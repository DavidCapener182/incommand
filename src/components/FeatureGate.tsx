'use client'

import React from 'react'
import { FeatureKey, FEATURE_MATRIX } from '@/config/FeatureMatrix'
import { PlanCode } from '@/config/PricingConfig'
import { isFeatureEnabled } from '@/lib/featureAccess'
import { UpgradePlanModal, UpgradeFeatureCard } from '@/components/ui/UpgradePlanModal'
import { getMinimumTierForFeature } from '@/config/FeatureMatrix'

interface FeatureGateProps {
  feature: FeatureKey
  plan?: PlanCode
  fallback?: React.ReactNode
  children: React.ReactNode
  showUpgradeModal?: boolean
  showUpgradeCard?: boolean
  upgradeCardVariant?: 'card' | 'banner' | 'compact'
  upgradeCardDescription?: string
  onUpgrade?: () => void
}

/**
 * Component wrapper for feature gating
 * Only renders children if the feature is enabled for the given plan
 * Can show upgrade modal, upgrade card, or custom fallback when locked
 */
export function FeatureGate({
  feature,
  plan = 'starter',
  fallback,
  children,
  showUpgradeModal = false,
  showUpgradeCard = false,
  upgradeCardVariant = 'card',
  upgradeCardDescription,
  onUpgrade,
}: FeatureGateProps) {
  const [showModal, setShowModal] = React.useState(false)
  const enabled = isFeatureEnabled(plan, feature)

  const handleClick = (e: React.MouseEvent) => {
    if (!enabled && showUpgradeModal) {
      e.preventDefault()
      e.stopPropagation()
      setShowModal(true)
    }
  }

  if (enabled) {
    return <>{children}</>
  }

  // Show upgrade card if requested
  if (showUpgradeCard) {
    const requiredPlan = getMinimumTierForFeature(feature)
    const featureName = FEATURE_MATRIX[feature]?.name || feature
    
    if (!requiredPlan) {
      return <>{fallback || null}</>
    }

    return (
      <>
        <UpgradeFeatureCard
          featureName={featureName}
          requiredPlan={requiredPlan}
          description={upgradeCardDescription}
          variant={upgradeCardVariant}
          onUpgrade={onUpgrade}
        />
        {showUpgradeModal && (
          <UpgradePlanModal
            isOpen={showModal}
            onClose={() => setShowModal(false)}
            featureName={featureName}
            requiredPlan={requiredPlan}
            onUpgrade={onUpgrade}
          />
        )}
      </>
    )
  }

  // Show upgrade modal on click if requested
  if (showUpgradeModal) {
    const requiredPlan = getMinimumTierForFeature(feature)
    const featureName = FEATURE_MATRIX[feature]?.name || feature
    return (
      <>
        <div onClick={handleClick} className="cursor-pointer">
          {fallback || children}
        </div>
        {requiredPlan && (
          <UpgradePlanModal
            isOpen={showModal}
            onClose={() => setShowModal(false)}
            featureName={featureName}
            requiredPlan={requiredPlan}
            onUpgrade={onUpgrade}
          />
        )}
      </>
    )
  }

  return <>{fallback || null}</>
}

