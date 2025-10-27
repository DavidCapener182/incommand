'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { HeartIcon, UserGroupIcon, HomeModernIcon } from '@heroicons/react/24/outline'
import { mockEventData } from '@/data/mockEventData'

interface WelfareCardProps {
  className?: string
}

export default function WelfareCard({ className }: WelfareCardProps) {
  const welfare = mockEventData.festival?.welfare

  const lostPersons = welfare?.lostPersons ?? 0
  const reunions = welfare?.reunions ?? 0
  const welfareIncidents = welfare?.welfareIncidents ?? 0
  const aidTents = welfare?.activeAidTents ?? []

  return (
    <Card className={`card-depth ${className ?? ''}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold">
          <HeartIcon className="h-5 w-5 text-pink-600" />
          Welfare & Support
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-lg border border-border/60 p-2">
            <UserGroupIcon className="mx-auto h-5 w-5 text-blue-500" />
            <p className="mt-1 text-lg font-semibold text-foreground">{lostPersons}</p>
            <p className="text-xs text-muted-foreground">Lost persons</p>
          </div>
          <div className="rounded-lg border border-border/60 p-2">
            <UserGroupIcon className="mx-auto h-5 w-5 text-emerald-500" />
            <p className="mt-1 text-lg font-semibold text-foreground">{reunions}</p>
            <p className="text-xs text-muted-foreground">Reunited</p>
          </div>
          <div className="rounded-lg border border-border/60 p-2">
            <HeartIcon className="mx-auto h-5 w-5 text-amber-500" />
            <p className="mt-1 text-lg font-semibold text-foreground">{welfareIncidents}</p>
            <p className="text-xs text-muted-foreground">Active welfare cases</p>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Aid Tents</p>
          <div className="space-y-2">
            {aidTents.length === 0 ? (
              <p className="text-xs text-muted-foreground">No aid tent data available.</p>
            ) : (
              aidTents.map(tent => (
                <div
                  key={tent.name}
                  className="flex items-center justify-between rounded-lg border border-border/60 p-2 text-xs"
                >
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <HomeModernIcon className="h-4 w-4" />
                    <span className="font-medium text-foreground">{tent.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={tent.status?.toLowerCase() === 'busy' ? 'destructive' : tent.status?.toLowerCase() === 'stable' ? 'secondary' : 'outline'}
                      className="text-[10px] uppercase tracking-wide"
                    >
                      {tent.status ?? 'Unknown'}
                    </Badge>
                    <span className="text-muted-foreground">Wait {tent.waitTime ?? '—'}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export const supportedEventTypes = ['festival']
