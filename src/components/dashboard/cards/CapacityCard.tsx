'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  BuildingOffice2Icon, 
  ArrowUpIcon, 
  ArrowDownIcon,
  ClockIcon
} from '@heroicons/react/24/outline'
import { mockEventData } from '@/data/mockEventData'

interface CapacityCardProps {
  className?: string
}

export default function CapacityCard({ className }: CapacityCardProps) {
  const data = mockEventData.football

  // Use available data or provide defaults
  const currentOccupancy = data.currentOccupancy || Math.round((data.currentCapacityPercentage / 100) * 50000) // Assume 50k capacity
  const totalCapacity = data.totalCapacity || 50000
  const capacityPercentage = data.currentCapacityPercentage || Math.round((currentOccupancy / totalCapacity) * 100)
  const isNearCapacity = capacityPercentage >= 90
  const isAtCapacity = capacityPercentage >= 100

  const getCapacityColor = () => {
    if (isAtCapacity) return 'text-red-500'
    if (isNearCapacity) return 'text-amber-500'
    return 'text-green-500'
  }

  const getCapacityBgColor = () => {
    if (isAtCapacity) return 'bg-red-50 dark:bg-red-900/20'
    if (isNearCapacity) return 'bg-amber-50 dark:bg-amber-900/20'
    return 'bg-green-50 dark:bg-green-900/20'
  }

  const getProgressColor = () => {
    if (isAtCapacity) return 'bg-red-500'
    if (isNearCapacity) return 'bg-amber-500'
    return 'bg-green-500'
  }

  return (
    <Card className={`card-depth ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold">
          <BuildingOffice2Icon className="h-5 w-5 text-blue-600" />
          Stadium Capacity
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main capacity display */}
        <div className="text-center">
          <div className={`text-3xl font-bold ${getCapacityColor()}`}>
            {capacityPercentage}%
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {currentOccupancy.toLocaleString()} / {totalCapacity.toLocaleString()}
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
          <div 
            className={`h-3 rounded-full transition-all duration-300 ${getProgressColor()}`}
            style={{ width: `${Math.min(capacityPercentage, 100)}%` }}
          />
        </div>

        {/* Entry/Exit metrics */}
        <div className="grid grid-cols-2 gap-3">
          <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="flex items-center justify-center gap-1 mb-1">
              <ArrowUpIcon className="h-4 w-4 text-blue-600" />
              <span className="text-lg font-semibold text-blue-600">{data.entryExitRate}</span>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">Entry Rate/min</p>
          </div>
          
          <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex items-center justify-center gap-1 mb-1">
              <ClockIcon className="h-4 w-4 text-gray-600" />
              <span className="text-lg font-semibold text-gray-600">2m 30s</span>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">Avg Wait Time</p>
          </div>
        </div>

        {/* Turnstile status */}
        <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">Turnstile Flow</span>
            <Badge 
              variant={data.turnstileFlow < 1000 ? 'destructive' : data.turnstileFlow < 2000 ? 'secondary' : 'default'}
              className="text-xs"
            >
              {data.turnstileFlow > 2000 ? 'High' : data.turnstileFlow > 1000 ? 'Normal' : 'Slow'}
            </Badge>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            8 of 12 gates active
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Export supported event types for conditional rendering
export const supportedEventTypes = ['football'];
