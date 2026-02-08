'use client'

import React from 'react'
import VenueCalendar from '@/components/calendar/VenueCalendar'
import { FeatureGate } from '@/components/FeatureGate'
import { useUserPlan } from '@/hooks/useUserPlan'
import { PageWrapper } from '@/components/layout/PageWrapper'

export default function CalendarPage() {
  const userPlan = useUserPlan() || 'starter'

  return (
    <PageWrapper>
      <FeatureGate
        feature="venue-calendar"
        plan={userPlan}
        showUpgradeCard={true}
        upgradeCardVariant="card"
        upgradeCardDescription="View all your venue bookings in a visual calendar. See which dates are booked and which are available across all your venues."
      >
        <VenueCalendar />
      </FeatureGate>
    </PageWrapper>
  )
}

