-- Fix company_id data type inconsistency in events table
-- CRITICAL: This ensures proper multi-tenant data isolation
-- This version finds and drops ALL policies that reference company_id across ALL tables

-- 1. Check current data type
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'events' AND column_name = 'company_id';

-- 2. Find ALL policies that reference company_id (across all tables)
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
WHERE (qual LIKE '%company_id%' OR with_check LIKE '%company_id%')
ORDER BY tablename, policyname;

-- 3. Drop ALL policies that reference company_id across ALL tables
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    -- Get all policies that reference company_id
    FOR policy_record IN 
        SELECT schemaname, tablename, policyname
        FROM pg_policies 
        WHERE (qual LIKE '%company_id%' OR with_check LIKE '%company_id%')
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || policy_record.policyname || '" ON ' || policy_record.schemaname || '.' || policy_record.tablename;
        RAISE NOTICE 'Dropped policy: % on table %', policy_record.policyname, policy_record.tablename;
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

-- 10. Recreate the proper RLS policies for events table
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

-- 11. Recreate policies for incident_tags table (if it exists)
DO $$
DECLARE
    column_exists boolean;
BEGIN
    -- Check if incident_tags table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'incident_tags') THEN
        -- Check what columns exist in incident_tags
        SELECT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'incident_tags' AND column_name = 'event_id'
        ) INTO column_exists;
        
        IF column_exists THEN
            -- Create policy for incident_tags that references events.company_id
            EXECUTE 'CREATE POLICY "incident_tags_company_isolation" ON incident_tags
            FOR SELECT USING (
              event_id IN (
                SELECT id FROM events
                WHERE company_id IN (
                  SELECT company_id FROM profiles
                  WHERE id = auth.uid()
                )
              )
              OR
              -- Superadmin can see all incident tags
              EXISTS (
                SELECT 1 FROM profiles
                WHERE id = auth.uid()
                AND role = ''superadmin''
                AND email = ''david@incommand.uk''
              )
            )';
            
            RAISE NOTICE 'Created incident_tags policy with event_id reference';
        ELSE
            -- Check if it has incident_id instead
            SELECT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'incident_tags' AND column_name = 'incident_id'
            ) INTO column_exists;
            
            IF column_exists THEN
                -- Create policy for incident_tags that references incident_logs -> events
                EXECUTE 'CREATE POLICY "incident_tags_company_isolation" ON incident_tags
                FOR SELECT USING (
                  incident_id IN (
                    SELECT id FROM incident_logs
                    WHERE event_id IN (
                      SELECT id FROM events
                      WHERE company_id IN (
                        SELECT company_id FROM profiles
                        WHERE id = auth.uid()
                      )
                    )
                  )
                  OR
                  -- Superadmin can see all incident tags
                  EXISTS (
                    SELECT 1 FROM profiles
                    WHERE id = auth.uid()
                    AND role = ''superadmin''
                    AND email = ''david@incommand.uk''
                  )
                )';
                
                RAISE NOTICE 'Created incident_tags policy with incident_id reference';
            ELSE
                -- Just create a basic policy if we can't determine the relationship
                EXECUTE 'CREATE POLICY "incident_tags_company_isolation" ON incident_tags
                FOR SELECT USING (
                  -- Superadmin can see all incident tags
                  EXISTS (
                    SELECT 1 FROM profiles
                    WHERE id = auth.uid()
                    AND role = ''superadmin''
                    AND email = ''david@incommand.uk''
                  )
                )';
                
                RAISE NOTICE 'Created basic incident_tags policy (no company isolation)';
            END IF;
        END IF;
    ELSE
        RAISE NOTICE 'incident_tags table does not exist, skipping policy creation';
    END IF;
END $$;

-- 12. Verify the fix worked
SELECT 
  'events' as table_name,
  company_id::text,
  pg_typeof(company_id) as data_type
FROM events
WHERE company_id IS NOT NULL
LIMIT 3;

-- 13. Show the new policies that were created
SELECT 
    tablename,
    policyname,
    cmd,
    permissive
FROM pg_policies 
WHERE tablename IN ('events', 'incident_tags')
ORDER BY tablename, policyname;
