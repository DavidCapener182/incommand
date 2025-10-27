'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { mockEventData } from '@/data/mockEventData'
import { CloudIcon } from '@heroicons/react/24/outline'

interface WeatherAviationCardProps {
  className?: string
}

export default function WeatherAviationCard({ className }: WeatherAviationCardProps) {
  const weather = mockEventData.airshow?.weather

  const visibility = weather?.visibility ?? '—'
  const wind = weather?.wind ?? '—'
  const ceiling = weather?.cloudCeiling ?? '—'
  const temperature = weather?.temperature ?? '—'
  const qnh = weather?.qnh ?? '—'
  const notes = weather?.notes

  return (
    <Card className={`card-depth ${className ?? ''}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold">
          <CloudIcon className="h-5 w-5 text-sky-600" />
          Aviation Weather
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-xs text-muted-foreground">
        <div className="grid grid-cols-2 gap-2">
          <Info label="Visibility" value={visibility} />
          <Info label="Wind" value={wind} />
          <Info label="Cloud ceiling" value={ceiling} />
          <Info label="Temperature" value={temperature} />
          <Info label="QNH" value={qnh} />
        </div>
        {notes ? (
          <div className="rounded-lg border border-border/60 p-2 text-xs text-foreground">
            {notes}
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border/60 p-2">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold text-foreground">{value}</p>
    </div>
  )
}

export const supportedEventTypes = ['airshow']
