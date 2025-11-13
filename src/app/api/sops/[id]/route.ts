/**
 * Individual SOP Management API
 * Feature 2: Live Doctrine Assistant & Dynamic SOP Adjustment Engine
 * 
 * GET /api/sops/[id] - Get SOP details
 * PUT /api/sops/[id] - Update SOP
 * DELETE /api/sops/[id] - Delete SOP
 */

import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import type { Database } from '@/types/supabase'
import type { SOPUpdateInput } from '@/types/sops'

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

    // Get SOP with adjustments
    const { data: sop, error: sopError } = await supabase
      .from('sops')
      .select('*')
      .eq('id', sopId)
      .eq('company_id', profile.company_id)
      .single()

    if (sopError || !sop) {
      return NextResponse.json({ error: 'SOP not found' }, { status: 404 })
    }

    // Get pending adjustments
    const { data: adjustments } = await supabase
      .from('sop_adjustments')
      .select('*')
      .eq('sop_id', sopId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    return NextResponse.json({
      success: true,
      sop: {
        ...sop,
        adjustments: adjustments || [],
      },
    })
  } catch (error) {
    console.error('Get SOP API error:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch SOP',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

export async function PUT(
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
    const body: SOPUpdateInput = await request.json()

    // Verify SOP exists and belongs to company
    const { data: existingSop, error: checkError } = await supabase
      .from('sops')
      .select('id, status')
      .eq('id', sopId)
      .eq('company_id', profile.company_id)
      .single()

    if (checkError || !existingSop) {
      return NextResponse.json({ error: 'SOP not found' }, { status: 404 })
    }

    // Update SOP
    const updateData: any = {}
    if (body.title !== undefined) updateData.title = body.title
    if (body.description !== undefined) updateData.description = body.description
    if (body.conditions !== undefined) updateData.conditions = body.conditions
    if (body.actions !== undefined) updateData.actions = body.actions
    if (body.procedures !== undefined) updateData.procedures = body.procedures
    if (body.status !== undefined) updateData.status = body.status
    if (body.priority !== undefined) updateData.priority = body.priority
    if (body.notes !== undefined) updateData.notes = body.notes

    // Increment version on content changes
    if (body.conditions || body.actions || body.procedures) {
      updateData.version = (existingSop as any).version + 1
    }

    const { data: updatedSop, error: updateError } = await supabase
      .from('sops')
      .update(updateData)
      .eq('id', sopId)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating SOP:', updateError)
      return NextResponse.json({ error: 'Failed to update SOP' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      sop: updatedSop,
    })
  } catch (error) {
    console.error('Update SOP API error:', error)
    return NextResponse.json(
      {
        error: 'Failed to update SOP',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

export async function DELETE(
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

    // Verify SOP exists and belongs to company
    const { data: existingSop, error: checkError } = await supabase
      .from('sops')
      .select('id')
      .eq('id', sopId)
      .eq('company_id', profile.company_id)
      .single()

    if (checkError || !existingSop) {
      return NextResponse.json({ error: 'SOP not found' }, { status: 404 })
    }

    // Delete SOP (adjustments will be cascade deleted)
    const { error: deleteError } = await supabase.from('sops').delete().eq('id', sopId)

    if (deleteError) {
      console.error('Error deleting SOP:', deleteError)
      return NextResponse.json({ error: 'Failed to delete SOP' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'SOP deleted successfully',
    })
  } catch (error) {
    console.error('Delete SOP API error:', error)
    return NextResponse.json(
      {
        error: 'Failed to delete SOP',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

