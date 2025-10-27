'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { mockEventData } from '@/data/mockEventData'
import { MapPinIcon } from '@heroicons/react/24/outline'
import { Badge } from '@/components/ui/badge'

interface MedicalZoneMapCardProps {
  className?: string
}

export default function MedicalZoneMapCard({ className }: MedicalZoneMapCardProps) {
  const zones = mockEventData.marathon?.medicalZones ?? []

  return (
    <Card className={`card-depth ${className ?? ''}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold">
          <MapPinIcon className="h-5 w-5 text-rose-600" />
          Medical Zones
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-xs">
        {zones.map(zone => (
          <div key={zone.zone} className="rounded-lg border border-border/60 p-2">
            <div className="flex items-center justify-between text-xs font-medium text-foreground">
              <span>{zone.zone}</span>
              <Badge
                variant={zone.status?.toLowerCase() === 'responding' ? 'destructive' : zone.status?.toLowerCase() === 'stabilised' ? 'secondary' : 'outline'}
                className="text-[10px] uppercase tracking-wide"
              >
                {zone.status ?? 'Monitoring'}
              </Badge>
            </div>
            <div className="mt-1 text-xs text-muted-foreground flex items-center justify-between">
              <span>{zone.incidents ?? 0} incidents</span>
              <span>ETA {zone.eta ?? '—'}</span>
            </div>
          </div>
        ))}
        {zones.length === 0 ? <p className="text-muted-foreground">No medical zones active.</p> : null}
      </CardContent>
    </Card>
  )
}

export const supportedEventTypes = ['marathon']
