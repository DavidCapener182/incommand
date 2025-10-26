/**
 * API Route: Create Auditable Incident Log
 * POST /api/v1/incidents/create-log
 * 
 * Creates an immutable incident log entry with full audit trail support
 */

import { NextRequest, NextResponse } from 'next/server'
import { secureApiHandler } from '@/lib/apiSecurity'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { createImmutableLog } from '@/lib/auditableLogging'

import { CreateAuditableLogRequest, CreateLogResponse } from '@/types/auditableLog'


export async function POST(request: NextRequest) {
  return secureApiHandler(request, async (supabase, user, request) => {
    try {

      // Parse request body
      const body: CreateAuditableLogRequest = await request.json()

      // Validate required fields
      if (!body.occurrence || !body.action_taken || !body.incident_type) {
        return NextResponse.json(
          { success: false, error: 'Missing required fields: occurrence, action_taken, incident_type' },
          { status: 400 }
        )
      }

      if (!body.time_of_occurrence) {
        return NextResponse.json(
          { success: false, error: 'time_of_occurrence is required' },
          { status: 400 }
        )
      }

      if (!body.entry_type || !['contemporaneous', 'retrospective'].includes(body.entry_type)) {
        return NextResponse.json(
          { success: false, error: 'entry_type must be "contemporaneous" or "retrospective"' },
          { status: 400 }
        )
      }

      // Validate retrospective justification
      if (body.entry_type === 'retrospective') {
        if (!body.retrospective_justification || body.retrospective_justification.trim().length === 0) {
          return NextResponse.json(
            { success: false, error: 'Retrospective entries require a justification' },
            { status: 400 }
          )
        }
      }

      // Get user's current callsign from profile or assignment
      const { data: profile } = await supabase
        .from('profiles')
        .select('first_name, last_name, email')
        .eq('id', user.id)
        .single()

      // Try to get current callsign assignment
      const { data: assignment } = await supabase
        .from('callsign_assignments')
        .select('callsign_positions(callsign, short_code)')
        .eq('user_id', user.id)
        .eq('event_id', body.event_id)
        .single()

      const userCallsign = (assignment as any)?.callsign_positions?.callsign || 
                          (assignment as any)?.callsign_positions?.short_code ||
                          `${profile?.first_name?.[0]}${profile?.last_name?.[0]}`.toUpperCase() ||
                          'Unknown'

      // Generate log number
      const { data: eventData } = await supabase
        .from('events')
        .select('event_name, name, event_date, date')
        .eq('id', body.event_id)
        .single()

      const eventNameValue = eventData?.event_name ?? eventData?.name ?? 'Event'
      const eventPrefix = eventNameValue.substring(0, 3).toUpperCase()
      const resolvedDate = eventData?.event_date ?? eventData?.date
      const eventDate = resolvedDate ? new Date(resolvedDate).toISOString().split('T')[0].replace(/-/g, '') : new Date().toISOString().split('T')[0].replace(/-/g, '')
      
      // Get count for log number
      const { count } = await supabase
        .from('incident_logs')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', body.event_id)

      const logNumber = `${eventPrefix}-${eventDate}-${String((count || 0) + 1).padStart(3, '0')}`

      // Determine if this should be logged as operational log vs incident
      const operationalLogTypes = [
        'Artist On Stage', 'Artist Off Stage', 'Artist on Stage', 'Artist off Stage',
        'Attendance', 'Event Timing', 'Timings', 'Sit Rep', 'Staffing',
        'Accreditation', 'Accessibility', 'Accsessablity' // Include typo variant
      ];
      const shouldBeLogged = operationalLogTypes.includes(body.incident_type) || body.priority === 'low';

      // Prepare log data
      const logData = {
        log_number: logNumber,
        occurrence: body.occurrence,
        action_taken: body.action_taken,
        incident_type: body.incident_type,
        callsign_from: body.callsign_from,
        callsign_to: body.callsign_to,
        time_of_occurrence: body.time_of_occurrence,
        time_logged: body.time_logged || new Date().toISOString(),
        timestamp: body.time_of_occurrence, // For backward compatibility
        entry_type: body.entry_type,
        retrospective_justification: body.retrospective_justification,
        logged_by_callsign: userCallsign,
        priority: body.priority || 'medium',
        photo_url: body.photo_url,
        event_id: body.event_id,
        status: shouldBeLogged ? 'logged' : (body.status || 'open'),
        is_closed: shouldBeLogged,
        location: body.location_name || '' // Map location_name to database location field
      }

      // Create immutable log
      const result = await createImmutableLog(logData, user.id)

      if (!result.success) {
        return NextResponse.json(
          { success: false, error: result.error },
          { status: 400 }
        )
      }

      const response: CreateLogResponse = {
        success: true,
        log: result.log,
        warnings: result.warnings
      }

      return NextResponse.json(response, { status: 201 })
    } catch (error: any) {
      console.error('Error creating auditable log:', error)
      return NextResponse.json(
        { success: false, error: error.message || 'Internal server error' },
        { status: 500 }
      )
    }
  })
}
