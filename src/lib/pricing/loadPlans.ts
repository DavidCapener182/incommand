import type { PricingPlan } from '@/components/marketing/interactives/PricingPlans'
import { PRICING_PLANS, type Plan, type PlanCode } from '@/config/PricingConfig'

export const PLAN_ORDER: PlanCode[] = ['starter', 'operational', 'command', 'enterprise']

export const PLAN_NOTES: Record<PlanCode, string> = {
  starter: 'Built for smaller teams just getting started.',
  operational: 'Our most popular plan for growing venues.',
  command: 'Advanced control and AI insights for complex operations.',
  enterprise: 'Includes dedicated onboarding, custom SLAs, and private deployment options.',
}

export function buildPricingPlan(
  plan: Plan,
  options: {
    monthlyPrice?: number | null
    annualPrice?: number | null
    currency?: string
    features?: string[]
  } = {}
): PricingPlan {
  // Use provided option, or fallback to plan default, or null
  const monthlyPrice = options.monthlyPrice ?? (typeof plan.pricing.monthly === 'number' ? plan.pricing.monthly : null)
  const annualPrice = options.annualPrice ?? (typeof plan.pricing.annual === 'number' ? plan.pricing.annual : null)
  
  const currency = options.currency ?? plan.pricing.currency
  const features = options.features ?? plan.features.features
  const isCustom = monthlyPrice === null

  return {
    name: plan.displayName,
    description: plan.metadata.description ?? '',
    features,
    cta: isCustom ? 'Talk to Sales' : 'Get Started',
    ctaLink: isCustom
      ? 'mailto:support@incommand.uk?subject=InCommand%20Enterprise%20Pricing'
      : `/signup?plan=${plan.code}`,
    note: PLAN_NOTES[plan.code],
    monthlyPrice,
    annualPrice,
    currency,
    isCustom,
  }
}

/**
 * Constructs a base URL from environment variables with proper error handling
 */
function getBaseUrl(): string | null {
  const normalizedBase = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || ''
  
  if (!normalizedBase) {
    return null
  }

  try {
    // Use URL constructor for robust parsing
    const url = normalizedBase.startsWith('http') 
      ? new URL(normalizedBase)
      : new URL(`https://${normalizedBase}`)
    
    return url.origin
  } catch (error) {
    console.error('Invalid base URL:', normalizedBase, error)
    return null
  }
}

/**
 * Loads pricing plans from the API, falling back to static config on error
 * Uses ISR-friendly caching (revalidates every hour)
 */
export async function loadPlans(): Promise<PricingPlan[]> {
  const baseUrl = getBaseUrl()

  if (baseUrl) {
    try {
      const apiUrl = new URL('/api/billing/plans', baseUrl)
      const res = await fetch(apiUrl.toString(), {
        next: { revalidate: 3600 }, // Revalidate every hour (ISR)
      })

      if (res.ok) {
        const json = await res.json()
        const planMap = new Map<string, any>((json.plans ?? []).map((p: any) => [p.code, p]))

        const apiPlans = PLAN_ORDER.map((code) => {
          const configPlan = PRICING_PLANS[code]
          if (!configPlan) return null
          
          const apiPlan = planMap.get(code)

          const monthlyPrice = typeof apiPlan?.price_monthly === 'number'
              ? apiPlan.price_monthly
              : (typeof configPlan.pricing.monthly === 'number' ? configPlan.pricing.monthly : null)

          const annualPrice = typeof apiPlan?.price_annual === 'number'
              ? apiPlan.price_annual
              : (typeof configPlan.pricing.annual === 'number' ? configPlan.pricing.annual : null)

          const currency = apiPlan?.currency ?? configPlan.pricing.currency
          
          const features = Array.isArray(apiPlan?.metadata?.features)
            ? apiPlan.metadata.features
            : configPlan.features.features

          return buildPricingPlan(configPlan, { monthlyPrice, annualPrice, currency, features })
        }).filter((plan): plan is PricingPlan => Boolean(plan))

        if (apiPlans.length > 0) {
          return apiPlans
        }
      }
    } catch (error) {
      console.error('Error loading plans:', error)
      // Fallthrough to default plans on error
    }
  }

  // Fallback to static config if API fails or no URL provided
  return PLAN_ORDER.map((code) => buildPricingPlan(PRICING_PLANS[code]))
}

