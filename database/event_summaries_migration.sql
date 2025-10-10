-- Event Summaries Migration
-- Stores AI-generated end-of-event summaries and metrics

-- Create event_summaries table
CREATE TABLE IF NOT EXISTS event_summaries (
  id SERIAL PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  generated_by UUID REFERENCES profiles(id),
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  summary_data JSONB NOT NULL,
  
  -- Prevent duplicate summaries for same event
  UNIQUE(event_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_event_summaries_event ON event_summaries(event_id);
CREATE INDEX IF NOT EXISTS idx_event_summaries_generated_at ON event_summaries(generated_at);
CREATE INDEX IF NOT EXISTS idx_event_summaries_generated_by ON event_summaries(generated_by);

-- Add venue_type to events table if it doesn't exist
ALTER TABLE events ADD COLUMN IF NOT EXISTS venue_type VARCHAR(50);

-- Update existing events with default venue type
UPDATE events SET venue_type = 'concert' WHERE venue_type IS NULL;

-- Enable RLS
ALTER TABLE event_summaries ENABLE ROW LEVEL SECURITY;

-- RLS Policies for event_summaries
CREATE POLICY "Users can view summaries for events they have access to"
  ON event_summaries FOR SELECT
  USING (
    event_id IN (
      SELECT id FROM events 
      WHERE organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can create summaries for events they have access to"
  ON event_summaries FOR INSERT
  WITH CHECK (
    event_id IN (
      SELECT id FROM events 
      WHERE organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

-- Function to get summary metrics for analytics
CREATE OR REPLACE FUNCTION get_summary_metrics(p_event_id UUID)
RETURNS TABLE (
  total_incidents BIGINT,
  avg_response_time TEXT,
  resolution_rate NUMERIC,
  staff_efficiency NUMERIC,
  top_incident_types JSONB,
  lessons_learned JSONB,
  ai_insights JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (es.summary_data->'metrics'->>'totalIncidents')::BIGINT as total_incidents,
    (es.summary_data->'metrics'->>'averageResponseTime')::TEXT as avg_response_time,
    (es.summary_data->'metrics'->>'resolutionRate')::NUMERIC as resolution_rate,
    (es.summary_data->'metrics'->>'staffEfficiency')::NUMERIC as staff_efficiency,
    es.summary_data->'metrics'->'incidentTypes' as top_incident_types,
    es.summary_data->'lessons' as lessons_learned,
    es.summary_data->'insights' as ai_insights
  FROM event_summaries es
  WHERE es.event_id = p_event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get benchmarking data
CREATE OR REPLACE FUNCTION get_benchmarking_data(p_venue_type VARCHAR(50))
RETURNS TABLE (
  event_id UUID,
  event_name TEXT,
  event_date DATE,
  total_incidents BIGINT,
  resolution_rate NUMERIC,
  staff_efficiency NUMERIC,
  avg_response_time TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.id,
    e.name,
    e.date,
    (es.summary_data->'metrics'->>'totalIncidents')::BIGINT as total_incidents,
    (es.summary_data->'metrics'->>'resolutionRate')::NUMERIC as resolution_rate,
    (es.summary_data->'metrics'->>'staffEfficiency')::NUMERIC as staff_efficiency,
    (es.summary_data->'metrics'->>'averageResponseTime')::TEXT as avg_response_time
  FROM events e
  LEFT JOIN event_summaries es ON e.id = es.event_id
  WHERE e.venue_type = p_venue_type
  AND es.summary_data IS NOT NULL
  ORDER BY e.date DESC
  LIMIT 50;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT SELECT, INSERT ON event_summaries TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE event_summaries_id_seq TO authenticated;
GRANT EXECUTE ON FUNCTION get_summary_metrics(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_benchmarking_data(VARCHAR(50)) TO authenticated;

-- Add comment
COMMENT ON TABLE event_summaries IS 'AI-generated end-of-event summaries with metrics and insights';
