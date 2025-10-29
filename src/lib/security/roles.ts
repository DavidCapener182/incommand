import type { SupabaseClient, User } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'
import { getServiceSupabaseClient } from '../supabaseServer'

const PLATFORM_SUPERADMIN_EMAILS = new Set(['david@incommand.uk'])
const PLATFORM_SUPERADMIN_DEFAULT_COMPANY = 'InCommand Platform'

export function normalizeEmail(email?: string | null): string | null {
  return email ? email.trim().toLowerCase() : null
}

export function isPlatformSuperadmin(user: { email?: string | null } | null | undefined): boolean {
  const normalized = normalizeEmail(user?.email)
  return !!normalized && PLATFORM_SUPERADMIN_EMAILS.has(normalized)
}

export function resolveEffectiveRole(
  role: string | null | undefined,
  user: { email?: string | null } | null | undefined
): string | null | undefined {
  if (isPlatformSuperadmin(user)) {
    return 'superadmin'
  }
  return role
}

export async function ensurePlatformSuperadminProfile(
  user: Pick<User, 'id' | 'email' | 'user_metadata'>,
  options: {
    supabase?: SupabaseClient<Database>
  } = {}
): Promise<'superadmin' | null> {
  if (!isPlatformSuperadmin(user)) {
    return null
  }

  const normalizedEmail = normalizeEmail(user.email)
  if (!normalizedEmail) {
    return null
  }

  const serviceClient = options.supabase ?? getServiceSupabaseClient()

  const { data: profile, error } = await serviceClient
    .from('profiles')
    .select('id, role, full_name, company, company_id, display_name')
    .eq('id', user.id)
    .maybeSingle()

  if (error) {
    console.error('Platform superadmin role sync failed while fetching profile:', error)
    return 'superadmin'
  }

  const userMetadata = (user.user_metadata ?? {}) as Record<string, unknown>
  const metadataFullName =
    typeof userMetadata.full_name === 'string' && userMetadata.full_name.trim().length > 0
      ? userMetadata.full_name.trim()
      : null
  const metadataCompany =
    typeof userMetadata.company === 'string' && userMetadata.company.trim().length > 0
      ? userMetadata.company.trim()
      : null

  if (!profile) {
    const payload: Database['public']['Tables']['profiles']['Insert'] = {
      id: user.id,
      email: normalizedEmail,
      role: 'superadmin',
      full_name: metadataFullName ?? null,
      company: metadataCompany ?? PLATFORM_SUPERADMIN_DEFAULT_COMPANY,
      company_id: null,
      display_name: metadataFullName ?? null,
    }

    const { error: insertError } = await serviceClient.from('profiles').upsert(payload)
    if (insertError) {
      console.error('Platform superadmin profile upsert failed:', insertError)
    }
    return 'superadmin'
  }

  if (profile.role !== 'superadmin') {
    const { error: updateError } = await serviceClient
      .from('profiles')
      .update({ role: 'superadmin' })
      .eq('id', user.id)

    if (updateError) {
      console.error('Platform superadmin role update failed:', updateError)
    }
  }

  return 'superadmin'
}

export function logPlatformSuperadminRecognition(user: { email?: string | null } | null | undefined, context: string) {
  if (isPlatformSuperadmin(user)) {
    console.log(`[${context}] Platform Superadmin recognized for ${normalizeEmail(user?.email)}`)
  }
}
