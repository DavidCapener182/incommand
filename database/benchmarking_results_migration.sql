-- Benchmarking Results Migration
-- Stores venue type benchmarking analysis results

-- Create benchmarking_results table
CREATE TABLE IF NOT EXISTS benchmarking_results (
  id SERIAL PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  analyzed_by UUID REFERENCES profiles(id),
  analyzed_at TIMESTAMPTZ DEFAULT NOW(),
  benchmarking_data JSONB NOT NULL,
  provider_used VARCHAR(20) DEFAULT 'openai',
  
  -- One result per event
  UNIQUE(event_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_benchmarking_results_event ON benchmarking_results(event_id);
CREATE INDEX IF NOT EXISTS idx_benchmarking_results_analyzed_at ON benchmarking_results(analyzed_at);
CREATE INDEX IF NOT EXISTS idx_benchmarking_results_analyzed_by ON benchmarking_results(analyzed_by);

-- Enable RLS
ALTER TABLE benchmarking_results ENABLE ROW LEVEL SECURITY;

-- RLS Policies for benchmarking_results
CREATE POLICY "Users can view benchmarking results for events they have access to"
  ON benchmarking_results FOR SELECT
  USING (
    event_id IN (
      SELECT id FROM events 
      WHERE organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can create benchmarking results for events they have access to"
  ON benchmarking_results FOR INSERT
  WITH CHECK (
    event_id IN (
      SELECT id FROM events 
      WHERE organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can update benchmarking results for events they have access to"
  ON benchmarking_results FOR UPDATE
  USING (
    event_id IN (
      SELECT id FROM events 
      WHERE organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

-- Function to get benchmarking statistics
CREATE OR REPLACE FUNCTION get_benchmarking_statistics(p_event_id UUID)
RETURNS TABLE (
  percentile_ranking NUMERIC,
  performance_label TEXT,
  venue_type TEXT,
  total_comparison_events BIGINT,
  analysis_date TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (br.benchmarking_data->>'percentileRanking')::NUMERIC as percentile_ranking,
    CASE 
      WHEN (br.benchmarking_data->>'percentileRanking')::NUMERIC >= 90 THEN 'Excellent'
      WHEN (br.benchmarking_data->>'percentileRanking')::NUMERIC >= 80 THEN 'Very Good'
      WHEN (br.benchmarking_data->>'percentileRanking')::NUMERIC >= 70 THEN 'Good'
      WHEN (br.benchmarking_data->>'percentileRanking')::NUMERIC >= 60 THEN 'Above Average'
      WHEN (br.benchmarking_data->>'percentileRanking')::NUMERIC >= 40 THEN 'Average'
      WHEN (br.benchmarking_data->>'percentileRanking')::NUMERIC >= 30 THEN 'Below Average'
      WHEN (br.benchmarking_data->>'percentileRanking')::NUMERIC >= 20 THEN 'Poor'
      ELSE 'Very Poor'
    END as performance_label,
    (br.benchmarking_data->'currentEvent'->>'venueType')::TEXT as venue_type,
    (br.benchmarking_data->'benchmark'->>'totalEvents')::BIGINT as total_comparison_events,
    br.analyzed_at as analysis_date
  FROM benchmarking_results br
  WHERE br.event_id = p_event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get venue type performance trends
CREATE OR REPLUTE FUNCTION get_venue_performance_trends(p_venue_type VARCHAR(50), p_days INTEGER DEFAULT 90)
RETURNS TABLE (
  event_id UUID,
  event_name TEXT,
  event_date DATE,
  percentile_ranking NUMERIC,
  performance_label TEXT,
  incidents_per_hour NUMERIC,
  avg_response_time NUMERIC,
  resolution_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.id,
    e.name,
    e.date,
    (br.benchmarking_data->>'percentileRanking')::NUMERIC as percentile_ranking,
    CASE 
      WHEN (br.benchmarking_data->>'percentileRanking')::NUMERIC >= 90 THEN 'Excellent'
      WHEN (br.benchmarking_data->>'percentileRanking')::NUMERIC >= 80 THEN 'Very Good'
      WHEN (br.benchmarking_data->>'percentileRanking')::NUMERIC >= 70 THEN 'Good'
      WHEN (br.benchmarking_data->>'percentileRanking')::NUMERIC >= 60 THEN 'Above Average'
      WHEN (br.benchmarking_data->>'percentileRanking')::NUMERIC >= 40 THEN 'Average'
      WHEN (br.benchmarking_data->>'percentileRanking')::NUMERIC >= 30 THEN 'Below Average'
      WHEN (br.benchmarking_data->>'percentileRanking')::NUMERIC >= 20 THEN 'Poor'
      ELSE 'Very Poor'
    END as performance_label,
    (br.benchmarking_data->'currentEvent'->'metrics'->>'incidentsPerHour')::NUMERIC as incidents_per_hour,
    (br.benchmarking_data->'currentEvent'->'metrics'->>'averageResponseTime')::NUMERIC as avg_response_time,
    (br.benchmarking_data->'currentEvent'->'metrics'->>'resolutionRate')::NUMERIC as resolution_rate
  FROM events e
  INNER JOIN benchmarking_results br ON e.id = br.event_id
  WHERE e.venue_type = p_venue_type
  AND br.analyzed_at >= NOW() - INTERVAL '1 day' * p_days
  ORDER BY e.date DESC
  LIMIT 100;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON benchmarking_results TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE benchmarking_results_id_seq TO authenticated;
GRANT EXECUTE ON FUNCTION get_benchmarking_statistics(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_venue_performance_trends(VARCHAR(50), INTEGER) TO authenticated;

-- Add comment
COMMENT ON TABLE benchmarking_results IS 'Venue type benchmarking analysis results for event performance comparison';
