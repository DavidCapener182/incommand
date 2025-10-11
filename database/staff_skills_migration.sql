-- Staff Skills & Certifications Migration
-- Comprehensive staff skills tracking and certification management

-- Create staff_skills table
CREATE TABLE IF NOT EXISTS staff_skills (
  id SERIAL PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  skill_name VARCHAR(100) NOT NULL,
  certification_date DATE,
  expiry_date DATE,
  verified BOOLEAN DEFAULT FALSE,
  verified_by UUID REFERENCES profiles(id),
  verified_at TIMESTAMPTZ,
  certification_number VARCHAR(100),
  issuing_authority VARCHAR(200),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Prevent duplicate skills per person
  UNIQUE(profile_id, skill_name)
);

-- Create staff_availability table for on-shift/off-shift tracking
CREATE TABLE IF NOT EXISTS staff_availability (
  id SERIAL PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  is_available BOOLEAN DEFAULT FALSE,
  availability_reason VARCHAR(100), -- 'on-shift', 'off-shift', 'break', 'unavailable'
  shift_start TIMESTAMPTZ,
  shift_end TIMESTAMPTZ,
  last_status_change TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- One availability record per person per event
  UNIQUE(profile_id, event_id)
);

-- Create staff_performance table for tracking performance metrics
CREATE TABLE IF NOT EXISTS staff_performance (
  id SERIAL PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  performance_score INTEGER CHECK (performance_score >= 0 AND performance_score <= 100),
  incidents_handled INTEGER DEFAULT 0,
  avg_response_time_minutes DECIMAL(5,2),
  log_quality_score INTEGER CHECK (log_quality_score >= 0 AND log_quality_score <= 100),
  resolution_rate DECIMAL(5,2),
  supervisor_rating INTEGER CHECK (supervisor_rating >= 1 AND supervisor_rating <= 5),
  supervisor_notes TEXT,
  calculated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- One performance record per person per event
  UNIQUE(profile_id, event_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_staff_skills_profile ON staff_skills(profile_id);
CREATE INDEX IF NOT EXISTS idx_staff_skills_skill ON staff_skills(skill_name);
CREATE INDEX IF NOT EXISTS idx_staff_skills_expiry ON staff_skills(expiry_date);
CREATE INDEX IF NOT EXISTS idx_staff_skills_verified ON staff_skills(verified);

CREATE INDEX IF NOT EXISTS idx_staff_availability_profile ON staff_availability(profile_id);
CREATE INDEX IF NOT EXISTS idx_staff_availability_event ON staff_availability(event_id);
CREATE INDEX IF NOT EXISTS idx_staff_availability_status ON staff_availability(is_available);

CREATE INDEX IF NOT EXISTS idx_staff_performance_profile ON staff_performance(profile_id);
CREATE INDEX IF NOT EXISTS idx_staff_performance_event ON staff_performance(event_id);
CREATE INDEX IF NOT EXISTS idx_staff_performance_score ON staff_performance(performance_score);

-- Enable RLS
ALTER TABLE staff_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_performance ENABLE ROW LEVEL SECURITY;

-- RLS Policies for staff_skills
CREATE POLICY "Users can view skills for profiles in their organization"
  ON staff_skills FOR SELECT
  USING (
    profile_id IN (
      SELECT id FROM profiles 
      WHERE organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can manage skills for profiles in their organization"
  ON staff_skills FOR ALL
  USING (
    profile_id IN (
      SELECT id FROM profiles 
      WHERE organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

-- RLS Policies for staff_availability
CREATE POLICY "Users can view availability for profiles in their organization"
  ON staff_availability FOR SELECT
  USING (
    profile_id IN (
      SELECT id FROM profiles 
      WHERE organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can manage availability for profiles in their organization"
  ON staff_availability FOR ALL
  USING (
    profile_id IN (
      SELECT id FROM profiles 
      WHERE organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

-- RLS Policies for staff_performance
CREATE POLICY "Users can view performance for profiles in their organization"
  ON staff_performance FOR SELECT
  USING (
    profile_id IN (
      SELECT id FROM profiles 
      WHERE organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can manage performance for profiles in their organization"
  ON staff_performance FOR ALL
  USING (
    profile_id IN (
      SELECT id FROM profiles 
      WHERE organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

-- Function to get skills matrix data
CREATE OR REPLACE FUNCTION get_skills_matrix(p_organization_id UUID)
RETURNS TABLE (
  profile_id UUID,
  full_name TEXT,
  email TEXT,
  skills JSONB,
  certifications_expiring_30_days INTEGER,
  verified_skills_count INTEGER,
  total_skills_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    CONCAT(p.first_name, ' ', p.last_name) as full_name,
    p.email,
    COALESCE(
      JSON_AGG(
        JSON_BUILD_OBJECT(
          'skill_name', ss.skill_name,
          'certification_date', ss.certification_date,
          'expiry_date', ss.expiry_date,
          'verified', ss.verified,
          'days_until_expiry', CASE 
            WHEN ss.expiry_date IS NOT NULL 
            THEN ss.expiry_date - CURRENT_DATE 
            ELSE NULL 
          END
        )
      ) FILTER (WHERE ss.id IS NOT NULL),
      '[]'::JSONB
    ) as skills,
    COUNT(*) FILTER (WHERE ss.expiry_date IS NOT NULL AND ss.expiry_date - CURRENT_DATE <= 30) as certifications_expiring_30_days,
    COUNT(*) FILTER (WHERE ss.verified = TRUE) as verified_skills_count,
    COUNT(*) as total_skills_count
  FROM profiles p
  LEFT JOIN staff_skills ss ON p.id = ss.profile_id
  WHERE p.organization_id = p_organization_id
  GROUP BY p.id, p.first_name, p.last_name, p.email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get staff availability for an event
CREATE OR REPLACE FUNCTION get_staff_availability(p_event_id UUID)
RETURNS TABLE (
  profile_id UUID,
  full_name TEXT,
  callsign TEXT,
  is_available BOOLEAN,
  availability_reason TEXT,
  shift_start TIMESTAMPTZ,
  shift_end TIMESTAMPTZ,
  last_status_change TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    CONCAT(p.first_name, ' ', p.last_name) as full_name,
    p.callsign,
    COALESCE(sa.is_available, FALSE) as is_available,
    sa.availability_reason,
    sa.shift_start,
    sa.shift_end,
    sa.last_status_change
  FROM profiles p
  LEFT JOIN staff_availability sa ON p.id = sa.profile_id AND sa.event_id = p_event_id
  WHERE p.organization_id = (
    SELECT organization_id FROM events WHERE id = p_event_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate staff performance
CREATE OR REPLACE FUNCTION calculate_staff_performance(p_event_id UUID, p_profile_id UUID)
RETURNS TABLE (
  performance_score INTEGER,
  incidents_handled INTEGER,
  avg_response_time_minutes DECIMAL(5,2),
  log_quality_score INTEGER,
  resolution_rate DECIMAL(5,2)
) AS $$
DECLARE
  total_incidents INTEGER;
  handled_incidents INTEGER;
  resolved_incidents INTEGER;
  total_response_time DECIMAL;
  avg_response DECIMAL(5,2);
  quality_score INTEGER;
  resolution_rate DECIMAL(5,2);
  final_score INTEGER;
BEGIN
  -- Get incident counts
  SELECT 
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE callsign_from = (SELECT callsign FROM profiles WHERE id = p_profile_id) 
                     OR assigned_to = (SELECT callsign FROM profiles WHERE id = p_profile_id)) as handled,
    COUNT(*) FILTER (WHERE (callsign_from = (SELECT callsign FROM profiles WHERE id = p_profile_id) 
                            OR assigned_to = (SELECT callsign FROM profiles WHERE id = p_profile_id))
                      AND is_closed = TRUE) as resolved
  INTO total_incidents, handled_incidents, resolved_incidents
  FROM incident_logs
  WHERE event_id = p_event_id;

  -- Calculate average response time
  SELECT AVG(
    EXTRACT(EPOCH FROM (responded_at - timestamp)) / 60
  ) INTO avg_response
  FROM incident_logs
  WHERE event_id = p_event_id
  AND (callsign_from = (SELECT callsign FROM profiles WHERE id = p_profile_id)
       OR assigned_to = (SELECT callsign FROM profiles WHERE id = p_profile_id))
  AND responded_at IS NOT NULL;

  -- Calculate log quality score (based on completeness)
  SELECT ROUND(
    AVG(
      CASE 
        WHEN occurrence IS NOT NULL AND occurrence != '' THEN 20 ELSE 0 END +
      CASE 
        WHEN action_taken IS NOT NULL AND action_taken != '' THEN 20 ELSE 0 END +
      CASE 
        WHEN location IS NOT NULL AND location != '' THEN 20 ELSE 0 END +
      CASE 
        WHEN incident_type IS NOT NULL AND incident_type != '' THEN 20 ELSE 0 END +
      CASE 
        WHEN priority IS NOT NULL AND priority != '' THEN 20 ELSE 0 END
    )
  ) INTO quality_score
  FROM incident_logs
  WHERE event_id = p_event_id
  AND (callsign_from = (SELECT callsign FROM profiles WHERE id = p_profile_id)
       OR assigned_to = (SELECT callsign FROM profiles WHERE id = p_profile_id));

  -- Calculate resolution rate
  IF handled_incidents > 0 THEN
    resolution_rate := (resolved_incidents::DECIMAL / handled_incidents::DECIMAL) * 100;
  ELSE
    resolution_rate := 0;
  END IF;

  -- Calculate final performance score
  final_score := LEAST(100, GREATEST(0, 
    COALESCE(quality_score, 0) * 0.4 +
    CASE WHEN avg_response IS NOT NULL AND avg_response <= 5 THEN 30
         WHEN avg_response IS NOT NULL AND avg_response <= 10 THEN 20
         WHEN avg_response IS NOT NULL AND avg_response <= 15 THEN 10
         ELSE 0 END +
    CASE WHEN resolution_rate >= 90 THEN 30
         WHEN resolution_rate >= 80 THEN 25
         WHEN resolution_rate >= 70 THEN 20
         WHEN resolution_rate >= 60 THEN 15
         WHEN resolution_rate >= 50 THEN 10
         ELSE 0 END
  ));

  RETURN QUERY SELECT
    final_score::INTEGER,
    handled_incidents,
    avg_response,
    quality_score,
    resolution_rate;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON staff_skills TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON staff_availability TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON staff_performance TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE staff_skills_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE staff_availability_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE staff_performance_id_seq TO authenticated;
GRANT EXECUTE ON FUNCTION get_skills_matrix(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_staff_availability(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_staff_performance(UUID, UUID) TO authenticated;

-- Add comments
COMMENT ON TABLE staff_skills IS 'Staff skills and certifications tracking';
COMMENT ON TABLE staff_availability IS 'Staff availability and shift tracking per event';
COMMENT ON TABLE staff_performance IS 'Staff performance metrics and scoring';
