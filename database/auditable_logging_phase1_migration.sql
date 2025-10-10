-- Auditable Event Logging - Phase 1 Migration
-- This migration adds immutable audit trail capabilities to incident logs
-- Based on emergency services best practices (JESIP, JDM)

-- =============================================================================
-- PART 1: Extend incident_logs table
-- =============================================================================

-- Add new columns for auditable logging (with defaults for existing data)
ALTER TABLE incident_logs 
  ADD COLUMN IF NOT EXISTS time_of_occurrence TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS time_logged TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS entry_type VARCHAR(20) DEFAULT 'contemporaneous',
  ADD COLUMN IF NOT EXISTS retrospective_justification TEXT,
  ADD COLUMN IF NOT EXISTS logged_by_user_id UUID REFERENCES profiles(id),
  ADD COLUMN IF NOT EXISTS logged_by_callsign VARCHAR(50),
  ADD COLUMN IF NOT EXISTS is_amended BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS original_entry_id INTEGER REFERENCES incident_logs(id);

-- Backfill timestamps from existing 'timestamp' field
UPDATE incident_logs
SET 
  time_of_occurrence = COALESCE(time_of_occurrence, timestamp),
  time_logged = COALESCE(time_logged, timestamp),
  logged_by_callsign = COALESCE(logged_by_callsign, callsign_from)
WHERE time_of_occurrence IS NULL OR time_logged IS NULL;

-- Make required columns NOT NULL after backfill
ALTER TABLE incident_logs
  ALTER COLUMN time_of_occurrence SET NOT NULL,
  ALTER COLUMN time_logged SET NOT NULL,
  ALTER COLUMN entry_type SET NOT NULL;

-- Add constraints (using DO block for conditional creation)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'entry_type_check'
  ) THEN
    ALTER TABLE incident_logs
      ADD CONSTRAINT entry_type_check 
        CHECK (entry_type IN ('contemporaneous', 'retrospective'));
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'retrospective_requires_justification'
  ) THEN
    ALTER TABLE incident_logs
      ADD CONSTRAINT retrospective_requires_justification 
        CHECK (
          entry_type != 'retrospective' OR 
          (retrospective_justification IS NOT NULL AND LENGTH(TRIM(retrospective_justification)) > 0)
        );
  END IF;
END $$;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_incident_logs_time_of_occurrence 
  ON incident_logs(time_of_occurrence DESC);

CREATE INDEX IF NOT EXISTS idx_incident_logs_entry_type 
  ON incident_logs(entry_type);

CREATE INDEX IF NOT EXISTS idx_incident_logs_is_amended 
  ON incident_logs(is_amended) WHERE is_amended = TRUE;

CREATE INDEX IF NOT EXISTS idx_incident_logs_logged_by_user 
  ON incident_logs(logged_by_user_id);

-- =============================================================================
-- PART 2: Create incident_log_revisions table
-- =============================================================================

CREATE TABLE IF NOT EXISTS incident_log_revisions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  incident_log_id INTEGER NOT NULL REFERENCES incident_logs(id) ON DELETE CASCADE,
  revision_number INTEGER NOT NULL,
  field_changed VARCHAR(100) NOT NULL,
  old_value JSONB,
  new_value JSONB,
  changed_by_user_id UUID REFERENCES profiles(id),
  changed_by_callsign VARCHAR(50),
  change_reason TEXT NOT NULL,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  change_type VARCHAR(50) NOT NULL,
  
  -- Ensure unique revision numbers per incident
  CONSTRAINT unique_revision_per_incident UNIQUE(incident_log_id, revision_number),
  
  -- Validate change type
  CONSTRAINT change_type_check 
    CHECK (change_type IN ('amendment', 'status_change', 'escalation', 'correction', 'clarification')),
  
  -- Ensure change reason is provided
  CONSTRAINT change_reason_required 
    CHECK (LENGTH(TRIM(change_reason)) > 0)
);

-- Add indexes for revision queries
CREATE INDEX IF NOT EXISTS idx_revisions_incident 
  ON incident_log_revisions(incident_log_id);

CREATE INDEX IF NOT EXISTS idx_revisions_changed_at 
  ON incident_log_revisions(changed_at DESC);

CREATE INDEX IF NOT EXISTS idx_revisions_change_type 
  ON incident_log_revisions(change_type);

CREATE INDEX IF NOT EXISTS idx_revisions_changed_by 
  ON incident_log_revisions(changed_by_user_id);

-- =============================================================================
-- PART 3: Create helper function for automatic revision numbering
-- =============================================================================

CREATE OR REPLACE FUNCTION get_next_revision_number(incident_id INTEGER)
RETURNS INTEGER AS $$
DECLARE
  next_number INTEGER;
BEGIN
  SELECT COALESCE(MAX(revision_number), 0) + 1
  INTO next_number
  FROM incident_log_revisions
  WHERE incident_log_id = incident_id;
  
  RETURN next_number;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- PART 4: Create trigger to auto-update is_amended flag
-- =============================================================================

CREATE OR REPLACE FUNCTION mark_incident_as_amended()
RETURNS TRIGGER AS $$
BEGIN
  -- Mark the incident as amended when a revision is created
  UPDATE incident_logs
  SET is_amended = TRUE
  WHERE id = NEW.incident_log_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_mark_incident_amended
  AFTER INSERT ON incident_log_revisions
  FOR EACH ROW
  EXECUTE FUNCTION mark_incident_as_amended();

-- =============================================================================
-- PART 5: Row Level Security (RLS) Policies
-- =============================================================================

-- Enable RLS on revisions table
ALTER TABLE incident_log_revisions ENABLE ROW LEVEL SECURITY;

-- Policy: All authenticated users can view revisions
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'incident_log_revisions_select'
  ) THEN
    CREATE POLICY incident_log_revisions_select 
      ON incident_log_revisions
      FOR SELECT
      USING (auth.uid() IS NOT NULL);
  END IF;
END $$;

-- Policy: Users can create revisions for logs they created (if <24 hours) OR if admin
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'incident_log_revisions_insert'
  ) THEN
    CREATE POLICY incident_log_revisions_insert 
      ON incident_log_revisions
      FOR INSERT
      WITH CHECK (
        -- User is authenticated
        auth.uid() IS NOT NULL
        AND (
          -- User created the original log and it's within 24 hours
          EXISTS (
            SELECT 1 FROM incident_logs
            WHERE id = incident_log_id
            AND logged_by_user_id = auth.uid()
            AND created_at > NOW() - INTERVAL '24 hours'
          )
          OR
          -- User is an admin
          EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() 
            AND role = 'admin'
          )
        )
      );
  END IF;
END $$;

-- Policy: Update existing incident_logs policy to include new fields
-- Note: This assumes there's already a policy on incident_logs
-- If not, create appropriate policies based on your security model

-- =============================================================================
-- PART 6: Create view for easy revision history access
-- =============================================================================

CREATE OR REPLACE VIEW incident_log_revision_history AS
SELECT 
  r.id,
  r.incident_log_id,
  r.revision_number,
  r.field_changed,
  r.old_value,
  r.new_value,
  r.change_reason,
  r.changed_at,
  r.change_type,
  r.changed_by_user_id,
  r.changed_by_callsign,
  p.first_name,
  p.last_name,
  p.email,
  COALESCE(p.first_name || ' ' || p.last_name, p.email) AS changed_by_name,
  il.log_number,
  il.incident_type,
  il.entry_type,
  il.time_of_occurrence,
  il.time_logged
FROM incident_log_revisions r
LEFT JOIN profiles p ON r.changed_by_user_id = p.id
LEFT JOIN incident_logs il ON r.incident_log_id = il.id
ORDER BY r.incident_log_id, r.revision_number;

-- Grant select on view to authenticated users
GRANT SELECT ON incident_log_revision_history TO authenticated;

-- =============================================================================
-- PART 7: Data validation and migration verification
-- =============================================================================

-- Verify all existing logs have been backfilled
DO $$
DECLARE
  missing_timestamps INTEGER;
  missing_entry_types INTEGER;
BEGIN
  SELECT COUNT(*) INTO missing_timestamps
  FROM incident_logs
  WHERE time_of_occurrence IS NULL OR time_logged IS NULL;
  
  SELECT COUNT(*) INTO missing_entry_types
  FROM incident_logs
  WHERE entry_type IS NULL;
  
  IF missing_timestamps > 0 THEN
    RAISE EXCEPTION 'Migration incomplete: % logs missing timestamps', missing_timestamps;
  END IF;
  
  IF missing_entry_types > 0 THEN
    RAISE EXCEPTION 'Migration incomplete: % logs missing entry_type', missing_entry_types;
  END IF;
  
  RAISE NOTICE 'Migration validation successful: All logs have required audit fields';
END $$;

-- =============================================================================
-- PART 8: Create audit log entry for this migration
-- =============================================================================

INSERT INTO settings_audit_logs (
  user_id,
  action,
  category,
  severity,
  resource,
  details,
  created_at
) VALUES (
  NULL,  -- System action
  'DATABASE_MIGRATION',
  'system',
  'high',
  'incident_logs',
  jsonb_build_object(
    'migration', 'auditable_logging_phase1',
    'description', 'Added immutable audit trail to incident logs',
    'tables_modified', ARRAY['incident_logs', 'incident_log_revisions'],
    'completed_at', NOW()
  ),
  NOW()
) ON CONFLICT DO NOTHING;

-- =============================================================================
-- Migration Complete
-- =============================================================================

-- Display summary
DO $$
DECLARE
  total_logs INTEGER;
  total_revisions INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_logs FROM incident_logs;
  SELECT COUNT(*) INTO total_revisions FROM incident_log_revisions;
  
  RAISE NOTICE '=============================================================================';
  RAISE NOTICE 'Auditable Logging Phase 1 Migration Complete';
  RAISE NOTICE '=============================================================================';
  RAISE NOTICE 'Total incident logs migrated: %', total_logs;
  RAISE NOTICE 'Total revisions: %', total_revisions;
  RAISE NOTICE 'New columns added to incident_logs:';
  RAISE NOTICE '  - time_of_occurrence';
  RAISE NOTICE '  - time_logged';
  RAISE NOTICE '  - entry_type';
  RAISE NOTICE '  - retrospective_justification';
  RAISE NOTICE '  - logged_by_user_id';
  RAISE NOTICE '  - logged_by_callsign';
  RAISE NOTICE '  - is_amended';
  RAISE NOTICE '  - original_entry_id';
  RAISE NOTICE 'New table created: incident_log_revisions';
  RAISE NOTICE 'Helper function created: get_next_revision_number()';
  RAISE NOTICE 'Trigger created: mark_incident_as_amended';
  RAISE NOTICE 'View created: incident_log_revision_history';
  RAISE NOTICE '=============================================================================';
END $$;

