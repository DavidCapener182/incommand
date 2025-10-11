-- Radio Sign-Out System Migration
-- Equipment tracking with digital signatures

-- Create radio_signouts table
CREATE TABLE IF NOT EXISTS radio_signouts (
  id SERIAL PRIMARY KEY,
  radio_number VARCHAR(20) NOT NULL,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  
  -- Sign-out details
  signed_out_at TIMESTAMPTZ DEFAULT NOW(),
  signed_out_signature TEXT NOT NULL,
  signed_out_notes TEXT,
  
  -- Sign-in details
  signed_in_at TIMESTAMPTZ,
  signed_in_signature TEXT,
  signed_in_notes TEXT,
  condition_on_return VARCHAR(50), -- good, damaged, missing_parts, faulty
  
  -- Status tracking
  status VARCHAR(20) DEFAULT 'out' CHECK (status IN ('out', 'returned', 'overdue', 'lost')),
  overdue_notified_at TIMESTAMPTZ,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_radio_signouts_radio_number ON radio_signouts(radio_number);
CREATE INDEX IF NOT EXISTS idx_radio_signouts_user ON radio_signouts(user_id);
CREATE INDEX IF NOT EXISTS idx_radio_signouts_event ON radio_signouts(event_id);
CREATE INDEX IF NOT EXISTS idx_radio_signouts_status ON radio_signouts(status);
CREATE INDEX IF NOT EXISTS idx_radio_signouts_signed_out ON radio_signouts(signed_out_at);

-- Create radio_inventory table for equipment management
CREATE TABLE IF NOT EXISTS radio_inventory (
  id SERIAL PRIMARY KEY,
  radio_number VARCHAR(20) UNIQUE NOT NULL,
  model VARCHAR(100),
  serial_number VARCHAR(100),
  purchase_date DATE,
  last_maintenance DATE,
  next_maintenance_due DATE,
  status VARCHAR(20) DEFAULT 'available' CHECK (status IN ('available', 'in_use', 'maintenance', 'retired')),
  condition VARCHAR(50) DEFAULT 'good',
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for radio inventory
CREATE INDEX IF NOT EXISTS idx_radio_inventory_org ON radio_inventory(organization_id);
CREATE INDEX IF NOT EXISTS idx_radio_inventory_status ON radio_inventory(status);
CREATE INDEX IF NOT EXISTS idx_radio_inventory_number ON radio_inventory(radio_number);

-- Enable RLS
ALTER TABLE radio_signouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE radio_inventory ENABLE ROW LEVEL SECURITY;

-- RLS Policies for radio_signouts
CREATE POLICY "Users can view radio sign-outs for their organization"
  ON radio_signouts FOR SELECT
  USING (
    user_id IN (
      SELECT id FROM profiles 
      WHERE organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
      )
    )
    OR
    event_id IN (
      SELECT id FROM events 
      WHERE organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can create radio sign-outs for their organization"
  ON radio_signouts FOR INSERT
  WITH CHECK (
    user_id IN (
      SELECT id FROM profiles 
      WHERE organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can update radio sign-outs for their organization"
  ON radio_signouts FOR UPDATE
  USING (
    user_id IN (
      SELECT id FROM profiles 
      WHERE organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

-- RLS Policies for radio_inventory
CREATE POLICY "Users can view radio inventory for their organization"
  ON radio_inventory FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can manage radio inventory for their organization"
  ON radio_inventory FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Function to check for overdue radios
CREATE OR REPLACE FUNCTION check_overdue_radios(p_event_id UUID)
RETURNS TABLE (
  id INTEGER,
  radio_number VARCHAR(20),
  user_id UUID,
  user_name TEXT,
  signed_out_at TIMESTAMPTZ,
  hours_overdue DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    rs.id,
    rs.radio_number,
    rs.user_id,
    CONCAT(p.first_name, ' ', p.last_name) as user_name,
    rs.signed_out_at,
    EXTRACT(EPOCH FROM (NOW() - rs.signed_out_at)) / 3600 as hours_overdue
  FROM radio_signouts rs
  JOIN profiles p ON rs.user_id = p.id
  WHERE rs.event_id = p_event_id
  AND rs.status = 'out'
  AND rs.signed_out_at < NOW() - INTERVAL '24 hours'
  ORDER BY rs.signed_out_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get radio sign-out statistics
CREATE OR REPLACE FUNCTION get_radio_signout_stats(p_event_id UUID)
RETURNS TABLE (
  total_signouts INTEGER,
  currently_out INTEGER,
  returned INTEGER,
  overdue INTEGER,
  avg_usage_hours DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::INTEGER as total_signouts,
    COUNT(*) FILTER (WHERE status = 'out')::INTEGER as currently_out,
    COUNT(*) FILTER (WHERE status = 'returned')::INTEGER as returned,
    COUNT(*) FILTER (WHERE status = 'overdue')::INTEGER as overdue,
    AVG(
      CASE 
        WHEN signed_in_at IS NOT NULL 
        THEN EXTRACT(EPOCH FROM (signed_in_at - signed_out_at)) / 3600
        ELSE NULL
      END
    ) as avg_usage_hours
  FROM radio_signouts
  WHERE event_id = p_event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to link radio to incident logs
CREATE OR REPLACE FUNCTION link_radio_to_incidents(p_radio_number VARCHAR(20), p_event_id UUID)
RETURNS TABLE (
  incident_id INTEGER,
  timestamp TIMESTAMPTZ,
  incident_type VARCHAR(100),
  priority VARCHAR(20)
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    il.id,
    il.timestamp,
    il.incident_type,
    il.priority
  FROM incident_logs il
  WHERE il.event_id = p_event_id
  AND (
    il.occurrence ILIKE '%' || p_radio_number || '%'
    OR il.action_taken ILIKE '%' || p_radio_number || '%'
    OR il.callsign_from IN (
      SELECT callsign FROM profiles 
      WHERE id IN (
        SELECT user_id FROM radio_signouts 
        WHERE radio_number = p_radio_number 
        AND event_id = p_event_id
      )
    )
  )
  ORDER BY il.timestamp DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update status to overdue
CREATE OR REPLACE FUNCTION update_overdue_radios()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE radio_signouts
  SET status = 'overdue',
      updated_at = NOW()
  WHERE status = 'out'
  AND signed_out_at < NOW() - INTERVAL '24 hours'
  AND overdue_notified_at IS NULL;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to run hourly (managed by application cron)
CREATE OR REPLACE FUNCTION check_and_update_overdue_radios()
RETURNS void AS $$
BEGIN
  PERFORM update_overdue_radios();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON radio_signouts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON radio_inventory TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE radio_signouts_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE radio_inventory_id_seq TO authenticated;
GRANT EXECUTE ON FUNCTION check_overdue_radios(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_radio_signout_stats(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION link_radio_to_incidents(VARCHAR(20), UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION check_and_update_overdue_radios() TO authenticated;

-- Add comments
COMMENT ON TABLE radio_signouts IS 'Radio equipment sign-out and return tracking with digital signatures';
COMMENT ON TABLE radio_inventory IS 'Radio equipment inventory management';
COMMENT ON FUNCTION check_overdue_radios(UUID) IS 'Get list of radios that are overdue for return';
COMMENT ON FUNCTION get_radio_signout_stats(UUID) IS 'Get radio sign-out statistics for an event';
COMMENT ON FUNCTION link_radio_to_incidents(VARCHAR(20), UUID) IS 'Link radio equipment to incident logs';
