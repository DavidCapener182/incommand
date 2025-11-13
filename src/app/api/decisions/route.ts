/**
 * Decisions API Route
 * Feature 3: Golden Thread Decision Logging
 * 
 * GET /api/decisions - List decisions
 * POST /api/decisions - Create decision
 */

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/types/supabase'
import type { DecisionCreateInput, DecisionListQuery } from '@/types/decisions'

export const dynamic = 'force-dynamic'

// GET /api/decisions - List decisions
export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies })
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user's company_id
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single()

    const profileRecord = profile as { company_id?: string } | null

    if (profileError || !profileRecord?.company_id) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      )
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const eventId = searchParams.get('event_id')
    const lockedOnly = searchParams.get('locked_only') === 'true'
    const roleLevel = searchParams.get('role_level')
    const from = searchParams.get('from')
    const to = searchParams.get('to')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = (page - 1) * limit

    // Build query
    let query = supabase
      .from('decisions')
      .select('*', { count: 'exact' })
      .eq('company_id', profileRecord.company_id)

    if (eventId) {
      query = query.eq('event_id', eventId)
    }

    if (lockedOnly) {
      query = query.eq('is_locked', true)
    }

    if (roleLevel) {
      query = query.eq('role_level', roleLevel)
    }

    if (from) {
      query = query.gte('timestamp', from)
    }

    if (to) {
      query = query.lte('timestamp', to)
    }

    // Order by timestamp descending (most recent first)
    query = query
      .order('timestamp', { ascending: false })
      .range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Database error', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      decisions: data || [],
      total: count || 0,
      page,
      limit,
    })

  } catch (error: any) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

// POST /api/decisions - Create decision
export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies })
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user's company_id
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single()

    const profileRecord = profile as { company_id?: string } | null

    if (profileError || !profileRecord?.company_id) {
      return NextResponse.json(
        { error: 'Profile not found or company not assigned' },
        { status: 404 }
      )
    }

    // Parse request body
    const body: DecisionCreateInput = await request.json()

    // Validate required fields
    if (!body.event_id || !body.trigger_issue || !body.decision_taken || !body.rationale) {
      return NextResponse.json(
        { error: 'Missing required fields', details: 'event_id, trigger_issue, decision_taken, and rationale are required' },
        { status: 400 }
      )
    }

    // Validate decision owner
    if (!body.decision_owner_id && !body.decision_owner_callsign) {
      return NextResponse.json(
        { error: 'Decision owner required', details: 'Either decision_owner_id or decision_owner_callsign must be provided' },
        { status: 400 }
      )
    }

    // Verify event belongs to user's company
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id, company_id')
      .eq('id', body.event_id)
      .single()

    if (eventError || !event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      )
    }

    const eventRecord = event as { company_id?: string }

    if (eventRecord.company_id !== profileRecord.company_id) {
      return NextResponse.json(
        { error: 'Unauthorized', details: 'Event does not belong to your company' },
        { status: 403 }
      )
    }

    // Create decision
    const decisionData = {
      company_id: profileRecord.company_id,
      event_id: body.event_id,
      trigger_issue: body.trigger_issue,
      options_considered: body.options_considered || [],
      information_available: body.information_available || {},
      decision_taken: body.decision_taken,
      rationale: body.rationale,
      decision_owner_id: body.decision_owner_id || null,
      decision_owner_callsign: body.decision_owner_callsign || null,
      role_level: body.role_level || 'other',
      location: body.location || null,
      follow_up_review_time: body.follow_up_review_time || null,
      linked_incident_ids: body.linked_incident_ids || [],
      linked_staff_assignment_ids: body.linked_staff_assignment_ids || [],
      created_by_user_id: user.id,
    }

    const { data: decision, error: insertError } = await (supabase as any)
      .from('decisions')
      .insert(decisionData)
      .select()
      .single()

    if (insertError) {
      console.error('Database error:', insertError)
      return NextResponse.json(
        { error: 'Failed to create decision', details: insertError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      decision,
    }, { status: 201 })

  } catch (error: any) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

