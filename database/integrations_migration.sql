-- Integrations & Automation Migration
-- Supports email/SMS notifications, webhooks, and API access

-- Create notification_logs table
CREATE TABLE IF NOT EXISTS notification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL, -- 'incident', 'shift-handoff', 'emergency', etc.
  incident_id UUID REFERENCES incident_logs(id) ON DELETE CASCADE,
  recipients INTEGER NOT NULL,
  method TEXT NOT NULL, -- 'email', 'sms', 'both'
  email_success BOOLEAN,
  sms_success BOOLEAN,
  errors TEXT[],
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create webhooks table
CREATE TABLE IF NOT EXISTS webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  events TEXT[] NOT NULL,
  headers JSONB,
  secret TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  retry_attempts INTEGER DEFAULT 3,
  timeout INTEGER DEFAULT 10000,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_triggered_at TIMESTAMPTZ
);

-- Create webhook_deliveries table
CREATE TABLE IF NOT EXISTS webhook_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id UUID NOT NULL REFERENCES webhooks(id) ON DELETE CASCADE,
  event TEXT NOT NULL,
  payload JSONB NOT NULL,
  status TEXT NOT NULL, -- 'pending', 'success', 'failed', 'retrying'
  attempts INTEGER NOT NULL DEFAULT 0,
  response JSONB,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_attempt_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ
);

-- Create api_keys table
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL UNIQUE,
  key_preview TEXT NOT NULL, -- Last 4 characters for display
  permissions JSONB NOT NULL DEFAULT '["read"]'::jsonb,
  rate_limit INTEGER DEFAULT 100, -- requests per minute
  is_active BOOLEAN NOT NULL DEFAULT true,
  expires_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_used_at TIMESTAMPTZ,
  request_count INTEGER DEFAULT 0
);

-- Create notification_preferences table
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email_enabled BOOLEAN DEFAULT true,
  sms_enabled BOOLEAN DEFAULT false,
  email_address TEXT,
  phone_number TEXT,
  notify_on_high_priority BOOLEAN DEFAULT true,
  notify_on_critical BOOLEAN DEFAULT true,
  notify_on_assignment BOOLEAN DEFAULT true,
  notify_on_escalation BOOLEAN DEFAULT true,
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Create shift_handoff_reports table
CREATE TABLE IF NOT EXISTS shift_handoff_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shift_id TEXT NOT NULL,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  shift_name TEXT NOT NULL,
  shift_start TIMESTAMPTZ NOT NULL,
  shift_end TIMESTAMPTZ NOT NULL,
  officer_callsign TEXT NOT NULL,
  total_incidents INTEGER NOT NULL,
  open_incidents INTEGER NOT NULL,
  closed_incidents INTEGER NOT NULL,
  high_priority_incidents INTEGER NOT NULL,
  report_data JSONB NOT NULL,
  ai_summary TEXT,
  notes TEXT,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  sent_to TEXT[], -- Array of email addresses
  sent_at TIMESTAMPTZ
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notification_logs_incident_id ON notification_logs(incident_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_sent_at ON notification_logs(sent_at);
CREATE INDEX IF NOT EXISTS idx_webhooks_is_active ON webhooks(is_active);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_webhook_id ON webhook_deliveries(webhook_id);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_status ON webhook_deliveries(status);
CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash ON api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_api_keys_is_active ON api_keys(is_active);
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id ON notification_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_shift_handoff_reports_event_id ON shift_handoff_reports(event_id);
CREATE INDEX IF NOT EXISTS idx_shift_handoff_reports_shift_start ON shift_handoff_reports(shift_start);

-- Enable Row Level Security
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE shift_handoff_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies for notification_logs
CREATE POLICY "Allow authenticated users to view notification logs"
  ON notification_logs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert notification logs"
  ON notification_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- RLS Policies for webhooks
CREATE POLICY "Allow authenticated users to view webhooks"
  ON webhooks FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow users to manage own webhooks"
  ON webhooks FOR ALL
  TO authenticated
  USING (created_by = auth.uid());

-- RLS Policies for webhook_deliveries
CREATE POLICY "Allow authenticated users to view webhook deliveries"
  ON webhook_deliveries FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policies for api_keys
CREATE POLICY "Allow users to view own API keys"
  ON api_keys FOR SELECT
  TO authenticated
  USING (created_by = auth.uid());

CREATE POLICY "Allow users to manage own API keys"
  ON api_keys FOR ALL
  TO authenticated
  USING (created_by = auth.uid());

-- RLS Policies for notification_preferences
CREATE POLICY "Allow users to view own notification preferences"
  ON notification_preferences FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Allow users to manage own notification preferences"
  ON notification_preferences FOR ALL
  TO authenticated
  USING (user_id = auth.uid());

-- RLS Policies for shift_handoff_reports
CREATE POLICY "Allow authenticated users to view shift handoff reports"
  ON shift_handoff_reports FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to create shift handoff reports"
  ON shift_handoff_reports FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_webhooks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_notification_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
DROP TRIGGER IF EXISTS update_webhooks_updated_at ON webhooks;
CREATE TRIGGER update_webhooks_updated_at
  BEFORE UPDATE ON webhooks
  FOR EACH ROW
  EXECUTE FUNCTION update_webhooks_updated_at();

DROP TRIGGER IF EXISTS update_notification_preferences_updated_at ON notification_preferences;
CREATE TRIGGER update_notification_preferences_updated_at
  BEFORE UPDATE ON notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_notification_preferences_updated_at();

-- Add comments
COMMENT ON TABLE notification_logs IS 'Tracks all email/SMS notifications sent by the system';
COMMENT ON TABLE webhooks IS 'Webhook configurations for real-time integrations';
COMMENT ON TABLE webhook_deliveries IS 'Delivery log for webhook attempts';
COMMENT ON TABLE api_keys IS 'API keys for third-party integrations';
COMMENT ON TABLE notification_preferences IS 'User notification preferences for email/SMS alerts';
COMMENT ON TABLE shift_handoff_reports IS 'Automated shift handoff reports';
