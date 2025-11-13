import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/middleware/auth'
import { detectFileType } from '@/lib/knowledge/ingest'
import { recordAdminAudit } from '@/lib/admin/audit'

export const maxDuration = 60 // Uploads should be quick; ingestion happens separately
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const MAX_FILE_SIZE = 25 * 1024 * 1024 // 25MB
const STORAGE_BUCKET = 'knowledge-uploads'

/**
 * POST /api/knowledge/upload
 * Upload and ingest a document into the knowledge base
 */
export async function POST(request: NextRequest) {
  return withAdminAuth(request, 'content_editor', async (context) => {
    try {
      const formData = await request.formData()
      const file = formData.get('file') as File | null
      const title = formData.get('title') as string | null
      const organizationId = formData.get('organizationId') as string | null
      const eventId = formData.get('eventId') as string | null
      const tagsStr = formData.get('tags') as string | null
      
      if (!file) {
        return NextResponse.json(
          { error: 'No file provided' },
          { status: 400 }
        )
      }
      
      if (!title || title.trim().length === 0) {
        return NextResponse.json(
          { error: 'Title is required' },
          { status: 400 }
        )
      }
      
      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: `File size exceeds maximum of ${MAX_FILE_SIZE / 1024 / 1024}MB` },
          { status: 400 }
        )
      }
      
      // Validate file type
      const fileType = detectFileType(file)
      if (fileType === 'unknown') {
        return NextResponse.json(
          { error: 'Unsupported file type. Supported: PDF, DOCX, TXT, MD, CSV' },
          { status: 400 }
        )
      }
      
      // Parse tags
      const tags = tagsStr ? tagsStr.split(',').map(t => t.trim()).filter(Boolean) : []
      
      // Determine organization context
      // Super admins can upload without organizationId to make documents available to all companies
      let resolvedOrgId: string | undefined
      if (organizationId) {
        // Verify user has access to this organization
        if (context.highestRole !== 'super_admin' && 
            !context.organizationMemberships.includes(organizationId)) {
          return NextResponse.json(
            { error: 'Access denied to specified organization' },
            { status: 403 }
          )
        }
        resolvedOrgId = organizationId
      } else {
        // For super admins, allow null organizationId (available to all companies)
        // For other users, use their default organization
        if (context.highestRole === 'super_admin') {
          resolvedOrgId = undefined // null = available to all companies
        } else {
          resolvedOrgId = context.defaultOrganizationId || context.organizationMemberships[0]
          if (!resolvedOrgId) {
            return NextResponse.json(
              { error: 'Organization context required' },
              { status: 400 }
            )
          }
        }
      }
      
      const supabase = context.serviceClient

      // Ensure storage bucket exists
      const { error: bucketError } = await supabase.storage.createBucket(STORAGE_BUCKET, {
        public: false,
        fileSizeLimit: `${MAX_FILE_SIZE}`
      })
      if (bucketError && !bucketError.message?.toLowerCase().includes('already exists')) {
        console.error('Failed to ensure storage bucket:', bucketError)
        return NextResponse.json(
          { error: 'Failed to prepare storage bucket for uploads' },
          { status: 500 }
        )
      }

      // Create knowledge base record in pending state
        const { data: kbEntry, error: kbError } = await supabase
          .from('knowledge_base' as any)
          .insert({
            title: title.trim(),
            type: fileType,
            source: 'user-upload',
            uploader_id: context.user.id,
            organization_id: resolvedOrgId ?? context.defaultOrganizationId ?? null,
            event_id: eventId || null,
            tags,
            status: 'pending',
            bytes: file.size,
            original_filename: file.name,
            body: ''
          } as any)
        .select('id')
        .single()

      if (kbError || !kbEntry) {
        console.error('Failed to create knowledge base record:', kbError)
        return NextResponse.json(
          { error: 'Failed to create knowledge record' },
          { status: 500 }
        )
      }

        const knowledgeRecord = kbEntry as Record<string, any>
        const knowledgeId = knowledgeRecord.id
      const sanitizedFilename = file.name.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9._-]/g, '') || 'document'
      const storagePath = `${knowledgeId}/${Date.now()}-${sanitizedFilename}`
      
      const arrayBuffer = await file.arrayBuffer()
      const { error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(storagePath, arrayBuffer, {
          upsert: true,
          contentType: file.type || 'application/octet-stream'
        })

      if (uploadError) {
        console.error('Failed to upload file to storage:', uploadError)
        await supabase.from('knowledge_base').delete().eq('id', knowledgeId)
        return NextResponse.json(
          { error: 'Failed to store uploaded file' },
          { status: 500 }
        )
      }

      // Update record with storage path
        await supabase
          .from('knowledge_base' as any)
        .update({
          storage_path: storagePath,
          status: 'pending',
          updated_at: new Date().toISOString()
        })
        .eq('id', knowledgeId)

        await recordAdminAudit(context.serviceClient, {
          organizationId: resolvedOrgId ?? context.defaultOrganizationId ?? '00000000-0000-0000-0000-000000000000',
        actorId: context.user.id,
        action: 'upload_knowledge',
        resourceType: 'knowledge_base',
        resourceId: knowledgeId,
        changes: {
          title,
          type: fileType,
          bytes: file.size,
          storage_path: storagePath
        }
      })

      return NextResponse.json({
        success: true,
        knowledgeId,
        status: 'pending',
        bytes: file.size,
        type: fileType,
        storagePath,
        message: 'File uploaded successfully. Start ingestion when ready.'
      })
      
    } catch (error: any) {
      console.error('Knowledge upload error:', error)
      return NextResponse.json(
        { error: error.message || 'Failed to upload document' },
        { status: 500 }
      )
    }
  })
}

