import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth, requireOrganizationAccess } from '@/lib/middleware/auth'
import { adminRoleArraySchema, adminRoleSchema, AdminRole, ROLE_PERMISSIONS } from '@/lib/security/roles'
import { recordAdminAudit } from '@/lib/admin/audit'
import { z } from 'zod'

const defaultInviteRoles: AdminRole[] = ['support_agent']

const manageUsersSchema = z.object({
  organizationId: z.string().uuid(),
  operations: z
    .array(
      z.discriminatedUnion('type', [
        z.object({
          type: z.literal('assign_roles'),
          userId: z.string().uuid(),
          roles: adminRoleArraySchema,
        }),
        z.object({
          type: z.literal('remove_member'),
          userId: z.string().uuid(),
        }),
        z.object({
          type: z.literal('invite_member'),
          email: z.string().email(),
          roles: adminRoleArraySchema.default(defaultInviteRoles),
        }),
        z.object({
          type: z.literal('delegate_admin'),
          userId: z.string().uuid(),
        }),
      ])
    )
    .min(1, 'At least one operation is required'),
})

async function getOrCreateOrganizationRole(
  serviceClient: any,
  organizationId: string,
  role: AdminRole
): Promise<string> {
  const { data: existingRole, error: existingError } = await serviceClient
    .from('roles' as any)
    .select('id')
    .eq('company_id', organizationId)
    .eq('name', role)
    .maybeSingle()

  if (existingError && existingError.code !== 'PGRST116') {
    throw existingError
  }

  if (existingRole?.id) {
    return existingRole.id
  }

  const { data, error } = await serviceClient
    .from('roles' as any)
    .insert({
      company_id: organizationId,
      name: role,
      description: `${role.replace('_', ' ')} role`,
      permissions: ROLE_PERMISSIONS[role] ?? [],
      is_system_role: false,
    })
    .select('id')
    .single()

  if (error) {
    throw error
  }

  return data.id
}

async function ensureMembership(serviceClient: any, organizationId: string, userId: string) {
  const { error } = await serviceClient
    .from('company_members' as any)
    .upsert(
      {
        company_id: organizationId,
        user_id: userId,
        is_active: true,
      },
      { onConflict: 'company_id,user_id' }
    )

  if (error) {
    throw error
  }
}

export async function GET(request: NextRequest) {
  return withAdminAuth(request, 'organization_admin', async (context) => {
    const url = new URL(request.url)
    const organizationIdParam = url.searchParams.get('organizationId')
    const resolvedOrg = await requireOrganizationAccess(context, organizationIdParam)
    if (resolvedOrg instanceof NextResponse) {
      return resolvedOrg
    }

    const includeInactive = url.searchParams.get('includeInactive') === 'true'

    const { data: members, error } = await context.serviceClient
      .from('company_members' as any)
      .select('id, company_id, user_id, is_owner, is_active, joined_at, last_active_at, custom_permissions')
      .eq('company_id', resolvedOrg)
      .order('joined_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: 'Failed to load organization members' }, { status: 500 })
    }

    const filteredMembers = (members ?? []).filter((member: any) => includeInactive || member.is_active !== false)
    const userIds = filteredMembers.map((member: any) => member.user_id)

    let profiles: any[] = []
    if (userIds.length > 0) {
      const { data: profileRows, error: profileError } = await context.serviceClient
        .from('profiles' as any)
        .select('id, full_name, email, avatar_url, phone')
        .in('id', userIds)

      if (profileError) {
        return NextResponse.json({ error: 'Failed to load user profiles' }, { status: 500 })
      }

      profiles = profileRows ?? []
    }

    let roleAssignments: Record<string, AdminRole[]> = {}
    if (userIds.length > 0) {
      const { data: roles, error: rolesError } = await context.serviceClient
        .from('user_roles' as any)
        .select('user_id, roles:roles(name)')
        .eq('company_id', resolvedOrg)
        .in('user_id', userIds)

      if (rolesError) {
        return NextResponse.json({ error: 'Failed to load user roles' }, { status: 500 })
      }

      roleAssignments = (roles ?? []).reduce((acc: Record<string, AdminRole[]>, entry: any) => {
        const roleName = entry?.roles?.name
        if (!roleName) {
          return acc
        }
        try {
          const normalizedRole = adminRoleSchema.parse(roleName)
          const list = acc[entry.user_id] ?? []
          list.push(normalizedRole)
          acc[entry.user_id] = list
        } catch (err) {
          // ignore unsupported roles
        }
        return acc
      }, {})
    }

    const membersWithProfile = filteredMembers.map((member: any) => ({
      ...member,
      profile: profiles.find((profile) => profile.id === member.user_id) ?? null,
      roles: roleAssignments[member.user_id] ?? [],
    }))

    return NextResponse.json({
      organizationId: resolvedOrg,
      members: membersWithProfile,
      total: membersWithProfile.length,
    })
  })
}

export async function POST(request: NextRequest) {
  return withAdminAuth(request, 'organization_admin', async (context) => {
    const body = await request.json()
    const parsed = manageUsersSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.message }, { status: 400 })
    }

    const resolvedOrg = await requireOrganizationAccess(context, parsed.data.organizationId)
    if (resolvedOrg instanceof NextResponse) {
      return resolvedOrg
    }

    const results: Array<{ type: string; status: 'success' | 'error'; detail?: string }> = []

    for (const operation of parsed.data.operations) {
      try {
        if (operation.type === 'assign_roles') {
          await ensureMembership(context.serviceClient, resolvedOrg, operation.userId)

          const roleIds = await Promise.all(
            operation.roles.map((role) => getOrCreateOrganizationRole(context.serviceClient, resolvedOrg, role))
          )

          const payload = roleIds.map((roleId) => ({
            user_id: operation.userId,
            company_id: resolvedOrg,
            role_id: roleId,
            assigned_by: context.user.id,
          }))

          const { error } = await (context.serviceClient as any)
            .from('user_roles')
            .upsert(payload, { onConflict: 'user_id,role_id,company_id' })

          if (error) {
            throw error
          }

          await recordAdminAudit(context.serviceClient, {
            organizationId: resolvedOrg,
            actorId: context.user.id,
            action: 'assign_roles',
            resourceType: 'user_roles',
            resourceId: operation.userId,
            changes: { roles: operation.roles },
          })

          results.push({ type: operation.type, status: 'success' })
        } else if (operation.type === 'remove_member') {
          const { error: updateError } = await (context.serviceClient as any)
            .from('company_members')
            .update({ is_active: false })
            .eq('company_id', resolvedOrg)
            .eq('user_id', operation.userId)

          if (updateError) {
            throw updateError
          }

          await context.serviceClient
            .from('user_roles' as any)
            .delete()
            .eq('company_id', resolvedOrg)
            .eq('user_id', operation.userId)

          await recordAdminAudit(context.serviceClient, {
            organizationId: resolvedOrg,
            actorId: context.user.id,
            action: 'remove_member',
            resourceType: 'company_members',
            resourceId: operation.userId,
            changes: { is_active: false },
          })

          results.push({ type: operation.type, status: 'success' })
        } else if (operation.type === 'delegate_admin') {
          await ensureMembership(context.serviceClient, resolvedOrg, operation.userId)
          const adminRoleId = await getOrCreateOrganizationRole(context.serviceClient, resolvedOrg, 'organization_admin')

          const { error: delegateError } = await (context.serviceClient as any)
            .from('user_roles')
            .upsert(
              {
                user_id: operation.userId,
                company_id: resolvedOrg,
                role_id: adminRoleId,
                assigned_by: context.user.id,
              },
              { onConflict: 'user_id,role_id,company_id' }
            )

          if (delegateError) {
            throw delegateError
          }

          await recordAdminAudit(context.serviceClient, {
            organizationId: resolvedOrg,
            actorId: context.user.id,
            action: 'delegate_admin',
            resourceType: 'user_roles',
            resourceId: operation.userId,
            changes: { role: 'organization_admin' },
          })

          results.push({ type: operation.type, status: 'success' })
        } else if (operation.type === 'invite_member') {
          const invitation = await context.serviceClient.auth.admin.inviteUserByEmail(operation.email, {
            data: {
              invited_by: context.user.id,
              company_id: resolvedOrg,
            },
          })

          if (invitation.error) {
            throw invitation.error
          }

          if (operation.roles.length > 0 && invitation.data?.user?.id) {
            const newUserId = invitation.data.user.id
            await ensureMembership(context.serviceClient, resolvedOrg, newUserId)

            const roleIds = await Promise.all(
              operation.roles.map((role) => getOrCreateOrganizationRole(context.serviceClient, resolvedOrg, role))
            )

            const payload = roleIds.map((roleId) => ({
              user_id: newUserId,
              company_id: resolvedOrg,
              role_id: roleId,
              assigned_by: context.user.id,
            }))

            await (context.serviceClient as any).from('user_roles').upsert(payload, {
              onConflict: 'user_id,role_id,company_id',
            })
          }

          await recordAdminAudit(context.serviceClient, {
            organizationId: resolvedOrg,
            actorId: context.user.id,
            action: 'invite_member',
            resourceType: 'company_members',
            resourceId: invitation.data?.user?.id ?? operation.email,
            changes: { roles: operation.roles, email: operation.email },
          })

          results.push({ type: operation.type, status: 'success' })
        }
      } catch (error: any) {
        results.push({
          type: operation.type,
          status: 'error',
          detail: error?.message ?? 'Unknown error',
        })
      }
    }

    return NextResponse.json({
      organizationId: resolvedOrg,
      results,
    })
  })
}
