'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { mockEventData } from '@/data/mockEventData'
import { FlagIcon } from '@heroicons/react/24/outline'

interface RunnerProgressCardProps {
  className?: string
}

export default function RunnerProgressCard({ className }: RunnerProgressCardProps) {
  const progress = mockEventData.marathon?.runnerProgress

  const leadPack = progress?.leadPack ?? []
  const pace = progress?.averagePace ?? '—'
  const gap = progress?.chasingPackGap ?? '—'
  const lastUpdate = progress?.lastUpdate ?? '—'

  return (
    <Card className={`card-depth ${className ?? ''}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold">
          <FlagIcon className="h-5 w-5 text-emerald-600" />
          Lead Runner Progress
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-xs text-muted-foreground">
        <div className="flex items-center justify-between rounded-lg border border-border/60 p-2">
          <span>Average pace</span>
          <span className="font-semibold text-foreground">{pace}</span>
        </div>
        <div className="flex items-center justify-between rounded-lg border border-border/60 p-2">
          <span>Gap to chasing pack</span>
          <span className="font-semibold text-foreground">{gap}</span>
        </div>
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Lead pack</p>
          <div className="space-y-2">
            {leadPack.length === 0 ? (
              <p>No runner data available.</p>
            ) : (
              leadPack.map(runner => (
                <div key={runner.bib} className="rounded-lg border border-border/60 p-2">
                  <div className="flex items-center justify-between text-xs font-medium text-foreground">
                    <span>{runner.name}</span>
                    <span>{runner.location}</span>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">Bib {runner.bib} · Split {runner.split}</div>
                </div>
              ))
            )}
          </div>
        </div>
        <p className="text-right text-[10px] uppercase tracking-wide">Last update {lastUpdate}</p>
      </CardContent>
    </Card>
  )
}

export const supportedEventTypes = ['marathon']
