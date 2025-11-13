-- Feature 10: Intelligent Radio Traffic Analysis
-- Migration: Create radio_messages and radio_channel_health tables

-- Ensure companies table exists (create if it doesn't)
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Radio Messages Table
CREATE TABLE IF NOT EXISTS radio_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  channel VARCHAR(50) NOT NULL,
  from_callsign VARCHAR(50),
  to_callsign VARCHAR(50),
  message TEXT NOT NULL,
  transcription TEXT,
  audio_url TEXT,
  category VARCHAR(50) CHECK (category IN ('incident', 'routine', 'emergency', 'coordination', 'other')),
  priority VARCHAR(20) CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  incident_id INTEGER REFERENCES incident_logs(id) ON DELETE SET NULL,
  task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Radio Channel Health Table
CREATE TABLE IF NOT EXISTS radio_channel_health (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  channel VARCHAR(50) NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  message_count INTEGER NOT NULL DEFAULT 0,
  avg_response_time_seconds DECIMAL(10,2),
  overload_indicator BOOLEAN DEFAULT FALSE,
  health_score INTEGER CHECK (health_score >= 0 AND health_score <= 100),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_radio_messages_company_id ON radio_messages(company_id);
CREATE INDEX IF NOT EXISTS idx_radio_messages_event_id ON radio_messages(event_id);
CREATE INDEX IF NOT EXISTS idx_radio_messages_channel ON radio_messages(channel);
CREATE INDEX IF NOT EXISTS idx_radio_messages_created_at ON radio_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_radio_messages_category ON radio_messages(category);
CREATE INDEX IF NOT EXISTS idx_radio_messages_priority ON radio_messages(priority);
CREATE INDEX IF NOT EXISTS idx_radio_messages_incident_id ON radio_messages(incident_id);
CREATE INDEX IF NOT EXISTS idx_radio_messages_task_id ON radio_messages(task_id);

CREATE INDEX IF NOT EXISTS idx_radio_channel_health_company_id ON radio_channel_health(company_id);
CREATE INDEX IF NOT EXISTS idx_radio_channel_health_event_id ON radio_channel_health(event_id);
CREATE INDEX IF NOT EXISTS idx_radio_channel_health_channel ON radio_channel_health(channel);
CREATE INDEX IF NOT EXISTS idx_radio_channel_health_timestamp ON radio_channel_health(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_radio_channel_health_event_channel ON radio_channel_health(event_id, channel, timestamp DESC);

-- Updated_at trigger for radio_messages
CREATE OR REPLACE FUNCTION update_radio_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_radio_messages_updated_at
  BEFORE UPDATE ON radio_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_radio_messages_updated_at();

-- Row Level Security Policies

-- Radio Messages RLS
ALTER TABLE radio_messages ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view radio messages for their company
CREATE POLICY "Users can view radio messages for their company"
  ON radio_messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.company_id = radio_messages.company_id
    )
  );

-- Policy: Users can insert radio messages for their company
CREATE POLICY "Users can insert radio messages for their company"
  ON radio_messages
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.company_id = radio_messages.company_id
    )
  );

-- Policy: Users can update radio messages for their company
CREATE POLICY "Users can update radio messages for their company"
  ON radio_messages
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.company_id = radio_messages.company_id
    )
  );

-- Policy: Users can delete radio messages for their company
CREATE POLICY "Users can delete radio messages for their company"
  ON radio_messages
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.company_id = radio_messages.company_id
    )
  );

-- Radio Channel Health RLS
ALTER TABLE radio_channel_health ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view channel health for their company
CREATE POLICY "Users can view channel health for their company"
  ON radio_channel_health
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.company_id = radio_channel_health.company_id
    )
  );

-- Policy: Users can insert channel health for their company
CREATE POLICY "Users can insert channel health for their company"
  ON radio_channel_health
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.company_id = radio_channel_health.company_id
    )
  );

-- Policy: Users can update channel health for their company
CREATE POLICY "Users can update channel health for their company"
  ON radio_channel_health
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.company_id = radio_channel_health.company_id
    )
  );

-- Policy: Users can delete channel health for their company
CREATE POLICY "Users can delete channel health for their company"
  ON radio_channel_health
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.company_id = radio_channel_health.company_id
    )
  );

-- Comments for documentation
COMMENT ON TABLE radio_messages IS 'Stores transcribed radio messages with categorization and priority';
COMMENT ON TABLE radio_channel_health IS 'Tracks channel-level health metrics including traffic volume and response times';

COMMENT ON COLUMN radio_messages.channel IS 'Radio channel identifier (e.g., "Channel 1", "Security", "Medical")';
COMMENT ON COLUMN radio_messages.from_callsign IS 'Callsign of the sender';
COMMENT ON COLUMN radio_messages.to_callsign IS 'Callsign of the recipient (if directed)';
COMMENT ON COLUMN radio_messages.transcription IS 'Transcribed text from audio (if audio was provided)';
COMMENT ON COLUMN radio_messages.category IS 'Message category: incident, routine, emergency, coordination, other';
COMMENT ON COLUMN radio_messages.priority IS 'Message priority: low, medium, high, critical';
COMMENT ON COLUMN radio_messages.incident_id IS 'Linked incident if message triggered incident creation';
COMMENT ON COLUMN radio_messages.task_id IS 'Linked task if message triggered task creation';

COMMENT ON COLUMN radio_channel_health.channel IS 'Radio channel identifier';
COMMENT ON COLUMN radio_channel_health.message_count IS 'Number of messages in the time window';
COMMENT ON COLUMN radio_channel_health.avg_response_time_seconds IS 'Average response time between messages';
COMMENT ON COLUMN radio_channel_health.overload_indicator IS 'True if channel shows overload patterns';
COMMENT ON COLUMN radio_channel_health.health_score IS 'Overall health score 0-100 (higher is better)';

