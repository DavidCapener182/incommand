/**
 * Decision Evidence API Route
 * Feature 3: Golden Thread Decision Logging
 * 
 * POST /api/decisions/[id]/evidence - Add evidence to decision
 */

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/types/supabase'
import type { EvidenceUploadInput } from '@/types/decisions'

export const dynamic = 'force-dynamic'

// POST /api/decisions/[id]/evidence - Add evidence
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

    // Get decision to verify access and lock status
    const { data: decision, error: decisionError } = await supabase
      .from('decisions')
      .select('id, is_locked, company_id')
      .eq('id', decisionId)
      .single()

      if (decisionError || !decision) {
      return NextResponse.json(
        { error: 'Decision not found' },
        { status: 404 }
      )
    }

      const decisionRecord = decision as { is_locked?: boolean; company_id?: string }

    // Check if decision is locked (evidence can only be added to unlocked decisions)
      if (decisionRecord.is_locked) {
      return NextResponse.json(
        { error: 'Decision is locked', details: 'Evidence cannot be added to locked decisions.' },
        { status: 403 }
      )
    }

    // Verify company access
      const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single()

      const profileRecord = profile as { company_id?: string } | null

      if (!profileRecord?.company_id || profileRecord.company_id !== decisionRecord.company_id) {
      return NextResponse.json(
        { error: 'Unauthorized', details: 'Decision does not belong to your company' },
        { status: 403 }
      )
    }

    // Parse form data (can be JSON or FormData for file uploads)
    const contentType = request.headers.get('content-type') || ''
    let body: EvidenceUploadInput
    let file: File | null = null

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData()
        body = {
          evidence_type: (formData.get('evidence_type') as EvidenceUploadInput['evidence_type']) || 'other',
          title: formData.get('title') as string,
          description: (formData.get('description') as string) || undefined,
          external_reference: (formData.get('external_reference') as string) || undefined,
          captured_at: (formData.get('captured_at') as string) || new Date().toISOString(),
        }
      file = formData.get('file') as File | null
    } else {
      body = await request.json()
    }

    // Validate required fields
    if (!body.evidence_type || !body.title) {
      return NextResponse.json(
        { error: 'Missing required fields', details: 'evidence_type and title are required' },
        { status: 400 }
      )
    }

    // Handle file upload if provided
    let filePath: string | null = null
    let fileUrl: string | null = null
    let fileSizeBytes: number | null = null
    let mimeType: string | null = null

    if (file) {
      // Generate unique filename
      const fileExt = file.name.split('.').pop()
      const fileName = `${decisionId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
      const filePathFull = `decision-evidence/${fileName}`

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('decision-evidence')
        .upload(filePathFull, file, {
          contentType: file.type,
          upsert: false,
        })

      if (uploadError) {
        console.error('Storage upload error:', uploadError)
        return NextResponse.json(
          { error: 'Failed to upload file', details: uploadError.message },
          { status: 500 }
        )
      }

      filePath = filePathFull
      fileSizeBytes = file.size
      mimeType = file.type

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('decision-evidence')
        .getPublicUrl(filePathFull)
      
      fileUrl = urlData.publicUrl
    }

    // Create evidence record
    const evidenceData = {
      decision_id: decisionId,
        company_id: profileRecord.company_id,
      evidence_type: body.evidence_type,
      title: body.title,
      description: body.description || null,
      file_path: filePath,
      file_url: fileUrl,
      external_reference: body.external_reference || null,
      captured_at: body.captured_at || new Date().toISOString(),
      captured_by_user_id: user.id,
      file_size_bytes: fileSizeBytes,
      mime_type: mimeType,
    }

      const { data: evidence, error: insertError } = await (supabase as any)
        .from('decision_evidence')
      .insert(evidenceData)
      .select()
      .single()

    if (insertError) {
      console.error('Database error:', insertError)
      // If file was uploaded, try to clean it up
      if (filePath) {
        await supabase.storage.from('decision-evidence').remove([filePath])
      }
      return NextResponse.json(
        { error: 'Failed to create evidence record', details: insertError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      evidence,
    }, { status: 201 })

  } catch (error: any) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

