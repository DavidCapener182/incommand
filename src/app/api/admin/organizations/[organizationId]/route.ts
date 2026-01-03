import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth, requireOrganizationAccess } from '@/lib/middleware/auth'
import { recordAdminAudit } from '@/lib/admin/audit'
import { z } from 'zod'

const updateOrganizationSchema = z.object({
  name: z.string().min(2).optional(),
  slug: z.string().min(2).optional(),
  tier: z.enum(['free', 'professional', 'enterprise']).optional(),
  subscriptionStatus: z.enum(['active', 'suspended', 'cancelled']).optional(),
  isActive: z.boolean().optional(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: { organizationId: string } }
) {
  return withAdminAuth(request, 'organization_admin', async (context) => {
    const organizationId = await requireOrganizationAccess(context, params.organizationId)
    if (organizationId instanceof NextResponse) {
      return organizationId
    }

    const body = await request.json()
    const parsed = updateOrganizationSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.message }, { status: 400 })
    }

    if (Object.keys(parsed.data).length === 0) {
      return NextResponse.json({ error: 'No updates provided' }, { status: 400 })
    }

    const payload: Record<string, unknown> = {}
    if (parsed.data.name) payload.name = parsed.data.name
    if (parsed.data.slug) payload.slug = parsed.data.slug
    if (parsed.data.tier) payload.tier = parsed.data.tier
    if (parsed.data.subscriptionStatus) payload.subscription_status = parsed.data.subscriptionStatus
    if (parsed.data.isActive !== undefined) payload.is_active = parsed.data.isActive

    const { data, error } = await (context.serviceClient as any)
      .from('organizations')
      .update(payload)
      .eq('id', organizationId)
      .select('*')
      .single()

    if (error) {
      return NextResponse.json({ error: 'Failed to update organization' }, { status: 500 })
    }

    await recordAdminAudit(context.serviceClient, {
      organizationId,
      actorId: context.user.id,
      action: 'update_organization',
      resourceType: 'organizations',
      resourceId: organizationId,
      changes: payload,
    })

    return NextResponse.json({ organization: data })
  })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { organizationId: string } }
) {
  return withAdminAuth(request, 'super_admin', async (context) => {
    const organizationId = params.organizationId
    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 })
    }

    const { error } = await (context.serviceClient as any)
      .from('organizations')
      .update({ is_active: false, subscription_status: 'cancelled' })
      .eq('id', organizationId)

    if (error) {
      return NextResponse.json({ error: 'Failed to deactivate organization' }, { status: 500 })
    }

    await recordAdminAudit(context.serviceClient, {
      organizationId,
      actorId: context.user.id,
      action: 'deactivate_organization',
      resourceType: 'organizations',
      resourceId: organizationId,
      changes: { is_active: false },
    })

    return NextResponse.json({ success: true })
  })
}
