/**
 * Organization Management System
 * Multi-tenant organization structure and hierarchy
 */

import type { Organization, OrganizationSettings } from '@/lib/permissions/rbac'

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
  {
    id: 'professional',
    name: 'Professional',
    price: 99,
    billingCycle: 'monthly',
    features: {
      maxEvents: 20,
      maxUsers: 25,
      aiFeatures: true,
      customMetrics: true,
      apiAccess: true,
      whiteLabel: false
    },
    limits: {
      storageGB: 50,
      apiCallsPerMonth: 10000,
      emailsPerMonth: 5000,
      smsPerMonth: 500
    }
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 499,
    billingCycle: 'monthly',
    features: {
      maxEvents: -1, // Unlimited
      maxUsers: -1, // Unlimited
      aiFeatures: true,
      customMetrics: true,
      apiAccess: true,
      whiteLabel: true
    },
    limits: {
      storageGB: -1, // Unlimited
      apiCallsPerMonth: -1, // Unlimited
      emailsPerMonth: -1, // Unlimited
      smsPerMonth: -1 // Unlimited
    }
  }
]

export class OrganizationManager {
  private organizations: Map<string, Organization> = new Map()

  /**
   * Create new organization
   */
  createOrganization(
    name: string,
    tier: 'free' | 'professional' | 'enterprise' = 'free'
  ): Organization {
    const slug = this.generateSlug(name)
    const tierConfig = SUBSCRIPTION_TIERS.find(t => t.id === tier)!

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
  upgrade(organizationId: string, newTier: 'professional' | 'enterprise'): Organization | null {
    const org = this.organizations.get(organizationId)
    if (!org) return null

    const tierConfig = SUBSCRIPTION_TIERS.find(t => t.id === newTier)
    if (!tierConfig) return null

    org.tier = newTier
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
