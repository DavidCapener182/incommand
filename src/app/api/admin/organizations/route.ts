export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/middleware/auth'
import { recordAdminAudit } from '@/lib/admin/audit'
import { z } from 'zod'
import type { Database } from '@/types/supabase'

const createOrganizationSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2),
  parentId: z.string().uuid().nullable().optional(),
  tier: z.enum(['free', 'professional', 'enterprise']).default('free'),
  subscriptionStatus: z.enum(['active', 'suspended', 'cancelled']).default('active'),
  isActive: z.boolean().default(true),
})

export async function GET(request: NextRequest) {
  return withAdminAuth(request, 'support_agent', async (context) => {
    const url = new URL(request.url)
    const search = url.searchParams.get('search')
    const status = url.searchParams.get('status')

    let query = context.serviceClient
      .from('organizations' as any)
      .select('id, name, slug, tier, subscription_status, is_active, created_at, updated_at')
      .order('created_at', { ascending: false })

    if (context.highestRole !== 'super_admin') {
      query = query.in('id', context.organizationMemberships)
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,slug.ilike.%${search}%`)
    }

    if (status) {
      query = query.eq('subscription_status', status)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: 'Failed to load organizations' }, { status: 500 })
    }

    return NextResponse.json({
      organizations: data ?? [],
      total: data?.length ?? 0,
    })
  })
}

export async function POST(request: NextRequest) {
  return withAdminAuth(request, 'super_admin', async (context) => {
    const body = await request.json()
    const parsed = createOrganizationSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.message }, { status: 400 })
    }

    const { data, error } = await context.serviceClient
      .from('companies')
      .insert({
        name: parsed.data.name,
        slug: parsed.data.slug,
        parent_id: parsed.data.parentId ?? null,
        tier: parsed.data.tier,
        subscription_status: parsed.data.subscriptionStatus,
        is_active: parsed.data.isActive,
      })
      .select('*')
      .single()

    if (error) {
      return NextResponse.json({ error: 'Failed to create organization' }, { status: 500 })
    }

    await recordAdminAudit(context.serviceClient, {
      organizationId: data?.id || '',
      actorId: context.user.id,
      action: 'create_organization',
      resourceType: 'organizations',
      resourceId: data?.id || '',
      changes: data,
    })

    return NextResponse.json({ organization: data })
  })
}
