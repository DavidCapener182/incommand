-- Enable RLS on critical tables
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE incident_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies that might conflict
DROP POLICY IF EXISTS "events_company_isolation" ON events;
DROP POLICY IF EXISTS "incidents_company_isolation" ON incident_logs;
DROP POLICY IF EXISTS "incidents_company_isolation_insert" ON incident_logs;
DROP POLICY IF EXISTS "incidents_company_isolation_update" ON incident_logs;
DROP POLICY IF EXISTS "profiles_select_policy" ON profiles;

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS get_user_company_id();
DROP FUNCTION IF EXISTS is_user_superadmin();

-- Create a SECURITY DEFINER function to get user's company_id without RLS recursion
CREATE OR REPLACE FUNCTION get_user_company_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT company_id FROM profiles WHERE id = auth.uid();
$$;

-- Create a SECURITY DEFINER function to check if user is superadmin without RLS recursion
CREATE OR REPLACE FUNCTION is_user_superadmin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'superadmin'
    AND email = 'david@incommand.uk'
  );
$$;

-- Events: Users can only see events from their company
CREATE POLICY "events_company_isolation" ON events
FOR SELECT USING (
  company_id = get_user_company_id()
  OR
  -- Superadmin can see all events
  is_user_superadmin()
);

-- Incident Logs: Users can only see incidents from their company's events
CREATE POLICY "incidents_company_isolation" ON incident_logs
FOR SELECT USING (
  event_id IN (
    SELECT id FROM events
    WHERE company_id = get_user_company_id()
  )
  OR
  -- Superadmin can see all incidents
  is_user_superadmin()
);

-- Incident Logs: Users can insert incidents for their company's events
CREATE POLICY "incidents_company_isolation_insert" ON incident_logs
FOR INSERT WITH CHECK (
  event_id IN (
    SELECT id FROM events
    WHERE company_id = get_user_company_id()
  )
  OR
  -- Superadmin can insert for any event
  is_user_superadmin()
);

-- Incident Logs: Users can update incidents from their company's events
CREATE POLICY "incidents_company_isolation_update" ON incident_logs
FOR UPDATE USING (
  event_id IN (
    SELECT id FROM events
    WHERE company_id = get_user_company_id()
  )
  OR
  -- Superadmin can update any incident
  is_user_superadmin()
);

-- Profiles: Users can view profiles from their company
CREATE POLICY "profiles_select_policy" ON profiles
FOR SELECT USING (
  -- Users can always see their own profile (no recursion)
  id = auth.uid()
  OR
  -- Users can see profiles from their company (using function to avoid recursion)
  company_id = get_user_company_id()
  OR
  -- Superadmin can see all profiles (using function to avoid recursion)
  is_user_superadmin()
);





