import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Create the user_notification_settings table with a simple SQL query
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS user_notification_settings (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        settings JSONB NOT NULL DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
        UNIQUE(user_id)
      );
    `;

    // Execute the query using the REST API
    const { error: tableError } = await supabase
      .from('_sql')
      .select('*')
      .eq('query', createTableQuery);

    // If that doesn't work, let's try a different approach - just try to access the table
    // and if it doesn't exist, we'll get an error that tells us what to do
    const { error: testError } = await supabase
      .from('user_notification_settings')
      .select('*')
      .limit(1);

    if (testError && testError.code === '42P01') {
      // Table doesn't exist, we need to create it through the Supabase dashboard
      return NextResponse.json({ 
        message: 'Table does not exist. Please create it manually in the Supabase dashboard.',
        sql: `
-- Run this SQL in your Supabase SQL Editor:

CREATE TABLE IF NOT EXISTS user_notification_settings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  settings JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id)
);

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_notification_settings_user_id 
ON user_notification_settings(user_id);

-- Enable RLS
ALTER TABLE user_notification_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own notification settings" 
ON user_notification_settings FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notification settings" 
ON user_notification_settings FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notification settings" 
ON user_notification_settings FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notification settings" 
ON user_notification_settings FOR DELETE 
USING (auth.uid() = user_id);
        `,
        action: 'Copy the SQL above and run it in your Supabase SQL Editor to create the table.'
      });
    } else if (!testError) {
      // Table exists
      return NextResponse.json({ 
        message: 'User notification settings table already exists and is accessible',
        status: 'ready'
      });
    } else {
      // Some other error
      return NextResponse.json({ 
        message: 'Error checking table status',
        error: testError,
        sql: `
-- If the table doesn't exist, run this SQL in your Supabase SQL Editor:

CREATE TABLE IF NOT EXISTS user_notification_settings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  settings JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id)
);

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_notification_settings_user_id 
ON user_notification_settings(user_id);

-- Enable RLS
ALTER TABLE user_notification_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own notification settings" 
ON user_notification_settings FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notification settings" 
ON user_notification_settings FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notification settings" 
ON user_notification_settings FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notification settings" 
ON user_notification_settings FOR DELETE 
USING (auth.uid() = user_id);
        `
      });
    }

  } catch (error) {
    console.error('Error in setup-notification-settings-table:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error,
        sql: `
-- If you need to create the table manually, run this SQL in your Supabase SQL Editor:

CREATE TABLE IF NOT EXISTS user_notification_settings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  settings JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id)
);

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_notification_settings_user_id 
ON user_notification_settings(user_id);

-- Enable RLS
ALTER TABLE user_notification_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own notification settings" 
ON user_notification_settings FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notification settings" 
ON user_notification_settings FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notification settings" 
ON user_notification_settings FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notification settings" 
ON user_notification_settings FOR DELETE 
USING (auth.uid() = user_id);
        `
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'Use POST to check/create the user notification settings table',
    endpoint: '/api/setup-notification-settings-table'
  });
} 