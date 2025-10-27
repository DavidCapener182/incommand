'use client'

import React from 'react'
import { mockEventData } from '@/data/mockEventData'
import { LifebuoyIcon } from '@heroicons/react/24/outline'
import ListCard from './shared/ListCard'

interface AidStationStatusCardProps {
  className?: string
}

export default function AidStationStatusCard({ className }: AidStationStatusCardProps) {
  const stations = mockEventData.marathon?.aidStations ?? []

  const items = stations.map(station => ({
    id: station.name,
    label: station.name,
    value: `${station.hydrationLevel ?? 0}%`,
    description: `${station.medicalIncidents ?? 0} medical incidents`,
    badge: station.status
      ? {
          label: station.status,
          variant: station.status.toLowerCase() === 'strained' ? 'destructive' : station.status.toLowerCase() === 'busy' ? 'warning' : 'secondary'
        }
      : undefined
  }))

  return (
    <ListCard
      className={className}
      title="Aid Station Status"
      icon={<LifebuoyIcon className="h-5 w-5 text-sky-600" />}
      items={items}
      emptyState="No aid station data"
    />
  )
}

export const supportedEventTypes = ['marathon']
