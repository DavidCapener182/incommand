import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { adminApiHandler } from '@/lib/apiSecurity'
import { getServiceSupabaseClient } from '@/lib/supabaseServer'
import { logger } from '@/lib/logger'
import {
  AdminContextUser,
  assertSuperAdmin,
  canManageOrganization,
  getOrganizationFilter,
  isSuperAdmin,
  logAdminAction,
  logAdminAuditEntry,
} from '@/lib/security'

const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
  role: z.string().optional(),
  companyId: z.string().uuid().optional(),
  search: z.string().optional(),
})

const createUserSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  email: z.string().email('Valid email is required'),
  role: z.string().min(1, 'Role is required'),
  companyId: z.string().uuid().optional(),
  company: z.string().optional(),
  phoneNumber: z.string().optional(),
  callsign: z.string().optional(),
})

const updateUserSchema = z.object({
  id: z.string().uuid(),
  fullName: z.string().min(1).optional(),
  role: z.string().optional(),
  companyId: z.string().uuid().nullable().optional(),
  company: z.string().optional(),
  phoneNumber: z.string().nullable().optional(),
  callsign: z.string().nullable().optional(),
  maxAssignments: z.number().int().min(0).nullable().optional(),
})

function parsePagination(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  return paginationSchema.parse({
    page: searchParams.get('page') ?? undefined,
    pageSize: searchParams.get('pageSize') ?? undefined,
    role: searchParams.get('role') ?? undefined,
    companyId: searchParams.get('companyId') ?? undefined,
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

  return `full_name.ilike.%${sanitized}%,email.ilike.%${sanitized}%,company.ilike.%${sanitized}%`
}

export async function GET(request: NextRequest) {
  return adminApiHandler(request, async (supabase, user, req) => {
    const adminUser = user as AdminContextUser
    const { page, pageSize, role, companyId, search } = parsePagination(req)

    let query = supabase
      .from('profiles')
      .select('id, full_name, email, role, company, company_id, created_at, phone_number, callsign, is_staff, max_assignments', {
        count: 'exact',
      })

    if (role) {
      query = query.eq('role', role)
    }

    const orgFilter = companyId ? { column: 'company_id', value: companyId } : getOrganizationFilter(adminUser)
    if (orgFilter) {
      query = query.eq(orgFilter.column, orgFilter.value)
    }

    const searchFilter = buildSearchFilter(search)
    if (searchFilter) {
      query = query.or(searchFilter)
    }

    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    const { data, error, count } = await query.order('created_at', { ascending: false }).range(from, to)

    if (error) {
      logger.error('Failed to fetch admin users', { error, page, pageSize })
      return NextResponse.json({ error: 'Unable to fetch users' }, { status: 500 })
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
    const body = await req.json().catch(() => null)

    const parsed = createUserSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const payload = parsed.data
    if (!isSuperAdmin(adminUser)) {
      const targetOrg = payload.companyId ?? adminUser.profile?.company_id ?? null
      if (!canManageOrganization(adminUser, targetOrg)) {
        return NextResponse.json({ error: 'You do not have access to this organization' }, { status: 403 })
      }
    }

    let serviceClient
    try {
      serviceClient = getServiceSupabaseClient()
    } catch (error) {
      logger.error('Service client configuration error when creating user', error)
      return NextResponse.json({ error: 'Service configuration error' }, { status: 500 })
    }

    const companyName = payload.company ?? adminUser.profile?.company ?? 'Unassigned'
    const profileInsert = {
      full_name: payload.fullName,
      email: payload.email,
      role: payload.role,
      company: companyName,
      company_id: payload.companyId ?? adminUser.profile?.company_id ?? null,
      phone_number: payload.phoneNumber ?? null,
      callsign: payload.callsign ?? null,
      is_staff: true,
    }

    const { data: createdUser, error: createError } = await serviceClient.auth.admin.createUser({
      email: payload.email,
      email_confirm: true,
      user_metadata: {
        full_name: payload.fullName,
        role: payload.role,
        company: companyName,
        company_id: profileInsert.company_id,
        phone_number: payload.phoneNumber ?? null,
        callsign: payload.callsign ?? null,
      },
    })

    if (createError || !createdUser?.user) {
      logger.error('Failed to create Supabase auth user', { error: createError })
      return NextResponse.json({ error: 'Unable to create user' }, { status: 500 })
    }

    const profilePayload = {
      id: createdUser.user.id,
      ...profileInsert,
    }

    const { error: profileError } = await serviceClient.from('profiles').upsert(profilePayload, { onConflict: 'id' })

    if (profileError) {
      logger.error('Failed to create profile for new user', { error: profileError })
      await serviceClient.auth.admin.deleteUser(createdUser.user.id)
      return NextResponse.json({ error: 'Unable to create user profile' }, { status: 500 })
    }

    await logAdminAction({
      adminId: adminUser.id,
      actionType: 'admin.users.create',
      details: {
        targetUserId: createdUser.user.id,
        role: payload.role,
        companyId: profilePayload.company_id,
      },
      client: serviceClient,
    })

    await logAdminAuditEntry({
      adminId: adminUser.id,
      tableName: 'profiles',
      recordId: createdUser.user.id,
      actionType: 'create',
      changes: profilePayload,
      client: serviceClient,
    })

    return NextResponse.json({
      data: {
        id: createdUser.user.id,
        ...profileInsert,
      },
    })
  })
}

export async function PATCH(request: NextRequest) {
  return adminApiHandler(request, async (_supabase, user, req) => {
    const adminUser = user as AdminContextUser
    const body = await req.json().catch(() => null)
    const parsed = updateUserSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    let serviceClient
    try {
      serviceClient = getServiceSupabaseClient()
    } catch (error) {
      logger.error('Service client configuration error when updating user', error)
      return NextResponse.json({ error: 'Service configuration error' }, { status: 500 })
    }

    const { id, ...updates } = parsed.data

    const { data: existing, error: fetchError } = await serviceClient
      .from('profiles')
      .select('id, company_id')
      .eq('id', id)
      .maybeSingle()

    if (fetchError) {
      logger.error('Failed to fetch profile for update', { error: fetchError, id })
      return NextResponse.json({ error: 'Unable to load user' }, { status: 500 })
    }

    if (!existing) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (!canManageOrganization(adminUser, updates.companyId ?? existing.company_id)) {
      return NextResponse.json({ error: 'You do not have access to this organization' }, { status: 403 })
    }

    const profileUpdates: Record<string, unknown> = {}
    if (typeof updates.fullName === 'string') {
      profileUpdates.full_name = updates.fullName
      profileUpdates.display_name = updates.fullName
    }
    if (updates.companyId !== undefined) {
      profileUpdates.company_id = updates.companyId
    }
    if (updates.company) {
      profileUpdates.company = updates.company
    }
    if (updates.phoneNumber !== undefined) {
      profileUpdates.phone_number = updates.phoneNumber
    }
    if (updates.callsign !== undefined) {
      profileUpdates.callsign = updates.callsign
    }
    if (updates.maxAssignments !== undefined) {
      profileUpdates.max_assignments = updates.maxAssignments
    }
    if (updates.role) {
      profileUpdates.role = updates.role
    }

    if (Object.keys(profileUpdates).length === 0) {
      return NextResponse.json({ error: 'No updates provided' }, { status: 400 })
    }

    const { error: updateError } = await serviceClient.from('profiles').update(profileUpdates).eq('id', id)
    if (updateError) {
      logger.error('Failed to update profile', { error: updateError, id })
      return NextResponse.json({ error: 'Unable to update user' }, { status: 500 })
    }

    if (updates.role) {
      await serviceClient.auth.admin.updateUserById(id, {
        user_metadata: {
          role: updates.role,
        },
      })
    }

    await logAdminAction({
      adminId: adminUser.id,
      actionType: 'admin.users.update',
      details: { targetUserId: id, updates: profileUpdates },
      client: serviceClient,
    })

    await logAdminAuditEntry({
      adminId: adminUser.id,
      tableName: 'profiles',
      recordId: id,
      actionType: 'update',
      changes: profileUpdates,
      client: serviceClient,
    })

    return NextResponse.json({ data: { id, ...profileUpdates } })
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

    const targetId = req.nextUrl.searchParams.get('id') || (await req.json().catch(() => ({} as any))).id
    if (!targetId) {
      return NextResponse.json({ error: 'User id is required' }, { status: 400 })
    }

    let serviceClient
    try {
      serviceClient = getServiceSupabaseClient()
    } catch (error) {
      logger.error('Service client configuration error when deleting user', error)
      return NextResponse.json({ error: 'Service configuration error' }, { status: 500 })
    }

    const { error: deleteProfileError } = await serviceClient.from('profiles').delete().eq('id', targetId)
    if (deleteProfileError) {
      logger.error('Failed to delete profile', { error: deleteProfileError, targetId })
      return NextResponse.json({ error: 'Unable to delete user profile' }, { status: 500 })
    }

    await serviceClient.auth.admin.deleteUser(targetId)

    await logAdminAction({
      adminId: adminUser.id,
      actionType: 'admin.users.delete',
      details: { targetUserId: targetId },
      client: serviceClient,
    })

    await logAdminAuditEntry({
      adminId: adminUser.id,
      tableName: 'profiles',
      recordId: targetId,
      actionType: 'delete',
      client: serviceClient,
    })

    return NextResponse.json({ success: true })
  })
}
