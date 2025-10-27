'use client'

import React from 'react'
import { FireIcon } from '@heroicons/react/24/outline'
import { mockEventData } from '@/data/mockEventData'
import ListCard from './shared/ListCard'

interface IncidentSummaryCardProps {
  className?: string
}

export default function IncidentSummaryCard({ className }: IncidentSummaryCardProps) {
  const incidents = mockEventData.festival?.incidentsByZone ?? []

  const items = incidents.map(incident => ({
    id: incident.zone,
    label: incident.zone,
    value: incident.count,
    description: incident.type,
    badge: {
      label: incident.type,
      variant: incident.type?.toLowerCase().includes('medical') ? 'destructive' : 'secondary'
    }
  }))

  return (
    <ListCard
      className={className}
      title="Incident Summary"
      icon={<FireIcon className="h-5 w-5 text-red-600" />}
      items={items}
      emptyState="No incidents reported"
    />
  )
}

export const supportedEventTypes = ['festival']
