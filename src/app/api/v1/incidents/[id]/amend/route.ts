/**
 * API Route: Amend Incident Log
 * POST /api/v1/incidents/[id]/amend
 * 
 * Creates a non-destructive amendment to an existing log entry
 */

import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
import { createClient } from '@supabase/supabase-js'

import { createRevision, canUserAmendLog, validateAmendmentRequest } from '@/lib/auditableLogging'

import { AmendLogRequest, AmendLogResponse } from '@/types/auditableLog'


export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const incidentId = params.id

    // Get Supabase client with user session
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    
    // Get auth token from request
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')
    
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    })

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user can amend this log
    console.log('Checking amendment permissions for user:', user.id, 'incident:', incidentId)
    const amendCheck = await canUserAmendLog(incidentId, user.id, supabase)
    console.log('Amendment check result:', amendCheck)
    if (!amendCheck.canAmend) {
      return NextResponse.json(
        { success: false, error: amendCheck.reason || 'You do not have permission to amend this log' },
        { status: 403 }
      )
    }

    // Parse request body
    const body: AmendLogRequest = await request.json()

    // Validate amendment request
    const validation = validateAmendmentRequest(
      body.field_changed,
      body.new_value,
      body.change_reason
    )

    if (!validation.isValid) {
      return NextResponse.json(
        { success: false, error: validation.errors.join('; ') },
        { status: 400 }
      )
    }

    // Get current log to capture old value
    const { data: currentLog, error: fetchError } = await supabase
      .from('incident_logs')
      .select('*')
      .eq('id', incidentId)
      .single()

    if (fetchError || !currentLog) {
      return NextResponse.json(
        { success: false, error: 'Incident log not found' },
        { status: 404 }
      )
    }

    // Get old value
    const oldValue = (currentLog as any)[body.field_changed]

    // Check if value actually changed
    if (JSON.stringify(oldValue) === JSON.stringify(body.new_value)) {
      return NextResponse.json(
        { success: false, error: 'New value is the same as current value. No amendment needed.' },
        { status: 400 }
      )
    }

    // Get user's callsign
    const { data: assignment } = await supabase
      .from('callsign_assignments')
      .select('callsign_positions(callsign, short_code)')
      .eq('user_id', user.id)
      .eq('event_id', currentLog.event_id)
      .single()

    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single()

    const userCallsign = (assignment as any)?.callsign_positions?.callsign || 
                        (assignment as any)?.callsign_positions?.short_code ||
                        profile?.full_name ||
                        'Unknown'

    // Create revision
    const revisionResult = await createRevision(
      incidentId,
      body.field_changed as any,
      oldValue,
      body.new_value,
      body.change_reason,
      body.change_type,
      user.id,
      userCallsign,
      supabase
    )

    if (!revisionResult.success) {
      return NextResponse.json(
        { success: false, error: revisionResult.error },
        { status: 500 }
      )
    }

    // Check if action_taken field contains ejection keywords and update incident type accordingly
    let updateData: any = {
      [body.field_changed]: body.new_value,
      updated_at: new Date().toISOString()
    }

    // Auto-detect ejection from actions_taken field
    if (body.field_changed === 'action_taken' && body.new_value) {
      const actionText = String(body.new_value).toLowerCase()
      const ejectionKeywords = ['ejection', 'ejected', 'removed from site', 'kicked out', 'escorted out', 'banned']
      
      if (ejectionKeywords.some(keyword => actionText.includes(keyword))) {
        // Update incident type to Ejection
        updateData.incident_type = 'Ejection'
        console.log('Auto-detected ejection from actions_taken, updating incident type to Ejection')
      }
    }

    // Update the incident log with new value
    // Note: This is an exception to "no updates" rule - we do update the current value
    // but the revision history maintains the complete audit trail
    const { error: updateError } = await supabase
      .from('incident_logs')
      .update(updateData)
      .eq('id', incidentId)

    if (updateError) {
      console.error('Error updating incident log value:', updateError)
    }

    // Fetch updated incident
    const { data: updatedIncident } = await supabase
      .from('incident_logs')
      .select('*')
      .eq('id', incidentId)
      .single()

    const response: AmendLogResponse = {
      success: true,
      revision: revisionResult.revision,
      incident: updatedIncident
    }

    return NextResponse.json(response, { status: 201 })
  } catch (error: any) {
    console.error('Error amending log:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

