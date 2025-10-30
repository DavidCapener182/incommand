-- Fix companies RLS policy to allow superadmins to read all companies
-- Drop existing policies
DROP POLICY IF EXISTS "Companies are viewable by authenticated users" ON companies;
DROP POLICY IF EXISTS "Companies are insertable by superadmins" ON companies;
DROP POLICY IF EXISTS "Companies are updatable by superadmins" ON companies;
DROP POLICY IF EXISTS "Companies are deletable by superadmins" ON companies;

-- Create new policies with proper superadmin bypass
CREATE POLICY "companies_select_all_authenticated" ON companies
  FOR SELECT USING (
    auth.role() = 'authenticated'
    OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'superadmin'
    )
  );

CREATE POLICY "companies_insert_superadmin" ON companies
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'superadmin'
    )
  );

CREATE POLICY "companies_update_superadmin" ON companies
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'superadmin'
    )
  );

CREATE POLICY "companies_delete_superadmin" ON companies
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'superadmin'
    )
  );

