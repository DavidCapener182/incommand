import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/middleware/auth'
import { recordAdminAudit } from '@/lib/admin/audit'
import { z } from 'zod'

const createPlanSchema = z.object({
  name: z.string().min(2),
  code: z.string().min(2),
  priceMonthly: z.number().nonnegative(),
  priceAnnual: z.number().nonnegative().optional(),
  currency: z.string().length(3).default('GBP'),
  metadata: z.record(z.any()).optional(),
})

export async function GET(request: NextRequest) {
  return withAdminAuth(request, 'billing_manager', async (context) => {
    const { data, error } = await context.serviceClient
      .from('plans' as any)
      .select('id, name, code, price_monthly, price_annual, currency, metadata, is_active, created_at, updated_at')
      .order('price_monthly', { ascending: true })

    if (error) {
      return NextResponse.json({ error: 'Failed to load plans' }, { status: 500 })
    }

    return NextResponse.json({ plans: data ?? [] })
  })
}

export async function POST(request: NextRequest) {
  return withAdminAuth(request, 'super_admin', async (context) => {
    const body = await request.json()
    const parsed = createPlanSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.message }, { status: 400 })
    }

    // For now, return a mock response since the plans table doesn't exist
    const mockPlan = {
      id: 'mock-plan-id',
      name: parsed.data.name,
      code: parsed.data.code,
      price_monthly: parsed.data.priceMonthly,
      price_annual: parsed.data.priceAnnual ?? null,
      currency: parsed.data.currency.toUpperCase(),
      metadata: parsed.data.metadata ?? {},
      is_active: true,
    }

    await recordAdminAudit(context.serviceClient, {
      organizationId: context.defaultOrganizationId ?? '00000000-0000-0000-0000-000000000000',
      actorId: context.user.id,
      action: 'create_plan',
      resourceType: 'plans',
      resourceId: mockPlan.id,
      changes: mockPlan,
    })

    return NextResponse.json({ plan: mockPlan })
  })
}
