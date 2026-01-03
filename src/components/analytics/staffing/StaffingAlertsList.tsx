'use client'

import React from 'react'
import type { StaffingForecastResult } from '@/lib/analytics/staffingForecast'
import type { StaffingIngestionBundle } from '@/lib/staffing/dataIngestion'
import { Card } from '@/components/ui/card'
import { AlertTriangle } from 'lucide-react'

interface StaffingAlertsListProps {
  forecast?: StaffingForecastResult | null
  snapshot?: StaffingIngestionBundle | null
}

export function StaffingAlertsList({ forecast, snapshot }: StaffingAlertsListProps) {
  if (!forecast) return null

  const alerts = forecast.disciplines
    .filter((discipline) => discipline.risk !== 'low')
    .map((discipline) => ({
      discipline: discipline.label,
      shortfall: discipline.shortfall,
      risk: discipline.risk,
    }))

  if (alerts.length === 0) {
    const anyActuals =
      snapshot?.disciplines?.some((discipline) => discipline.actual > 0 || discipline.planned > 0) ?? false
    return (
      <Card className="p-5 text-sm text-muted-foreground">
        {anyActuals
          ? 'Staffing levels look good — no shortages detected.'
          : 'Staffing levels have not been captured yet. Add requested and confirmed counts to begin tracking.'}
      </Card>
    )
  }

  return (
    <Card className="space-y-4 p-5">
      <div className="flex items-center gap-2 text-sm font-semibold text-amber-600 dark:text-amber-300">
        <AlertTriangle className="h-4 w-4" />
        Staffing Alerts
      </div>
      <ul className="space-y-3">
        {alerts.map((alert) => (
          <li
            key={alert.discipline}
            className="rounded-lg border border-amber-100 bg-amber-50/60 p-3 dark:border-amber-800/40 dark:bg-amber-900/20"
          >
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">
              {alert.discipline} · {alert.risk.toUpperCase()} risk
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-300">
              Shortfall of {alert.shortfall} personnel vs forecast.
            </p>
          </li>
        ))}
      </ul>
    </Card>
  )
}

