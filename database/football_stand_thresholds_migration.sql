-- Migration: Create football_stand_thresholds table
-- Purpose: Store default thresholds and per-stand overrides for occupancy color coding

CREATE TABLE IF NOT EXISTS football_stand_thresholds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  event_id UUID NOT NULL,
  default_green_threshold INT NOT NULL DEFAULT 90,
  default_amber_threshold INT NOT NULL DEFAULT 97,
  default_red_threshold INT NOT NULL DEFAULT 100,
  stand_overrides JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(company_id, event_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_football_stand_thresholds_company_event 
ON football_stand_thresholds(company_id, event_id);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_football_stand_thresholds_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_football_stand_thresholds_updated_at
  BEFORE UPDATE ON football_stand_thresholds
  FOR EACH ROW
  EXECUTE FUNCTION update_football_stand_thresholds_updated_at();

-- Add RLS policies
ALTER TABLE football_stand_thresholds ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read thresholds for their company's events
CREATE POLICY "Users can read thresholds for their company events"
  ON football_stand_thresholds
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.company_id = football_stand_thresholds.company_id
    )
  );

-- Policy: Users can insert/update thresholds for their company's events
CREATE POLICY "Users can manage thresholds for their company events"
  ON football_stand_thresholds
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.company_id = football_stand_thresholds.company_id
      AND (p.role = 'admin' OR p.role = 'superadmin')
    )
  );

COMMENT ON TABLE football_stand_thresholds IS 'Stores occupancy thresholds for color coding stands. Default thresholds apply to all stands unless overridden per stand.';
COMMENT ON COLUMN football_stand_thresholds.stand_overrides IS 'JSON object mapping stand names to custom thresholds: { "Main Stand": { "amber": 95, "red": 98 } }';

