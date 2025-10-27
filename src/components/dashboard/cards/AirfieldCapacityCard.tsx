'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { mockEventData } from '@/data/mockEventData'
import { BuildingOfficeIcon } from '@heroicons/react/24/outline'
import { Badge } from '@/components/ui/badge'

interface AirfieldCapacityCardProps {
  className?: string
}

export default function AirfieldCapacityCard({ className }: AirfieldCapacityCardProps) {
  const capacity = mockEventData.airshow?.airfieldCapacity

  const standsAvailable = capacity?.standsAvailable ?? 0
  const standsTotal = capacity?.standsTotal ?? 0
  const runwayStatus = capacity?.runwayStatus ?? 'Unknown'
  const groundMovements = capacity?.groundMovements ?? {}
  const fuelStatus = capacity?.fuelStatus ?? '—'

  const occupancyPercent = standsTotal > 0 ? Math.round(((standsTotal - standsAvailable) / standsTotal) * 100) : 0

  return (
    <Card className={`card-depth ${className ?? ''}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold">
          <BuildingOfficeIcon className="h-5 w-5 text-sky-600" />
          Airfield Capacity
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-xs text-muted-foreground">
        <div className="flex items-center justify-between rounded-lg border border-border/60 p-3">
          <div>
            <p className="text-sm font-semibold text-foreground">Stands available</p>
            <p>{standsAvailable} of {standsTotal}</p>
          </div>
          <div className="rounded-full bg-sky-100 px-3 py-1 text-sm font-semibold text-sky-700 dark:bg-sky-900/30 dark:text-sky-300">
            {occupancyPercent}% occupied
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-lg border border-border/60 p-2 text-center">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Taxiing</p>
            <p className="text-lg font-semibold text-foreground">{groundMovements.taxiing ?? 0}</p>
          </div>
          <div className="rounded-lg border border-border/60 p-2 text-center">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Holding</p>
            <p className="text-lg font-semibold text-foreground">{groundMovements.holding ?? 0}</p>
          </div>
          <div className="rounded-lg border border-border/60 p-2 text-center">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Departures</p>
            <p className="text-lg font-semibold text-foreground">{groundMovements.departuresQueued ?? 0}</p>
          </div>
        </div>

        <div className="flex items-center justify-between rounded-lg border border-border/60 p-2">
          <span>Runway</span>
          <Badge variant={runwayStatus.toLowerCase() === 'active' ? 'secondary' : 'outline'} className="text-[10px] uppercase tracking-wide">
            {runwayStatus}
          </Badge>
        </div>
        <div className="flex items-center justify-between rounded-lg border border-border/60 p-2">
          <span>Fuel</span>
          <span className="font-semibold text-foreground">{fuelStatus}</span>
        </div>
      </CardContent>
    </Card>
  )
}

export const supportedEventTypes = ['airshow']
