'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { mockEventData } from '@/data/mockEventData'
import {
  ArrowRightOnRectangleIcon,
  BoltIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'

interface TurnstileStatusCardProps {
  className?: string
}

export default function TurnstileStatusCard({ className }: TurnstileStatusCardProps) {
  const turnstiles = mockEventData.football?.turnstiles

  const open = turnstiles?.open ?? 0
  const total = turnstiles?.total ?? 0
  const throughput = turnstiles?.throughputPerMinute ?? 0
  const averageQueue = turnstiles?.queueTime?.average ?? '—'
  const longestQueue = turnstiles?.queueTime?.longest ?? '—'
  const closedGates = turnstiles?.closedGates ?? []
  const alerts = turnstiles?.alerts ?? 0

  const openPercentage = total > 0 ? Math.round((open / total) * 100) : 0

  const alertVariant = alerts > 0 ? 'destructive' : 'secondary'

  return (
    <Card className={`card-depth ${className ?? ''}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold">
          <ArrowRightOnRectangleIcon className="h-5 w-5 text-blue-600" />
          Turnstile Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Open Turnstiles</p>
            <p className="text-2xl font-bold text-foreground">{open}</p>
            <p className="text-xs text-muted-foreground">{total} total ({openPercentage}%)</p>
          </div>
          <div className="rounded-xl bg-blue-50 dark:bg-blue-900/20 px-3 py-2 text-center">
            <p className="text-xs uppercase text-blue-600">Throughput</p>
            <p className="text-lg font-semibold text-blue-600">{throughput.toLocaleString()} / min</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs text-muted-foreground">
          <div className="rounded-lg border border-border/60 p-3">
            <p className="font-semibold text-foreground">Average Queue</p>
            <p>{averageQueue}</p>
          </div>
          <div className="rounded-lg border border-border/60 p-3">
            <p className="font-semibold text-foreground">Longest Queue</p>
            <p>{longestQueue}</p>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <BoltIcon className="h-4 w-4 text-amber-500" />
            <span>{closedGates.length} gates offline</span>
          </div>
          {closedGates.length > 0 ? (
            <div className="flex gap-1">
              {closedGates.map(gate => (
                <Badge key={gate} variant="outline" className="text-[10px] uppercase tracking-wide">
                  {gate}
                </Badge>
              ))}
            </div>
          ) : (
            <Badge variant="secondary" className="text-[10px] uppercase tracking-wide">
              All operational
            </Badge>
          )}
        </div>

        <div className="flex items-center justify-between rounded-lg border border-border/60 p-2 text-xs">
          <div className="flex items-center gap-2 text-muted-foreground">
            <ExclamationTriangleIcon className="h-4 w-4 text-amber-500" />
            <span>Active alerts</span>
          </div>
          <Badge variant={alertVariant} className="text-[10px] uppercase tracking-wide">
            {alerts}
          </Badge>
        </div>
      </CardContent>
    </Card>
  )
}

export const supportedEventTypes = ['football']
