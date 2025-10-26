-- Chat Enhancements Migration
-- Extends existing chat_messages table for dual-mode chat interface

-- Add new columns to existing chat_messages table
ALTER TABLE chat_messages 
ADD COLUMN IF NOT EXISTS channel_type TEXT DEFAULT 'team' CHECK (channel_type IN ('team', 'ai-archive', 'direct')),
ADD COLUMN IF NOT EXISTS channel_name TEXT DEFAULT 'general',
ADD COLUMN IF NOT EXISTS thread_id UUID REFERENCES chat_messages(id),
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS company_id UUID,
ADD COLUMN IF NOT EXISTS event_id UUID;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_chat_messages_channel 
ON chat_messages (event_id, company_id, channel_name, channel_type);

CREATE INDEX IF NOT EXISTS idx_chat_messages_thread 
ON chat_messages (thread_id);

CREATE INDEX IF NOT EXISTS idx_chat_messages_company_event 
ON chat_messages (company_id, event_id);

-- Add foreign key constraints
ALTER TABLE chat_messages 
ADD CONSTRAINT fk_chat_messages_company 
FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;

ALTER TABLE chat_messages 
ADD CONSTRAINT fk_chat_messages_event 
FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE;

-- Create RLS policies for Event+Company scoping
-- Users can only see messages from their company+event
CREATE POLICY "Users can view messages from their company and event" ON chat_messages
FOR SELECT USING (
  company_id IN (
    SELECT company_id FROM profiles 
    WHERE id = auth.uid()
  ) 
  AND event_id IN (
    SELECT event_id FROM event_staff 
    WHERE user_id = auth.uid()
  )
);

-- Users can insert messages in their company+event
CREATE POLICY "Users can send messages in their company and event" ON chat_messages
FOR INSERT WITH CHECK (
  company_id IN (
    SELECT company_id FROM profiles 
    WHERE id = auth.uid()
  ) 
  AND event_id IN (
    SELECT event_id FROM event_staff 
    WHERE user_id = auth.uid()
  )
  AND user_id = auth.uid()
);

-- Users can update their own messages
CREATE POLICY "Users can update their own messages" ON chat_messages
FOR UPDATE USING (
  user_id = auth.uid()
  AND company_id IN (
    SELECT company_id FROM profiles 
    WHERE id = auth.uid()
  )
);

-- Admins can see all messages in their company
CREATE POLICY "Admins can view all company messages" ON chat_messages
FOR SELECT USING (
  company_id IN (
    SELECT company_id FROM profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
  )
);

-- AI-archive messages require user ownership
CREATE POLICY "Users can only access their own AI-archived messages" ON chat_messages
FOR ALL USING (
  channel_type = 'ai-archive' AND user_id = auth.uid()
);

-- Enable RLS on chat_messages if not already enabled
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Create function to get user's company and event context
CREATE OR REPLACE FUNCTION get_user_chat_context(user_uuid UUID)
RETURNS TABLE(company_id UUID, event_id UUID) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.company_id,
    es.event_id
  FROM profiles p
  JOIN event_staff es ON p.id = es.user_id
  WHERE p.id = user_uuid
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to validate user can access channel
CREATE OR REPLACE FUNCTION can_access_channel(
  user_uuid UUID,
  target_company_id UUID,
  target_event_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles p
    JOIN event_staff es ON p.id = es.user_id
    WHERE p.id = user_uuid
    AND p.company_id = target_company_id
    AND es.event_id = target_event_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create table for chat channels (custom channels per event+company)
CREATE TABLE IF NOT EXISTS chat_channels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_private BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for chat_channels
CREATE INDEX IF NOT EXISTS idx_chat_channels_event_company 
ON chat_channels (event_id, company_id);

-- RLS for chat_channels
ALTER TABLE chat_channels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view channels in their company and event" ON chat_channels
FOR SELECT USING (
  company_id IN (
    SELECT company_id FROM profiles 
    WHERE id = auth.uid()
  ) 
  AND event_id IN (
    SELECT event_id FROM event_staff 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can create channels in their company and event" ON chat_channels
FOR INSERT WITH CHECK (
  company_id IN (
    SELECT company_id FROM profiles 
    WHERE id = auth.uid()
  ) 
  AND event_id IN (
    SELECT event_id FROM event_staff 
    WHERE user_id = auth.uid()
  )
  AND created_by = auth.uid()
);

-- Create table for message reactions
CREATE TABLE IF NOT EXISTS chat_message_reactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(message_id, user_id, emoji)
);

-- Index for reactions
CREATE INDEX IF NOT EXISTS idx_chat_reactions_message 
ON chat_message_reactions (message_id);

-- RLS for reactions
ALTER TABLE chat_message_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage reactions on messages they can see" ON chat_message_reactions
FOR ALL USING (
  message_id IN (
    SELECT id FROM chat_messages 
    WHERE company_id IN (
      SELECT company_id FROM profiles 
      WHERE id = auth.uid()
    ) 
    AND event_id IN (
      SELECT event_id FROM event_staff 
      WHERE user_id = auth.uid()
    )
  )
  AND user_id = auth.uid()
);

-- Create table for typing indicators
CREATE TABLE IF NOT EXISTS chat_typing_indicators (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  channel_id TEXT NOT NULL, -- event_company_channel format
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_typing BOOLEAN DEFAULT true,
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(channel_id, user_id)
);

-- Index for typing indicators
CREATE INDEX IF NOT EXISTS idx_typing_channel 
ON chat_typing_indicators (channel_id);

-- RLS for typing indicators
ALTER TABLE chat_typing_indicators ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage typing indicators in their channels" ON chat_typing_indicators
FOR ALL USING (
  user_id = auth.uid()
  AND channel_id LIKE (
    SELECT CONCAT(event_id, '_', company_id, '_%') 
    FROM event_staff es
    JOIN profiles p ON es.user_id = p.id
    WHERE es.user_id = auth.uid()
    LIMIT 1
  )
);

-- Create function to clean up old typing indicators
CREATE OR REPLACE FUNCTION cleanup_typing_indicators()
RETURNS void AS $$
BEGIN
  DELETE FROM chat_typing_indicators 
  WHERE last_seen < NOW() - INTERVAL '30 seconds';
END;
$$ LANGUAGE plpgsql;

-- Create function to get channel participants
CREATE OR REPLACE FUNCTION get_channel_participants(
  target_event_id UUID,
  target_company_id UUID
)
RETURNS TABLE(
  user_id UUID,
  display_name TEXT,
  avatar_url TEXT,
  role TEXT,
  is_online BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id as user_id,
    COALESCE(p.display_name, p.email) as display_name,
    p.avatar_url,
    p.role,
    EXISTS(
      SELECT 1 FROM chat_typing_indicators cti
      WHERE cti.user_id = p.id 
      AND cti.channel_id LIKE CONCAT(target_event_id, '_', target_company_id, '_%')
      AND cti.last_seen > NOW() - INTERVAL '5 minutes'
    ) as is_online
  FROM profiles p
  JOIN event_staff es ON p.id = es.user_id
  WHERE p.company_id = target_company_id
  AND es.event_id = target_event_id
  ORDER BY p.display_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
