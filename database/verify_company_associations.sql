-- Verification queries for multi-tenant data isolation
-- Run these queries in Supabase SQL Editor to verify data integrity

-- 1. Check user-company associations
SELECT 
  p.email,
  p.company_id,
  c.name as company_name,
  p.role,
  p.created_at
FROM profiles p
LEFT JOIN companies c ON p.company_id = c.id
WHERE p.email IN (
  'capener182@googlemail.com',
  'david.capener@compactsecurity.co.uk',
  'david@incommand.uk'
)
ORDER BY p.email;

-- 2. Check event-company associations
SELECT 
  e.event_name,
  e.event_type,
  e.company_id,
  c.name as company_name,
  e.is_current,
  e.created_at
FROM events e
LEFT JOIN companies c ON e.company_id::uuid = c.id
WHERE e.is_current = true
ORDER BY e.created_at DESC;

-- 3. Check all companies in the system
SELECT 
  id,
  name,
  created_at
FROM companies
ORDER BY created_at;

-- 4. Check for any events without company_id (potential data leakage)
SELECT 
  id,
  event_name,
  event_type,
  company_id,
  is_current,
  created_at
FROM events
WHERE company_id IS NULL
ORDER BY created_at DESC;

-- 5. Check for any profiles without company_id (except superadmin)
SELECT 
  id,
  email,
  company_id,
  role,
  created_at
FROM profiles
WHERE company_id IS NULL 
AND email != 'david@incommand.uk'
ORDER BY created_at DESC;

-- 6. Verify event_type values in events table
SELECT 
  event_type,
  COUNT(*) as count
FROM events
GROUP BY event_type
ORDER BY count DESC;

-- 7. Check for potential data type issues with company_id
SELECT 
  'events' as table_name,
  company_id::text,
  pg_typeof(company_id) as data_type
FROM events
WHERE company_id IS NOT NULL
LIMIT 5;

-- 8. Check profiles table data types
SELECT 
  'profiles' as table_name,
  company_id::text,
  pg_typeof(company_id) as data_type
FROM profiles
WHERE company_id IS NOT NULL
LIMIT 5;
