-- Pattern Analyses Migration
-- Stores AI-generated pattern analysis results

-- Create pattern_analyses table
CREATE TABLE IF NOT EXISTS pattern_analyses (
  id SERIAL PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  analyzed_by UUID REFERENCES profiles(id),
  analyzed_at TIMESTAMPTZ DEFAULT NOW(),
  analysis_data JSONB NOT NULL,
  provider_used VARCHAR(20) DEFAULT 'openai',
  
  -- One analysis per event
  UNIQUE(event_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_pattern_analyses_event ON pattern_analyses(event_id);
CREATE INDEX IF NOT EXISTS idx_pattern_analyses_analyzed_at ON pattern_analyses(analyzed_at);
CREATE INDEX IF NOT EXISTS idx_pattern_analyses_analyzed_by ON pattern_analyses(analyzed_by);

-- Enable RLS
ALTER TABLE pattern_analyses ENABLE ROW LEVEL SECURITY;

-- RLS Policies for pattern_analyses
CREATE POLICY "Users can view pattern analyses for events they have access to"
  ON pattern_analyses FOR SELECT
  USING (
    event_id IN (
      SELECT id FROM events 
      WHERE organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can create pattern analyses for events they have access to"
  ON pattern_analyses FOR INSERT
  WITH CHECK (
    event_id IN (
      SELECT id FROM events 
      WHERE organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can update pattern analyses for events they have access to"
  ON pattern_analyses FOR UPDATE
  USING (
    event_id IN (
      SELECT id FROM events 
      WHERE organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

-- Function to get pattern statistics
CREATE OR REPLACE FUNCTION get_pattern_statistics(p_event_id UUID)
RETURNS TABLE (
  total_patterns BIGINT,
  critical_patterns BIGINT,
  high_risk_patterns BIGINT,
  overall_risk TEXT,
  confidence_level NUMERIC,
  analysis_date TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    jsonb_array_length(pa.analysis_data->'patterns') as total_patterns,
    (
      SELECT COUNT(*)
      FROM jsonb_array_elements(pa.analysis_data->'patterns') pattern
      WHERE pattern->>'severity' = 'critical'
    ) as critical_patterns,
    (
      SELECT COUNT(*)
      FROM jsonb_array_elements(pa.analysis_data->'patterns') pattern
      WHERE pattern->>'severity' IN ('critical', 'high')
    ) as high_risk_patterns,
    (pa.analysis_data->>'overallRisk')::TEXT as overall_risk,
    (pa.analysis_data->>'confidence')::NUMERIC as confidence_level,
    pa.analyzed_at as analysis_date
  FROM pattern_analyses pa
  WHERE pa.event_id = p_event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get pattern trends across events
CREATE OR REPLACE FUNCTION get_pattern_trends(p_organization_id UUID, p_days INTEGER DEFAULT 30)
RETURNS TABLE (
  pattern_type TEXT,
  total_occurrences BIGINT,
  avg_severity TEXT,
  most_common_location TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    pattern->>'type' as pattern_type,
    COUNT(*) as total_occurrences,
    (
      SELECT severity
      FROM (
        SELECT pattern->>'severity' as severity, COUNT(*) as cnt
        FROM jsonb_array_elements(pa.analysis_data->'patterns') p
        WHERE p->>'type' = pattern->>'type'
        GROUP BY pattern->>'severity'
        ORDER BY cnt DESC
        LIMIT 1
      ) severity_ranking
    ) as avg_severity,
    (
      SELECT location
      FROM (
        SELECT il.location, COUNT(*) as cnt
        FROM incident_logs il
        WHERE il.event_id = pa.event_id
        AND il.location IS NOT NULL
        GROUP BY il.location
        ORDER BY cnt DESC
        LIMIT 1
      ) location_ranking
    ) as most_common_location
  FROM pattern_analyses pa
  INNER JOIN events e ON pa.event_id = e.id
  CROSS JOIN jsonb_array_elements(pa.analysis_data->'patterns') pattern
  WHERE e.organization_id = p_organization_id
  AND pa.analyzed_at >= NOW() - INTERVAL '1 day' * p_days
  GROUP BY pattern->>'type'
  ORDER BY total_occurrences DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON pattern_analyses TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE pattern_analyses_id_seq TO authenticated;
GRANT EXECUTE ON FUNCTION get_pattern_statistics(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_pattern_trends(UUID, INTEGER) TO authenticated;

-- Add comment
COMMENT ON TABLE pattern_analyses IS 'AI-generated pattern analysis results for security incidents';
