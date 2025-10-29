import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { adminApiHandler } from '@/lib/apiSecurity'
import { getServiceSupabaseClient } from '@/lib/supabaseServer'
import { logger } from '@/lib/logger'
import {
  AdminContextUser,
  assertSuperAdmin,
  isSuperAdmin,
  logAdminAction,
  logAdminAuditEntry,
} from '@/lib/security'

const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
})

const createOrganizationSchema = z.object({
  name: z.string().min(1, 'Organization name is required'),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  contactPerson: z.string().optional(),
  address: z.string().optional(),
  billingAddress: z.string().optional(),
  vatNumber: z.string().optional(),
  notes: z.string().optional(),
})

const updateOrganizationSchema = createOrganizationSchema.partial().extend({
  id: z.string().uuid(),
})

function parsePagination(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  return paginationSchema.parse({
    page: searchParams.get('page') ?? undefined,
    pageSize: searchParams.get('pageSize') ?? undefined,
    search: searchParams.get('search') ?? undefined,
  })
}

function buildSearchFilter(search?: string) {
  if (!search) {
    return undefined
  }

  const sanitized = search.trim().replace(/%/g, '')
  if (!sanitized) {
    return undefined
  }

  return `name.ilike.%${sanitized}%,email.ilike.%${sanitized}%,contact_person.ilike.%${sanitized}%`
}

export async function GET(request: NextRequest) {
  return adminApiHandler(request, async (supabase, user, req) => {
    const adminUser = user as AdminContextUser
    const { page, pageSize, search } = parsePagination(req)

    let query = supabase
      .from('inquest_organizations')
      .select('id, name, email, phone, contact_person, address, billing_address, vat_number, created_at, updated_at', {
        count: 'exact',
      })

    if (!isSuperAdmin(adminUser) && adminUser.profile?.company_id) {
      query = query.eq('id', adminUser.profile.company_id)
    }

    const searchFilter = buildSearchFilter(search)
    if (searchFilter) {
      query = query.or(searchFilter)
    }

    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    const { data, error, count } = await query.order('created_at', { ascending: false }).range(from, to)

    if (error) {
      logger.error('Failed to load organizations', { error, page, pageSize })
      return NextResponse.json({ error: 'Unable to fetch organizations' }, { status: 500 })
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
    try {
      assertSuperAdmin(adminUser)
    } catch (error) {
      return NextResponse.json({ error: (error as Error).message }, { status: 403 })
    }

    const body = await req.json().catch(() => null)
    const parsed = createOrganizationSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    let serviceClient
    try {
      serviceClient = getServiceSupabaseClient()
    } catch (error) {
      logger.error('Service client configuration error when creating organization', error)
      return NextResponse.json({ error: 'Service configuration error' }, { status: 500 })
    }

    const payload = {
      name: parsed.data.name,
      email: parsed.data.email ?? null,
      phone: parsed.data.phone ?? null,
      contact_person: parsed.data.contactPerson ?? null,
      address: parsed.data.address ?? null,
      billing_address: parsed.data.billingAddress ?? null,
      vat_number: parsed.data.vatNumber ?? null,
      notes: parsed.data.notes ?? null,
    }

    const { data, error } = await serviceClient
      .from('inquest_organizations')
      .insert(payload)
      .select()
      .single()

    if (error || !data) {
      logger.error('Failed to create organization', { error })
      return NextResponse.json({ error: 'Unable to create organization' }, { status: 500 })
    }

    await logAdminAction({
      adminId: adminUser.id,
      actionType: 'admin.organizations.create',
      details: { organizationId: data.id },
      client: serviceClient,
    })

    await logAdminAuditEntry({
      adminId: adminUser.id,
      tableName: 'inquest_organizations',
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

    const body = await req.json().catch(() => null)
    const parsed = updateOrganizationSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    if (!isSuperAdmin(adminUser) && adminUser.profile?.company_id !== parsed.data.id) {
      return NextResponse.json({ error: 'You do not have access to this organization' }, { status: 403 })
    }

    let serviceClient
    try {
      serviceClient = getServiceSupabaseClient()
    } catch (error) {
      logger.error('Service client configuration error when updating organization', error)
      return NextResponse.json({ error: 'Service configuration error' }, { status: 500 })
    }

    const { id, ...changes } = parsed.data
    if (Object.keys(changes).length === 0) {
      return NextResponse.json({ error: 'No updates provided' }, { status: 400 })
    }

    const payload: Record<string, unknown> = {}
    if (changes.name !== undefined) payload.name = changes.name
    if (changes.email !== undefined) payload.email = changes.email ?? null
    if (changes.phone !== undefined) payload.phone = changes.phone ?? null
    if (changes.contactPerson !== undefined) payload.contact_person = changes.contactPerson ?? null
    if (changes.address !== undefined) payload.address = changes.address ?? null
    if (changes.billingAddress !== undefined) payload.billing_address = changes.billingAddress ?? null
    if (changes.vatNumber !== undefined) payload.vat_number = changes.vatNumber ?? null
    if (changes.notes !== undefined) payload.notes = changes.notes ?? null

    if (Object.keys(payload).length === 0) {
      return NextResponse.json({ error: 'No valid changes provided' }, { status: 400 })
    }

    const { error } = await serviceClient
      .from('inquest_organizations')
      .update(payload)
      .eq('id', id)

    if (error) {
      logger.error('Failed to update organization', { error, id })
      return NextResponse.json({ error: 'Unable to update organization' }, { status: 500 })
    }

    await logAdminAction({
      adminId: adminUser.id,
      actionType: 'admin.organizations.update',
      details: { organizationId: id, changes: payload },
      client: serviceClient,
    })

    await logAdminAuditEntry({
      adminId: adminUser.id,
      tableName: 'inquest_organizations',
      recordId: id,
      actionType: 'update',
      changes: payload,
      client: serviceClient,
    })

    return NextResponse.json({ data: { id, ...payload } })
  })
}
