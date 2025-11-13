import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { Database } from '@/types/supabase'
import { processIncidentForTask, processIncidentsForTasks } from '@/lib/radio/taskCreator'

export const dynamic = 'force-dynamic'

/**
 * POST /api/incidents/process-tasks
 * Process incidents and create tasks automatically
 * 
 * Query params:
 * - incident_id: Process a specific incident (optional)
 * - event_id: Process all open incidents for an event (optional, required if no incident_id)
 * - auto_create: Enable/disable auto-creation (default: true)
 * 
 * Body (optional):
 * - incident_ids: Array of incident IDs to process
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient<any>({ cookies })
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const incidentId = searchParams.get('incident_id')
    const eventId = searchParams.get('event_id')
    const autoCreate = searchParams.get('auto_create') !== 'false'

    const body = await request.json().catch(() => ({}))
    const incidentIds = body.incident_ids as number[] | undefined

    // Get user's company
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single()

    if (!profile || !profile.company_id) {
      return NextResponse.json({ error: 'No company found' }, { status: 403 })
    }

    // Process single incident
    if (incidentId) {
      const { data: incident, error: incidentError } = await supabase
        .from('incident_logs')
        .select('id, occurrence, incident_type, priority, location, callsign_from, callsign_to, event_id, is_closed, created_at')
        .eq('id', parseInt(incidentId))
        .single()

      if (incidentError || !incident) {
        return NextResponse.json({ error: 'Incident not found' }, { status: 404 })
      }

      // Verify event belongs to user's company via RLS (already enforced, but double-check)
      const { data: event } = await supabase
        .from('events')
        .select('company_id')
        .eq('id', incident.event_id)
        .single()

      if (!event || event.company_id !== profile.company_id) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }

      const result = await processIncidentForTask(
        incident as any,
        user.id,
        supabase,
        autoCreate
      )

      // Add debug info
      console.log('Processing incident for task:', {
        incidentId: incident.id,
        occurrence: incident.occurrence?.substring(0, 50),
        incident_type: incident.incident_type,
        is_closed: incident.is_closed,
        result,
      })

      return NextResponse.json({
        success: true,
        incidentId: incident.id,
        ...result,
      })
    }

    // Process multiple incidents by IDs
    if (incidentIds && incidentIds.length > 0) {
      const { data: incidents, error: incidentsError } = await supabase
        .from('incident_logs')
        .select('id, occurrence, incident_type, priority, location, callsign_from, callsign_to, event_id, is_closed, created_at')
        .in('id', incidentIds)
        .eq('is_closed', false)

      if (incidentsError) {
        return NextResponse.json({ error: incidentsError.message }, { status: 500 })
      }

      const result = await processIncidentsForTasks(
        incidents as any[],
        user.id,
        supabase,
        autoCreate
      )

      return NextResponse.json({
        success: true,
        ...result,
      })
    }

    // Process all open incidents for an event
    if (eventId) {
      // Verify event belongs to user's company
      const { data: event } = await supabase
        .from('events')
        .select('company_id')
        .eq('id', eventId)
        .single()

      if (!event || event.company_id !== profile.company_id) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }

      const { data: incidents, error: incidentsError } = await supabase
        .from('incident_logs')
        .select('id, occurrence, incident_type, priority, location, callsign_from, callsign_to, event_id, is_closed, created_at')
        .eq('event_id', eventId)
        .eq('is_closed', false)
        .order('created_at', { ascending: false })
        .limit(100) // Limit to prevent overload

      if (incidentsError) {
        return NextResponse.json({ error: incidentsError.message }, { status: 500 })
      }

      const result = await processIncidentsForTasks(
        incidents as any[],
        user.id,
        supabase,
        autoCreate
      )

      return NextResponse.json({
        success: true,
        eventId,
        ...result,
      })
    }

    return NextResponse.json(
      { error: 'Either incident_id, event_id, or incident_ids in body is required' },
      { status: 400 }
    )
  } catch (error: any) {
    console.error('Error in POST /api/incidents/process-tasks:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

/**
 * GET /api/incidents/process-tasks
 * Check which incidents would create tasks (dry run)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient<any>({ cookies })
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const eventId = searchParams.get('event_id')

    if (!eventId) {
      return NextResponse.json({ error: 'event_id is required' }, { status: 400 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single()

    if (!profile || !profile.company_id) {
      return NextResponse.json({ error: 'No company found' }, { status: 403 })
    }

    // Verify event belongs to user's company
    const { data: event } = await supabase
      .from('events')
      .select('company_id')
      .eq('id', eventId)
      .single()

    if (!event || event.company_id !== profile.company_id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Get open incidents
    const { data: incidents, error: incidentsError } = await supabase
      .from('incident_logs')
      .select('id, occurrence, incident_type, priority, location, callsign_from, callsign_to, event_id, is_closed, created_at')
      .eq('event_id', eventId)
      .eq('is_closed', false)
      .order('created_at', { ascending: false })
      .limit(50)

    if (incidentsError) {
      return NextResponse.json({ error: incidentsError.message }, { status: 500 })
    }

    // Import the detection function
    const { shouldCreateTaskFromIncident } = await import('@/lib/radio/taskCreator')

    const eligibleIncidents = incidents
      ?.filter(incident => shouldCreateTaskFromIncident(incident as any))
      .map(incident => ({
        id: incident.id,
        incident_type: incident.incident_type,
        occurrence: incident.occurrence,
        priority: incident.priority,
        location: incident.location,
      })) || []

    return NextResponse.json({
      success: true,
      totalIncidents: incidents?.length || 0,
      eligibleForTasks: eligibleIncidents.length,
      incidents: eligibleIncidents,
    })
  } catch (error: any) {
    console.error('Error in GET /api/incidents/process-tasks:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

