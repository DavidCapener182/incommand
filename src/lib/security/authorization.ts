import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

export interface AdminProfile {
  id: string
  role: string | null
  company_id?: string | null
  company?: string | null
}

export interface AdminContextUser {
  id: string
  email?: string | null
  profile: AdminProfile
}

export type TypedSupabaseClient = SupabaseClient<Database>

export function isSuperAdmin(user: AdminContextUser): boolean {
  const role = user.profile?.role?.toLowerCase()
  return role === 'superadmin'
}

export function isPlatformAdmin(user: AdminContextUser): boolean {
  const role = user.profile?.role?.toLowerCase()
  return role === 'admin' || role === 'superadmin'
}

export function assertPlatformAdmin(user: AdminContextUser): void {
  if (!isPlatformAdmin(user)) {
    throw new Error('Admin privileges required for this operation')
  }
}

export function assertSuperAdmin(user: AdminContextUser): void {
  if (!isSuperAdmin(user)) {
    throw new Error('Superadmin privileges required for this operation')
  }
}

export function canManageOrganization(user: AdminContextUser, organizationId: string | null | undefined): boolean {
  if (!organizationId) {
    return true
  }

  if (isSuperAdmin(user)) {
    return true
  }

  return user.profile?.company_id === organizationId
}

export function getOrganizationFilter(user: AdminContextUser): { column: string; value: string } | null {
  if (isSuperAdmin(user)) {
    return null
  }

  if (!user.profile?.company_id) {
    return null
  }

  return { column: 'company_id', value: user.profile.company_id }
}
