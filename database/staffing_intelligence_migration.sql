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

-- Ensure staffing_forecasts table exists with correct schema
-- Note: The table definition is in database/schema/support_tools.sql
-- This migration ensures constraints and RLS policies are in place

-- Add foreign key constraints if they don't exist
DO $$
BEGIN
  -- Check for company_id foreign key by constraint type and referenced table
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
    WHERE tc.table_name = 'staffing_forecasts'
    AND tc.constraint_type = 'FOREIGN KEY'
    AND kcu.column_name = 'company_id'
    AND ccu.table_name = 'companies'
  ) THEN
    ALTER TABLE staffing_forecasts 
    ADD CONSTRAINT staffing_forecasts_company_id_fkey 
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;
  END IF;

  -- Check for event_id foreign key by constraint type and referenced table
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
    WHERE tc.table_name = 'staffing_forecasts'
    AND tc.constraint_type = 'FOREIGN KEY'
    AND kcu.column_name = 'event_id'
    AND ccu.table_name = 'events'
  ) THEN
    ALTER TABLE staffing_forecasts 
    ADD CONSTRAINT staffing_forecasts_event_id_fkey 
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE;
  END IF;

  -- Check for UNIQUE constraint on (company_id, event_id, discipline, generated_at)
  -- This checks if a unique constraint exists covering all four columns
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints tc
    WHERE tc.table_name = 'staffing_forecasts'
    AND tc.constraint_type = 'UNIQUE'
    AND (
      SELECT COUNT(DISTINCT kcu.column_name) 
      FROM information_schema.key_column_usage kcu
      WHERE kcu.constraint_name = tc.constraint_name
      AND kcu.table_name = 'staffing_forecasts'
      AND kcu.column_name IN ('company_id', 'event_id', 'discipline', 'generated_at')
    ) = 4
  ) THEN
    ALTER TABLE staffing_forecasts 
    ADD CONSTRAINT staffing_forecasts_company_id_event_id_discipline_generated_at_key 
    UNIQUE(company_id, event_id, discipline, generated_at);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_staffing_forecasts_company_event ON staffing_forecasts(company_id, event_id, discipline);

-- Trigger to keep updated_at fresh
-- Drop existing trigger if it exists (from support_tools.sql or previous migration)
DROP TRIGGER IF EXISTS update_staffing_forecasts_updated_at ON staffing_forecasts;
DROP TRIGGER IF EXISTS trigger_update_staffing_forecasts_updated_at ON staffing_forecasts;

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

