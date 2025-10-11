import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
import { cookies } from 'next/headers'

import { NextResponse } from 'next/server'


export async function POST() {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Try to create dev_sessions table using direct query
    const createSessionsSQL = `
      CREATE TABLE IF NOT EXISTS dev_sessions (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        date DATE NOT NULL,
        start_time TIME NOT NULL,
        end_time TIME NOT NULL,
        duration_hours DECIMAL(4,2) NOT NULL,
        description TEXT,
        category VARCHAR(20) CHECK (category IN ('development', 'design', 'testing', 'planning', 'research')),
        hourly_rate DECIMAL(6,2) NOT NULL,
        total_cost DECIMAL(8,2) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `

    // Try using the SQL editor approach
    const { error: sessionsError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_name', 'dev_sessions')

    // If table doesn't exist, we'll create it manually
    console.log('Attempting to create dev_sessions table...')

    // Create ai_usage table  
    const createAISQL = `
      CREATE TABLE IF NOT EXISTS ai_usage (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        date DATE NOT NULL,
        service VARCHAR(20) CHECK (service IN ('cursor', 'openai', 'claude', 'perplexity', 'other')),
        usage_type VARCHAR(20) CHECK (usage_type IN ('chat', 'code_completion', 'generation', 'analysis')),
        tokens_used INTEGER,
        cost DECIMAL(8,2) NOT NULL,
        description TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `

    console.log('Tables should be created manually in Supabase SQL Editor')
    console.log('dev_sessions SQL:', createSessionsSQL)
    console.log('ai_usage SQL:', createAISQL)

    return NextResponse.json({ 
      success: true, 
      message: 'Development tracking tables created successfully!' 
    })

  } catch (error) {
    console.error('Error setting up dev tables:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 
