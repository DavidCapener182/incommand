import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth, requireOrganizationAccess } from '@/lib/middleware/auth'
import { recordAdminAudit } from '@/lib/admin/audit'
import { z } from 'zod'

const createArticleSchema = z.object({
  organizationId: z.string().uuid().optional(),
  title: z.string().min(3),
  body: z.string().min(10),
  status: z.enum(['draft', 'published', 'archived']).default('draft'),
  authorId: z.string().uuid().optional(),
  publishedAt: z.string().datetime().optional(),
  tags: z.array(z.string()).optional(),
})

export async function GET(request: NextRequest) {
  return withAdminAuth(request, 'content_editor', async (context) => {
    const url = new URL(request.url)
    const status = url.searchParams.get('status')
    const organizationId = url.searchParams.get('organizationId')

    let query = context.serviceClient
      .from('knowledge_base')
      .select('*')
      .order('updated_at', { ascending: false })

    if (organizationId) {
      const resolvedOrg = await requireOrganizationAccess(context, organizationId)
      if (resolvedOrg instanceof NextResponse) {
        return resolvedOrg
      }
      query = query.eq('organization_id', resolvedOrg)
    } else if (context.highestRole !== 'super_admin') {
      query = query.in('organization_id', context.organizationMemberships)
    }

    if (status) {
      query = query.eq('status', status)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: 'Failed to load content library' }, { status: 500 })
    }

    return NextResponse.json({ articles: data ?? [] })
  })
}

export async function POST(request: NextRequest) {
  return withAdminAuth(request, 'content_editor', async (context) => {
    const body = await request.json()
    const parsed = createArticleSchema.safeParse(body)

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
    } else {
      organizationId = context.defaultOrganizationId ?? context.organizationMemberships[0]
    }

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization context required for content creation' }, { status: 400 })
    }

    const { data, error } = await context.serviceClient
      .from('knowledge_base')
      .insert({
        organization_id: organizationId,
        title: parsed.data.title,
        body: parsed.data.body,
        status: parsed.data.status,
        author_id: parsed.data.authorId ?? context.user.id,
        published_at: parsed.data.publishedAt ?? null,
        tags: parsed.data.tags ?? [],
      })
      .select('*')
      .single()

    if (error) {
      return NextResponse.json({ error: 'Failed to create content item' }, { status: 500 })
    }

    if (!data || !('id' in data)) {
      throw new Error('Failed to create content item: invalid response')
    }

    const contentData = data as unknown as { id: string; [key: string]: unknown }

    await recordAdminAudit(context.serviceClient, {
      organizationId,
      actorId: context.user.id,
      action: 'create_content',
      resourceType: 'knowledge_base',
      resourceId: contentData.id,
      changes: contentData as Record<string, unknown>,
    })

    return NextResponse.json({ article: data })
  })
}

export async function DELETE(request: NextRequest) {
  return withAdminAuth(request, 'content_editor', async (context) => {
    const url = new URL(request.url)
    const clearFailed = url.searchParams.get('clearFailed') === 'true'
    const organizationId = url.searchParams.get('organizationId')

    if (!clearFailed) {
      return NextResponse.json({ error: 'Invalid delete request. Use ?clearFailed=true to clear failed uploads' }, { status: 400 })
    }

    // Build query to find failed items
    let query = context.serviceClient
      .from('knowledge_base')
      .select('id, organization_id, storage_path')
      .eq('status', 'failed')

    // Apply organization filter
    if (organizationId) {
      const resolvedOrg = await requireOrganizationAccess(context, organizationId)
      if (resolvedOrg instanceof NextResponse) {
        return resolvedOrg
      }
      query = query.eq('organization_id', resolvedOrg)
    } else if (context.highestRole !== 'super_admin') {
      // Non-super-admins can only clear failed items from their organizations
      query = query.in('organization_id', context.organizationMemberships)
    }

    // Get all failed items first for audit logging
    const { data: failedItems, error: fetchError } = await query

    if (fetchError) {
      return NextResponse.json({ error: 'Failed to fetch failed items' }, { status: 500 })
    }

    if (!failedItems || failedItems.length === 0) {
      return NextResponse.json({ deleted: 0, message: 'No failed uploads to clear' })
    }

    // Remove stored files if present
    const storagePaths = failedItems
      .map(item => item.storage_path as string | null)
      .filter((path): path is string => Boolean(path))

    if (storagePaths.length > 0) {
      const { error: removeError } = await context.serviceClient.storage
        .from('knowledge-uploads')
        .remove(storagePaths)

      if (removeError) {
        console.warn('Failed to remove some storage files for failed knowledge uploads:', removeError)
      }
    }

    // Delete failed items (cascade will handle knowledge_embeddings)
    const idsToDelete = failedItems.map(item => item.id)
    const { error: deleteError } = await context.serviceClient
      .from('knowledge_base')
      .delete()
      .in('id', idsToDelete)

    if (deleteError) {
      return NextResponse.json({ error: 'Failed to delete failed items' }, { status: 500 })
    }

    // Record audit log for bulk deletion
    await recordAdminAudit(context.serviceClient, {
      organizationId: organizationId!,
      actorId: context.user.id,
      action: 'bulk_delete_content',
      resourceType: 'knowledge_base',
      resourceId: null,
      changes: { 
        deletedCount: idsToDelete.length,
        deletedIds: idsToDelete,
        reason: 'Clear failed uploads'
      },
    })

    return NextResponse.json({ 
      deleted: idsToDelete.length,
      message: `Successfully cleared ${idsToDelete.length} failed upload${idsToDelete.length !== 1 ? 's' : ''}`
    })
  })
}
