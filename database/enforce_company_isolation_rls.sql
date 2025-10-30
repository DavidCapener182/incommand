-- Enable RLS on critical tables
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE incident_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies that might conflict
DROP POLICY IF EXISTS "events_company_isolation" ON events;
DROP POLICY IF EXISTS "incidents_company_isolation" ON incident_logs;
DROP POLICY IF EXISTS "profiles_select_policy" ON profiles;

-- Events: Users can only see events from their company
CREATE POLICY "events_company_isolation" ON events
FOR SELECT USING (
  company_id IN (
    SELECT company_id FROM profiles 
    WHERE id = auth.uid()
  )
  OR
  -- Superadmin can see all events
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'superadmin'
    AND email = 'david@incommand.uk'
  )
);

-- Incident Logs: Users can only see incidents from their company's events
CREATE POLICY "incidents_company_isolation" ON incident_logs
FOR SELECT USING (
  event_id IN (
    SELECT id FROM events
    WHERE company_id IN (
      SELECT company_id FROM profiles
      WHERE id = auth.uid()
    )
  )
  OR
  -- Superadmin can see all incidents
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'superadmin'
    AND email = 'david@incommand.uk'
  )
);

-- Profiles: Users can view profiles from their company
CREATE POLICY "profiles_select_policy" ON profiles
FOR SELECT USING (
  company_id IN (
    SELECT company_id FROM profiles p2
    WHERE p2.id = auth.uid()
  )
  OR
  -- Superadmin can see all profiles
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'superadmin'
    AND email = 'david@incommand.uk'
  )
  OR
  -- Users can always see their own profile
  id = auth.uid()
);


