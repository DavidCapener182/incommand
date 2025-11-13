/**
 * Lock Decision API Route
 * Feature 3: Golden Thread Decision Logging
 * 
 * POST /api/decisions/[id]/lock - Lock decision (make tamper-evident)
 */

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/types/supabase'

export const dynamic = 'force-dynamic'

// POST /api/decisions/[id]/lock - Lock decision
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const decisionId = params.id

    // Get existing decision
    const { data: decision, error: fetchError } = await supabase
      .from('decisions')
      .select('id, is_locked, decision_owner_id, company_id')
      .eq('id', decisionId)
      .single()

    if (fetchError || !decision) {
      return NextResponse.json(
        { error: 'Decision not found' },
        { status: 404 }
      )
    }

    // Check if already locked
    if (decision.is_locked) {
      return NextResponse.json(
        { error: 'Decision already locked', details: 'This decision has already been locked and cannot be modified.' },
        { status: 400 }
      )
    }

    // Verify company access
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id, role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.company_id !== decision.company_id) {
      return NextResponse.json(
        { error: 'Unauthorized', details: 'Decision does not belong to your company' },
        { status: 403 }
      )
    }

    // Check if user is decision owner or admin
    const isOwner = decision.decision_owner_id === user.id
    const isAdmin = profile.role === 'admin' || profile.role === 'superadmin'

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized', details: 'Only the decision owner or an admin can lock decisions' },
        { status: 403 }
      )
    }

    // Lock the decision
    const { data: lockedDecision, error: lockError } = await supabase
      .from('decisions')
      .update({
        is_locked: true,
        locked_at: new Date().toISOString(),
        locked_by_user_id: user.id,
      })
      .eq('id', decisionId)
      .select()
      .single()

    if (lockError) {
      console.error('Database error:', lockError)
      return NextResponse.json(
        { error: 'Failed to lock decision', details: lockError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      decision: lockedDecision,
      message: 'Decision locked successfully. It can no longer be edited, but annotations can still be added.',
    })

  } catch (error: any) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

