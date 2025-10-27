'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { mockEventData } from '@/data/mockEventData'
import { ClockIcon } from '@heroicons/react/24/outline'

interface DispersalMonitorCardProps {
  className?: string
}

export default function DispersalMonitorCard({ className }: DispersalMonitorCardProps) {
  const dispersal = mockEventData.parade?.dispersal

  const expectedClear = dispersal?.expectedClear ?? '—'
  const status = dispersal?.status ?? 'Monitoring'
  const zones = dispersal?.zones ?? []

  return (
    <Card className={`card-depth ${className ?? ''}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold">
          <ClockIcon className="h-5 w-5 text-blue-600" />
          Dispersal Monitoring
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="rounded-lg border border-border/60 p-3 text-xs text-muted-foreground">
          Expected clear by <span className="font-semibold text-foreground">{expectedClear}</span> · {status}
        </div>
        <div className="space-y-2">
          {zones.map(zone => {
            const completion = zone.completion ?? 0
            const value = Math.max(0, Math.min(100, completion))
            const barColor = value >= 80 ? 'bg-emerald-500' : value >= 50 ? 'bg-amber-500' : 'bg-blue-500'

            return (
              <div key={zone.zone} className="rounded-lg border border-border/60 p-2">
                <div className="flex items-center justify-between text-xs font-medium text-foreground">
                  <span>{zone.zone}</span>
                  <span>{value}%</span>
                </div>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div className={`h-full transition-all duration-300 ${barColor}`} style={{ width: `${value}%` }} />
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

export const supportedEventTypes = ['parade']
