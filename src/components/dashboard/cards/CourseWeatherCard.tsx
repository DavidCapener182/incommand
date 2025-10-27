'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { mockEventData } from '@/data/mockEventData'
import { CloudIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'

interface CourseWeatherCardProps {
  className?: string
}

export default function CourseWeatherCard({ className }: CourseWeatherCardProps) {
  const weather = mockEventData.marathon?.courseWeather

  const segments = weather?.segments ?? []
  const alerts = weather?.alerts ?? []

  return (
    <Card className={`card-depth ${className ?? ''}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold">
          <CloudIcon className="h-5 w-5 text-blue-600" />
          Course Weather
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-xs text-muted-foreground">
        <div className="space-y-2">
          {segments.map(segment => (
            <div key={segment.location} className="rounded-lg border border-border/60 p-2">
              <div className="flex items-center justify-between text-xs font-medium text-foreground">
                <span>{segment.location}</span>
                <span>{segment.temperature}</span>
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                {segment.condition} · Wind {segment.wind}
              </div>
            </div>
          ))}
          {segments.length === 0 ? <p>No segment weather data.</p> : null}
        </div>
        {alerts.length > 0 ? (
          <div className="space-y-1">
            {alerts.map(alert => (
              <div key={alert} className="flex items-center gap-2 text-xs text-amber-600">
                <ExclamationTriangleIcon className="h-4 w-4" />
                <span>{alert}</span>
              </div>
            ))}
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}

export const supportedEventTypes = ['marathon']
