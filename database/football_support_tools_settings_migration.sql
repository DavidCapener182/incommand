-- Migration: Create football_support_tools_settings table
-- Purpose: Store per-tool settings including auto-refresh configuration and tool-specific settings

CREATE TYPE support_tool_type AS ENUM ('stand', 'staffing', 'crowd', 'transport', 'fixture');

CREATE TABLE IF NOT EXISTS football_support_tools_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  event_id UUID NOT NULL,
  tool_type support_tool_type NOT NULL,
  auto_refresh_enabled BOOLEAN NOT NULL DEFAULT true,
  auto_refresh_interval INT NOT NULL DEFAULT 30, -- seconds
  settings_json JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(company_id, event_id, tool_type)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_football_support_tools_settings_company_event 
ON football_support_tools_settings(company_id, event_id);

CREATE INDEX IF NOT EXISTS idx_football_support_tools_settings_tool_type 
ON football_support_tools_settings(tool_type);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_football_support_tools_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_football_support_tools_settings_updated_at
  BEFORE UPDATE ON football_support_tools_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_football_support_tools_settings_updated_at();

-- Add RLS policies
ALTER TABLE football_support_tools_settings ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read settings for their company's events
CREATE POLICY "Users can read settings for their company events"
  ON football_support_tools_settings
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.company_id = football_support_tools_settings.company_id
    )
  );

-- Policy: Users can insert/update settings for their company's events
CREATE POLICY "Users can manage settings for their company events"
  ON football_support_tools_settings
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.company_id = football_support_tools_settings.company_id
      AND (p.role = 'admin' OR p.role = 'superadmin')
    )
  );

COMMENT ON TABLE football_support_tools_settings IS 'Stores configuration settings for each support tool per event. Includes auto-refresh settings and tool-specific configurations.';
COMMENT ON COLUMN football_support_tools_settings.settings_json IS 'Tool-specific settings stored as JSON. Structure varies by tool type.';

