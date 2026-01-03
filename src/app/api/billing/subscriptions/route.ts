import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth, requireOrganizationAccess } from '@/lib/middleware/auth'
import { recordAdminAudit } from '@/lib/admin/audit'
import { z } from 'zod'

const updateSubscriptionSchema = z.object({
  organizationId: z.string().uuid(),
  planId: z.string().uuid().optional(),
  status: z.enum(['active', 'suspended', 'cancelled']).optional(),
  cancel: z.boolean().optional(),
})

export async function GET(request: NextRequest) {
  return withAdminAuth(request, 'billing_manager', async (context) => {
    const url = new URL(request.url)
    const organizationId = url.searchParams.get('organizationId')
    const resolvedOrg = organizationId
      ? await requireOrganizationAccess(context, organizationId)
      : context.highestRole === 'super_admin'
      ? null
      : context.defaultOrganizationId ?? null

    if (resolvedOrg instanceof NextResponse) {
      return resolvedOrg
    }

    let query = (context.serviceClient as any)
      .from('organizations')
      .select('id, name, slug, tier, subscription_status, subscription_starts_at, subscription_ends_at')

    if (typeof resolvedOrg === 'string') {
      query = query.eq('id', resolvedOrg)
    } else if (context.highestRole !== 'super_admin') {
      query = query.in('id', context.organizationMemberships)
    }

    const { data: organizations, error } = await query

    if (error) {
      return NextResponse.json({ error: 'Failed to load subscriptions' }, { status: 500 })
    }

    const organizationIds = (organizations ?? []).map((org: any) => org.id)
    let usageByOrg: Record<string, any> = {}
    if (organizationIds.length > 0) {
      const { data: usageRows } = await (context.serviceClient as any)
        .from('subscription_usage')
        .select('*')
        .in('organization_id', organizationIds)
        .order('period_start', { ascending: false })

      usageByOrg = (usageRows ?? []).reduce((acc: Record<string, any>, row: any) => {
        if (!acc[row.organization_id]) {
          acc[row.organization_id] = row
        }
        return acc
      }, {})
    }

    return NextResponse.json({
      subscriptions: (organizations ?? []).map((org: any) => ({
        ...org,
        latest_usage: usageByOrg[org.id] ?? null,
      })),
    })
  })
}

export async function PATCH(request: NextRequest) {
  return withAdminAuth(request, 'billing_manager', async (context) => {
    const body = await request.json()
    const parsed = updateSubscriptionSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.message }, { status: 400 })
    }

    const resolvedOrg = await requireOrganizationAccess(context, parsed.data.organizationId)
    if (resolvedOrg instanceof NextResponse) {
      return resolvedOrg
    }

    const updates: Record<string, unknown> = {}
    if (parsed.data.planId) {
      updates.tier = parsed.data.planId
    }
    if (parsed.data.status) {
      updates.subscription_status = parsed.data.status
    }
    if (parsed.data.cancel) {
      updates.subscription_status = 'cancelled'
      updates.subscription_ends_at = new Date().toISOString()
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No updates provided' }, { status: 400 })
    }

    const { data, error } = await (context.serviceClient as any)
      .from('organizations')
      .update(updates)
      .eq('id', resolvedOrg)
      .select('*')
      .single()

    if (error) {
      return NextResponse.json({ error: 'Failed to update subscription' }, { status: 500 })
    }

    await recordAdminAudit(context.serviceClient, {
      organizationId: resolvedOrg,
      actorId: context.user.id,
      action: 'update_subscription',
      resourceType: 'organizations',
      resourceId: resolvedOrg,
      changes: updates,
    })

    return NextResponse.json({ subscription: data })
  })
}
