-- Collaboration Features Migration
-- Chat, file sharing, video conferencing, and tactical maps

-- Create chat_channels table
CREATE TABLE IF NOT EXISTS chat_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('general', 'incident', 'team', 'private')),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  incident_id UUID REFERENCES incident_logs(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  participants TEXT[] DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create chat_messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID NOT NULL REFERENCES chat_channels(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_callsign TEXT NOT NULL,
  message TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'system', 'alert', 'file', 'location')),
  metadata JSONB,
  reactions JSONB DEFAULT '{}'::jsonb,
  is_edited BOOLEAN NOT NULL DEFAULT false,
  edited_at TIMESTAMPTZ,
  read_by TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create shared_files table
CREATE TABLE IF NOT EXISTS shared_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  size INTEGER NOT NULL,
  url TEXT NOT NULL,
  thumbnail TEXT,
  uploaded_by UUID NOT NULL REFERENCES auth.users(id),
  uploaded_by_callsign TEXT NOT NULL,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  incident_id UUID REFERENCES incident_logs(id) ON DELETE CASCADE,
  channel_id UUID REFERENCES chat_channels(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  description TEXT,
  tags TEXT[] DEFAULT '{}',
  shared_with TEXT[] DEFAULT '{}',
  expires_at TIMESTAMPTZ,
  download_count INTEGER NOT NULL DEFAULT 0,
  is_public BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create tactical_map_layers table
CREATE TABLE IF NOT EXISTS tactical_map_layers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  layer_type TEXT NOT NULL CHECK (layer_type IN ('incidents', 'staff', 'resources', 'hazards', 'zones', 'routes')),
  data JSONB NOT NULL,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create collaborative_notes table
CREATE TABLE IF NOT EXISTS collaborative_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  incident_id UUID REFERENCES incident_logs(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  content_delta JSONB, -- Quill.js delta format
  created_by UUID NOT NULL REFERENCES auth.users(id),
  last_edited_by UUID REFERENCES auth.users(id),
  editors TEXT[] DEFAULT '{}', -- Active editors
  version INTEGER NOT NULL DEFAULT 1,
  is_locked BOOLEAN NOT NULL DEFAULT false,
  locked_by UUID REFERENCES auth.users(id),
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create video_sessions table
CREATE TABLE IF NOT EXISTS video_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  incident_id UUID REFERENCES incident_logs(id) ON DELETE CASCADE,
  session_name TEXT NOT NULL,
  provider TEXT NOT NULL DEFAULT 'agora', -- 'agora', 'twilio', 'jitsi'
  session_token TEXT,
  room_id TEXT NOT NULL,
  host_id UUID NOT NULL REFERENCES auth.users(id),
  participants TEXT[] DEFAULT '{}',
  max_participants INTEGER DEFAULT 10,
  is_recording BOOLEAN NOT NULL DEFAULT false,
  recording_url TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'ended', 'expired')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create command_hierarchy table
CREATE TABLE IF NOT EXISTS command_hierarchy (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  callsign TEXT NOT NULL,
  role TEXT NOT NULL,
  level TEXT NOT NULL CHECK (level IN ('gold', 'silver', 'bronze', 'operator')),
  parent_id UUID REFERENCES command_hierarchy(id) ON DELETE SET NULL,
  position_order INTEGER DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(event_id, user_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_chat_channels_event_id ON chat_channels(event_id);
CREATE INDEX IF NOT EXISTS idx_chat_channels_incident_id ON chat_channels(incident_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_channel_id ON chat_messages(channel_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_shared_files_event_id ON shared_files(event_id);
CREATE INDEX IF NOT EXISTS idx_shared_files_incident_id ON shared_files(incident_id);
CREATE INDEX IF NOT EXISTS idx_shared_files_channel_id ON shared_files(channel_id);
CREATE INDEX IF NOT EXISTS idx_shared_files_uploaded_by ON shared_files(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_tactical_map_layers_event_id ON tactical_map_layers(event_id);
CREATE INDEX IF NOT EXISTS idx_collaborative_notes_event_id ON collaborative_notes(event_id);
CREATE INDEX IF NOT EXISTS idx_collaborative_notes_incident_id ON collaborative_notes(incident_id);
CREATE INDEX IF NOT EXISTS idx_video_sessions_event_id ON video_sessions(event_id);
CREATE INDEX IF NOT EXISTS idx_command_hierarchy_event_id ON command_hierarchy(event_id);
CREATE INDEX IF NOT EXISTS idx_command_hierarchy_parent_id ON command_hierarchy(parent_id);

-- Enable Row Level Security
ALTER TABLE chat_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE tactical_map_layers ENABLE ROW LEVEL SECURITY;
ALTER TABLE collaborative_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE command_hierarchy ENABLE ROW LEVEL SECURITY;

-- RLS Policies for chat_channels
CREATE POLICY "Users can view channels they participate in"
  ON chat_channels FOR SELECT
  TO authenticated
  USING (
    auth.uid()::text = ANY(participants) OR
    created_by = auth.uid() OR
    type = 'general'
  );

-- RLS Policies for chat_messages
CREATE POLICY "Users can view messages in their channels"
  ON chat_messages FOR SELECT
  TO authenticated
  USING (
    channel_id IN (
      SELECT id FROM chat_channels
      WHERE auth.uid()::text = ANY(participants) OR created_by = auth.uid() OR type = 'general'
    )
  );

CREATE POLICY "Users can send messages to their channels"
  ON chat_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND
    channel_id IN (
      SELECT id FROM chat_channels
      WHERE auth.uid()::text = ANY(participants) OR created_by = auth.uid()
    )
  );

-- RLS Policies for shared_files
CREATE POLICY "Users can view shared files"
  ON shared_files FOR SELECT
  TO authenticated
  USING (
    is_public = true OR
    uploaded_by = auth.uid() OR
    auth.uid()::text = ANY(shared_with)
  );

CREATE POLICY "Authenticated users can upload files"
  ON shared_files FOR INSERT
  TO authenticated
  WITH CHECK (uploaded_by = auth.uid());

-- RLS Policies for collaborative_notes
CREATE POLICY "Users can view collaborative notes"
  ON collaborative_notes FOR SELECT
  TO authenticated
  USING (
    created_by = auth.uid() OR
    auth.uid()::text = ANY(editors)
  );

-- Functions for chat features
CREATE OR REPLACE FUNCTION add_message_reader(message_id UUID, reader_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE chat_messages
  SET read_by = array_append(read_by, reader_id::text)
  WHERE id = message_id AND NOT (reader_id::text = ANY(read_by));
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION add_message_reaction(message_id UUID, user_id UUID, emoji_code TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE chat_messages
  SET reactions = jsonb_set(
    COALESCE(reactions, '{}'::jsonb),
    ARRAY[emoji_code],
    COALESCE(reactions->emoji_code, '[]'::jsonb) || jsonb_build_array(user_id::text)
  )
  WHERE id = message_id;
END;
$$ LANGUAGE plpgsql;

-- Add comments
COMMENT ON TABLE chat_channels IS 'Real-time chat channels for team communication';
COMMENT ON TABLE chat_messages IS 'Chat messages with reactions and read receipts';
COMMENT ON TABLE shared_files IS 'Shared documents and media files';
COMMENT ON TABLE tactical_map_layers IS 'Map layers for tactical visualization';
COMMENT ON TABLE collaborative_notes IS 'Real-time collaborative note-taking';
COMMENT ON TABLE video_sessions IS 'Video conferencing sessions';
COMMENT ON TABLE command_hierarchy IS 'Command structure and chain of command';
