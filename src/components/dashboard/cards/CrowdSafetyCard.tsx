'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { mockEventData } from '@/data/mockEventData'
import { ShieldCheckIcon, MegaphoneIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import { Badge } from '@/components/ui/badge'

interface CrowdSafetyCardProps {
  className?: string
}

export default function CrowdSafetyCard({ className }: CrowdSafetyCardProps) {
  const safety = mockEventData.airshow?.crowdSafety

  const incidents = safety?.incidents ?? []
  const restrictedZones = safety?.restrictedZones ?? []
  const announcements = safety?.publicAnnouncements ?? []
  const fencingAlerts = safety?.fencingAlerts ?? 0

  return (
    <Card className={`card-depth ${className ?? ''}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold">
          <ShieldCheckIcon className="h-5 w-5 text-emerald-600" />
          Crowd Safety
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-xs text-muted-foreground">
        <div className="flex items-center justify-between rounded-lg border border-border/60 p-2">
          <span>Fencing alerts</span>
          <Badge variant={fencingAlerts > 0 ? 'destructive' : 'secondary'} className="text-[10px] uppercase tracking-wide">
            {fencingAlerts}
          </Badge>
        </div>
        <div>
          <p className="mb-1 text-[10px] uppercase tracking-wide text-muted-foreground">Active incidents</p>
          <div className="space-y-1">
            {incidents.length === 0 ? (
              <p>No crowd incidents reported.</p>
            ) : (
              incidents.map(incident => (
                <div key={`${incident.type}-${incident.location}`} className="flex items-center gap-2">
                  <ExclamationTriangleIcon className="h-4 w-4 text-amber-500" />
                  <span>{incident.type} · {incident.location} ({incident.status})</span>
                </div>
              ))
            )}
          </div>
        </div>
        <div>
          <p className="mb-1 text-[10px] uppercase tracking-wide text-muted-foreground">Restricted zones</p>
          <div className="flex flex-wrap gap-1">
            {restrictedZones.map(zone => (
              <Badge key={zone} variant="outline" className="text-[10px] uppercase tracking-wide">
                {zone}
              </Badge>
            ))}
            {restrictedZones.length === 0 ? <p>No restrictions.</p> : null}
          </div>
        </div>
        <div>
          <p className="mb-1 text-[10px] uppercase tracking-wide text-muted-foreground">Announcements</p>
          <div className="space-y-1">
            {announcements.map(announcement => (
              <div key={announcement} className="flex items-center gap-2">
                <MegaphoneIcon className="h-4 w-4 text-blue-500" />
                <span>{announcement}</span>
              </div>
            ))}
            {announcements.length === 0 ? <p>No announcements queued.</p> : null}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export const supportedEventTypes = ['airshow']
