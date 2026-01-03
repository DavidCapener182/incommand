'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { PlanCode } from '@/config/PricingConfig'
import { FeatureKey } from '@/config/FeatureMatrix'
import { isFeatureEnabled, checkFeatureAccess } from '@/lib/featureAccess'
import { UpgradePlanModal } from '@/components/ui/UpgradePlanModal'
import { getPlanCodeFromCompany } from '@/lib/planFeatures'
import { supabase } from '@/lib/supabase'

/**
 * Hook for feature gating with upgrade modal support
 * Automatically shows upgrade modal when a locked feature is accessed
 */
export function useFeatureGate() {
  const { user } = useAuth()
  const [upgradeModal, setUpgradeModal] = useState<{
    isOpen: boolean
    featureName: string
    requiredPlan: PlanCode
  }>({
    isOpen: false,
    featureName: '',
    requiredPlan: 'starter',
  })
  const [userPlan, setUserPlan] = useState<PlanCode | null>(null)

  // Fetch user's plan from company
  useEffect(() => {
    async function fetchPlan() {
      if (!user?.id) return
      
      // Try to get plan from user's company
      try {
        const { data: profile } = await (supabase as any)
          .from('profiles')
          .select('company_id')
          .eq('id', user.id)
          .single()

        const profileData = profile as any;
        if (profileData?.company_id) {
          const plan = await getPlanCodeFromCompany(profileData.company_id)
          setUserPlan(plan || 'starter')
        } else {
          setUserPlan('starter') // Default fallback
        }
      } catch (error) {
        console.error('Error fetching user plan:', error)
        setUserPlan('starter') // Default fallback
      }
    }

    fetchPlan()
  }, [user])

  const checkAccess = (featureKey: FeatureKey, plan?: PlanCode): boolean => {
    const effectivePlan = plan || userPlan || 'starter'
    return isFeatureEnabled(effectivePlan, featureKey)
  }

  const requireFeature = (featureKey: FeatureKey, plan?: PlanCode): boolean => {
    const effectivePlan = plan || userPlan || 'starter'
    const access = checkFeatureAccess(effectivePlan, featureKey)

    if (!access.enabled && access.requiredPlan) {
      setUpgradeModal({
        isOpen: true,
        featureName: access.featureName,
        requiredPlan: access.requiredPlan,
      })
      return false
    }

    return true
  }

  const closeUpgradeModal = () => {
    setUpgradeModal((prev) => ({ ...prev, isOpen: false }))
  }

  return {
    checkAccess,
    requireFeature,
    userPlan,
    UpgradeModal: (
      <UpgradePlanModal
        isOpen={upgradeModal.isOpen}
        onClose={closeUpgradeModal}
        featureName={upgradeModal.featureName}
        requiredPlan={upgradeModal.requiredPlan}
      />
    ),
  }
}

