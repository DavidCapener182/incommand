/**
 * Decision Annotations API Route
 * Feature 3: Golden Thread Decision Logging
 * 
 * POST /api/decisions/[id]/annotations - Add annotation to decision
 */

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/types/supabase'
import type { AnnotationCreateInput } from '@/types/decisions'

export const dynamic = 'force-dynamic'

// POST /api/decisions/[id]/annotations - Add annotation
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

    // Get decision to verify access (annotations can be added even to locked decisions)
    const { data: decision, error: decisionError } = await supabase
      .from('decisions')
      .select('id, company_id')
      .eq('id', decisionId)
      .single()

    if (decisionError || !decision) {
      return NextResponse.json(
        { error: 'Decision not found' },
        { status: 404 }
      )
    }

    // Verify company access
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single()

    if (!profile || profile.company_id !== decision.company_id) {
      return NextResponse.json(
        { error: 'Unauthorized', details: 'Decision does not belong to your company' },
        { status: 403 }
      )
    }

    // Parse request body
    const body: AnnotationCreateInput = await request.json()

    // Validate required fields
    if (!body.annotation_text || body.annotation_text.trim().length === 0) {
      return NextResponse.json(
        { error: 'Missing required field', details: 'annotation_text is required' },
        { status: 400 }
      )
    }

    // Create annotation record
    const annotationData = {
      decision_id: decisionId,
      company_id: profile.company_id,
      annotation_text: body.annotation_text.trim(),
      annotation_type: body.annotation_type || 'note',
      created_by_user_id: user.id,
    }

    const { data: annotation, error: insertError } = await supabase
      .from('decision_annotations')
      .insert(annotationData)
      .select()
      .single()

    if (insertError) {
      console.error('Database error:', insertError)
      return NextResponse.json(
        { error: 'Failed to create annotation', details: insertError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      annotation,
    }, { status: 201 })

  } catch (error: any) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

