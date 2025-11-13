import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { Database } from '@/types/supabase'
import { processIncidentsForTasks } from '@/lib/radio/taskCreator'

export const dynamic = 'force-dynamic'

/**
 * POST /api/incidents/auto-process-tasks
 * Automatically process all open incidents and create tasks
 * This can be called manually or scheduled
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies })
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single()

    if (!profile || !profile.company_id) {
      return NextResponse.json({ error: 'No company found' }, { status: 403 })
    }

    // Get all current events for this company
    const { data: events } = await supabase
      .from('events')
      .select('id')
      .eq('company_id', profile.company_id)
      .eq('is_current', true)

    if (!events || events.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'No current events found',
        processed: 0,
        tasksCreated: 0
      })
    }

    let totalProcessed = 0
    let totalTasksCreated = 0
    const results: any[] = []

    // Process incidents for each event
    for (const event of events) {
      const { data: incidents, error: incidentsError } = await supabase
        .from('incident_logs')
        .select('id, occurrence, incident_type, priority, location, callsign_from, callsign_to, event_id, is_closed, created_at')
        .eq('event_id', event.id)
        .eq('is_closed', false)
        .order('created_at', { ascending: false })
        .limit(100)

      if (incidentsError) {
        console.error(`Error fetching incidents for event ${event.id}:`, incidentsError)
        continue
      }

      if (incidents && incidents.length > 0) {
        const result = await processIncidentsForTasks(
          incidents as any[],
          user.id,
          supabase,
          true
        )

        totalProcessed += result.processed
        totalTasksCreated += result.tasksCreated
        results.push({
          eventId: event.id,
          ...result
        })
      }
    }

    return NextResponse.json({
      success: true,
      processed: totalProcessed,
      tasksCreated: totalTasksCreated,
      eventsProcessed: events.length,
      results
    })
  } catch (error: any) {
    console.error('Error in POST /api/incidents/auto-process-tasks:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

