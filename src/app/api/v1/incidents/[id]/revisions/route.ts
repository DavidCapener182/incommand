/**
 * API Route: Get Incident Log Revisions
 * GET /api/v1/incidents/[id]/revisions
 * 
 * Retrieves complete revision history for an incident log
 */

import { NextRequest, NextResponse } from 'next/server'
import { createRlsServerClient } from '@/lib/supabaseServer'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { getRevisionHistory } from '@/lib/auditableLogging'

import { GetRevisionsResponse, AuditableIncidentLog } from '@/types/auditableLog'


export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const incidentId = params.id

    // Get auth token from request
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')
    
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const supabase = createRlsServerClient(token)

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get the incident log
    const { data: incident, error: incidentError } = await supabase
      .from('incident_logs')
      .select('id, log_number, timestamp, callsign_from, callsign_to, occurrence, incident_type, action_taken, is_closed, event_id, status, priority, created_at, updated_at, time_of_occurrence, time_logged, entry_type, is_amended')
      .eq('id', parseInt(incidentId))
      .single()

    if (incidentError || !incident) {
      return NextResponse.json(
        { success: false, error: 'Incident log not found' },
        { status: 404 }
      )
    }

    // Get revision history
    const result = await getRevisionHistory(incidentId)

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      )
    }

    const response: GetRevisionsResponse = {
      success: true,
      revisions: result.revisions,
      incident: incident as AuditableIncidentLog
    }

    return NextResponse.json(response, { status: 200 })
  } catch (error: any) {
    console.error('Error fetching revisions:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
