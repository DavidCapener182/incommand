'use client'

import React from 'react'
import TaskDispatch from '@/components/features/task-dispatch'
import { FeatureGate } from '@/components/FeatureGate'
import { useUserPlan } from '@/hooks/useUserPlan'
import { PageWrapper } from '@/components/layout/PageWrapper'

export default function TasksPage() {
  const userPlan = useUserPlan() || 'starter'

  return (
    <PageWrapper>
      <FeatureGate
        feature="task-dispatch"
        plan={userPlan}
        showUpgradeCard={true}
        upgradeCardVariant="banner"
        upgradeCardDescription="Allocate and monitor field staff tasks in real time. Create tasks, assign them to staff members, and track completion status."
      >
        <TaskDispatch />
      </FeatureGate>
    </PageWrapper>
  )
}

