import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/middleware/auth'
import { recordAdminAudit } from '@/lib/admin/audit'
import { z } from 'zod'
import { getAllPlans, getPlan, type PlanCode } from '@/config/PricingConfig'
import { getServiceSupabaseClient } from '@/lib/supabaseServer'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'

const updatePlanSchema = z.object({
  code: z.enum(['starter', 'operational', 'command', 'enterprise']),
  priceMonthly: z.number().nonnegative().nullable().optional(),
  priceAnnual: z.number().nonnegative().nullable().optional(),
  currency: z.enum(['GBP', 'USD', 'EUR']).optional(),
  billingCycles: z.array(z.enum(['monthly', 'annual'])).optional(),
  features: z.record(z.any()).optional(),
  metadata: z.record(z.any()).optional(),
  isActive: z.boolean().optional(),
  deprecated: z.boolean().optional(),
})

/**
 * GET /api/admin/pricing
 * Get all pricing plans with versioning support
 * Falls back to config-based plans if database is unavailable
 * Uses simpler auth check for read operations
 */
export async function GET(request: NextRequest) {
  // Check authentication using simpler pattern (like content route)
  const supabase = createRouteHandlerClient({ cookies })
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    // Still return config plans even if not authenticated (for public pricing page)
    return getConfigPlans(null)
  }

  // Check if user has admin role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  const isAdmin = (profile as any)?.role === 'superadmin'

  // Try to fetch from database if admin, otherwise use config
  if (isAdmin) {
    try {
      const serviceClient = getServiceSupabaseClient()
      const url = new URL(request.url)
      const includeDeprecated = url.searchParams.get('includeDeprecated') === 'true'
      const code = url.searchParams.get('code') as PlanCode | null

      let query = serviceClient
        .from('subscription_plans' as any)
        .select('*')
        .order('price_monthly', { ascending: true })

      if (!includeDeprecated) {
        query = query.eq('deprecated', false)
      }

      if (code) {
        query = query.eq('code', code)
      }

      const { data: dbPlans, error } = await query

      if (!error && dbPlans && dbPlans.length > 0) {
        // Transform database plans
        const plans = dbPlans.map((p: any) => ({
          id: p.id,
          code: p.code,
          displayName: p.display_name,
          version: p.version,
          effectiveAt: p.effective_at,
          currency: p.currency,
          priceMonthly: p.price_monthly,
          priceAnnual: p.price_annual,
          billingCycles: p.billing_cycles,
          features: p.features,
          metadata: p.metadata,
          isActive: p.is_active,
          deprecated: p.deprecated,
          createdAt: p.created_at,
          updatedAt: p.updated_at,
        }))

        return NextResponse.json({ plans })
      }
    } catch (error) {
      console.warn('Failed to fetch plans from database, using config fallback:', error)
    }
  }

  // Fallback to config-based plans
  const url = new URL(request.url)
  const code = url.searchParams.get('code') as PlanCode | null
  return getConfigPlans(code)
}

/**
 * Helper function to return config-based plans
 */
function getConfigPlans(code: PlanCode | null) {
  let configPlans = getAllPlans()
  if (code) {
    const plan = getPlan(code)
    configPlans = plan ? [plan] : []
  }

  const plans = configPlans.map(plan => ({
    id: plan.code,
    code: plan.code,
    displayName: plan.displayName,
    version: plan.metadata.version,
    effectiveAt: plan.metadata.effectiveAt,
    currency: plan.pricing.currency,
    priceMonthly: typeof plan.pricing.monthly === 'number' ? plan.pricing.monthly : null,
    priceAnnual: typeof plan.pricing.annual === 'number' ? plan.pricing.annual : null,
    billingCycles: plan.pricing.billingCycles,
    features: plan.features,
    metadata: plan.metadata,
    isActive: true,
    deprecated: false,
  }))

  return NextResponse.json({ plans })
}

/**
 * PATCH /api/admin/pricing
 * Update pricing plan (creates new version if effective_at changes)
 */
export async function PATCH(request: NextRequest) {
  return withAdminAuth(request, 'super_admin', async (context) => {
    const body = await request.json()
    const parsed = updatePlanSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.message }, { status: 400 })
    }

    const { code, ...updates } = parsed.data

    // Build update payload
    const updatePayload: Record<string, unknown> = {}
    
    if (updates.priceMonthly !== undefined) {
      updatePayload.price_monthly = updates.priceMonthly
    }
    if (updates.priceAnnual !== undefined) {
      updatePayload.price_annual = updates.priceAnnual
    }
    if (updates.currency) {
      updatePayload.currency = updates.currency
    }
    if (updates.billingCycles) {
      updatePayload.billing_cycles = updates.billingCycles
    }
    if (updates.features) {
      updatePayload.features = updates.features
    }
    if (updates.metadata) {
      updatePayload.metadata = updates.metadata
    }
    if (updates.isActive !== undefined) {
      updatePayload.is_active = updates.isActive
    }
    if (updates.deprecated !== undefined) {
      updatePayload.deprecated = updates.deprecated
    }

    if (Object.keys(updatePayload).length === 0) {
      return NextResponse.json({ error: 'No updates provided' }, { status: 400 })
    }

    // Check if creating a new version (if effective_at is in the future)
    const effectiveAt = updates.metadata?.effectiveAt
    if (effectiveAt) {
      const effectiveDate = new Date(effectiveAt)
      const now = new Date()
      
      if (effectiveDate > now) {
        // Create new version instead of updating existing
        const { data: currentPlan } = await context.serviceClient
          .from('subscription_plans' as any)
          .select('*')
          .eq('code', code)
          .eq('is_active', true)
          .eq('deprecated', false)
          .order('effective_at', { ascending: false })
          .limit(1)
          .single()

        if (currentPlan) {
          const { data: newVersion, error: insertError } = await context.serviceClient
            .from('subscription_plans' as any)
            .insert({
              code,
              display_name: currentPlan.display_name,
              version: updates.metadata?.version || currentPlan.version,
              effective_at: effectiveAt,
              currency: updates.currency || currentPlan.currency,
              price_monthly: updates.priceMonthly ?? currentPlan.price_monthly,
              price_annual: updates.priceAnnual ?? currentPlan.price_annual,
              billing_cycles: updates.billingCycles || currentPlan.billing_cycles,
              features: updates.features || currentPlan.features,
              metadata: { ...currentPlan.metadata, ...updates.metadata },
              is_active: updates.isActive ?? true,
              deprecated: false,
            })
            .select('*')
            .single()

          if (insertError) {
            return NextResponse.json({ error: 'Failed to create plan version' }, { status: 500 })
          }

          await recordAdminAudit(context.serviceClient, {
            organizationId: context.defaultOrganizationId ?? '00000000-0000-0000-0000-000000000000',
            actorId: context.user.id,
            action: 'create_plan_version',
            resourceType: 'subscription_plans',
            resourceId: newVersion.id,
            changes: newVersion,
          })

          return NextResponse.json({ plan: newVersion })
        }
      }
    }

    // Update existing plan
    const { data: updatedPlan, error: updateError } = await context.serviceClient
      .from('subscription_plans' as any)
      .update(updatePayload)
      .eq('code', code)
      .eq('is_active', true)
      .eq('deprecated', false)
      .order('effective_at', { ascending: false })
      .limit(1)
      .select('*')
      .single()

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update plan' }, { status: 500 })
    }

    await recordAdminAudit(context.serviceClient, {
      organizationId: context.defaultOrganizationId ?? '00000000-0000-0000-0000-000000000000',
      actorId: context.user.id,
      action: 'update_plan',
      resourceType: 'subscription_plans',
      resourceId: updatedPlan.id,
      changes: updatePayload,
    })

    return NextResponse.json({ plan: updatedPlan })
  })
}

