/**
 * Feature Matrix Configuration
 * Centralized catalog of platform features with tier-based access control
 * Maps feature keys to their display names, descriptions, categories, and available tiers
 */

import { PlanCode } from './PricingConfig'

export type FeatureKey = keyof typeof FEATURE_MATRIX

export interface FeatureDefinition {
  name: string
  description: string
  tiers: ReadonlyArray<PlanCode>
  category: string
}

export const FEATURE_MATRIX = {
  // --- Core Platform ---
  'event-dashboard': {
    name: 'Event Dashboard',
    description: 'Create, view, and manage events in a unified dashboard.',
    tiers: ['starter', 'operational', 'command', 'enterprise'],
    category: 'Core Platform',
  },
  'multi-event-management': {
    name: 'Multi-Event Management',
    description: 'Manage multiple concurrent events under one organisation.',
    tiers: ['command', 'enterprise'],
    category: 'Core Platform',
  },
  'venue-calendar': {
    name: 'Venue Calendar',
    description: 'Visual schedule of booked and available venue dates.',
    tiers: ['starter', 'operational', 'command', 'enterprise'],
    category: 'Core Platform',
  },

  // --- Incident & Crowd Management ---
  'incident-reporting': {
    name: 'Incident Reporting',
    description: 'Log and categorise incidents with severity, location, and timestamp.',
    tiers: ['starter', 'operational', 'command', 'enterprise'],
    category: 'Crowd Management',
  },
  'real-time-incident-dashboard': {
    name: 'Real-Time Incident Dashboard',
    description: 'Live feed of incidents with geolocation and status tracking.',
    tiers: ['operational', 'command', 'enterprise'],
    category: 'Crowd Management',
  },
  'command-centre': {
    name: 'Command Centre View',
    description: 'Map-based operational overview for multiple venues or sites.',
    tiers: ['command', 'enterprise'],
    category: 'Crowd Management',
  },
  'task-dispatch': {
    name: 'Task Dispatch & Assignment',
    description: 'Allocate and monitor field staff tasks in real time.',
    tiers: ['operational', 'command', 'enterprise'],
    category: 'Operations',
  },

  // --- Communication ---
  'email-alerts': {
    name: 'Email Notifications',
    description: 'Automated and manual email alerts for key events.',
    tiers: ['starter', 'operational', 'command', 'enterprise'],
    category: 'Communication',
  },
  'sms-alerts': {
    name: 'SMS & WhatsApp Alerts',
    description: 'Send urgent messages to staff or management.',
    tiers: ['operational', 'command', 'enterprise'],
    category: 'Communication',
  },
  'push-notifications': {
    name: 'Push Notifications',
    description: 'Mobile push alerts for incident or task updates.',
    tiers: ['operational', 'command', 'enterprise'],
    category: 'Communication',
  },

  // --- Mobile & Field Access ---
  'mobile-access': {
    name: 'Mobile App Access',
    description: 'Access platform features through the mobile app.',
    tiers: ['operational', 'command', 'enterprise'],
    category: 'Field Access',
  },
  'offline-mode': {
    name: 'Offline Mode',
    description: 'Allow offline data capture, syncing once reconnected.',
    tiers: ['command', 'enterprise'],
    category: 'Field Access',
  },

  // --- Analytics ---
  'basic-reports': {
    name: 'Basic Reports',
    description: 'Download incident and attendance reports (CSV).',
    tiers: ['starter', 'operational', 'command', 'enterprise'],
    category: 'Analytics',
  },
  'real-time-analytics': {
    name: 'Real-Time Analytics',
    description: 'Live occupancy and event trend dashboards.',
    tiers: ['command', 'enterprise'],
    category: 'Analytics',
  },
  'custom-dashboards': {
    name: 'Custom Dashboards',
    description: 'Build and save personalised reporting layouts.',
    tiers: ['operational', 'command', 'enterprise'],
    category: 'Analytics',
  },

  // --- Integrations ---
  'api-access': {
    name: 'API Access',
    description: 'Authenticated API for third-party integrations.',
    tiers: ['command', 'enterprise'],
    category: 'Integrations',
  },
  'zapier-integration': {
    name: 'Zapier Integration',
    description: 'Connect with Zapier to automate workflows.',
    tiers: ['command', 'enterprise'],
    category: 'Integrations',
  },

  // --- Security ---
  'two-factor-auth': {
    name: 'Two-Factor Authentication',
    description: 'Add OTP verification for logins.',
    tiers: ['starter', 'operational', 'command', 'enterprise'],
    category: 'Security',
  },
  'sso-integration': {
    name: 'Single Sign-On',
    description: 'Authenticate via AzureAD or Okta.',
    tiers: ['command', 'enterprise'],
    category: 'Security',
  },

  // --- Branding ---
  'white-labelling': {
    name: 'White-Labelling',
    description: 'Custom branding; remove InCommand logo/colours.',
    tiers: ['command', 'enterprise'],
    category: 'Branding',
  },
  'custom-domain': {
    name: 'Custom Domain',
    description: 'Serve the app under client-specific domain and SSL.',
    tiers: ['command', 'enterprise'],
    category: 'Branding',
  },

  // --- Support ---
  'priority-support': {
    name: 'Priority Support',
    description: 'Faster ticket response and extended hours.',
    tiers: ['operational', 'command', 'enterprise'],
    category: 'Support',
  },
  'dedicated-manager': {
    name: 'Dedicated Account Manager',
    description: 'Named success manager for enterprise clients.',
    tiers: ['command', 'enterprise'],
    category: 'Support',
  },
} as const

/**
 * Get all feature keys for a given plan
 */
export function getPlanFeatures(plan: PlanCode): FeatureKey[] {
  const eligiblePlan = plan === 'command' || plan === 'enterprise' ? plan : undefined
  if (!eligiblePlan) {
    return []
  }
  return Object.entries(FEATURE_MATRIX)
    .filter(([_, feature]) => feature.tiers.includes(eligiblePlan))
    .map(([key]) => key as FeatureKey)
}

/**
 * Get all features grouped by category
 */
export function getFeaturesByCategory(): Record<string, Array<{ key: FeatureKey; feature: FeatureDefinition }>> {
  const categories: Record<string, Array<{ key: FeatureKey; feature: FeatureDefinition }>> = {}
  
  Object.entries(FEATURE_MATRIX).forEach(([key, feature]) => {
    if (!categories[feature.category]) {
      categories[feature.category] = []
    }
    categories[feature.category].push({ key: key as FeatureKey, feature })
  })
  
  return categories
}

/**
 * Get the minimum tier required for a feature
 */
export function getMinimumTierForFeature(featureKey: FeatureKey): PlanCode | null {
  const feature = FEATURE_MATRIX[featureKey]
  if (!feature) return null
  
  const tierOrder: PlanCode[] = ['starter', 'operational', 'command', 'enterprise']
  const featureTiers = [...feature.tiers] as PlanCode[]
  for (const tier of tierOrder) {
    if (featureTiers.includes(tier)) {
      return tier
    }
  }
  return null
}



