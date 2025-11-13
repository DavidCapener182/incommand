/**
 * SOP Management API
 * Feature 2: Live Doctrine Assistant & Dynamic SOP Adjustment Engine
 * 
 * GET /api/sops - List SOPs
 * POST /api/sops - Create SOP
 */

import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import type { Database } from '@/types/supabase'
import type { SOPCreateInput, SOPListQuery } from '@/types/sops'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
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

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const eventId = searchParams.get('event_id')
    const templateOnly = searchParams.get('template_only') === 'true'
    const status = searchParams.get('status')
    const sopType = searchParams.get('sop_type')
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100)

    // Build query
    let query = supabase
      .from('sops')
      .select('*', { count: 'exact' })
      .eq('company_id', profile.company_id)

    // Apply filters
    if (templateOnly) {
      query = query.is('event_id', null).is('template_id', null)
    } else if (eventId) {
      query = query.eq('event_id', eventId)
    }

    if (status) {
      query = query.eq('status', status)
    }

    if (sopType) {
      query = query.eq('sop_type', sopType)
    }

    // Pagination
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.order('created_at', { ascending: false }).range(from, to)

    const { data: sops, error, count } = await query

    if (error) {
      console.error('Error fetching SOPs:', error)
      return NextResponse.json({ error: 'Failed to fetch SOPs' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      sops: sops || [],
      total: count || 0,
      page,
      limit,
    })
  } catch (error) {
    console.error('SOPs API error:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch SOPs',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
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

    // Parse request body
    const body: SOPCreateInput = await request.json()

    // Validate required fields
    if (!body.sop_type || !body.title) {
      return NextResponse.json(
        { error: 'sop_type and title are required' },
        { status: 400 }
      )
    }

    // If event_id is provided, verify access
    if (body.event_id) {
      const { data: eventAccess, error: accessError } = await supabase
        .from('events')
        .select('id, company_id')
        .eq('id', body.event_id)
        .single()

      if (accessError || !eventAccess) {
        return NextResponse.json({ error: 'Event not found' }, { status: 404 })
      }

      if (eventAccess.company_id !== profile.company_id) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }
    }

    // Create SOP
    const { data: sop, error: insertError } = await supabase
      .from('sops')
      .insert({
        company_id: profile.company_id,
        event_id: body.event_id || null,
        template_id: body.template_id || null,
        sop_type: body.sop_type,
        title: body.title,
        description: body.description || null,
        conditions: body.conditions || {},
        actions: body.actions || [],
        procedures: body.procedures || null,
        status: body.status || 'draft',
        priority: body.priority || 'normal',
        linked_knowledge_ids: body.linked_knowledge_ids || [],
        applicable_event_types: body.applicable_event_types || null,
        created_by_user_id: user.id,
        notes: body.notes || null,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error creating SOP:', insertError)
      return NextResponse.json({ error: 'Failed to create SOP' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      sop,
    })
  } catch (error) {
    console.error('Create SOP API error:', error)
    return NextResponse.json(
      {
        error: 'Failed to create SOP',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

