-- Staff Assignments Migration
-- Persist staff position assignments for events

-- Create staff_assignments table to persist position assignments
CREATE TABLE IF NOT EXISTS staff_assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  staff_id UUID REFERENCES staff(id) ON DELETE CASCADE,
  position_id TEXT NOT NULL, -- e.g., "ALPHA-1", "SIERRA-2"
  callsign TEXT NOT NULL,
  position_name TEXT NOT NULL,
  department TEXT NOT NULL,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  assigned_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one staff member per position per event
  UNIQUE(event_id, position_id),
  -- Ensure one position per staff member per event
  UNIQUE(event_id, staff_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_staff_assignments_event_id ON staff_assignments(event_id);
CREATE INDEX IF NOT EXISTS idx_staff_assignments_staff_id ON staff_assignments(staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_assignments_position_id ON staff_assignments(position_id);

-- Enable RLS
ALTER TABLE staff_assignments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view assignments for their company events" ON staff_assignments
  FOR SELECT USING (
    event_id IN (
      SELECT e.id FROM events e
      JOIN profiles p ON p.company_id = e.company_id
      WHERE p.id = auth.uid()
    )
  );

CREATE POLICY "Users can manage assignments for their company events" ON staff_assignments
  FOR ALL USING (
    event_id IN (
      SELECT e.id FROM events e
      JOIN profiles p ON p.company_id = e.company_id
      WHERE p.id = auth.uid()
    )
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_staff_assignments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER trigger_update_staff_assignments_updated_at
  BEFORE UPDATE ON staff_assignments
  FOR EACH ROW
  EXECUTE FUNCTION update_staff_assignments_updated_at();

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON staff_assignments TO authenticated;

-- Add comments
COMMENT ON TABLE staff_assignments IS 'Staff position assignments for events - persists which staff are assigned to which positions';
