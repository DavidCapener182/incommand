'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  MusicalNoteIcon, 
  ClockIcon, 
  UsersIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline'
import { mockEventData } from '@/data/mockEventData'

interface MultiStageCardProps {
  className?: string
}

export default function MultiStageCard({ className }: MultiStageCardProps) {
  const data = mockEventData.festival

  const getOccupancyColor = (occupancy: number) => {
    if (occupancy >= 90) return 'text-red-500'
    if (occupancy >= 70) return 'text-amber-500'
    return 'text-green-500'
  }

  const getOccupancyBgColor = (occupancy: number) => {
    if (occupancy >= 90) return 'bg-red-50 dark:bg-red-900/20'
    if (occupancy >= 70) return 'bg-amber-50 dark:bg-amber-900/20'
    return 'bg-green-50 dark:bg-green-900/20'
  }

  const getProgressColor = (occupancy: number) => {
    if (occupancy >= 90) return 'bg-red-500'
    if (occupancy >= 70) return 'bg-amber-500'
    return 'bg-green-500'
  }

  return (
    <Card className={`card-depth ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold">
          <MusicalNoteIcon className="h-5 w-5 text-purple-600" />
          Multi-Stage Overview
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Schedule adherence */}
        <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="flex items-center justify-center gap-2 mb-1">
            <ClockIcon className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-600">Schedule Adherence</span>
          </div>
          <div className="text-2xl font-bold text-blue-600">
            {data.scheduleAdherence}%
          </div>
        </div>

        {/* Stage details */}
        <div className="space-y-3">
          {data.stageDetails.map((stage, index) => (
            <div
              key={index}
              className={`p-3 rounded-lg border border-gray-200 dark:border-gray-700 ${getOccupancyBgColor(data.stageOccupancy[index])}`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <MusicalNoteIcon className="h-4 w-4 text-gray-600" />
                  <span className="font-medium text-sm">{stage.name}</span>
                </div>
                <Badge 
                  variant={data.stageOccupancy[index] >= 90 ? 'destructive' : data.stageOccupancy[index] >= 70 ? 'secondary' : 'default'}
                  className="text-xs"
                >
                  {data.stageOccupancy[index]}%
                </Badge>
              </div>
              
              <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                <div>Now: {stage.artist}</div>
                <div>Next: {stage.nextAct} ({stage.timeRemaining})</div>
              </div>
              
              {/* Occupancy progress bar */}
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(data.stageOccupancy[index])}`}
                  style={{ width: `${data.stageOccupancy[index]}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Crowd flow summary */}
        <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Crowd Flow</span>
            <Badge 
              variant={data.overlappingCrowdDensity === 'High' ? 'destructive' : data.overlappingCrowdDensity === 'Moderate' ? 'secondary' : 'default'}
              className="text-xs"
            >
              {data.overlappingCrowdDensity}
            </Badge>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {data.stagesActive} stages active
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Export supported event types for conditional rendering
export const supportedEventTypes = ['festival'];
