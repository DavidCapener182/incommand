/**
 * Quote Calculator
 * Generates custom, dynamic pricing estimates based on client metrics
 * Uses existing tier data from PricingConfig as baseline, then applies scaling multipliers
 */

import { PRICING_PLANS, PlanCode } from '@/config/PricingConfig'

export interface QuoteInput {
  basePlan?: PlanCode // Selected base plan
  eventsPerMonth: number
  avgAttendeesPerEvent: number
  staffUsers: number
  adminUsers: number
  featureAddOns?: string[]
}

export interface AddOnPrice {
  name: string
  price: number
  description?: string
}

export interface QuoteResult {
  basePlan: PlanCode
  monthlyEstimate: number
  annualEstimate: number
  breakdown: {
    basePrice: number
    eventsMultiplier: number
    attendeesMultiplier: number
    staffMultiplier: number
    discountFactor: number
    compositeMultiplier: number
    addOnsCost: number
    addOns: Record<string, number>
    annualDiscount: number
  }
  recommendedPlan: PlanCode
}

/**
 * Calculate attendee multiplier based on average attendees per event
 * Updated with more realistic commercial multipliers
 */
function getAttendeeMultiplier(attendees: number): number {
  if (attendees <= 500) return 1.0
  if (attendees <= 2000) return 1.15
  if (attendees <= 5000) return 1.3
  if (attendees <= 10000) return 1.6
  if (attendees <= 20000) return 1.9
  return 2.2
}

/**
 * Calculate event multiplier based on events per month
 * Updated with higher-value multipliers reflecting operational costs
 */
function getEventMultiplier(eventsPerMonth: number): number {
  if (eventsPerMonth <= 2) return 1.0
  if (eventsPerMonth <= 5) return 2.0
  if (eventsPerMonth <= 10) return 5.0
  if (eventsPerMonth <= 20) return 7.0
  if (eventsPerMonth <= 50) return 10.0
  return 12.0 // Enterprise fallback for 51+ events
}

/**
 * Calculate volume discount factor based on events per month
 * Higher event volumes receive progressive discounts
 * Capped at 10+ events for realistic live events industry pricing
 */
function getVolumeDiscount(eventsPerMonth: number): number {
  if (eventsPerMonth <= 2) return 1.00  // Base rate - no discount
  if (eventsPerMonth <= 5) return 0.97  // 3% volume discount
  if (eventsPerMonth <= 8) return 0.94  // 6% discount
  if (eventsPerMonth <= 10) return 0.90 // 10% discount
  return 0.88 // 11+ events = maximum 12% discount
}

/**
 * Calculate staff multiplier based on total users (staff + admin)
 * Small uplift for additional users
 */
function getStaffMultiplier(totalUsers: number): number {
  if (totalUsers <= 3) return 1.0
  if (totalUsers <= 10) return 1.1
  if (totalUsers <= 25) return 1.25
  return 1.4
}

/**
 * Determine recommended plan based on requirements
 */
function getRecommendedPlan(input: QuoteInput): PlanCode {
  const { eventsPerMonth, avgAttendeesPerEvent, staffUsers, adminUsers } = input
  const totalUsers = staffUsers + adminUsers

  // Check against plan limits
  if (
    eventsPerMonth <= 2 &&
    avgAttendeesPerEvent <= 500 &&
    totalUsers <= 3 &&
    staffUsers <= 5
  ) {
    return 'starter'
  }

  if (
    eventsPerMonth <= 10 &&
    avgAttendeesPerEvent <= 2000 &&
    totalUsers <= 10 &&
    staffUsers <= 20
  ) {
    return 'operational'
  }

  if (
    eventsPerMonth <= 25 &&
    avgAttendeesPerEvent <= 5000 &&
    totalUsers <= 25 &&
    staffUsers <= 50
  ) {
    return 'command'
  }

  return 'enterprise'
}

/**
 * Add-on pricing configuration
 * Includes all key features from pricing plans with individual pricing
 */
export const ADD_ON_PRICES: Record<string, AddOnPrice> = {
  // Starter Plan Features (all included - no additional cost)
  'Event dashboard': { name: 'Event dashboard', price: 0, description: 'Core event management dashboard' },
  'Basic incident management': { name: 'Basic incident management', price: 0, description: 'Track and manage incidents' },
  'Email notifications': { name: 'Email notifications', price: 0, description: 'Automated email alerts' },
  'Mobile app access': { name: 'Mobile app access', price: 15, description: 'Access via mobile application' },
  'Basic analytics': { name: 'Basic analytics', price: 0, description: 'Basic reporting and insights' },
  'Email support': { name: 'Email support', price: 0, description: 'Email-based customer support' },
  
  // Operational Plan Features
  'Staff scheduling': { name: 'Staff scheduling', price: 20, description: 'Schedule and manage staff shifts' },
  'Advanced reporting': { name: 'Advanced reporting', price: 25, description: 'Detailed reports and insights' },
  'SMS alerts': { name: 'SMS alerts', price: 15, description: 'SMS notifications and alerts' },
  'API access': { name: 'API access', price: 25, description: 'RESTful API for integrations' },
  'Custom branding': { name: 'Custom branding', price: 20, description: 'Customize platform branding' },
  'Priority support': { name: 'Priority support', price: 30, description: 'Faster response times' },
  'Advanced analytics': { name: 'Advanced analytics', price: 30, description: 'Advanced data analysis' },
  'Multi-event management': { name: 'Multi-event management', price: 30, description: 'Manage multiple events simultaneously' },
  
  // Command Plan Features
  'AI-powered insights': { name: 'AI-powered insights', price: 45, description: 'AI-driven recommendations' },
  'Advanced analytics suite': { name: 'Advanced analytics suite', price: 60, description: 'Comprehensive analytics package' },
  'Custom integrations': { name: 'Custom integrations', price: 50, description: 'Tailored third-party integrations' },
  'On-site tools': { name: 'On-site tools', price: 35, description: 'Tools for physical event management' },
  'Real-time dashboards': { name: 'Real-time dashboards', price: 40, description: 'Live monitoring dashboards' },
  'Predictive analytics': { name: 'Predictive analytics', price: 55, description: 'Forecast trends and patterns' },
  'Custom workflows': { name: 'Custom workflows', price: 50, description: 'Automated custom processes' },
  
  // Enterprise Plan Features
  'Unlimited events': { name: 'Unlimited events', price: 100, description: 'No limit on event creation' },
  'Unlimited attendees': { name: 'Unlimited attendees', price: 100, description: 'No limit on attendee capacity' },
  'Unlimited staff': { name: 'Unlimited staff', price: 80, description: 'No limit on staff users' },
  'Dedicated account manager': { name: 'Dedicated account manager', price: 75, description: 'Personal account manager' },
  'SLA guarantee (99.9%)': { name: 'SLA guarantee (99.9%)', price: 150, description: 'Guaranteed uptime SLA' },
  'Advanced security suite': { name: 'Advanced security suite', price: 80, description: 'Enhanced security features' },
  'White-label options': { name: 'White-label options', price: 40, description: 'Remove all branding' },
  'On-premise deployment options': { name: 'On-premise deployment options', price: 200, description: 'Deploy on your servers' },
  'Custom development': { name: 'Custom development', price: 100, description: 'Tailored feature development' },
  'Priority 24/7 support': { name: 'Priority 24/7 support', price: 75, description: 'Round-the-clock priority support' },
  
  // Additional Add-ons
  'Additional staff seats': { name: 'Additional staff seats', price: 10, description: 'Add more staff users' },
  'Dedicated Support': { name: 'Dedicated Support', price: 75, description: 'Dedicated support channel' },
  'Training sessions': { name: 'Training sessions', price: 60, description: 'On-demand or live training' },
  'Custom SLA terms': { name: 'Custom SLA terms', price: 150, description: 'Customized SLA agreements' },
  'Private cloud deployment': { name: 'Private cloud deployment', price: 200, description: 'Private cloud infrastructure' },
  'Dedicated infrastructure': { name: 'Dedicated infrastructure', price: 300, description: 'Dedicated server infrastructure' },
}

/**
 * Get all features for a plan including inherited features from lower-tier plans
 * Inheritance chain: Starter -> Operational -> Command -> Enterprise
 */
export function getAllPlanFeatures(planCode: PlanCode): string[] {
  const allFeatures: string[] = []
  
  // Define the inheritance chain
  const planHierarchy: PlanCode[] = ['starter', 'operational', 'command', 'enterprise']
  const planIndex = planHierarchy.indexOf(planCode)
  
  if (planIndex === -1) return allFeatures
  
  // Collect features from all plans up to and including the selected plan
  for (let i = 0; i <= planIndex; i++) {
    const plan = PRICING_PLANS[planHierarchy[i]]
    const planFeatures = plan.features.features || []
    
    // Add features, filtering out "Everything in X" references
    planFeatures.forEach(feature => {
      if (!feature.toLowerCase().includes('everything in')) {
        if (!allFeatures.includes(feature)) {
          allFeatures.push(feature)
        }
      }
    })
    
    // Also add plan-specific add-ons
    const planAddOns = plan.features.addOns || []
    planAddOns.forEach(addOn => {
      if (!allFeatures.includes(addOn)) {
        allFeatures.push(addOn)
      }
    })
  }
  
  return allFeatures
}

/**
 * Get only the features that are included with a plan (excluding optional add-ons)
 */
export function getPlanIncludedFeatures(planCode: PlanCode): string[] {
  const includedFeatures: string[] = []

  const planHierarchy: PlanCode[] = ['starter', 'operational', 'command', 'enterprise']
  const planIndex = planHierarchy.indexOf(planCode)

  if (planIndex === -1) {
    return includedFeatures
  }

  for (let i = 0; i <= planIndex; i++) {
    const plan = PRICING_PLANS[planHierarchy[i]]
    const planFeatures = plan.features.features || []

    planFeatures.forEach((feature) => {
      if (!feature.toLowerCase().includes('everything in') && !includedFeatures.includes(feature)) {
        includedFeatures.push(feature)
      }
    })
  }

  return includedFeatures
}

/**
 * Get all available add-ons
 */
export function getAllAddOns(): AddOnPrice[] {
  return Object.values(ADD_ON_PRICES)
}

/**
 * Get add-on price by name
 */
export function getAddOnPrice(addOnName: string): number {
  return ADD_ON_PRICES[addOnName]?.price || 0
}

/**
 * Calculate custom quote based on input metrics
 */
export function calculateQuote(input: QuoteInput): QuoteResult {
  // Use selected base plan or Operational as default
  const basePlanCode: PlanCode = input.basePlan || 'operational'
  const basePlan = PRICING_PLANS[basePlanCode]
  
  // Get base monthly price
  const basePrice =
    typeof basePlan.pricing.monthly === 'number'
      ? basePlan.pricing.monthly
      : 129 // Fallback to Operational plan default

  // Calculate multipliers
  const eventsMultiplier = getEventMultiplier(input.eventsPerMonth)
  const attendeesMultiplier = getAttendeeMultiplier(input.avgAttendeesPerEvent)
  const staffMultiplier = getStaffMultiplier(input.staffUsers + input.adminUsers)
  const discountFactor = getVolumeDiscount(input.eventsPerMonth)
  
  // Composite multiplier (multiplicative scaling including volume discount)
  const compositeMultiplier = eventsMultiplier * attendeesMultiplier * staffMultiplier * discountFactor

  // Calculate base monthly estimate
  let monthlyEstimate = basePrice * compositeMultiplier

  // Add feature add-ons with individual pricing
  const addOnsBreakdown: Record<string, number> = {}
  let addOnsCost = 0
  const includedFeatures = new Set(getPlanIncludedFeatures(basePlanCode))

  if (input.featureAddOns && input.featureAddOns.length > 0) {
    input.featureAddOns.forEach(addOnName => {
      const addOnPrice = includedFeatures.has(addOnName) ? 0 : getAddOnPrice(addOnName)
      addOnsBreakdown[addOnName] = addOnPrice
      addOnsCost += addOnPrice
    })
  }
  monthlyEstimate += addOnsCost

  // Round to 2 decimal places
  monthlyEstimate = Math.round(monthlyEstimate * 100) / 100

  // Calculate annual estimate with 10% discount
  const annualEstimate = Math.round(monthlyEstimate * 12 * 0.9 * 100) / 100
  const annualDiscount = monthlyEstimate * 12 - annualEstimate

  // Determine recommended plan
  const recommendedPlan = getRecommendedPlan(input)

  return {
    basePlan: basePlanCode,
    monthlyEstimate,
    annualEstimate,
    breakdown: {
      basePrice,
      eventsMultiplier,
      attendeesMultiplier,
      staffMultiplier,
      discountFactor,
      compositeMultiplier,
      addOnsCost,
      addOns: addOnsBreakdown,
      annualDiscount,
    },
    recommendedPlan,
  }
}

/**
 * Format currency value
 */
export function formatCurrency(
  amount: number,
  currency: 'GBP' | 'USD' | 'EUR' = 'GBP'
): string {
  const symbol = currency === 'GBP' ? '£' : currency === 'USD' ? '$' : '€'
  return `${symbol}${amount.toFixed(2)}`
}

