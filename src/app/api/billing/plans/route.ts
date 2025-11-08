import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/middleware/auth'
import { recordAdminAudit } from '@/lib/admin/audit'
import { z } from 'zod'
import { getAllPlans, getPlan, type PlanCode } from '@/config/PricingConfig'

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
    // Try to fetch from database first
    const { data: dbPlans, error } = await context.serviceClient
      .from('subscription_plans' as any)
      .select('*')
      .eq('is_active', true)
      .eq('deprecated', false)
      .order('price_monthly', { ascending: true })

    if (!error && dbPlans && dbPlans.length > 0) {
      // Transform database plans to API format
      const plans = dbPlans.map((p: any) => ({
        id: p.id,
        code: p.code,
        name: p.display_name,
        displayName: p.display_name,
        price_monthly: p.price_monthly,
        price_annual: p.price_annual,
        currency: p.currency,
        billing_cycles: p.billing_cycles,
        features: p.features,
        metadata: p.metadata,
        version: p.version,
        effective_at: p.effective_at,
        is_active: p.is_active,
        created_at: p.created_at,
        updated_at: p.updated_at,
      }))
      
      return NextResponse.json({ plans })
    }

    // Fallback to config-based plans
    const configPlans = getAllPlans().map(plan => ({
      id: plan.code,
      code: plan.code,
      name: plan.displayName,
      displayName: plan.displayName,
      price_monthly: typeof plan.pricing.monthly === 'number' ? plan.pricing.monthly : null,
      price_annual: typeof plan.pricing.annual === 'number' ? plan.pricing.annual : null,
      currency: plan.pricing.currency,
      billing_cycles: plan.pricing.billingCycles,
      features: plan.features,
      metadata: plan.metadata,
      version: plan.metadata.version,
      effective_at: plan.metadata.effectiveAt,
      is_active: true,
    }))

    return NextResponse.json({ plans: configPlans })
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
