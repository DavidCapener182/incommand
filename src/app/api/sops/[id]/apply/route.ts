/**
 * Apply SOP Adjustment API
 * Feature 2: Live Doctrine Assistant & Dynamic SOP Adjustment Engine
 * 
 * POST /api/sops/[id]/apply - Apply an adjustment to an SOP
 */

import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import type { Database } from '@/types/supabase'
import type { SOPAdjustmentReviewInput } from '@/types/sops'

export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient<any>({ cookies })

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
    const body: SOPAdjustmentReviewInput & { adjustment_id?: string } = await request.json()

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

    // Get the adjustment if provided
    let adjustment = null
    if (body.adjustment_id) {
      const { data: adj, error: adjError } = await supabase
        .from('sop_adjustments')
        .select('*')
        .eq('id', body.adjustment_id)
        .eq('sop_id', sopId)
        .single()

      if (adjError || !adj) {
        return NextResponse.json({ error: 'Adjustment not found' }, { status: 404 })
      }
      adjustment = adj
    } else {
      // Get latest pending adjustment
      const { data: latestAdj } = await supabase
        .from('sop_adjustments')
        .select('*')
        .eq('sop_id', sopId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (latestAdj) {
        adjustment = latestAdj
      }
    }

    if (!adjustment) {
      return NextResponse.json({ error: 'No pending adjustment found' }, { status: 404 })
    }

    // Update adjustment status
    const updateData: any = {
      status: body.status,
      reviewed_by_user_id: user.id,
      reviewed_at: new Date().toISOString(),
    }

    if (body.review_notes) {
      updateData.review_notes = body.review_notes
    }

    if (body.modifications) {
      updateData.modifications = body.modifications
    }

    // If accepted or modified, apply changes to SOP
    if (body.status === 'accepted' || body.status === 'modified') {
      const proposedState = adjustment.proposed_state || adjustment.changes
      const modifications = body.modifications || {}

      // Merge proposed state with modifications
      const finalState = {
        conditions: modifications.conditions || proposedState.conditions || sop.conditions,
        actions: modifications.actions || proposedState.actions || sop.actions,
        procedures: modifications.procedures || proposedState.procedures || sop.procedures,
      }

      // Update SOP
      const { error: updateSopError } = await supabase
        .from('sops')
        .update({
          conditions: finalState.conditions,
          actions: finalState.actions,
          procedures: finalState.procedures,
          version: (sop as any).version + 1,
        })
        .eq('id', sopId)

      if (updateSopError) {
        console.error('Error updating SOP:', updateSopError)
        return NextResponse.json({ error: 'Failed to apply adjustment' }, { status: 500 })
      }

      // Mark adjustment as applied
      updateData.applied_at = new Date().toISOString()
      updateData.applied_by_user_id = user.id
      updateData.status = 'applied'
    }

    // Update adjustment
    const { data: updatedAdjustment, error: updateError } = await supabase
      .from('sop_adjustments')
      .update(updateData)
      .eq('id', adjustment.id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating adjustment:', updateError)
      return NextResponse.json({ error: 'Failed to update adjustment' }, { status: 500 })
    }

    // Get updated SOP
    const { data: updatedSop } = await supabase
      .from('sops')
      .select('*')
      .eq('id', sopId)
      .single()

    return NextResponse.json({
      success: true,
      adjustment: updatedAdjustment,
      sop: updatedSop,
    })
  } catch (error) {
    console.error('Apply adjustment API error:', error)
    return NextResponse.json(
      {
        error: 'Failed to apply adjustment',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

