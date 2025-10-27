'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrophyIcon, ClockIcon } from '@heroicons/react/24/outline'
import { mockEventData } from '@/data/mockEventData'

interface MatchScoreCardProps {
  className?: string
}

export default function MatchScoreCard({ className }: MatchScoreCardProps) {
  const match = mockEventData.football?.match

  const homeTeam = match?.homeTeam ?? 'Home'
  const awayTeam = match?.awayTeam ?? 'Away'
  const homeScore = match?.homeScore ?? 0
  const awayScore = match?.awayScore ?? 0
  const clock = match?.clock ?? '—'
  const status = match?.status ?? 'Pre-match'
  const referee = match?.referee ?? 'TBC'
  const addedTime = match?.addedTime

  return (
    <Card className={`card-depth ${className ?? ''}`}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold">
          <TrophyIcon className="h-5 w-5 text-blue-600" />
          Match Centre
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-center">
          <div>
            <div className="text-xs uppercase text-muted-foreground">Home</div>
            <div className="text-sm font-semibold text-foreground">{homeTeam}</div>
          </div>
          <div className="rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 px-4 py-2 font-semibold text-xl">
            {homeScore} – {awayScore}
          </div>
          <div>
            <div className="text-xs uppercase text-muted-foreground">Away</div>
            <div className="text-sm font-semibold text-foreground">{awayTeam}</div>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <ClockIcon className="h-4 w-4" />
            <span>{clock}</span>
          </div>
          <span className="font-medium text-foreground">{status}</span>
          <span>
            Referee {referee}
            {addedTime ? ` · Added ${addedTime}` : ''}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}

export const supportedEventTypes = ['football']
