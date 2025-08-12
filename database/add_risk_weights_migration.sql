-- Migration: Add risk_weights column to events table
-- This allows for configurable risk factor weights in the RiskScoringEngine

-- Add the risk_weights column as JSONB to store custom weight configurations
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS risk_weights JSONB;

-- Add a comment to document the column purpose
COMMENT ON COLUMN events.risk_weights IS 'JSONB column storing custom risk factor weights for the RiskScoringEngine. Format: {"weather": 0.25, "crowd": 0.30, "time": 0.20, "location": 0.15, "eventPhase": 0.10}. Weights must sum to 1.0.';

-- Create an index on the risk_weights column for efficient querying
CREATE INDEX IF NOT EXISTS idx_events_risk_weights ON events USING GIN (risk_weights);

-- Add a check constraint to ensure weights sum to 1.0 (optional, as validation is handled in application code)
-- Note: This is a simplified check - full validation should be done in application code
ALTER TABLE events 
ADD CONSTRAINT IF NOT EXISTS check_risk_weights_valid 
CHECK (
  risk_weights IS NULL OR (
    risk_weights ? 'weather' AND 
    risk_weights ? 'crowd' AND 
    risk_weights ? 'time' AND 
    risk_weights ? 'location' AND 
    risk_weights ? 'eventPhase'
  )
);
