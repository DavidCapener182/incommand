-- Settings Overhaul Migration
-- Creates tables for AI usage tracking, subscriptions, notifications, and support

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- AI Usage Logs Table
CREATE TABLE IF NOT EXISTS ai_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  endpoint TEXT NOT NULL,
  model TEXT NOT NULL,
  tokens_prompt INTEGER DEFAULT 0,
  tokens_completion INTEGER DEFAULT 0,
  tokens_total INTEGER DEFAULT 0,
  cost_usd NUMERIC(10,6) DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_user_id ON ai_usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_timestamp ON ai_usage_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_org_id ON ai_usage_logs(org_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_endpoint ON ai_usage_logs(endpoint);
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_model ON ai_usage_logs(model);

-- AI Usage Daily Materialized View (rollup for dashboards)
CREATE TABLE IF NOT EXISTS ai_usage_daily (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  endpoint TEXT NOT NULL,
  model TEXT NOT NULL,
  calls INTEGER DEFAULT 0,
  tokens_total INTEGER DEFAULT 0,
  cost_usd NUMERIC(10,6) DEFAULT 0,
  PRIMARY KEY (user_id, date, endpoint, model)
);

CREATE INDEX IF NOT EXISTS idx_ai_usage_daily_user_date ON ai_usage_daily(user_id, date);
CREATE INDEX IF NOT EXISTS idx_ai_usage_daily_date ON ai_usage_daily(date);

-- Function to refresh daily usage rollup
CREATE OR REPLACE FUNCTION refresh_ai_usage_daily()
RETURNS void AS $$
BEGIN
  INSERT INTO ai_usage_daily (user_id, date, endpoint, model, calls, tokens_total, cost_usd)
  SELECT 
    user_id,
    DATE(timestamp) as date,
    endpoint,
    model,
    COUNT(*) as calls,
    SUM(tokens_total) as tokens_total,
    SUM(cost_usd) as cost_usd
  FROM ai_usage_logs
  WHERE timestamp >= CURRENT_DATE - INTERVAL '90 days'
  GROUP BY user_id, DATE(timestamp), endpoint, model
  ON CONFLICT (user_id, date, endpoint, model) 
  DO UPDATE SET
    calls = EXCLUDED.calls,
    tokens_total = EXCLUDED.tokens_total,
    cost_usd = EXCLUDED.cost_usd;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update daily rollup (can be called periodically)
-- For now, we'll refresh manually or via cron

-- Subscription Tiers Table
CREATE TABLE IF NOT EXISTS subscription_tiers (
  id TEXT PRIMARY KEY,
  monthly_token_allowance INTEGER NOT NULL DEFAULT 0,
  monthly_cost_cap_usd NUMERIC(10,2) DEFAULT 0,
  overage_policy TEXT NOT NULL DEFAULT 'warn' CHECK (overage_policy IN ('block', 'warn')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Insert default tiers
INSERT INTO subscription_tiers (id, monthly_token_allowance, monthly_cost_cap_usd, overage_policy) VALUES
  ('free', 10000, 0, 'block'),
  ('pro', 100000, 50.00, 'warn'),
  ('enterprise', 1000000, 500.00, 'warn')
ON CONFLICT (id) DO NOTHING;

-- User Subscriptions Table
CREATE TABLE IF NOT EXISTS user_subscriptions (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tier_id TEXT NOT NULL REFERENCES subscription_tiers(id),
  renewal_anchor DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_subscriptions_tier_id ON user_subscriptions(tier_id);

-- Default users to free tier if not set
-- This will be handled in application code, but we can add a trigger if needed

-- Notification Settings Table (separate from user_preferences JSONB for better querying)
CREATE TABLE IF NOT EXISTS notification_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  -- Email settings
  email_incidents BOOLEAN DEFAULT false,
  email_updates BOOLEAN DEFAULT false,
  email_reports BOOLEAN DEFAULT false,
  email_social BOOLEAN DEFAULT false,
  -- Push settings
  push_enabled BOOLEAN DEFAULT false,
  push_sound BOOLEAN DEFAULT false,
  push_vibrate BOOLEAN DEFAULT false,
  push_incidents BOOLEAN DEFAULT false,
  push_updates BOOLEAN DEFAULT false,
  push_reports BOOLEAN DEFAULT false,
  push_social BOOLEAN DEFAULT false,
  -- SMS settings
  sms_enabled BOOLEAN DEFAULT false,
  sms_emergency_only BOOLEAN DEFAULT true,
  sms_number TEXT,
  -- Quiet hours
  quiet_hours_enabled BOOLEAN DEFAULT false,
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notification_settings_user_id ON notification_settings(user_id);

-- Support Tickets Table (update existing if needed, or create new structure)
-- Check if support_tickets exists with different structure
DO $$ 
BEGIN
  -- If support_tickets exists but doesn't have user_id, add it
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'support_tickets') THEN
    -- Check if user_id column exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'support_tickets' AND column_name = 'user_id') THEN
      ALTER TABLE support_tickets ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
    END IF;
    
    -- Check if channel_id column exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'support_tickets' AND column_name = 'channel_id') THEN
      ALTER TABLE support_tickets ADD COLUMN channel_id UUID;
    END IF;
    
    -- Update status and category enums if needed
    -- Note: PostgreSQL doesn't support ALTER TYPE easily, so we'll handle this in app code
  ELSE
    -- Create new support_tickets table
    CREATE TABLE support_tickets (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      org_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
      channel_id UUID,
      subject TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'general' CHECK (category IN ('incident','technical','billing','other')),
      status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','in_progress','resolved')),
      priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('normal','urgent')),
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    
    CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON support_tickets(user_id);
    CREATE INDEX IF NOT EXISTS idx_support_tickets_org_id ON support_tickets(org_id);
    CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
  END IF;
END $$;

-- Support Messages Table
CREATE TABLE IF NOT EXISTS support_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  message TEXT NOT NULL,
  attachments JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_support_messages_ticket_id ON support_messages(ticket_id);
CREATE INDEX IF NOT EXISTS idx_support_messages_user_id ON support_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_support_messages_created_at ON support_messages(created_at);

-- Enable Row Level Security
ALTER TABLE ai_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ai_usage_logs
CREATE POLICY "Users can view their own AI usage logs" ON ai_usage_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own AI usage logs" ON ai_usage_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all AI usage logs" ON ai_usage_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'superadmin')
    )
  );

-- RLS Policies for ai_usage_daily
CREATE POLICY "Users can view their own daily usage" ON ai_usage_daily
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can update daily usage" ON ai_usage_daily
  FOR ALL USING (true); -- Refresh function runs as definer

-- RLS Policies for subscription_tiers (read-only for all)
CREATE POLICY "All authenticated users can view subscription tiers" ON subscription_tiers
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Only admins can modify subscription tiers" ON subscription_tiers
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'superadmin')
    )
  );

-- RLS Policies for user_subscriptions
CREATE POLICY "Users can view their own subscription" ON user_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscription" ON user_subscriptions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all subscriptions" ON user_subscriptions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'superadmin')
    )
  );

-- RLS Policies for notification_settings
CREATE POLICY "Users can view their own notification settings" ON notification_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notification settings" ON notification_settings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notification settings" ON notification_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for support_tickets
CREATE POLICY "Users can view their own support tickets" ON support_tickets
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own support tickets" ON support_tickets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own support tickets" ON support_tickets
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all support tickets" ON support_tickets
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'superadmin')
    )
  );

CREATE POLICY "Admins can update all support tickets" ON support_tickets
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'superadmin')
    )
  );

-- RLS Policies for support_messages
CREATE POLICY "Users can view messages for their tickets" ON support_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM support_tickets 
      WHERE support_tickets.id = support_messages.ticket_id 
      AND support_tickets.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'superadmin')
    )
  );

CREATE POLICY "Users can create messages for their tickets" ON support_messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM support_tickets 
      WHERE support_tickets.id = support_messages.ticket_id 
      AND support_tickets.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can create messages for any ticket" ON support_messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'superadmin')
    )
  );

-- Trigger function for updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
CREATE TRIGGER user_subscriptions_updated_at
  BEFORE UPDATE ON user_subscriptions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER notification_settings_updated_at
  BEFORE UPDATE ON notification_settings
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER support_tickets_updated_at
  BEFORE UPDATE ON support_tickets
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Grant execute permission on refresh function
GRANT EXECUTE ON FUNCTION refresh_ai_usage_daily() TO authenticated, service_role;





