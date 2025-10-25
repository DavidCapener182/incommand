'use client'

import dynamic from 'next/dynamic'
import { Suspense } from 'react'
import { KPISectionSkeleton, TrendsSkeleton, HeatmapSkeleton } from './analytics/Skeletons'

const KPISection = dynamic(() => import('./analytics/AnalyticsKPICards'), {
  ssr: false,
  loading: () => <KPISectionSkeleton />
})

const TrendsGraph = dynamic(() => import('./analytics/TrendsGraph'), {
  ssr: false,
  loading: () => <TrendsSkeleton />
})

const ActivityHeatmap = dynamic(() => import('./analytics/ActivityHeatmap'), {
  ssr: false,
  loading: () => <HeatmapSkeleton />
})

export default function AnalyticsDashboard({ data }: { data: any }) {
  return (
    <div className="space-y-8">
      <Suspense fallback={<KPISectionSkeleton />}>
        <KPISection />
      </Suspense>

      <Suspense fallback={<TrendsSkeleton />}>
        <TrendsGraph trends={data.trends} />
      </Suspense>

      <Suspense fallback={<HeatmapSkeleton />}>
        <ActivityHeatmap activity={data.activity} />
      </Suspense>
    </div>
  )
}
