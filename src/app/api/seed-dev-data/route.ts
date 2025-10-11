import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
import { cookies } from 'next/headers'

import { NextResponse } from 'next/server'


export async function POST() {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Initial development sessions based on conversation history
    const initialSessions = [
      {
        date: '2024-01-15',
        start_time: '09:00',
        end_time: '11:30',
        duration_hours: 2.5,
        description: 'Initial InCommand setup and database configuration',
        category: 'development',
        hourly_rate: 40,
        total_cost: 100
      },
      {
        date: '2024-01-16',
        start_time: '14:00',
        end_time: '18:00',
        duration_hours: 4.0,
        description: 'Staff management system development and debugging',
        category: 'development',
        hourly_rate: 40,
        total_cost: 160
      },
      {
        date: '2024-01-17',
        start_time: '10:00',
        end_time: '12:00',
        duration_hours: 2.0,
        description: 'Company footer feature and admin fixes',
        category: 'development',
        hourly_rate: 40,
        total_cost: 80
      },
      {
        date: '2024-01-18',
        start_time: '13:00',
        end_time: '19:00',
        duration_hours: 6.0,
        description: 'Complete callsign assignment interface redesign',
        category: 'design',
        hourly_rate: 40,
        total_cost: 240
      },
      {
        date: '2024-01-19',
        start_time: '15:00',
        end_time: '18:30',
        duration_hours: 3.5,
        description: 'Staff data integration and department management features',
        category: 'development',
        hourly_rate: 40,
        total_cost: 140
      },
      {
        date: '2024-01-20',
        start_time: '11:00',
        end_time: '14:00',
        duration_hours: 3.0,
        description: 'UI improvements, spacing fixes, and color palette updates',
        category: 'design',
        hourly_rate: 40,
        total_cost: 120
      },
      {
        date: '2024-01-21',
        start_time: '16:00',
        end_time: '17:30',
        duration_hours: 1.5,
        description: 'Development tracking system implementation',
        category: 'development',
        hourly_rate: 40,
        total_cost: 60
      }
    ]

    const initialAIUsage = [
      {
        date: '2024-01-15',
        service: 'cursor',
        usage_type: 'chat',
        cost: 8.50,
        description: 'Database setup and initial development guidance',
        tokens_used: 15000
      },
      {
        date: '2024-01-16',
        service: 'cursor',
        usage_type: 'code_completion',
        cost: 12.30,
        description: 'Staff management system code generation',
        tokens_used: 22000
      },
      {
        date: '2024-01-17',
        service: 'cursor',
        usage_type: 'chat',
        cost: 5.20,
        description: 'Footer component and admin debugging',
        tokens_used: 9500
      },
      {
        date: '2024-01-18',
        service: 'cursor',
        usage_type: 'generation',
        cost: 18.75,
        description: 'Complete UI redesign for callsign assignment',
        tokens_used: 35000
      },
      {
        date: '2024-01-19',
        service: 'cursor',
        usage_type: 'chat',
        cost: 9.80,
        description: 'Staff integration and department features',
        tokens_used: 18000
      },
      {
        date: '2024-01-20',
        service: 'cursor',
        usage_type: 'code_completion',
        cost: 7.40,
        description: 'UI refinements and styling improvements',
        tokens_used: 13500
      },
      {
        date: '2024-01-21',
        service: 'cursor',
        usage_type: 'generation',
        cost: 6.90,
        description: 'Development tracking system creation',
        tokens_used: 12000
      }
    ]

    // Insert development sessions
    const { error: sessionsError } = await supabase
      .from('dev_sessions')
      .insert(initialSessions)

    if (sessionsError) {
      console.error('Error inserting dev sessions:', sessionsError)
      return NextResponse.json({ error: 'Failed to insert development sessions' }, { status: 500 })
    }

    // Insert AI usage data
    const { error: aiError } = await supabase
      .from('ai_usage')
      .insert(initialAIUsage)

    if (aiError) {
      console.error('Error inserting AI usage:', aiError)
      return NextResponse.json({ error: 'Failed to insert AI usage data' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Initial development data seeded successfully!',
      summary: {
        sessions: initialSessions.length,
        totalHours: 22.5,
        devCost: 900,
        aiCost: 68.85,
        totalInvestment: 968.85
      }
    })

  } catch (error) {
    console.error('Error seeding dev data:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 
