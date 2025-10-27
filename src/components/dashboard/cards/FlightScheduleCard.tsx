'use client'

import React from 'react'
import { mockEventData } from '@/data/mockEventData'
import ListCard from './shared/ListCard'
import { PaperAirplaneIcon } from '@heroicons/react/24/outline'

interface FlightScheduleCardProps {
  className?: string
}

export default function FlightScheduleCard({ className }: FlightScheduleCardProps) {
  const flights = mockEventData.airshow?.flightSchedule ?? []

  const items = flights.map(flight => ({
    id: `${flight.slot}-${flight.aircraft}`,
    label: `${flight.slot} · ${flight.aircraft}`,
    description: flight.remarks,
    badge: flight.status
      ? {
          label: flight.status,
          variant: flight.status.toLowerCase() === 'airborne' ? 'secondary' : flight.status.toLowerCase() === 'holding' ? 'warning' : 'outline'
        }
      : undefined
  }))

  return (
    <ListCard
      className={className}
      title="Flight Schedule"
      icon={<PaperAirplaneIcon className="h-5 w-5 text-sky-600" />}
      items={items}
      emptyState="No scheduled sorties"
    />
  )
}

export const supportedEventTypes = ['airshow']
