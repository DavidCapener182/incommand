'use client'

import React from 'react'
import { useEventContext } from '@/contexts/EventContext'
import { FeatureGate } from '@/components/FeatureGate'
import { useUserPlan } from '@/hooks/useUserPlan'
import { PageWrapper } from '@/components/layout/PageWrapper'
import RealtimeAnalyticsDashboard from '@/components/analytics/RealtimeAnalyticsDashboard'
import LiveMetricsPanel from '@/components/analytics/LiveMetricsPanel'
import { Card, CardContent } from '@/components/ui/card'

export default function RealTimeAnalyticsPage() {
  const userPlan = useUserPlan() || 'starter'
  const { eventData } = useEventContext()
  const eventId = eventData?.id ?? null

  return (
    <PageWrapper>
      <FeatureGate
        feature="real-time-analytics"
        plan={userPlan}
        showUpgradeCard={true}
        upgradeCardVariant="banner"
        upgradeCardDescription="Live occupancy and event trend dashboards refreshing every 30 seconds."
      >
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-semibold">Real-Time Analytics</h1>
            <p className="text-muted-foreground text-sm">Live metrics auto-refreshing every 30 seconds. Command+ plans.</p>
          </div>

          {!eventId ? (
            <Card>
              <CardContent className="pt-6">Select an event to view real-time analytics.</CardContent>
            </Card>
          ) : (
            <>
              <LiveMetricsPanel eventId={eventId} />
              <RealtimeAnalyticsDashboard eventId={eventId} refreshInterval={30000} />
            </>
          )}
        </div>
      </FeatureGate>
    </PageWrapper>
  )
}
