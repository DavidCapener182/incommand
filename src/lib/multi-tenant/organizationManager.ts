/**
 * Organization Management System
 * Multi-tenant organization structure and hierarchy
 */

import type { Organization, OrganizationSettings } from '@/lib/permissions/rbac'
import { getPlan, type PlanCode } from '@/config/PricingConfig'

export interface OrganizationHierarchy {
  id: string
  name: string
  parentId?: string
  level: number
  children: OrganizationHierarchy[]
}

export interface SubscriptionTier {
  id: string
  name: string
  price: number
  billingCycle: 'monthly' | 'annual'
  features: OrganizationSettings['features']
  limits: OrganizationSettings['limits']
}

/**
 * Convert Plan from PricingConfig to SubscriptionTier format
 * Maintains backward compatibility with existing code
 */
function planToSubscriptionTier(planCode: PlanCode): SubscriptionTier | null {
  const plan = getPlan(planCode)
  if (!plan) return null

  const price = typeof plan.pricing.monthly === 'number' ? plan.pricing.monthly : 0
  
  return {
    id: plan.code,
    name: plan.displayName,
    price,
    billingCycle: plan.pricing.billingCycles[0] || 'monthly',
    features: {
      maxEvents: plan.features.maxEvents === -1 ? -1 : plan.features.maxEvents,
      maxUsers: plan.features.maxUsers === -1 ? -1 : plan.features.maxUsers,
      aiFeatures: plan.features.features.some(f => f.toLowerCase().includes('ai')),
      customMetrics: plan.features.features.some(f => f.toLowerCase().includes('analytics') || f.toLowerCase().includes('metrics')),
      apiAccess: plan.features.features.some(f => f.toLowerCase().includes('api')),
      whiteLabel: plan.features.features.some(f => f.toLowerCase().includes('white-label') || f.toLowerCase().includes('white label')),
    },
    limits: {
      storageGB: plan.features.maxEvents === -1 ? -1 : Math.max(1, plan.features.maxEvents * 5), // Estimate based on events
      apiCallsPerMonth: plan.features.features.some(f => f.toLowerCase().includes('api')) ? (plan.features.maxEvents === -1 ? -1 : plan.features.maxEvents * 1000) : 0,
      emailsPerMonth: plan.features.maxEvents === -1 ? -1 : plan.features.maxEvents * 500,
      smsPerMonth: plan.features.features.some(f => f.toLowerCase().includes('sms')) ? (plan.features.maxEvents === -1 ? -1 : plan.features.maxEvents * 100) : 0,
    }
  }
}

/**
 * Subscription tiers derived from PricingConfig
 * Includes legacy 'free' tier for backward compatibility
 */
export const SUBSCRIPTION_TIERS: SubscriptionTier[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    billingCycle: 'monthly',
    features: {
      maxEvents: 3,
      maxUsers: 5,
      aiFeatures: false,
      customMetrics: false,
      apiAccess: false,
      whiteLabel: false
    },
    limits: {
      storageGB: 1,
      apiCallsPerMonth: 0,
      emailsPerMonth: 100,
      smsPerMonth: 0
    }
  },
  ...(['starter', 'operational', 'command', 'enterprise'] as PlanCode[])
    .map(planToSubscriptionTier)
    .filter((tier): tier is SubscriptionTier => tier !== null)
]

export class OrganizationManager {
  private organizations: Map<string, Organization> = new Map()

  /**
   * Create new organization
   */
  createOrganization(
    name: string,
    tier: 'free' | 'starter' | 'operational' | 'command' | 'enterprise' | 'professional' = 'free'
  ): Organization {
    const slug = this.generateSlug(name)
    // Map 'professional' to 'operational' for backward compatibility
    const mappedTier = tier === 'professional' ? 'operational' : tier
    const tierConfig = SUBSCRIPTION_TIERS.find(t => t.id === mappedTier) || SUBSCRIPTION_TIERS[0]

    const organization: Organization = {
      id: `org_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      slug,
      tier,
      settings: {
        features: tierConfig.features,
        limits: tierConfig.limits
      },
      createdAt: new Date().toISOString(),
      isActive: true
    }

    this.organizations.set(organization.id, organization)
    return organization
  }

  /**
   * Get organization
   */
  getOrganization(id: string): Organization | null {
    return this.organizations.get(id) || null
  }

  /**
   * Update organization
   */
  updateOrganization(id: string, updates: Partial<Organization>): Organization | null {
    const org = this.organizations.get(id)
    if (!org) return null

    const updated = { ...org, ...updates }
    this.organizations.set(id, updated)
    return updated
  }

  /**
   * Check feature access
   */
  hasFeature(organizationId: string, feature: keyof OrganizationSettings['features']): boolean {
    const org = this.organizations.get(organizationId)
    if (!org) return false

    return org.settings.features[feature] === true
  }

  /**
   * Check limit
   */
  checkLimit(
    organizationId: string,
    limit: keyof OrganizationSettings['limits'],
    currentUsage: number
  ): { allowed: boolean; remaining: number; limit: number } {
    const org = this.organizations.get(organizationId)
    
    if (!org) {
      return { allowed: false, remaining: 0, limit: 0 }
    }

    const limitValue = org.settings.limits[limit]
    
    // -1 means unlimited
    if (limitValue === -1) {
      return { allowed: true, remaining: -1, limit: -1 }
    }

    const allowed = currentUsage < limitValue
    const remaining = Math.max(0, limitValue - currentUsage)

    return { allowed, remaining, limit: limitValue }
  }

  /**
   * Upgrade organization
   */
  upgrade(organizationId: string, newTier: 'starter' | 'operational' | 'command' | 'enterprise' | 'professional'): Organization | null {
    const org = this.organizations.get(organizationId)
    if (!org) return null

    // Map 'professional' to 'operational' for backward compatibility
    const mappedTier = newTier === 'professional' ? 'operational' : newTier
    const tierConfig = SUBSCRIPTION_TIERS.find(t => t.id === mappedTier)
    if (!tierConfig) return null

    org.tier = mappedTier as any
    org.settings.features = tierConfig.features
    org.settings.limits = tierConfig.limits

    this.organizations.set(organizationId, org)
    return org
  }

  /**
   * Get organization hierarchy
   */
  getHierarchy(organizationId: string): OrganizationHierarchy | null {
    const org = this.organizations.get(organizationId)
    if (!org) return null

    // Build hierarchy (simplified - in production would query database)
    return {
      id: org.id,
      name: org.name,
      level: 0,
      children: []
    }
  }

  /**
   * Generate URL-safe slug
   */
  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
  }
}

// Export singleton instance
export const organizationManager = new OrganizationManager()
