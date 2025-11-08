// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { createRlsServerClient, getServiceSupabaseClient } from '@/lib/supabaseServer'
import type { SupabaseClient, Session, User } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'
import { ADMIN_ROLES, AdminRole, derivePermissions, getHighestRole, hasRequiredRole, normalizeRole } from '@/lib/security/roles'
import { logger } from '@/lib/logger'

export interface AdminContext {
  request: NextRequest
  supabase: SupabaseClient<Database>
  serviceClient: SupabaseClient<Database>
  session: Session
  user: User
  adminRoles: AdminRole[]
  highestRole: AdminRole | null
  permissions: string[]
  organizationMemberships: string[]
  defaultOrganizationId?: string
}

interface AdminContextError {
  response: NextResponse
}

type AdminContextResult = AdminContext | AdminContextError

function forbidden(message: string): AdminContextError {
  return { response: NextResponse.json({ error: message }, { status: 403 }) }
}

async function ensureSystemRoles(serviceClient: SupabaseClient<Database>) {
  const { data: existingRoles, error: existingRolesError } = await serviceClient
    .from('roles')
    .select('name')
    .is('organization_id', null)
    .in('name', ADMIN_ROLES as unknown as string[])

  if (existingRolesError) {
    logger.error('Failed to load system roles', existingRolesError)
    throw existingRolesError
  }

  const existingNames = new Set((existingRoles ?? []).map((role: { name: string }) => role.name))
  const missingRoles = (ADMIN_ROLES as readonly string[]).filter((role) => !existingNames.has(role))

  if (missingRoles.length === 0) {
    return
  }

  const inserts = missingRoles.map((role) => ({
    organization_id: null,
    name: role,
    description: `${role.replace('_', ' ')} system role`,
    permissions: [],
    is_system_role: true,
  }))

  const { error: insertError } = await serviceClient.from('roles' as any).insert(inserts)
  if (insertError) {
    logger.error('Failed to insert missing system roles', insertError)
    throw insertError
  }
}

async function loadAdminRoles(
  serviceClient: SupabaseClient<Database>,
  userId: string
): Promise<{ roles: AdminRole[]; memberships: string[] }> {
  await ensureSystemRoles(serviceClient)

  const { data: memberships, error: membershipsError } = await serviceClient
    .from('organization_members' as any)
    .select('organization_id, is_active')
    .eq('user_id', userId)

  if (membershipsError) {
    logger.error('Failed to load organization memberships', membershipsError)
    throw membershipsError
  }

  const activeMemberships = (memberships ?? []).filter((membership: any) => membership.is_active !== false)
  const organizationIds = activeMemberships.map((membership: any) => membership.organization_id).filter(Boolean)

  const { data: roleAssignments, error: roleAssignmentsError } = await serviceClient
    .from<Database['public']['Tables']['user_roles']['Row'], Database['public']['Tables']['user_roles']['Update']>('user_roles')
    .select('organization_id, role_id')
    .eq('user_id', userId)

  if (roleAssignmentsError) {
    logger.error('Failed to load admin role assignments', roleAssignmentsError)
    throw roleAssignmentsError
  }

  const resolvedRoles: AdminRole[] = []

  for (const assignment of roleAssignments ?? []) {
    if (!assignment.role_id) {
      continue
    }

    // Get the role name by querying the roles table
    const { data: role, error: roleError } = await serviceClient
      .from<any, any>('roles')
      .select('name')
      .eq('id', assignment.role_id)
      .single()

    if (roleError || !role) {
      logger.warn('Failed to load role details', { roleId: assignment.role_id, error: roleError })
      continue
    }

    const roleName = role.name

    try {
      resolvedRoles.push(normalizeRole(roleName))
    } catch (error) {
      logger.warn('Skipping unsupported role for admin context', { roleName, error })
    }
  }

  return { roles: resolvedRoles, memberships: organizationIds }
}

async function createAdminContext(request: NextRequest): Promise<AdminContextResult> {
  try {
    const supabase = createRlsServerClient(request.headers)
    const serviceClient = getServiceSupabaseClient()

    const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
    if (sessionError || !sessionData.session) {
      logger.warn('Admin auth: no active session', { error: sessionError, hasSession: !!sessionData.session })
      return { response: NextResponse.json({ error: 'Authentication required' }, { status: 401 }) }
    }

    const session = sessionData.session
    const user = session.user

    // Restrict back office access to specific email only (company admins use /settings)
    const allowedBackOfficeEmail = 'david@incommand.uk'
    if (user.email !== allowedBackOfficeEmail) {
      logger.warn('Back office access denied - unauthorized email', { 
        attemptedEmail: user.email, 
        allowedEmail: allowedBackOfficeEmail 
      })
      return { response: NextResponse.json({ error: 'Access denied. Back office access is restricted to system administrators.' }, { status: 403 }) }
    }

    const sessionRevoked = user.user_metadata?.session_revoked === true
    if (sessionRevoked) {
      return { response: NextResponse.json({ error: 'Session revoked. Please sign in again.' }, { status: 401 }) }
    }

    const mfaEnabled = Boolean(
      user.user_metadata?.mfa_enrolled ||
      user.user_metadata?.mfa_verified ||
      user.user_metadata?.mfa_enabled
    )

    if (!mfaEnabled) {
      return forbidden('Multi-factor authentication is required for admin access')
    }

    const { roles, memberships } = await loadAdminRoles(serviceClient, user.id)

    if (roles.length === 0) {
      return forbidden('Admin role required')
    }

    const defaultOrganizationId = memberships[0]

    return {
      request,
      supabase,
      serviceClient,
      session,
      user,
      adminRoles: roles,
      highestRole: getHighestRole(roles),
      permissions: derivePermissions(roles),
      organizationMemberships: memberships,
      defaultOrganizationId,
    }
  } catch (error) {
    logger.error('Failed to create admin context', error)
    return { response: NextResponse.json({ error: 'Failed to authenticate request' }, { status: 500 }) }
  }
}

export async function withAdminAuth(
  request: NextRequest,
  requiredRole: AdminRole,
  handler: (context: AdminContext) => Promise<NextResponse>
): Promise<NextResponse> {
  const contextResult = await createAdminContext(request)

  if ('response' in contextResult) {
    return contextResult.response
  }

  if (!hasRequiredRole(contextResult.adminRoles, requiredRole)) {
    return NextResponse.json({ error: 'Insufficient role for requested operation' }, { status: 403 })
  }

  return handler(contextResult)
}

export async function requireOrganizationAccess(
  context: AdminContext,
  organizationId?: string | null
): Promise<string | NextResponse> {
  if (!organizationId) {
    if (context.highestRole === 'super_admin') {
      throw new Error('Organization ID is required for this operation')
    }
    if (context.defaultOrganizationId) {
      return context.defaultOrganizationId
    }
    return NextResponse.json({ error: 'Organization context is required' }, { status: 400 })
  }

  if (context.highestRole === 'super_admin') {
    return organizationId
  }

  if (!context.organizationMemberships.includes(organizationId)) {
    return NextResponse.json({ error: 'Organization access denied' }, { status: 403 })
  }

  return organizationId
}
