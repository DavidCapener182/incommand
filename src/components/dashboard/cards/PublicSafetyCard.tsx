'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  UserGroupIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'
import { mockEventData } from '@/data/mockEventData'

interface PublicSafetyCardProps {
  className?: string
}

export default function PublicSafetyCard({ className }: PublicSafetyCardProps) {
  const parade = mockEventData.parade
  const safety = parade?.publicSafety
  const crowdZones = parade?.crowdZones ?? []

  const crowdIncidents = safety?.crowdIncidents ?? 0
  const missingActive = safety?.missingPersons?.active ?? 0
  const missingResolved = safety?.missingPersons?.resolved ?? 0
  const firstAid = safety?.firstAidResponses ?? 0
  const pressureNotes = safety?.crowdPressureNotes ?? []

  return (
    <Card className={`card-depth ${className ?? ''}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold">
          <ShieldCheckIcon className="h-5 w-5 text-blue-600" />
          Public Safety
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-2">
          <div className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 text-center bg-blue-50 dark:bg-blue-900/20">
            <ShieldCheckIcon className="mx-auto h-5 w-5 text-blue-600" />
            <div className="text-lg font-bold text-blue-700 dark:text-blue-300">{crowdIncidents}</div>
            <p className="text-xs text-muted-foreground">Crowd incidents</p>
          </div>
          <div className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 text-center bg-amber-50 dark:bg-amber-900/20">
            <UserGroupIcon className="mx-auto h-5 w-5 text-amber-600" />
            <div className="text-lg font-bold text-amber-600">{missingActive}</div>
            <p className="text-xs text-muted-foreground">Missing persons</p>
          </div>
          <div className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 text-center bg-emerald-50 dark:bg-emerald-900/20">
            <CheckCircleIcon className="mx-auto h-5 w-5 text-emerald-600" />
            <div className="text-lg font-bold text-emerald-600">{missingResolved}</div>
            <p className="text-xs text-muted-foreground">Resolved cases</p>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-foreground">First aid responses</span>
            <Badge variant={firstAid > 3 ? 'destructive' : 'secondary'} className="text-xs">
              {firstAid}
            </Badge>
          </div>
          <div className="text-xs text-muted-foreground">Latest attention: {pressureNotes[0] ?? 'All clear'}</div>
        </div>

        <div className="space-y-1">
          <div className="text-sm font-medium text-gray-600 dark:text-gray-400">High attention zones</div>
          {pressureNotes.length === 0 ? (
            <p className="text-xs text-muted-foreground">No pressure alerts.</p>
          ) : (
            pressureNotes.map(note => (
              <div key={note} className="flex items-center gap-2 text-xs">
                <ExclamationTriangleIcon className="h-3 w-3 text-amber-500" />
                <span className="text-muted-foreground">{note}</span>
              </div>
            ))
          )}
        </div>

        <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
          <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Zone density snapshot</div>
          <div className="grid grid-cols-3 gap-2">
            {crowdZones.map(zone => (
              <div key={zone.zone} className="rounded-lg border border-gray-200 dark:border-gray-700 p-2 text-center">
                <span className="text-xs font-semibold text-foreground">{zone.zone}</span>
                <div className="text-lg font-bold text-foreground">{zone.density}%</div>
                <Badge
                  variant={zone.status === 'congested' ? 'destructive' : zone.status === 'moderate' ? 'secondary' : 'outline'}
                  className="text-[10px] uppercase tracking-wide"
                >
                  {zone.status}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export const supportedEventTypes = ['parade']
