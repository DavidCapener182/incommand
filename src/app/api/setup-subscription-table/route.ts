import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    console.log('Creating subscription_costs table...')

    return NextResponse.json({ 
      success: true, 
      message: 'Please create the subscription_costs table manually in Supabase SQL Editor',
      sql: `
        CREATE TABLE IF NOT EXISTS subscription_costs (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          service_name VARCHAR(50) NOT NULL,
          cost DECIMAL(8,2) NOT NULL,
          billing_period VARCHAR(20) CHECK (billing_period IN ('monthly', 'yearly', 'one-time')),
          start_date DATE NOT NULL,
          end_date DATE,
          description TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        CREATE TABLE IF NOT EXISTS dev_settings (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          setting_name VARCHAR(50) UNIQUE NOT NULL,
          setting_value DECIMAL(8,2) NOT NULL,
          description TEXT,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Insert default settings
        INSERT INTO dev_settings (setting_name, setting_value, description) VALUES
        ('hourly_rate', 40.00, 'Default hourly rate for development work'),
        ('subscription_price_monthly', 25.00, 'Monthly subscription price'),
        ('subscription_price_yearly', 250.00, 'Yearly subscription price'),
        ('per_event_price', 15.00, 'Price per event usage'),
        ('target_subscribers', 100, 'Target number of subscribers for projections')
        ON CONFLICT (setting_name) DO NOTHING;
      `
    })

  } catch (error) {
    console.error('Error setting up subscription table:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 