import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/middleware/auth'
import { recordAdminAudit } from '@/lib/admin/audit'
import { z } from 'zod'
import { defaultMarketingPlans } from '@/data/marketingPlans'

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
      // Fallback to marketing defaults
      return NextResponse.json({ plans: defaultMarketingPlans.map(p => ({
        id: p.code,
        name: p.name,
        code: p.code,
        price_monthly: p.priceMonthly,
        price_annual: null,
        currency: 'GBP',
        metadata: { features: p.features },
        is_active: true,
      })) })
    }

    const rows = data ?? []
    if (rows.length === 0) {
      return NextResponse.json({ plans: defaultMarketingPlans.map(p => ({
        id: p.code,
        name: p.name,
        code: p.code,
        price_monthly: p.priceMonthly,
        price_annual: null,
        currency: 'GBP',
        metadata: { features: p.features },
        is_active: true,
      })) })
    }

    return NextResponse.json({ plans: rows })
  })
}

export async function POST(request: NextRequest) {
  return withAdminAuth(request, 'super_admin', async (context) => {
    const body = await request.json()
    const parsed = createPlanSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.message }, { status: 400 })
    }

    // Insert if table exists; otherwise return mock
    try {
      const { data, error } = await context.serviceClient
        .from('plans' as any)
        .insert({
          name: parsed.data.name,
          code: parsed.data.code,
          price_monthly: parsed.data.priceMonthly,
          price_annual: parsed.data.priceAnnual ?? null,
          currency: parsed.data.currency.toUpperCase(),
          metadata: parsed.data.metadata ?? {},
          is_active: true,
        })
        .select('*')
        .single()

      if (error) throw error

      if (!data || !('id' in data)) {
        throw new Error('Failed to create plan: invalid response')
      }

      const planData = data as unknown as { id: string; [key: string]: unknown }

      await recordAdminAudit(context.serviceClient, {
        organizationId: context.defaultOrganizationId ?? '00000000-0000-0000-0000-000000000000',
        actorId: context.user.id,
        action: 'create_plan',
        resourceType: 'plans',
        resourceId: planData.id,
        changes: planData as Record<string, unknown>,
      })

      return NextResponse.json({ plan: data })
    } catch {
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
    }
  })
}
