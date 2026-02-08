'use client'

import Link from 'next/link'

/**
 * Real-Time Analytics Feature
 * Live occupancy and event trend dashboards.
 * Available on: Command, Enterprise plans
 */

export default function RealTimeAnalytics() {
  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold mb-2">Real-Time Analytics</h2>
      <p className="text-muted-foreground text-sm mb-4">
        Live occupancy and event trend dashboards. Available on Command and Enterprise plans.
      </p>
      <Link
        href="/analytics/real-time"
        className="inline-flex items-center rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
      >
        Open real-time analytics
      </Link>
    </div>
  )
}



