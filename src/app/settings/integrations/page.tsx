'use client'

import React from 'react'
import SSOIntegration from '@/components/features/sso-integration'
import { FeatureGate } from '@/components/FeatureGate'
import { useUserPlan } from '@/hooks/useUserPlan'
import { PageWrapper } from '@/components/layout/PageWrapper'

export default function SSOSettingsPage() {
  const userPlan = useUserPlan() || 'starter'

  return (
    <PageWrapper>
      <FeatureGate
        feature="sso-integration"
        plan={userPlan}
        showUpgradeCard={true}
        upgradeCardVariant="banner"
        upgradeCardDescription="Enable Single Sign-On with Azure AD, Okta, or SAML providers. Streamline user authentication and improve security."
      >
        <SSOIntegration />
      </FeatureGate>
    </PageWrapper>
  )
}

