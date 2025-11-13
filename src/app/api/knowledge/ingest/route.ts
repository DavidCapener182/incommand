export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 300

import { NextRequest, NextResponse } from 'next/server'
import { Buffer } from 'node:buffer'
import { withAdminAuth } from '@/lib/middleware/auth'
import { ingestDocument } from '@/lib/knowledge/ingest'
import { recordAdminAudit } from '@/lib/admin/audit'

const STORAGE_BUCKET = 'knowledge-uploads'

export async function POST(request: NextRequest) {
  return withAdminAuth(request, 'content_editor', async (context) => {
    try {
      const body = await request.json().catch(() => ({}))
      const { knowledgeId } = body as { knowledgeId?: string }

      if (!knowledgeId) {
        return NextResponse.json({ error: 'knowledgeId is required' }, { status: 400 })
      }

      const supabase = context.serviceClient

      const { data: knowledge, error: fetchError } = await supabase
        .from('knowledge_base')
        .select('*')
        .eq('id', knowledgeId)
        .single()

      if (fetchError || !knowledge) {
        return NextResponse.json({ error: 'Knowledge document not found' }, { status: 404 })
      }

      if (knowledge.storage_path == null) {
        return NextResponse.json({ error: 'No stored file found for this document' }, { status: 400 })
      }

      if (knowledge.status === 'ingesting') {
        return NextResponse.json({ error: 'Document is already ingesting' }, { status: 409 })
      }

      if (knowledge.organization_id && context.highestRole !== 'super_admin') {
        if (!context.organizationMemberships.includes(knowledge.organization_id)) {
          return NextResponse.json({ error: 'Access denied' }, { status: 403 })
        }
      }

      const download = await supabase.storage
        .from(STORAGE_BUCKET)
        .download(knowledge.storage_path)

      if (download.error || !download.data) {
        console.error('Failed to download stored file:', download.error)
        return NextResponse.json({ error: 'Failed to retrieve uploaded file for ingestion' }, { status: 500 })
      }

      const arrayBuffer = await download.data.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)

      const uploaderId = knowledge.uploader_id || context.user.id

      const result = await ingestDocument({
        file: buffer,
        title: knowledge.title,
        uploaderId,
        organizationId: knowledge.organization_id || undefined,
        eventId: knowledge.event_id || undefined,
        tags: knowledge.tags || [],
        type: (knowledge.type as any) || undefined,
        knowledgeId: knowledge.id,
        originalFilename: knowledge.original_filename || undefined,
        storagePath: knowledge.storage_path || undefined
      })

      const organizationId =
        knowledge.organization_id ??
        context.defaultOrganizationId ??
        context.organizationMemberships[0] ??
        'unknown'

      await recordAdminAudit(context.serviceClient, {
        organizationId,
        actorId: context.user.id,
        action: 'ingest_knowledge',
        resourceType: 'knowledge_base',
        resourceId: knowledgeId,
        changes: {
          title: knowledge.title,
          type: knowledge.type,
          chunksCreated: result.chunksCreated,
          bytes: result.bytes
        }
      })

      return NextResponse.json({
        success: true,
        knowledgeId: result.knowledgeId,
        chunksCreated: result.chunksCreated,
        bytes: result.bytes,
        type: result.type
      })
    } catch (error: any) {
      console.error('Knowledge ingest error:', error)
      return NextResponse.json({ error: error.message || 'Failed to ingest document' }, { status: 500 })
    }
  })
}
