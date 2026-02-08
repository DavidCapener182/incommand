'use client'

import Link from 'next/link'

/**
 * Real-Time Incident Dashboard Feature
 * Live feed of incidents with geolocation and status tracking.
 * Available on: Operational, Command, Enterprise plans
 */

export default function RealTimeIncidentDashboard() {
  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold mb-2">Real-Time Incident Dashboard</h2>
      <p className="text-muted-foreground text-sm mb-4">
        Live feed of incidents with geolocation and status tracking on a map. Available on Operational, Command, and Enterprise plans.
      </p>
      <Link
        href="/incidents/real-time"
        className="inline-flex items-center rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
      >
        Open real-time dashboard
      </Link>
    </div>
  )
}



