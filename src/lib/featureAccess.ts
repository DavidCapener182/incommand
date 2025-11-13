/**
 * Feature Access Utilities
 * Centralized utilities for checking feature availability based on plan tiers
 * Can be used in both frontend and backend contexts
 */

import { PlanCode } from '@/config/PricingConfig'
import { FEATURE_MATRIX, FeatureKey, getMinimumTierForFeature } from '@/config/FeatureMatrix'

/**
 * Check if a feature is enabled for a given plan
 */
export function isFeatureEnabled(plan: PlanCode, featureKey: FeatureKey): boolean {
  const feature = FEATURE_MATRIX[featureKey]
  if (!feature) return false
  return (feature.tiers as ReadonlyArray<PlanCode>).includes(plan)
}

/**
 * Get all enabled features for a plan
 */
export function getEnabledFeatures(plan: PlanCode): FeatureKey[] {
  return Object.keys(FEATURE_MATRIX).filter((key) =>
    isFeatureEnabled(plan, key as FeatureKey)
  ) as FeatureKey[]
}

/**
 * Check if user's plan has access to a feature
 * Returns an object with access status and upgrade information if locked
 */
export function checkFeatureAccess(plan: PlanCode, featureKey: FeatureKey): {
  enabled: boolean
  requiredPlan: PlanCode | null
  featureName: string
} {
  const enabled = isFeatureEnabled(plan, featureKey)
  const requiredPlan = enabled ? null : getMinimumTierForFeature(featureKey)
  const featureName = FEATURE_MATRIX[featureKey]?.name || featureKey

  return {
    enabled,
    requiredPlan,
    featureName,
  }
}

/**
 * Get the display name for a plan tier
 */
export function getPlanDisplayName(plan: PlanCode): string {
  const names: Record<PlanCode, string> = {
    starter: 'Starter',
    operational: 'Operational',
    command: 'Command',
    enterprise: 'Enterprise',
  }
  return names[plan] || plan
}

/**
 * Check if plan A is higher tier than plan B
 */
export function isHigherTier(planA: PlanCode, planB: PlanCode): boolean {
  const tierOrder: PlanCode[] = ['starter', 'operational', 'command', 'enterprise']
  return tierOrder.indexOf(planA) > tierOrder.indexOf(planB)
}

/**
 * Get the next tier up from current plan
 */
export function getNextTier(plan: PlanCode): PlanCode | null {
  const tierOrder: PlanCode[] = ['starter', 'operational', 'command', 'enterprise']
  const currentIndex = tierOrder.indexOf(plan)
  if (currentIndex === -1 || currentIndex === tierOrder.length - 1) return null
  return tierOrder[currentIndex + 1]
}



