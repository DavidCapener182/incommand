-- Fix company_id data type inconsistency in events table
-- CRITICAL: This ensures proper multi-tenant data isolation

-- 1. Check current data type
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'events' AND column_name = 'company_id';

-- 2. If TEXT, convert to UUID (with safety checks)
-- First, validate all existing company_id values are valid UUIDs
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

-- 3. Alter column type
ALTER TABLE events 
ALTER COLUMN company_id TYPE UUID USING company_id::UUID;

-- 4. Add foreign key constraint if missing
ALTER TABLE events
DROP CONSTRAINT IF EXISTS events_company_id_fkey;

ALTER TABLE events
ADD CONSTRAINT events_company_id_fkey 
FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;

-- 5. Create index for performance
CREATE INDEX IF NOT EXISTS idx_events_company_id ON events(company_id);





