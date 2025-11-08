/**
 * Pricing Configuration
 * Centralized pricing tier catalog aligned with market research
 * Single source of truth for plan definitions, features, and limits
 */

export type PlanCode = 'starter' | 'operational' | 'command' | 'enterprise'

export type BillingCycle = 'monthly' | 'annual'

export type Currency = 'GBP' | 'USD' | 'EUR'

export interface PlanFeatures {
  maxEvents: number // -1 for unlimited
  maxAttendees: number // -1 for unlimited
  maxUsers: number // -1 for unlimited
  maxStaff: number // -1 for unlimited
  features: string[] // Feature flags/descriptions
  addOns: string[] // Available add-on features
}

export interface PlanPricing {
  monthly: number | 'custom'
  annual?: number | 'custom' // Optional annual pricing
  currency: Currency
  billingCycles: BillingCycle[]
}

export interface PlanMetadata {
  version: string
  effectiveAt: string // ISO date string
  description: string
  popular?: boolean // Highlight popular plan
  deprecated?: boolean // Mark deprecated plans
}

export interface Plan {
  code: PlanCode
  displayName: string
  pricing: PlanPricing
  features: PlanFeatures
  metadata: PlanMetadata
}

/**
 * Pricing Plans Catalog
 * Based on competitor analysis: Eventify, Swoogo, Chronosoft, 24/7 Software
 */
export const PRICING_PLANS: Record<PlanCode, Plan> = {
  starter: {
    code: 'starter',
    displayName: 'Starter',
    pricing: {
      monthly: 49,
      annual: 490, // ~17% discount for annual
      currency: 'GBP',
      billingCycles: ['monthly', 'annual'],
    },
    features: {
      maxEvents: 2,
      maxAttendees: 500,
      maxUsers: 3,
      maxStaff: 5,
      features: [
        'Event dashboard',
        'Basic incident management',
        'Email notifications',
        'Basic analytics',
        'Email support',
      ],
      addOns: ['SMS notifications', 'Additional staff seats'],
    },
    metadata: {
      version: '1.0.0',
      effectiveAt: '2025-01-01T00:00:00Z',
      description: 'Perfect for small events and single organizers',
      popular: false,
    },
  },
  operational: {
    code: 'operational',
    displayName: 'Operational',
    pricing: {
      monthly: 129,
      annual: 1290, // ~17% discount for annual
      currency: 'GBP',
      billingCycles: ['monthly', 'annual'],
    },
    features: {
      maxEvents: 10,
      maxAttendees: 2000,
      maxUsers: 10,
      maxStaff: 20,
      features: [
        'Everything in Starter',
        'Mobile app access',
        'Staff scheduling',
        'Advanced reporting',
        'SMS alerts',
        'Priority support',
        'Advanced analytics'
      ],
      addOns: ['AI-powered insights', 'Custom integrations', 'White-label options'],
    },
    metadata: {
      version: '1.0.0',
      effectiveAt: '2025-01-01T00:00:00Z',
      description: 'Ideal for mid-sized events and growing operations',
      popular: true,
    },
  },
  command: {
    code: 'command',
    displayName: 'Command',
    pricing: {
      monthly: 249,
      annual: 2490, // ~17% discount for annual
      currency: 'GBP',
      billingCycles: ['monthly', 'annual'],
    },
    features: {
      maxEvents: 25,
      maxAttendees: 5000,
      maxUsers: 25,
      maxStaff: 50,
      features: [
        'Everything in Operational',
        'Multi-event management',
        'AI-powered insights',
        'Advanced analytics suite',
        'Custom integrations',
        'On-site tools',
        'Real-time dashboards',
        'Predictive analytics',
        'Custom workflows',
      ],
      addOns: ['Dedicated support', 'Custom development', 'Training sessions'],
    },
    metadata: {
      version: '1.0.0',
      effectiveAt: '2025-01-01T00:00:00Z',
      description: 'For large-scale events and complex operations',
      popular: false,
    },
  },
  enterprise: {
    code: 'enterprise',
    displayName: 'Enterprise',
    pricing: {
      monthly: 'custom',
      annual: 'custom',
      currency: 'GBP',
      billingCycles: ['monthly', 'annual'],
    },
    features: {
      maxEvents: -1, // Unlimited
      maxAttendees: -1, // Unlimited
      maxUsers: -1, // Unlimited
      maxStaff: -1, // Unlimited
      features: [
        'Everything in Command',
        'API access',
        'Custom branding',
        'Unlimited events',
        'Unlimited attendees',
        'Unlimited staff',
        'Dedicated account manager',
        'Custom integrations',
        'SLA guarantee (99.9%)',
        'Advanced security suite',
        'White-label options',
        'On-premise deployment options',
        'Custom development',
        'Priority 24/7 support',
      ],
      addOns: ['Custom SLA terms', 'Private cloud deployment', 'Dedicated infrastructure'],
    },
    metadata: {
      version: '1.0.0',
      effectiveAt: '2025-01-01T00:00:00Z',
      description: 'For stadiums, councils, and multi-agency operations',
      popular: false,
    },
  },
}

/**
 * Get plan by code
 */
export function getPlan(code: PlanCode): Plan {
  return PRICING_PLANS[code]
}

/**
 * Get all plans as array
 */
export function getAllPlans(): Plan[] {
  return Object.values(PRICING_PLANS)
}

/**
 * Get plan features
 */
export function getPlanFeatures(code: PlanCode): PlanFeatures {
  return PRICING_PLANS[code].features
}

/**
 * Check if plan allows event creation
 */
export function canCreateEvent(planCode: PlanCode, currentEventCount: number): boolean {
  const plan = PRICING_PLANS[planCode]
  if (plan.features.maxEvents === -1) return true
  return currentEventCount < plan.features.maxEvents
}

/**
 * Check if plan allows attendee count
 */
export function withinAttendeeLimit(planCode: PlanCode, attendeeCount: number): boolean {
  const plan = PRICING_PLANS[planCode]
  if (plan.features.maxAttendees === -1) return true
  return attendeeCount <= plan.features.maxAttendees
}

/**
 * Check if plan allows user creation
 */
export function canCreateUser(planCode: PlanCode, currentUserCount: number): boolean {
  const plan = PRICING_PLANS[planCode]
  if (plan.features.maxUsers === -1) return true
  return currentUserCount < plan.features.maxUsers
}

/**
 * Check if plan allows staff creation
 */
export function canCreateStaff(planCode: PlanCode, currentStaffCount: number): boolean {
  const plan = PRICING_PLANS[planCode]
  if (plan.features.maxStaff === -1) return true
  return currentStaffCount < plan.features.maxStaff
}

/**
 * Get plan price for billing cycle
 */
export function getPlanPrice(planCode: PlanCode, cycle: BillingCycle): number | 'custom' {
  const plan = PRICING_PLANS[planCode]
  if (cycle === 'annual' && plan.pricing.annual !== undefined) {
    return plan.pricing.annual
  }
  return plan.pricing.monthly
}

/**
 * Check if feature is available in plan
 */
export function hasFeature(planCode: PlanCode, feature: string): boolean {
  const plan = PRICING_PLANS[planCode]
  return plan.features.features.includes(feature) || plan.features.addOns.includes(feature)
}

/**
 * Get display price string
 */
export function getDisplayPrice(planCode: PlanCode, cycle: BillingCycle = 'monthly'): string {
  const price = getPlanPrice(planCode, cycle)
  if (price === 'custom') return 'Custom pricing'
  const plan = PRICING_PLANS[planCode]
  const symbol = plan.pricing.currency === 'GBP' ? '£' : plan.pricing.currency === 'USD' ? '$' : '€'
  return `${symbol}${price}${cycle === 'monthly' ? '/month' : '/year'}`
}

