-- Create event_invites table
CREATE TABLE IF NOT EXISTS event_invites (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    intended_email TEXT,
    role TEXT NOT NULL CHECK (role IN ('medic', 'security', 'production', 'read_only')),
    token_hash TEXT NOT NULL UNIQUE,
    allow_multiple BOOLEAN DEFAULT FALSE,
    max_uses INTEGER DEFAULT 1,
    used_count INTEGER DEFAULT 0,
    expires_at TIMESTAMPTZ NOT NULL,
    last_used_at TIMESTAMPTZ,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'revoked', 'expired')),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create event_members table
CREATE TABLE IF NOT EXISTS event_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    invite_id UUID REFERENCES event_invites(id) ON DELETE SET NULL,
    full_name TEXT,
    email TEXT,
    role TEXT NOT NULL CHECK (role IN ('medic', 'security', 'production', 'read_only', 'admin', 'organizer')),
    is_temporary BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMPTZ,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'revoked')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(event_id, user_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_event_invites_event_id ON event_invites(event_id);
CREATE INDEX IF NOT EXISTS idx_event_invites_token_hash ON event_invites(token_hash);
CREATE INDEX IF NOT EXISTS idx_event_invites_status ON event_invites(status);
CREATE INDEX IF NOT EXISTS idx_event_members_event_id ON event_members(event_id);
CREATE INDEX IF NOT EXISTS idx_event_members_user_id ON event_members(user_id);
CREATE INDEX IF NOT EXISTS idx_event_members_status ON event_members(status);

-- Enable RLS
ALTER TABLE event_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_members ENABLE ROW LEVEL SECURITY;

-- RLS Policies for event_invites
-- Allow users to view invites for events they created or are members of
CREATE POLICY "Users can view invites for their events" ON event_invites
    FOR SELECT USING (
        created_by = auth.uid() OR
        EXISTS (
            SELECT 1 FROM event_members em 
            WHERE em.event_id = event_invites.event_id 
            AND em.user_id = auth.uid() 
            AND em.status = 'active'
        )
    );

-- Allow users to create invites for events they created or are organizers of
CREATE POLICY "Users can create invites for their events" ON event_invites
    FOR INSERT WITH CHECK (
        created_by = auth.uid() AND
        EXISTS (
            SELECT 1 FROM events e 
            WHERE e.id = event_invites.event_id 
            AND (e.created_by = auth.uid() OR 
                 EXISTS (
                     SELECT 1 FROM event_members em 
                     WHERE em.event_id = e.id 
                     AND em.user_id = auth.uid() 
                     AND em.role IN ('admin', 'organizer')
                     AND em.status = 'active'
                 ))
        )
    );

-- Allow users to update invites they created
CREATE POLICY "Users can update their invites" ON event_invites
    FOR UPDATE USING (created_by = auth.uid());

-- RLS Policies for event_members
-- Allow users to view members of events they are part of
CREATE POLICY "Users can view members of their events" ON event_members
    FOR SELECT USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM event_members em2 
            WHERE em2.event_id = event_members.event_id 
            AND em2.user_id = auth.uid() 
            AND em2.status = 'active'
        )
    );

-- Allow system to create event members (for invite redemption)
CREATE POLICY "System can create event members" ON event_members
    FOR INSERT WITH CHECK (true);

-- Allow users to update their own membership
CREATE POLICY "Users can update their own membership" ON event_members
    FOR UPDATE USING (user_id = auth.uid());

-- Allow event organizers to update any membership in their events
CREATE POLICY "Organizers can update memberships" ON event_members
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM event_members em 
            WHERE em.event_id = event_members.event_id 
            AND em.user_id = auth.uid() 
            AND em.role IN ('admin', 'organizer')
            AND em.status = 'active'
        )
    );
