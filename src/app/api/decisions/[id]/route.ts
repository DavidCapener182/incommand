/**
 * Individual Decision API Route
 * Feature 3: Golden Thread Decision Logging
 * 
 * GET /api/decisions/[id] - Get decision details
 * PUT /api/decisions/[id] - Update decision
 */

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/types/supabase'
import type { DecisionUpdateInput } from '@/types/decisions'

export const dynamic = 'force-dynamic'

// GET /api/decisions/[id] - Get decision details with evidence and annotations
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient<any>({ cookies })
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const decisionId = params.id

    // Get decision with evidence and annotations
    const { data: decision, error: decisionError } = await supabase
      .from('decisions')
      .select(`
        *,
        decision_evidence (*),
        decision_annotations (*)
      `)
      .eq('id', decisionId)
      .single()

    if (decisionError || !decision) {
      return NextResponse.json(
        { error: 'Decision not found' },
        { status: 404 }
      )
    }

    // Get linked incidents if any
    let linkedIncidents: any[] = []
    if (decision.linked_incident_ids && decision.linked_incident_ids.length > 0) {
      const { data: incidents } = await supabase
        .from('incident_logs')
        .select('id, incident_type, priority, location, timestamp')
        .in('id', decision.linked_incident_ids)
      
      linkedIncidents = incidents || []
    }

    // Get linked staff assignments if any
    let linkedStaffAssignments: any[] = []
    if (decision.linked_staff_assignment_ids && decision.linked_staff_assignment_ids.length > 0) {
      // Note: staff_assignments table structure may vary - adjust as needed
      const { data: assignments } = await supabase
        .from('staff_assignments')
        .select('*')
        .in('id', decision.linked_staff_assignment_ids)
      
      linkedStaffAssignments = assignments || []
    }

    return NextResponse.json({
      success: true,
      decision: {
        ...decision,
        linked_incidents: linkedIncidents,
        linked_staff_assignments: linkedStaffAssignments,
      },
    })

  } catch (error: any) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

// PUT /api/decisions/[id] - Update decision (only if not locked)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient<any>({ cookies })
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const decisionId = params.id

    // Get existing decision
    const { data: existingDecision, error: fetchError } = await supabase
      .from('decisions')
      .select('id, is_locked, company_id')
      .eq('id', decisionId)
      .single()

    if (fetchError || !existingDecision) {
      return NextResponse.json(
        { error: 'Decision not found' },
        { status: 404 }
      )
    }

    // Check if decision is locked
    if (existingDecision.is_locked) {
      return NextResponse.json(
        { error: 'Decision is locked', details: 'Locked decisions cannot be edited. You can add annotations instead.' },
        { status: 403 }
      )
    }

    // Verify company access
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single()

    if (!profile || profile.company_id !== existingDecision.company_id) {
      return NextResponse.json(
        { error: 'Unauthorized', details: 'Decision does not belong to your company' },
        { status: 403 }
      )
    }

    // Parse request body
    const body: DecisionUpdateInput = await request.json()

    // Build update object (only include provided fields)
    const updateData: any = {}
    if (body.trigger_issue !== undefined) updateData.trigger_issue = body.trigger_issue
    if (body.options_considered !== undefined) updateData.options_considered = body.options_considered
    if (body.information_available !== undefined) updateData.information_available = body.information_available
    if (body.decision_taken !== undefined) updateData.decision_taken = body.decision_taken
    if (body.rationale !== undefined) updateData.rationale = body.rationale
    if (body.decision_owner_id !== undefined) updateData.decision_owner_id = body.decision_owner_id
    if (body.decision_owner_callsign !== undefined) updateData.decision_owner_callsign = body.decision_owner_callsign
    if (body.role_level !== undefined) updateData.role_level = body.role_level
    if (body.location !== undefined) updateData.location = body.location
    if (body.follow_up_review_time !== undefined) updateData.follow_up_review_time = body.follow_up_review_time
    if (body.linked_incident_ids !== undefined) updateData.linked_incident_ids = body.linked_incident_ids
    if (body.linked_staff_assignment_ids !== undefined) updateData.linked_staff_assignment_ids = body.linked_staff_assignment_ids

    // Update decision
    const { data: decision, error: updateError } = await supabase
      .from('decisions')
      .update(updateData)
      .eq('id', decisionId)
      .select()
      .single()

    if (updateError) {
      console.error('Database error:', updateError)
      return NextResponse.json(
        { error: 'Failed to update decision', details: updateError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      decision,
    })

  } catch (error: any) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

