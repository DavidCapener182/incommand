/**
 * SOP Adjustments API
 * Feature 2: Live Doctrine Assistant & Dynamic SOP Adjustment Engine
 * 
 * GET /api/sops/[id]/adjustments - List adjustments for SOP
 * POST /api/sops/[id]/adjustments - Create adjustment
 */

import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import type { Database } from '@/types/supabase'
import type { SOPAdjustmentCreateInput } from '@/types/sops'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies })

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's company
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single()

    if (!profile?.company_id) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }

    const sopId = params.id
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    // Verify SOP exists and belongs to company
    const { data: sop, error: sopError } = await supabase
      .from('sops')
      .select('id')
      .eq('id', sopId)
      .eq('company_id', profile.company_id)
      .single()

    if (sopError || !sop) {
      return NextResponse.json({ error: 'SOP not found' }, { status: 404 })
    }

    // Build query
    let query = supabase
      .from('sop_adjustments')
      .select('*', { count: 'exact' })
      .eq('sop_id', sopId)

    if (status) {
      query = query.eq('status', status)
    }

    query = query.order('created_at', { ascending: false })

    const { data: adjustments, error, count } = await query

    if (error) {
      console.error('Error fetching adjustments:', error)
      return NextResponse.json({ error: 'Failed to fetch adjustments' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      adjustments: adjustments || [],
      total: count || 0,
    })
  } catch (error) {
    console.error('Get adjustments API error:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch adjustments',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies })

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's company
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single()

    if (!profile?.company_id) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }

    const sopId = params.id
    const body: SOPAdjustmentCreateInput = await request.json()

    // Validate required fields
    if (!body.reason || !body.adjustment_type || !body.changes) {
      return NextResponse.json(
        { error: 'reason, adjustment_type, and changes are required' },
        { status: 400 }
      )
    }

    // Verify SOP exists and belongs to company
    const { data: sop, error: sopError } = await supabase
      .from('sops')
      .select('*')
      .eq('id', sopId)
      .eq('company_id', profile.company_id)
      .single()

    if (sopError || !sop) {
      return NextResponse.json({ error: 'SOP not found' }, { status: 404 })
    }

    // Create adjustment with current SOP state as original_state
    const { data: adjustment, error: insertError } = await supabase
      .from('sop_adjustments')
      .insert({
        sop_id: sopId,
        adjustment_type: body.adjustment_type,
        reason: body.reason,
        suggested_by: body.suggested_by || 'user',
        changes: body.changes,
        original_state: body.original_state || {
          conditions: sop.conditions,
          actions: sop.actions,
          procedures: sop.procedures,
        },
        proposed_state: body.proposed_state || null,
        created_by_user_id: user.id,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error creating adjustment:', insertError)
      return NextResponse.json({ error: 'Failed to create adjustment' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      adjustment,
    })
  } catch (error) {
    console.error('Create adjustment API error:', error)
    return NextResponse.json(
      {
        error: 'Failed to create adjustment',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

