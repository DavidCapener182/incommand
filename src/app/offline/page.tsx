'use client'

import React from 'react'
import OfflineMode from '@/components/features/offline-mode'
import { FeatureGate } from '@/components/FeatureGate'
import { useUserPlan } from '@/hooks/useUserPlan'
import { PageWrapper } from '@/components/layout/PageWrapper'

export default function OfflinePage() {
  const userPlan = useUserPlan() || 'starter'

  return (
    <PageWrapper>
      <FeatureGate
        feature="offline-mode"
        plan={userPlan}
        showUpgradeCard={true}
        upgradeCardVariant="banner"
        upgradeCardDescription="Capture data offline and sync automatically when connection is restored. Perfect for field operations in areas with poor connectivity."
      >
        <OfflineMode />
      </FeatureGate>
    </PageWrapper>
  )
}
