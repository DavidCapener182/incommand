-- Football Match Flow Incidents Migration
-- Adds support for match flow logs (Kick-Off, Half-Time, Goals, etc.)
-- These are non-escalating informational logs that update the Pitch Card

-- =============================================================================
-- PART 1: Add new columns to incident_logs table
-- =============================================================================

-- Add type column to distinguish match flow logs from standard incidents
ALTER TABLE incident_logs 
  ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'incident';

-- Add category column for event type categorization
ALTER TABLE incident_logs 
  ADD COLUMN IF NOT EXISTS category VARCHAR(50);

-- Add match_minute column for storing calculated match time
ALTER TABLE incident_logs 
  ADD COLUMN IF NOT EXISTS match_minute INTEGER;

-- Add home_score and away_score columns for goal tracking
ALTER TABLE incident_logs 
  ADD COLUMN IF NOT EXISTS home_score INTEGER;
ALTER TABLE incident_logs 
  ADD COLUMN IF NOT EXISTS away_score INTEGER;

-- Backfill type column for existing records
UPDATE incident_logs 
SET type = 'incident' 
WHERE type IS NULL;

-- Make type column NOT NULL after backfill
ALTER TABLE incident_logs
  ALTER COLUMN type SET NOT NULL;

-- =============================================================================
-- PART 2: Create indexes for efficient match flow log queries
-- =============================================================================

-- Index for filtering match flow logs by event and type
CREATE INDEX IF NOT EXISTS idx_incident_logs_event_type 
  ON incident_logs(event_id, type);

-- Index for filtering match flow logs by event, category, and type
CREATE INDEX IF NOT EXISTS idx_incident_logs_event_category_type 
  ON incident_logs(event_id, category, type) 
  WHERE category IS NOT NULL AND type = 'match_log';

-- Index for match flow log queries ordered by time
CREATE INDEX IF NOT EXISTS idx_incident_logs_match_flow_time 
  ON incident_logs(event_id, time_of_occurrence) 
  WHERE type = 'match_log';

-- =============================================================================
-- PART 3: Add constraints and validation
-- =============================================================================

-- Add constraint to validate type values
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'incident_logs_type_check'
  ) THEN
    ALTER TABLE incident_logs
      ADD CONSTRAINT incident_logs_type_check 
        CHECK (type IN ('incident', 'match_log', 'flow_log'));
  END IF;
END $$;

-- Add constraint to ensure match flow logs have category set
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'match_log_requires_category'
  ) THEN
    ALTER TABLE incident_logs
      ADD CONSTRAINT match_log_requires_category 
        CHECK (
          type != 'match_log' OR 
          (category IS NOT NULL AND LENGTH(TRIM(category)) > 0)
        );
  END IF;
END $$;

-- Add constraint to ensure scores are non-negative
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'incident_logs_score_check'
  ) THEN
    ALTER TABLE incident_logs
      ADD CONSTRAINT incident_logs_score_check 
        CHECK (
          (home_score IS NULL OR home_score >= 0) AND
          (away_score IS NULL OR away_score >= 0)
        );
  END IF;
END $$;

-- Add constraint to ensure match_minute is non-negative
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'incident_logs_match_minute_check'
  ) THEN
    ALTER TABLE incident_logs
      ADD CONSTRAINT incident_logs_match_minute_check 
        CHECK (match_minute IS NULL OR match_minute >= 0);
  END IF;
END $$;

-- =============================================================================
-- PART 4: Comments for documentation
-- =============================================================================

COMMENT ON COLUMN incident_logs.type IS 'Type of log entry: incident (standard), match_log (match flow), flow_log (generic flow)';
COMMENT ON COLUMN incident_logs.category IS 'Event category: football, concert, festival, etc.';
COMMENT ON COLUMN incident_logs.match_minute IS 'Calculated match minute when this log was created (for match flow logs)';
COMMENT ON COLUMN incident_logs.home_score IS 'Home team score at time of log creation (for goal logs)';
COMMENT ON COLUMN incident_logs.away_score IS 'Away team score at time of log creation (for goal logs)';

