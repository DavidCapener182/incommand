export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/middleware/auth'
import { recordAdminAudit } from '@/lib/admin/audit'
import { z } from 'zod'

const updatePlanSchema = z.object({
  name: z.string().min(2).optional(),
  priceMonthly: z.number().nonnegative().optional(),
  priceAnnual: z.number().nonnegative().optional(),
  currency: z.string().length(3).optional(),
  metadata: z.record(z.any()).optional(),
  isActive: z.boolean().optional(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: { planId: string } }
) {
  return withAdminAuth(request, 'billing_manager', async (context) => {
    const body = await request.json()
    const parsed = updatePlanSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.message }, { status: 400 })
    }

    if (Object.keys(parsed.data).length === 0) {
      return NextResponse.json({ error: 'No updates provided' }, { status: 400 })
    }

    const payload: Record<string, unknown> = {}
    if (parsed.data.name) payload.name = parsed.data.name
    if (parsed.data.priceMonthly !== undefined) payload.price_monthly = parsed.data.priceMonthly
    if (parsed.data.priceAnnual !== undefined) payload.price_annual = parsed.data.priceAnnual
    if (parsed.data.currency) payload.currency = parsed.data.currency.toUpperCase()
    if (parsed.data.metadata) payload.metadata = parsed.data.metadata
    if (parsed.data.isActive !== undefined) payload.is_active = parsed.data.isActive

    const { data, error } = await context.serviceClient
      .from('plans' as any)
      .update(payload)
      .eq('id', params.planId)
      .select('*')
      .single()

    if (error) {
      return NextResponse.json({ error: 'Failed to update plan' }, { status: 500 })
    }

    await recordAdminAudit(context.serviceClient, {
      organizationId: context.defaultOrganizationId ?? '00000000-0000-0000-0000-000000000000',
      actorId: context.user.id,
      action: 'update_plan',
      resourceType: 'plans',
      resourceId: params.planId,
      changes: payload,
    })

    return NextResponse.json({ plan: data })
  })
}
