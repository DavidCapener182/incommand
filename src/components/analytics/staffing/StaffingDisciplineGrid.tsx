'use client'

import React from 'react'
import { Card } from '@/components/ui/card'
import type { StaffingForecastResult } from '@/lib/analytics/staffingForecast'
import type { StaffingIngestionBundle } from '@/lib/staffing/dataIngestion'
import { DISCIPLINE_META } from '@/lib/staffing/discipline'

interface StaffingDisciplineGridProps {
  snapshot?: StaffingIngestionBundle | null
  forecast?: StaffingForecastResult | null
}

export function StaffingDisciplineGrid({ snapshot, forecast }: StaffingDisciplineGridProps) {
  if (!snapshot) {
    return null
  }

  const disciplineMap = new Map(snapshot.disciplines.map((item) => [item.discipline, item]))
  const forecastMap = new Map(forecast?.disciplines.map((item) => [item.discipline, item]))

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {snapshot.requiredDisciplines.map((discipline) => {
        const snapshotDiscipline = disciplineMap.get(discipline)
        const forecastDiscipline = forecastMap.get(discipline)
        const planned = snapshotDiscipline?.planned ?? 0
        const actual = snapshotDiscipline?.actual ?? 0
        const recommended = forecastDiscipline?.recommended ?? planned
        const meta = DISCIPLINE_META[discipline]

        const gap = actual - planned
        const gapDisplay =
          gap > 0 ? `+${gap.toLocaleString()}` : gap.toLocaleString()
        const fulfillment =
          planned > 0 ? Math.min(100, Math.round((actual / planned) * 100)) : actual > 0 ? 100 : 0

        return (
          <Card key={discipline} className="space-y-4 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase text-muted-foreground">{meta.label}</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                  {actual.toLocaleString()} / {planned.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">On-site vs. planned</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-muted-foreground">Fulfillment</p>
                <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{fulfillment}%</p>
              </div>
            </div>

            <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-700 transition-all"
                style={{ width: `${Math.min(fulfillment, 100)}%` }}
              />
            </div>

            <dl className="grid grid-cols-3 gap-3 text-xs">
              <div>
                <dt className="text-muted-foreground">Requested</dt>
                <dd className="font-semibold text-gray-900 dark:text-gray-100">{planned.toLocaleString()}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Forecast</dt>
                <dd className="font-semibold text-gray-900 dark:text-gray-100">
                  {recommended.toLocaleString()}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Gap</dt>
                <dd
                  className={`font-semibold ${
                    gap < 0
                      ? 'text-red-600 dark:text-red-300'
                      : gap > 0
                      ? 'text-green-600 dark:text-green-300'
                      : 'text-gray-900 dark:text-gray-100'
                  }`}
                >
                  {gapDisplay}
                </dd>
              </div>
            </dl>

            {forecastDiscipline && (
              <p className="text-xs text-muted-foreground">
                Confidence {Math.round(forecastDiscipline.confidence * 100)}% · Risk{' '}
                <span className="capitalize">{forecastDiscipline.risk}</span>
              </p>
            )}
          </Card>
        )
      })}
    </div>
  )
}
