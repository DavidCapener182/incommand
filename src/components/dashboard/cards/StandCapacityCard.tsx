'use client'

import React from 'react'
import { BuildingOffice2Icon } from '@heroicons/react/24/outline'
import { mockEventData } from '@/data/mockEventData'
import ProgressCard from './shared/ProgressCard'

interface StandCapacityCardProps {
  className?: string
}

export default function StandCapacityCard({ className }: StandCapacityCardProps) {
  const stands = mockEventData.football?.stands ?? []

  const totalCapacity = stands.reduce((sum, stand) => sum + (stand.capacity ?? 0), 0)
  const totalOccupancy = stands.reduce((sum, stand) => sum + (stand.occupancy ?? 0), 0)
  const capacityPercent = totalCapacity > 0 ? Math.round((totalOccupancy / totalCapacity) * 100) : 0

  const items = stands.map(stand => {
    const capacity = stand.capacity ?? 0
    const occupancy = stand.occupancy ?? 0
    const value = capacity > 0 ? Math.round((occupancy / capacity) * 100) : 0

    let status: 'default' | 'warning' | 'danger' = 'default'
    if (value >= 95) {
      status = 'danger'
    } else if (value >= 85) {
      status = 'warning'
    }

    return {
      id: stand.name,
      label: stand.name,
      value,
      status,
      description: `${occupancy.toLocaleString()} / ${capacity.toLocaleString()}`
    }
  })

  return (
    <ProgressCard
      className={className}
      title="Stand Capacity"
      icon={<BuildingOffice2Icon className="h-5 w-5 text-blue-600" />}
      items={items}
      footer={
        <div className="flex items-center justify-between">
          <span>Total Stadium Capacity</span>
          <span className="font-semibold">
            {totalOccupancy.toLocaleString()} / {totalCapacity.toLocaleString()} ({capacityPercent}%)
          </span>
        </div>
      }
    />
  )
}

export const supportedEventTypes = ['football']
