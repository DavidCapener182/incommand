-- Fix company_id data type inconsistency in events table
-- CRITICAL: This ensures proper multi-tenant data isolation
-- This version finds and drops ALL policies that depend on company_id

-- 1. Check current data type
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'events' AND column_name = 'company_id';

-- 2. Find ALL policies that depend on company_id column
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'events' 
AND (qual LIKE '%company_id%' OR with_check LIKE '%company_id%');

-- 3. Drop ALL existing RLS policies on events table
-- (This is safer than trying to identify specific ones)
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    -- Get all policies on events table
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'events'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || policy_record.policyname || '" ON events';
    END LOOP;
END $$;

-- 4. Temporarily disable RLS on events table
ALTER TABLE events DISABLE ROW LEVEL SECURITY;

-- 5. Validate all existing company_id values are valid UUIDs before conversion
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM events 
    WHERE company_id IS NOT NULL 
    AND company_id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  ) THEN
    RAISE EXCEPTION 'Invalid UUID values found in events.company_id';
  END IF;
END $$;

-- 6. Alter column type from TEXT to UUID
ALTER TABLE events 
ALTER COLUMN company_id TYPE UUID USING company_id::UUID;

-- 7. Add foreign key constraint if missing
ALTER TABLE events
DROP CONSTRAINT IF EXISTS events_company_id_fkey;

ALTER TABLE events
ADD CONSTRAINT events_company_id_fkey 
FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;

-- 8. Create index for performance
CREATE INDEX IF NOT EXISTS idx_events_company_id ON events(company_id);

-- 9. Re-enable RLS on events table
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- 10. Recreate the proper RLS policies for multi-tenant security
CREATE POLICY "events_select_company_isolation" ON events
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

CREATE POLICY "events_insert_company_isolation" ON events
FOR INSERT WITH CHECK (
  company_id IN (
    SELECT company_id FROM profiles 
    WHERE id = auth.uid()
  )
  OR
  -- Superadmin can insert events for any company
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'superadmin'
    AND email = 'david@incommand.uk'
  )
);

CREATE POLICY "events_update_company_isolation" ON events
FOR UPDATE USING (
  company_id IN (
    SELECT company_id FROM profiles 
    WHERE id = auth.uid()
  )
  OR
  -- Superadmin can update events for any company
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'superadmin'
    AND email = 'david@incommand.uk'
  )
);

CREATE POLICY "events_delete_company_isolation" ON events
FOR DELETE USING (
  company_id IN (
    SELECT company_id FROM profiles 
    WHERE id = auth.uid()
  )
  OR
  -- Superadmin can delete events for any company
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'superadmin'
    AND email = 'david@incommand.uk'
  )
);

-- 11. Verify the fix worked
SELECT 
  'events' as table_name,
  company_id::text,
  pg_typeof(company_id) as data_type
FROM events
WHERE company_id IS NOT NULL
LIMIT 3;

-- 12. Show the new policies that were created
SELECT 
    policyname,
    cmd,
    permissive
FROM pg_policies 
WHERE tablename = 'events'
ORDER BY policyname;









