-- Incident Tagging System Migration
-- Enables categorization and filtering of incidents with tags

-- Create incident_tags table
CREATE TABLE IF NOT EXISTS incident_tags (
  id SERIAL PRIMARY KEY,
  incident_id INTEGER NOT NULL REFERENCES incident_logs(id) ON DELETE CASCADE,
  tag VARCHAR(50) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id),
  
  -- Prevent duplicate tags on same incident
  UNIQUE(incident_id, tag)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_incident_tags_incident ON incident_tags(incident_id);
CREATE INDEX IF NOT EXISTS idx_incident_tags_tag ON incident_tags(tag);
CREATE INDEX IF NOT EXISTS idx_incident_tags_created_at ON incident_tags(created_at);

-- Create tag_presets table for predefined tags
CREATE TABLE IF NOT EXISTS tag_presets (
  id SERIAL PRIMARY KEY,
  tag_name VARCHAR(50) NOT NULL UNIQUE,
  category VARCHAR(50), -- medical, security, logistics, etc.
  color VARCHAR(7), -- hex color for UI
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);

-- Insert predefined tags
INSERT INTO tag_presets (tag_name, category, color, description) VALUES
  ('medical', 'emergency', '#EF4444', 'Medical emergency or health-related incident'),
  ('crowd', 'safety', '#F59E0B', 'Crowd management or density issues'),
  ('VIP', 'special', '#8B5CF6', 'VIP-related incident or request'),
  ('weather', 'environmental', '#3B82F6', 'Weather-related incident'),
  ('security', 'safety', '#DC2626', 'Security threat or concern'),
  ('staff', 'operational', '#10B981', 'Staff-related issue'),
  ('equipment', 'operational', '#6B7280', 'Equipment failure or issue'),
  ('lost-found', 'general', '#F97316', 'Lost property or found items'),
  ('noise', 'nuisance', '#EC4899', 'Noise complaint'),
  ('suspicious', 'security', '#DC2626', 'Suspicious behavior or activity'),
  ('theft', 'crime', '#7C2D12', 'Theft or stealing'),
  ('assault', 'crime', '#991B1B', 'Physical assault'),
  ('drugs', 'crime', '#6D28D9', 'Drug-related incident'),
  ('alcohol', 'substance', '#B45309', 'Alcohol-related incident'),
  ('fire', 'emergency', '#DC2626', 'Fire or smoke'),
  ('evacuation', 'emergency', '#DC2626', 'Evacuation required'),
  ('first-aid', 'medical', '#10B981', 'First aid provided'),
  ('child', 'special', '#3B82F6', 'Child-related incident'),
  ('elderly', 'special', '#3B82F6', 'Elderly person involved'),
  ('disability', 'special', '#3B82F6', 'Person with disability involved')
ON CONFLICT (tag_name) DO NOTHING;

-- Enable RLS
ALTER TABLE incident_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE tag_presets ENABLE ROW LEVEL SECURITY;

-- RLS Policies for incident_tags
CREATE POLICY "Users can view tags for events they have access to"
  ON incident_tags FOR SELECT
  USING (
    incident_id IN (
      SELECT id FROM incident_logs 
      WHERE event_id IN (
        SELECT id FROM events 
        WHERE organization_id IN (
          SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Users can add tags to incidents"
  ON incident_tags FOR INSERT
  WITH CHECK (
    incident_id IN (
      SELECT id FROM incident_logs 
      WHERE event_id IN (
        SELECT id FROM events 
        WHERE organization_id IN (
          SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Users can delete tags they created"
  ON incident_tags FOR DELETE
  USING (created_by = auth.uid());

-- RLS Policies for tag_presets (public read)
CREATE POLICY "Anyone can view tag presets"
  ON tag_presets FOR SELECT
  USING (is_active = TRUE);

-- Function to get popular tags for an event
CREATE OR REPLACE FUNCTION get_popular_tags(p_event_id UUID, p_limit INTEGER DEFAULT 10)
RETURNS TABLE (
  tag VARCHAR(50),
  count BIGINT,
  color VARCHAR(7)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    it.tag,
    COUNT(*) as count,
    COALESCE(tp.color, '#6B7280') as color
  FROM incident_tags it
  INNER JOIN incident_logs il ON it.incident_id = il.id
  LEFT JOIN tag_presets tp ON it.tag = tp.tag_name
  WHERE il.event_id = p_event_id
  GROUP BY it.tag, tp.color
  ORDER BY count DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get tag statistics
CREATE OR REPLACE FUNCTION get_tag_statistics(p_event_id UUID)
RETURNS TABLE (
  total_tags BIGINT,
  unique_tags BIGINT,
  most_used_tag VARCHAR(50),
  most_used_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) as total_tags,
    COUNT(DISTINCT it.tag) as unique_tags,
    (
      SELECT it2.tag
      FROM incident_tags it2
      INNER JOIN incident_logs il2 ON it2.incident_id = il2.id
      WHERE il2.event_id = p_event_id
      GROUP BY it2.tag
      ORDER BY COUNT(*) DESC
      LIMIT 1
    ) as most_used_tag,
    (
      SELECT COUNT(*)
      FROM incident_tags it3
      INNER JOIN incident_logs il3 ON it3.incident_id = il3.id
      WHERE il3.event_id = p_event_id
      GROUP BY it3.tag
      ORDER BY COUNT(*) DESC
      LIMIT 1
    ) as most_used_count
  FROM incident_tags it
  INNER JOIN incident_logs il ON it.incident_id = il.id
  WHERE il.event_id = p_event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT SELECT, INSERT, DELETE ON incident_tags TO authenticated;
GRANT SELECT ON tag_presets TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE incident_tags_id_seq TO authenticated;
GRANT EXECUTE ON FUNCTION get_popular_tags(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_tag_statistics(UUID) TO authenticated;

-- Add comment
COMMENT ON TABLE incident_tags IS 'Tags for categorizing and organizing incidents';
COMMENT ON TABLE tag_presets IS 'Predefined tags with colors and categories';

