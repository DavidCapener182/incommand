import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // Create audit_logs table
    const { error: createTableError } = await supabase.rpc('create_audit_logs_table', {
      sql: `
        CREATE TABLE IF NOT EXISTS audit_logs (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          action TEXT NOT NULL,
          action_type TEXT NOT NULL CHECK (action_type IN ('user', 'company', 'event', 'system')),
          performed_by UUID REFERENCES auth.users(id),
          details JSONB,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );

        -- Add RLS policies
        ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

        CREATE POLICY "Audit logs are viewable by super admins" ON audit_logs
          FOR SELECT USING (
            EXISTS (
              SELECT 1 FROM profiles
              WHERE profiles.id = auth.uid()
              AND profiles.role = 'superadmin'
            )
          );

        CREATE POLICY "Audit logs are insertable by authenticated users" ON audit_logs
          FOR INSERT WITH CHECK (auth.role() = 'authenticated');

        -- Create an updated_at trigger
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
        END;
        $$ language 'plpgsql';

        CREATE TRIGGER update_audit_logs_updated_at
          BEFORE UPDATE ON audit_logs
          FOR EACH ROW
          EXECUTE PROCEDURE update_updated_at_column();
      `
    });

    if (createTableError) {
      throw createTableError;
    }

    return NextResponse.json({ message: 'Audit logs table created successfully' });
  } catch (error) {
    console.error('Error setting up audit logs:', error);
    return NextResponse.json(
      { error: 'Failed to set up audit logs' },
      { status: 500 }
    );
  }
} 