'use client'

import dynamic from 'next/dynamic'
import { Suspense } from 'react'
import { KPISectionSkeleton, TrendsSkeleton, HeatmapSkeleton } from './analytics/Skeletons'
import IncidentVolumeCard from './analytics/cards/IncidentVolumeCard'
import ResponseTimeDistributionCard from './analytics/cards/ResponseTimeDistributionCard'
import AttendanceTimelineCard from './analytics/cards/AttendanceTimelineCard'
import EjectionPatternsCard from './analytics/cards/EjectionPatternsCard'

const KPISection = dynamic(() => import('./analytics/AnalyticsKPICards'), {
  ssr: false,
  loading: () => <KPISectionSkeleton />
})

export default function AnalyticsDashboard({ data }: { data: any }) {
  // Safely access nested properties with fallbacks
  const incidentVolumeData = data?.trends?.incidentVolumeData || []
  const responseTimeData = data?.trends?.responseTimeData || []
  const attendanceTimelineData = data?.activity?.attendanceTimelineData || []
  const ejectionPatternData = data?.activity?.ejectionPatternData || []

  return (
    <div className="space-y-8">
      <Suspense fallback={<KPISectionSkeleton />}>
        <KPISection />
      </Suspense>

      {/* Chart Cards - 2 per row on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <IncidentVolumeCard incidentVolumeData={incidentVolumeData} />
        <ResponseTimeDistributionCard responseTimeData={responseTimeData} />
        <AttendanceTimelineCard attendanceTimelineData={attendanceTimelineData} />
        <EjectionPatternsCard ejectionPatternData={ejectionPatternData} />
      </div>
    </div>
  )
}
