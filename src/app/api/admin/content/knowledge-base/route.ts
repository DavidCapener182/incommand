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
      .from('knowledge_base' as any)
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
      .from('knowledge_base' as any)
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

    await recordAdminAudit(context.serviceClient, {
      organizationId,
      actorId: context.user.id,
      action: 'create_content',
      resourceType: 'knowledge_base',
      resourceId: data.id,
      changes: data,
    })

    return NextResponse.json({ article: data })
  })
}
