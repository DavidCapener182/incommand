import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { adminApiHandler } from '@/lib/apiSecurity'
import { getServiceSupabaseClient } from '@/lib/supabaseServer'
import { logger } from '@/lib/logger'
import {
  AdminContextUser,
  assertSuperAdmin,
  isPlatformAdmin,
  logAdminAction,
  logAdminAuditEntry,
} from '@/lib/security'

const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
  search: z.string().optional(),
  heading: z.string().optional(),
  pageNumber: z.coerce.number().int().min(1).optional(),
})

const createArticleSchema = z.object({
  content: z.string().min(1, 'Content is required'),
  heading: z.string().optional(),
  page: z.coerce.number().int().min(1).optional(),
})

const updateArticleSchema = createArticleSchema.partial().extend({
  id: z.string().uuid(),
})

function parseQuery(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  return paginationSchema.parse({
    page: searchParams.get('page') ?? undefined,
    pageSize: searchParams.get('pageSize') ?? undefined,
    search: searchParams.get('search') ?? undefined,
    heading: searchParams.get('heading') ?? undefined,
    pageNumber: searchParams.get('pageNumber') ?? undefined,
  })
}

function buildContentFilter(search?: string, heading?: string) {
  const parts: string[] = []
  if (search) {
    const sanitized = search.trim().replace(/%/g, '')
    if (sanitized) {
      parts.push(`content.ilike.%${sanitized}%`)
    }
  }

  if (heading) {
    const sanitized = heading.trim().replace(/%/g, '')
    if (sanitized) {
      parts.push(`heading.ilike.%${sanitized}%`)
    }
  }

  if (parts.length === 0) {
    return undefined
  }

  return parts.join(',')
}

export async function GET(request: NextRequest) {
  return adminApiHandler(request, async (supabase, user, req) => {
    const adminUser = user as AdminContextUser
    if (!isPlatformAdmin(adminUser)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { page, pageSize, search, heading, pageNumber } = parseQuery(req)

    let query = supabase
      .from('green_guide_chunks')
      .select('id, heading, content, page, created_at', { count: 'exact' })

    const filter = buildContentFilter(search, heading)
    if (filter) {
      query = query.or(filter)
    }

    if (pageNumber) {
      query = query.eq('page', pageNumber)
    }

    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    const { data, error, count } = await query.order('page', { ascending: true }).range(from, to)

    if (error) {
      logger.error('Failed to load knowledge base articles', { error })
      return NextResponse.json({ error: 'Unable to load knowledge base content' }, { status: 500 })
    }

    return NextResponse.json({
      data: data ?? [],
      pagination: {
        page,
        pageSize,
        total: count ?? data?.length ?? 0,
      },
    })
  })
}

export async function POST(request: NextRequest) {
  return adminApiHandler(request, async (_supabase, user, req) => {
    const adminUser = user as AdminContextUser
    if (!isPlatformAdmin(adminUser)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await req.json().catch(() => null)
    const parsed = createArticleSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    let serviceClient
    try {
      serviceClient = getServiceSupabaseClient()
    } catch (error) {
      logger.error('Service client configuration error when creating knowledge base article', error)
      return NextResponse.json({ error: 'Service configuration error' }, { status: 500 })
    }

    const payload = {
      content: parsed.data.content,
      heading: parsed.data.heading ?? null,
      page: parsed.data.page ?? null,
    }

    const { data, error } = await serviceClient
      .from('green_guide_chunks')
      .insert(payload)
      .select()
      .single()

    if (error || !data) {
      logger.error('Failed to create knowledge base article', { error })
      return NextResponse.json({ error: 'Unable to create article' }, { status: 500 })
    }

    await logAdminAction({
      adminId: adminUser.id,
      actionType: 'admin.knowledge_base.create',
      details: { articleId: data.id },
      client: serviceClient,
    })

    await logAdminAuditEntry({
      adminId: adminUser.id,
      tableName: 'green_guide_chunks',
      recordId: data.id,
      actionType: 'create',
      changes: data,
      client: serviceClient,
    })

    return NextResponse.json({ data })
  })
}

export async function PATCH(request: NextRequest) {
  return adminApiHandler(request, async (_supabase, user, req) => {
    const adminUser = user as AdminContextUser
    if (!isPlatformAdmin(adminUser)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await req.json().catch(() => null)
    const parsed = updateArticleSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    let serviceClient
    try {
      serviceClient = getServiceSupabaseClient()
    } catch (error) {
      logger.error('Service client configuration error when updating knowledge base article', error)
      return NextResponse.json({ error: 'Service configuration error' }, { status: 500 })
    }

    const { id, ...changes } = parsed.data
    if (Object.keys(changes).length === 0) {
      return NextResponse.json({ error: 'No updates provided' }, { status: 400 })
    }

    const payload: Record<string, unknown> = {}
    if (changes.content !== undefined) payload.content = changes.content
    if (changes.heading !== undefined) payload.heading = changes.heading ?? null
    if (changes.page !== undefined) payload.page = changes.page ?? null

    const { error } = await serviceClient
      .from('green_guide_chunks')
      .update(payload)
      .eq('id', id)

    if (error) {
      logger.error('Failed to update knowledge base article', { error, id })
      return NextResponse.json({ error: 'Unable to update article' }, { status: 500 })
    }

    await logAdminAction({
      adminId: adminUser.id,
      actionType: 'admin.knowledge_base.update',
      details: { articleId: id, changes: payload },
      client: serviceClient,
    })

    await logAdminAuditEntry({
      adminId: adminUser.id,
      tableName: 'green_guide_chunks',
      recordId: id,
      actionType: 'update',
      changes: payload,
      client: serviceClient,
    })

    return NextResponse.json({ data: { id, ...payload } })
  })
}

export async function DELETE(request: NextRequest) {
  return adminApiHandler(request, async (_supabase, user, req) => {
    const adminUser = user as AdminContextUser
    try {
      assertSuperAdmin(adminUser)
    } catch (error) {
      return NextResponse.json({ error: (error as Error).message }, { status: 403 })
    }

    const id = req.nextUrl.searchParams.get('id') || (await req.json().catch(() => ({} as any))).id
    if (!id) {
      return NextResponse.json({ error: 'Article id is required' }, { status: 400 })
    }

    let serviceClient
    try {
      serviceClient = getServiceSupabaseClient()
    } catch (error) {
      logger.error('Service client configuration error when deleting knowledge base article', error)
      return NextResponse.json({ error: 'Service configuration error' }, { status: 500 })
    }

    const { error } = await serviceClient
      .from('green_guide_chunks')
      .delete()
      .eq('id', id)

    if (error) {
      logger.error('Failed to delete knowledge base article', { error, id })
      return NextResponse.json({ error: 'Unable to delete article' }, { status: 500 })
    }

    await logAdminAction({
      adminId: adminUser.id,
      actionType: 'admin.knowledge_base.delete',
      details: { articleId: id },
      client: serviceClient,
    })

    await logAdminAuditEntry({
      adminId: adminUser.id,
      tableName: 'green_guide_chunks',
      recordId: id,
      actionType: 'delete',
      client: serviceClient,
    })

    return NextResponse.json({ success: true })
  })
}
