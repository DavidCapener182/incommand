'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  MapIcon, 
  ArrowRightIcon, 
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline'
import { mockEventData } from '@/data/mockEventData'
import { useEventContext } from '@/contexts/EventContext'

interface CrowdFlowCardProps {
  className?: string
}

export default function CrowdFlowCard({ className }: CrowdFlowCardProps) {
  const { eventType } = useEventContext()
  const data = eventType === 'festival' ? mockEventData.festival : mockEventData.parade
  
  // Provide defaults for missing properties
  const flowRate = data.flowRate || 'High'
  const crowdDensityZones = data.crowdDensityZones || [
    { name: 'Main Entrance', density: 75, status: 'normal' },
    { name: 'Food Court', density: 60, status: 'normal' },
    { name: 'Exit Gates', density: 85, status: 'congested' }
  ]

  const getDensityColor = (density: number) => {
    if (density >= 90) return 'text-red-500'
    if (density >= 70) return 'text-amber-500'
    return 'text-green-500'
  }

  const getDensityBgColor = (density: number) => {
    if (density >= 90) return 'bg-red-50 dark:bg-red-900/20'
    if (density >= 70) return 'bg-amber-50 dark:bg-amber-900/20'
    return 'bg-green-50 dark:bg-green-900/20'
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'congested':
        return <ExclamationTriangleIcon className="h-4 w-4 text-red-500" />
      case 'moderate':
        return <ArrowRightIcon className="h-4 w-4 text-amber-500" />
      case 'comfortable':
        return <CheckCircleIcon className="h-4 w-4 text-green-500" />
      default:
        return <MapIcon className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'congested':
        return 'text-red-500'
      case 'moderate':
        return 'text-amber-500'
      case 'comfortable':
        return 'text-green-500'
      default:
        return 'text-gray-500'
    }
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'congested':
        return 'destructive' as const
      case 'moderate':
        return 'secondary' as const
      case 'comfortable':
        return 'default' as const
      default:
        return 'outline' as const
    }
  }

  if (eventType === 'festival') {
    return (
      <Card className={`card-depth ${className}`}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <MapIcon className="h-5 w-5 text-purple-600" />
            Crowd Flow Zones
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Flow rate summary */}
          <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="flex items-center justify-center gap-2 mb-1">
              <ArrowRightIcon className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-600">Overall Flow</span>
            </div>
            <div className="text-2xl font-bold text-blue-600">
              {flowRate}
            </div>
          </div>

          {/* Zone details */}
          <div className="space-y-3">
            {crowdDensityZones.map((zone, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg border border-gray-200 dark:border-gray-700 ${getDensityBgColor(zone.density)}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(zone.status)}
                    <span className="font-medium text-sm">{zone.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-bold ${getDensityColor(zone.density)}`}>
                      {zone.density}%
                    </span>
                    <Badge 
                      variant={getStatusBadgeVariant(zone.status)}
                      className="text-xs"
                    >
                      {zone.status}
                    </Badge>
                  </div>
                </div>
                
                {/* Density progress bar */}
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${getDensityColor(zone.density).replace('text-', 'bg-')}`}
                    style={{ width: `${zone.density}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Flow between stages */}
          <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Flow Between Stages</div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="text-center">
                <div className="font-medium">Main → Secondary</div>
                <Badge variant="secondary" className="text-xs mt-1">
                  {data.crowdFlow.mainToSecondary}
                </Badge>
              </div>
              <div className="text-center">
                <div className="font-medium">Food → Main</div>
                <Badge variant="default" className="text-xs mt-1">
                  {data.crowdFlow?.mainToSecondary || 'N/A'}
                </Badge>
              </div>
              <div className="text-center">
                <div className="font-medium">Exit Flow</div>
                <Badge variant="outline" className="text-xs mt-1">
                  {data.crowdFlow?.tentToExit || 'N/A'}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Parade version
  return (
    <Card className={`card-depth ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold">
          <MapIcon className="h-5 w-5 text-blue-600" />
          Parade Crowd Flow
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Pressure points */}
        <div className="space-y-2">
          <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Crowd Pressure Points</div>
          {data.crowdPressurePoints.map((point, index) => (
            <div key={index} className="flex items-center gap-2 p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
              <ExclamationTriangleIcon className="h-4 w-4 text-amber-500" />
              <span className="text-sm">{point.name} - {point.pressure}</span>
            </div>
          ))}
        </div>

        {/* Dispersal time */}
        <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="flex items-center justify-center gap-2 mb-1">
            <ClockIcon className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-600">Est. Dispersal Time</span>
          </div>
          <div className="text-2xl font-bold text-blue-600">
            {data.safetyMetrics.dispersalTime}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Export supported event types for conditional rendering
export const supportedEventTypes = ['festival', 'parade'];
