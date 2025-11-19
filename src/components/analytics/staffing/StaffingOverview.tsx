'use client'

import React from 'react';
import { Loader2, Users, ShieldCheck, CalendarClock } from 'lucide-react';
import { Card } from '@/components/ui/card';
import type { StaffingForecastResult } from '@/lib/analytics/staffingForecast';
import type { StaffingIngestionBundle } from '@/lib/staffing/dataIngestion';


interface StaffingOverviewProps {
  snapshot?: StaffingIngestionBundle | null
  forecast?: StaffingForecastResult | null
  loading?: boolean
  error?: string | null
}

const formatter = new Intl.NumberFormat()

export function StaffingOverview({ snapshot, forecast, loading, error }: StaffingOverviewProps) {
  if (loading) {
    return (
      <Card className="flex items-center gap-3 p-6 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Loading staffing overview…</span>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="p-6 text-sm text-red-600 dark:text-red-300">
        {error}
      </Card>
    )
  }

  const utilisation = forecast?.utilisationPct ?? 0
  const risk = forecast?.riskLevel ?? 'low'
  const availability = snapshot?.staffAvailability

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card className="space-y-2 p-5">
        <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
          <ShieldCheck className="h-4 w-4 text-blue-500" />
          Utilisation
        </div>
        <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{utilisation}%</p>
        <p className="text-xs text-muted-foreground">
          Percentage of requested staff currently fulfilled.
        </p>
      </Card>

      <Card className="space-y-2 p-5">
        <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
          <CalendarClock className="h-4 w-4 text-amber-500" />
          Event Risk
        </div>
        <p className="text-3xl font-bold capitalize text-gray-900 dark:text-gray-100">{risk}</p>
        <p className="text-xs text-muted-foreground">
          Based on forecasted demand, incidents, and attendance pressure.
        </p>
      </Card>

      <Card className="space-y-2 p-5">
        <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
          <Users className="h-4 w-4 text-emerald-500" />
          Available Staff
        </div>
        <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          {formatter.format(availability?.availableEstimate ?? 0)}
        </p>
        <p className="text-xs text-muted-foreground">
          Out of {formatter.format(availability?.active ?? 0)} active roster members.
        </p>
      </Card>
    </div>
  )
}

