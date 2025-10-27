'use client'

import React from 'react'
import { MusicalNoteIcon } from '@heroicons/react/24/outline'
import { mockEventData } from '@/data/mockEventData'
import ListCard from './shared/ListCard'

interface MultiStageOverviewCardProps {
  className?: string
}

export default function MultiStageOverviewCard({ className }: MultiStageOverviewCardProps) {
  const stages = mockEventData.festival?.stages ?? []

  const items = stages.map(stage => ({
    id: stage.name,
    label: stage.name,
    value: `${stage.occupancy ?? 0}%`,
    description: `${stage.nextAct ?? 'Next act TBC'} · ${stage.startTime ?? '--:--'}`,
    badge: stage.status
      ? {
          label: stage.status,
          variant: stage.status.toLowerCase().includes('delay') ? 'destructive' : 'secondary'
        }
      : undefined
  }))

  return (
    <ListCard
      className={className}
      title="Stage Overview"
      icon={<MusicalNoteIcon className="h-5 w-5 text-purple-600" />}
      items={items}
      emptyState="No stage data available"
    />
  )
}

export const supportedEventTypes = ['festival']
