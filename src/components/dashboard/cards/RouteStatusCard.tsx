'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  MapIcon, 
  ClockIcon, 
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline'
import { mockEventData } from '@/data/mockEventData'

interface RouteStatusCardProps {
  className?: string
}

export default function RouteStatusCard({ className }: RouteStatusCardProps) {
  const data = mockEventData.parade

  // Provide defaults for missing properties
  const routeStatus = data.routeStatus || {
    completedDistance: '2.5km',
    totalDistance: '5.0km',
    nextCheckpoint: 'City Hall'
  }
  const routeSegments = data.routeSegments || [
    { name: 'Start', status: 'clear' },
    { name: 'Main Street', status: 'congested' },
    { name: 'City Hall', status: 'pending' }
  ]

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'clear':
        return <CheckCircleIcon className="h-4 w-4 text-green-500" />
      case 'congested':
        return <ExclamationTriangleIcon className="h-4 w-4 text-amber-500" />
      case 'pending':
        return <XCircleIcon className="h-4 w-4 text-gray-400" />
      default:
        return <MapIcon className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'clear':
        return 'text-green-500'
      case 'congested':
        return 'text-amber-500'
      case 'pending':
        return 'text-gray-400'
      default:
        return 'text-gray-500'
    }
  }

  const getStatusBgColor = (status: string) => {
    switch (status) {
      case 'clear':
        return 'bg-green-50 dark:bg-green-900/20'
      case 'congested':
        return 'bg-amber-50 dark:bg-amber-900/20'
      case 'pending':
        return 'bg-gray-50 dark:bg-gray-800'
      default:
        return 'bg-gray-50 dark:bg-gray-800'
    }
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'clear':
        return 'default' as const
      case 'congested':
        return 'secondary' as const
      case 'pending':
        return 'outline' as const
      default:
        return 'outline' as const
    }
  }

  const getProgressColor = (completion: number) => {
    if (completion === 100) return 'bg-green-500'
    if (completion >= 50) return 'bg-blue-500'
    return 'bg-gray-400'
  }

  return (
    <Card className={`card-depth ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold">
          <MapIcon className="h-5 w-5 text-blue-600" />
          Route Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall progress */}
        <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="flex items-center justify-center gap-2 mb-1">
            <ClockIcon className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-600">Route Progress</span>
          </div>
          <div className="text-2xl font-bold text-blue-600">
            {routeStatus.completedDistance} / {routeStatus.totalDistance}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            Next: {routeStatus.nextCheckpoint}
          </div>
        </div>

        {/* Route segments */}
        <div className="space-y-3">
          {routeSegments.map((segment, index) => (
            <div
              key={index}
              className={`p-3 rounded-lg border border-gray-200 dark:border-gray-700 ${getStatusBgColor(segment.status)}`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {getStatusIcon(segment.status)}
                  <span className="font-medium text-sm">{segment.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-bold ${getStatusColor(segment.status)}`}>
                    {segment.completion}%
                  </span>
                  <Badge 
                    variant={getStatusBadgeVariant(segment.status)}
                    className="text-xs"
                  >
                    {segment.status}
                  </Badge>
                </div>
              </div>
              
              <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                Est. Time: {segment.estimatedTime}
              </div>
              
              {/* Completion progress bar */}
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(segment.completion)}`}
                  style={{ width: `${segment.completion}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Travel time summary */}
        <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Est. Travel Time</span>
            <Badge variant="outline" className="text-xs">
              {data.estimatedTravelTime}
            </Badge>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Avg Speed: {data.routeStatus.averageSpeed}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Export supported event types for conditional rendering
export const supportedEventTypes = ['parade'];
