/**
 * Operational Readiness Index Migration
 * Feature 1: Real-Time Operational Readiness Index
 * 
 * Creates table for storing historical operational readiness scores
 * and their component breakdowns.
 */

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create operational_readiness table
CREATE TABLE IF NOT EXISTS operational_readiness (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Overall Score (0-100)
  overall_score INTEGER NOT NULL CHECK (overall_score >= 0 AND overall_score <= 100),
  
  -- Component Scores (0-100 each)
  staffing_score INTEGER NOT NULL CHECK (staffing_score >= 0 AND staffing_score <= 100),
  incident_pressure_score INTEGER NOT NULL CHECK (incident_pressure_score >= 0 AND incident_pressure_score <= 100),
  weather_score INTEGER NOT NULL CHECK (weather_score >= 0 AND weather_score <= 100),
  transport_score INTEGER NOT NULL CHECK (transport_score >= 0 AND transport_score <= 100),
  asset_status_score INTEGER NOT NULL CHECK (asset_status_score >= 0 AND asset_status_score <= 100),
  crowd_density_score INTEGER NOT NULL CHECK (crowd_density_score >= 0 AND crowd_density_score <= 100),
  
  -- Component Details (JSONB for flexibility)
  staffing_details JSONB NOT NULL DEFAULT '{}'::jsonb,
  incident_details JSONB NOT NULL DEFAULT '{}'::jsonb,
  weather_details JSONB NOT NULL DEFAULT '{}'::jsonb,
  transport_details JSONB NOT NULL DEFAULT '{}'::jsonb,
  asset_details JSONB NOT NULL DEFAULT '{}'::jsonb,
  crowd_details JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  -- Metadata
  calculated_by_user_id UUID REFERENCES auth.users(id),
  calculation_version VARCHAR(50) DEFAULT '1.0',
  notes TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_operational_readiness_event_id 
  ON operational_readiness(event_id);
CREATE INDEX IF NOT EXISTS idx_operational_readiness_timestamp 
  ON operational_readiness(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_operational_readiness_company_id 
  ON operational_readiness(company_id);
CREATE INDEX IF NOT EXISTS idx_operational_readiness_score 
  ON operational_readiness(overall_score);
CREATE INDEX IF NOT EXISTS idx_operational_readiness_event_timestamp 
  ON operational_readiness(event_id, timestamp DESC);

-- Enable Row Level Security
ALTER TABLE operational_readiness ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view readiness scores for their company
CREATE POLICY "Users can view readiness scores for their company"
  ON operational_readiness FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

-- RLS Policy: Users can insert readiness scores for their company
CREATE POLICY "Users can insert readiness scores for their company"
  ON operational_readiness FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

-- RLS Policy: Users can update readiness scores for their company (for corrections)
CREATE POLICY "Users can update readiness scores for their company"
  ON operational_readiness FOR UPDATE
  USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_operational_readiness_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_operational_readiness_updated_at
  BEFORE UPDATE ON operational_readiness
  FOR EACH ROW
  EXECUTE FUNCTION update_operational_readiness_updated_at();

-- Add comment to table
COMMENT ON TABLE operational_readiness IS 'Stores historical operational readiness scores and component breakdowns for events';
COMMENT ON COLUMN operational_readiness.overall_score IS 'Overall readiness score (0-100), weighted aggregate of component scores';
COMMENT ON COLUMN operational_readiness.staffing_score IS 'Staffing component score (0-100), based on staff on post vs planned';
COMMENT ON COLUMN operational_readiness.incident_pressure_score IS 'Incident pressure component score (0-100), based on current incident load';
COMMENT ON COLUMN operational_readiness.weather_score IS 'Weather component score (0-100), based on current conditions and forecasts';
COMMENT ON COLUMN operational_readiness.transport_score IS 'Transport component score (0-100), based on ingress/egress status';
COMMENT ON COLUMN operational_readiness.asset_status_score IS 'Asset status component score (0-100), based on infrastructure operational status';
COMMENT ON COLUMN operational_readiness.crowd_density_score IS 'Crowd density component score (0-100), based on current occupancy vs capacity';

