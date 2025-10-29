import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth, requireOrganizationAccess } from '@/lib/middleware/auth'
import { recordAdminAudit } from '@/lib/admin/audit'
import { z } from 'zod'

const updateArticleSchema = z.object({
  organizationId: z.string().uuid().optional(),
  title: z.string().min(3).optional(),
  body: z.string().min(10).optional(),
  status: z.enum(['draft', 'published', 'archived']).optional(),
  publishedAt: z.string().datetime().nullable().optional(),
  tags: z.array(z.string()).optional(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAdminAuth(request, 'content_editor', async (context) => {
    const body = await request.json()
    const parsed = updateArticleSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.message }, { status: 400 })
    }

    let organizationId: string | undefined
    if (parsed.data.organizationId) {
      const resolvedOrg = await requireOrganizationAccess(context, parsed.data.organizationId)
      if (resolvedOrg instanceof NextResponse) {
        return resolvedOrg
      }
      organizationId = resolvedOrg
    }

    const updates: Record<string, unknown> = {}
    if (parsed.data.title) updates.title = parsed.data.title
    if (parsed.data.body) updates.body = parsed.data.body
    if (parsed.data.status) updates.status = parsed.data.status
    if (parsed.data.publishedAt !== undefined) updates.published_at = parsed.data.publishedAt
    if (parsed.data.tags) updates.tags = parsed.data.tags
    if (organizationId) updates.organization_id = organizationId

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No updates provided' }, { status: 400 })
    }

    const { data, error } = await context.serviceClient
      .from('knowledge_base' as any)
      .update(updates)
      .eq('id', params.id)
      .select('*')
      .single()

    if (error) {
      return NextResponse.json({ error: 'Failed to update content item' }, { status: 500 })
    }

    await recordAdminAudit(context.serviceClient, {
      organizationId: data.organization_id,
      actorId: context.user.id,
      action: 'update_content',
      resourceType: 'knowledge_base',
      resourceId: params.id,
      changes: updates,
    })

    return NextResponse.json({ article: data })
  })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAdminAuth(request, 'content_editor', async (context) => {
    const { data, error } = await context.serviceClient
      .from('knowledge_base' as any)
      .update({ status: 'archived' })
      .eq('id', params.id)
      .select('organization_id')
      .single()

    if (error) {
      return NextResponse.json({ error: 'Failed to archive content item' }, { status: 500 })
    }

    await recordAdminAudit(context.serviceClient, {
      organizationId: data.organization_id,
      actorId: context.user.id,
      action: 'archive_content',
      resourceType: 'knowledge_base',
      resourceId: params.id,
      changes: { status: 'archived' },
    })

    return NextResponse.json({ success: true })
  })
}
