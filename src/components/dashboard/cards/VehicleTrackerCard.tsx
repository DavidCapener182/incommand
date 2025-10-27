'use client'

import React from 'react'
import { TruckIcon } from '@heroicons/react/24/outline'
import { mockEventData } from '@/data/mockEventData'
import ListCard from './shared/ListCard'

interface VehicleTrackerCardProps {
  className?: string
}

export default function VehicleTrackerCard({ className }: VehicleTrackerCardProps) {
  const vehicles = mockEventData.parade?.vehicles

  const monitoring = vehicles?.monitoring ?? []
  const floats = vehicles?.floatsInRoute ?? 0
  const emergency = vehicles?.emergencyVehicles ?? 0
  const delays = vehicles?.delays ?? 0

  const header = (
    <div className="flex items-center justify-between text-xs text-muted-foreground">
      <span>Floats: {floats}</span>
      <span>Emergency: {emergency}</span>
      <span>Delays: {delays}</span>
    </div>
  )

  const items = monitoring.map(item => ({
    id: item.name,
    label: item.name,
    description: item.location ?? 'Location unknown',
    badge: item.status
      ? {
          label: item.status,
          variant: item.status.toLowerCase().includes('delay') ? 'destructive' : 'secondary'
        }
      : undefined
  }))

  return (
    <ListCard
      className={className}
      title="Vehicle Tracker"
      icon={<TruckIcon className="h-5 w-5 text-blue-600" />}
      items={items}
      emptyState="No vehicles tracked"
      footer={header}
    />
  )
}

export const supportedEventTypes = ['parade']
