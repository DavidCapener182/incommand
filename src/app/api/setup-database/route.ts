import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST() {
  const supabase = createRouteHandlerClient({ cookies });

  try {
    // Create companies table with enhanced fields
    const { error: companiesError } = await supabase.rpc('exec', {
      sql: `
        CREATE TABLE IF NOT EXISTS companies (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          name TEXT NOT NULL,
          primary_contact_name TEXT,
          primary_contact_email TEXT,
          subscription_plan TEXT NOT NULL DEFAULT 'trial' CHECK (subscription_plan IN ('trial', 'free', 'pro', 'enterprise')),
          billing_status TEXT NOT NULL DEFAULT 'active' CHECK (billing_status IN ('active', 'past_due', 'cancelled')),
          account_status TEXT NOT NULL DEFAULT 'active' CHECK (account_status IN ('active', 'suspended', 'inactive')),
          last_activity TIMESTAMP WITH TIME ZONE,
          account_manager TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        -- Add RLS policies for companies
        ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

        CREATE POLICY "Companies are viewable by authenticated users" ON companies
          FOR SELECT USING (auth.role() = 'authenticated');

        CREATE POLICY "Companies are insertable by superadmins" ON companies
          FOR INSERT WITH CHECK (EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'superadmin'
          ));

        CREATE POLICY "Companies are updatable by superadmins" ON companies
          FOR UPDATE USING (EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'superadmin'
          ));
      `
    });

    if (companiesError) {
      console.error('Error creating companies table:', companiesError);
      return NextResponse.json({ error: 'Failed to create companies table' }, { status: 500 });
    }

    // Create default companies if they don't exist
    const { error: insertError } = await supabase
      .from('companies')
      .upsert([
        {
          name: 'inCommand',
          primary_contact_name: 'System Admin',
          primary_contact_email: 'admin@incommand.co.uk',
          subscription_plan: 'enterprise',
          billing_status: 'active',
          account_status: 'active'
        },
        {
          name: 'Compact Security Services',
          primary_contact_name: 'David Capener',
          primary_contact_email: 'david.capener@compactsecurity.co.uk',
          subscription_plan: 'enterprise',
          billing_status: 'active',
          account_status: 'active'
        }
      ], {
        onConflict: 'name'
      });

    if (insertError) {
      console.error('Error inserting default companies:', insertError);
      return NextResponse.json({ error: 'Failed to insert default companies' }, { status: 500 });
    }

    // Create or update profiles table
    const { error: profilesError } = await supabase.rpc('exec', {
      sql: `
        CREATE TABLE IF NOT EXISTS profiles (
          id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
          email TEXT NOT NULL,
          full_name TEXT,
          role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin', 'superadmin')),
          company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(email)
        );

        -- Add RLS policies for profiles
        ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

        CREATE POLICY "Profiles are viewable by authenticated users" ON profiles
          FOR SELECT USING (auth.role() = 'authenticated');

        CREATE POLICY "Users can update their own profile" ON profiles
          FOR UPDATE USING (auth.uid() = id);

        CREATE POLICY "Superadmins can update any profile" ON profiles
          FOR UPDATE USING (EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'superadmin'
          ));
      `
    });

    if (profilesError) {
      console.error('Error creating profiles table:', profilesError);
      return NextResponse.json({ error: 'Failed to create profiles table' }, { status: 500 });
    }

    // Create staff table
    const { error: staffError } = await supabase.rpc('exec', {
      sql: `
        CREATE TABLE IF NOT EXISTS staff (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          full_name TEXT NOT NULL,
          contact_number TEXT,
          email TEXT,
          skill_tags TEXT[] DEFAULT '{}',
          notes TEXT,
          active BOOLEAN DEFAULT TRUE,
          company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        -- Add RLS policies for staff
        ALTER TABLE staff ENABLE ROW LEVEL SECURITY;

        CREATE POLICY "Staff are viewable by authenticated users" ON staff
          FOR SELECT USING (auth.role() = 'authenticated');

        CREATE POLICY "Staff are insertable by authenticated users" ON staff
          FOR INSERT WITH CHECK (auth.role() = 'authenticated');

        CREATE POLICY "Staff are updatable by authenticated users" ON staff
          FOR UPDATE USING (auth.role() = 'authenticated');

        CREATE POLICY "Staff are deletable by authenticated users" ON staff
          FOR DELETE USING (auth.role() = 'authenticated');

        -- Create an updated_at trigger for staff
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
        END;
        $$ language 'plpgsql';

        CREATE TRIGGER update_staff_updated_at
          BEFORE UPDATE ON staff
          FOR EACH ROW
          EXECUTE PROCEDURE update_updated_at_column();
      `
    });

    if (staffError) {
      console.error('Error creating staff table:', staffError);
      return NextResponse.json({ error: 'Failed to create staff table' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Database setup completed successfully' });
  } catch (error) {
    console.error('Error in database setup:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 