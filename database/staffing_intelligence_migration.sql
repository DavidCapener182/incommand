-- Staffing Intelligence schema updates

-- Add discipline column to staffing_roles for consistent categorisation
ALTER TABLE IF EXISTS staffing_roles
ADD COLUMN IF NOT EXISTS discipline TEXT CHECK (discipline IN ('security','police','medical','stewarding','other')) DEFAULT 'security';

-- Backfill existing rows based on role name keywords
UPDATE staffing_roles
SET discipline = CASE
  WHEN discipline IS NOT NULL AND discipline <> '' THEN discipline
  WHEN lower(name) LIKE '%police%' THEN 'police'
  WHEN lower(name) LIKE '%medic%' THEN 'medical'
  WHEN lower(name) LIKE '%steward%' THEN 'stewarding'
  ELSE 'security'
END;

-- Create staffing_forecasts table to store predicted requirements
CREATE TABLE IF NOT EXISTS staffing_forecasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  discipline TEXT NOT NULL CHECK (discipline IN ('security','police','medical','stewarding','other')),
  predicted_required INTEGER NOT NULL CHECK (predicted_required >= 0),
  confidence NUMERIC,
  methodology TEXT,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  generated_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(company_id, event_id, discipline, generated_at)
);

CREATE INDEX IF NOT EXISTS idx_staffing_forecasts_company_event ON staffing_forecasts(company_id, event_id, discipline);

-- Trigger to keep updated_at fresh
CREATE OR REPLACE FUNCTION update_staffing_forecasts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_staffing_forecasts_updated_at
  BEFORE UPDATE ON staffing_forecasts
  FOR EACH ROW
  EXECUTE FUNCTION update_staffing_forecasts_updated_at();

-- Enable RLS and company-scoped policies
ALTER TABLE staffing_forecasts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff can view staffing forecasts for their company" ON staffing_forecasts;
CREATE POLICY "Staff can view staffing forecasts for their company" ON staffing_forecasts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.company_id = staffing_forecasts.company_id
    )
  );

DROP POLICY IF EXISTS "Staff can insert staffing forecasts for their company" ON staffing_forecasts;
CREATE POLICY "Staff can insert staffing forecasts for their company" ON staffing_forecasts
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.company_id = staffing_forecasts.company_id
    )
  );

DROP POLICY IF EXISTS "Staff can update staffing forecasts for their company" ON staffing_forecasts;
CREATE POLICY "Staff can update staffing forecasts for their company" ON staffing_forecasts
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.company_id = staffing_forecasts.company_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.company_id = staffing_forecasts.company_id
    )
  );

DROP POLICY IF EXISTS "Staff can delete staffing forecasts for their company" ON staffing_forecasts;
CREATE POLICY "Staff can delete staffing forecasts for their company" ON staffing_forecasts
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.company_id = staffing_forecasts.company_id
    )
  );

GRANT SELECT, INSERT, UPDATE, DELETE ON staffing_forecasts TO authenticated;

