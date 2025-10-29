import { z } from 'zod'

export const ADMIN_ROLES = [
  'super_admin',
  'organization_admin',
  'billing_manager',
  'content_editor',
  'support_agent',
] as const

export type AdminRole = (typeof ADMIN_ROLES)[number]

export const ROLE_HIERARCHY: Record<AdminRole, number> = {
  super_admin: 5,
  organization_admin: 4,
  billing_manager: 3,
  content_editor: 2,
  support_agent: 1,
}

export const ROLE_PERMISSIONS: Record<AdminRole, string[]> = {
  super_admin: [
    'organizations:manage',
    'users:manage',
    'billing:manage',
    'content:publish',
    'support:manage',
    'compliance:review',
    'dashboard:view',
    'metrics:view',
  ],
  organization_admin: [
    'organizations:update',
    'users:manage',
    'billing:view',
    'content:publish',
    'support:manage',
    'compliance:view',
    'dashboard:view',
  ],
  billing_manager: [
    'billing:view',
    'billing:manage',
    'dashboard:view',
    'metrics:view',
  ],
  content_editor: [
    'content:publish',
    'content:update',
    'dashboard:view',
  ],
  support_agent: [
    'support:view',
    'support:manage',
    'dashboard:view',
  ],
}

export const adminRoleSchema = z.enum(ADMIN_ROLES)

export const adminRoleArraySchema = z
  .array(adminRoleSchema)
  .min(1, 'At least one role is required')
  .refine((roles) => new Set(roles).size === roles.length, 'Duplicate roles are not allowed')

export function isRoleSufficient(role: AdminRole, required: AdminRole) {
  return ROLE_HIERARCHY[role] >= ROLE_HIERARCHY[required]
}

export function hasRequiredRole(roles: AdminRole[], required: AdminRole) {
  return roles.some((role) => isRoleSufficient(role, required))
}

export function normalizeRole(role: string): AdminRole {
  if ((ADMIN_ROLES as readonly string[]).includes(role)) {
    return role as AdminRole
  }
  throw new Error(`Unsupported admin role: ${role}`)
}

export function sortRolesDescending(roles: AdminRole[]) {
  return [...roles].sort((a, b) => ROLE_HIERARCHY[b] - ROLE_HIERARCHY[a])
}

export function getHighestRole(roles: AdminRole[]): AdminRole | null {
  if (roles.length === 0) {
    return null
  }
  return sortRolesDescending(roles)[0]
}

export function derivePermissions(roles: AdminRole[]): string[] {
  const permissions = new Set<string>()
  roles.forEach((role) => {
    ROLE_PERMISSIONS[role]?.forEach((permission) => permissions.add(permission))
  })
  return Array.from(permissions)
}
