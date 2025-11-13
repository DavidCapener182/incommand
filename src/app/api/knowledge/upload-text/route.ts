import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/middleware/auth'
import { ingestDocument } from '@/lib/knowledge/ingest'
import { recordAdminAudit } from '@/lib/admin/audit'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 300

const MAX_TEXT_LENGTH = 200_000 // ~200k characters (~800kb)

export async function POST(request: NextRequest) {
  return withAdminAuth(request, 'content_editor', async (context) => {
    try {
      const body = await request.json().catch(() => ({}))
      const {
        title,
        content,
        organizationId,
        eventId,
        tags
      }: {
        title?: string
        content?: string
        organizationId?: string
        eventId?: string
        tags?: string[]
      } = body

      if (!content || typeof content !== 'string' || content.trim().length === 0) {
        return NextResponse.json({ error: 'Text content is required' }, { status: 400 })
      }

      if (content.length > MAX_TEXT_LENGTH) {
        return NextResponse.json({ error: `Text content exceeds maximum length of ${MAX_TEXT_LENGTH} characters` }, { status: 400 })
      }

      let resolvedOrgId: string | undefined
      if (organizationId) {
        if (context.highestRole !== 'super_admin' && !context.organizationMemberships.includes(organizationId)) {
          return NextResponse.json({ error: 'Access denied to specified organization' }, { status: 403 })
        }
        resolvedOrgId = organizationId
      } else if (context.highestRole !== 'super_admin') {
        resolvedOrgId = context.defaultOrganizationId || context.organizationMemberships[0]
        if (!resolvedOrgId) {
          return NextResponse.json({ error: 'Organization context required' }, { status: 400 })
        }
      }

      const trimmedTitle = (title && title.trim()) || 'Untitled text upload'
      const trimmedTags = Array.isArray(tags) ? tags : []

      const result = await ingestDocument({
        title: trimmedTitle,
        uploaderId: context.user.id,
        organizationId: resolvedOrgId,
        eventId: eventId || undefined,
        tags: trimmedTags,
        type: 'txt',
        originalFilename: `${trimmedTitle}.txt`,
        textContent: content,
        source: 'text-upload'
      })

      const auditOrganizationId =
        resolvedOrgId ??
        context.defaultOrganizationId ??
        context.organizationMemberships[0] ??
        'unknown'

      await recordAdminAudit(context.serviceClient, {
        organizationId: auditOrganizationId,
        actorId: context.user.id,
        action: 'upload_text_knowledge',
        resourceType: 'knowledge_base',
        resourceId: result.knowledgeId,
        changes: {
          title: trimmedTitle,
          type: 'txt',
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
      console.error('Text upload error:', error)
      return NextResponse.json({ error: error.message || 'Failed to upload text' }, { status: 500 })
    }
  })
}
