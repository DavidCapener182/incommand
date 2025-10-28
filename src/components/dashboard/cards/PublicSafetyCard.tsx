'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  ShieldCheckIcon, 
  ExclamationTriangleIcon, 
  UserGroupIcon,
  ClockIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'
import { mockEventData } from '@/data/mockEventData'

interface PublicSafetyCardProps {
  className?: string
}

export default function PublicSafetyCard({ className }: PublicSafetyCardProps) {
  const data = mockEventData.parade
  
  // Provide defaults for missing properties
  const publicSafetyIncidents = data.publicSafetyIncidents || 0
  const missingPersonsLogged = data.missingPersons?.logged || 0
  const missingPersonsResolved = data.missingPersons?.resolved || 0
  const safetyData = data.safetyMetrics || {
    crowdDensity: data.crowdDensityKeyPoints || 'Medium',
    lostChildren: 0,
    medicalIncidents: data.activeMedicalIncidents || 0,
    dispersalTime: '15m'
  }

  const safetyMetrics = [
    {
      label: 'Public Safety Incidents',
      value: publicSafetyIncidents,
      icon: ShieldCheckIcon,
      color: publicSafetyIncidents > 3 ? 'text-red-500' : publicSafetyIncidents > 1 ? 'text-amber-500' : 'text-green-500',
      bgColor: publicSafetyIncidents > 3 ? 'bg-red-50 dark:bg-red-900/20' : publicSafetyIncidents > 1 ? 'bg-amber-50 dark:bg-amber-900/20' : 'bg-green-50 dark:bg-green-900/20'
    },
    {
      label: 'Missing Persons Logged',
      value: missingPersonsLogged,
      icon: UserGroupIcon,
      color: missingPersonsLogged > 0 ? 'text-red-500' : 'text-green-500',
      bgColor: missingPersonsLogged > 0 ? 'bg-red-50 dark:bg-red-900/20' : 'bg-green-50 dark:bg-green-900/20'
    },
    {
      label: 'Missing Persons Resolved',
      value: missingPersonsResolved,
      icon: CheckCircleIcon,
      color: missingPersonsResolved > 0 ? 'text-green-500' : 'text-gray-500',
      bgColor: missingPersonsResolved > 0 ? 'bg-green-50 dark:bg-green-900/20' : 'bg-gray-50 dark:bg-gray-800'
    }
  ]

  const getCrowdDensityColor = () => {
    if (safetyData.crowdDensity === 'High') return 'text-red-500'
    if (safetyData.crowdDensity === 'Moderate') return 'text-amber-500'
    return 'text-green-500'
  }

  const getCrowdDensityBgColor = () => {
    if (safetyData.crowdDensity === 'High') return 'bg-red-50 dark:bg-red-900/20'
    if (safetyData.crowdDensity === 'Moderate') return 'bg-amber-50 dark:bg-amber-900/20'
    return 'bg-green-50 dark:bg-green-900/20'
  }

  const getCrowdDensityBadgeVariant = () => {
    if (safetyData.crowdDensity === 'High') return 'destructive' as const
    if (safetyData.crowdDensity === 'Moderate') return 'secondary' as const
    return 'default' as const
  }

  return (
    <Card className={`card-depth ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold">
          <ShieldCheckIcon className="h-5 w-5 text-blue-600" />
          Public Safety
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Safety metrics */}
        <div className="grid grid-cols-3 gap-2">
          {safetyMetrics.map((metric, index) => {
            const IconComponent = metric.icon
            return (
              <div
                key={index}
                className={`p-3 rounded-lg border border-gray-200 dark:border-gray-700 text-center ${metric.bgColor}`}
              >
                <IconComponent className={`h-5 w-5 mx-auto mb-1 ${metric.color}`} />
                <div className={`text-lg font-bold ${metric.color}`}>
                  {metric.value}
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {metric.label}
                </p>
              </div>
            )
          })}
        </div>

        {/* Crowd density */}
        <div className={`p-3 rounded-lg border border-gray-200 dark:border-gray-700 ${getCrowdDensityBgColor()}`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <UserGroupIcon className="h-4 w-4 text-gray-600" />
              <span className="font-medium text-sm">Crowd Density</span>
            </div>
            <Badge 
              variant={getCrowdDensityBadgeVariant()}
              className="text-xs"
            >
              {safetyData.crowdDensity}
            </Badge>
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">
            {safetyData.lostChildren} lost children, {safetyData.medicalIncidents} medical incidents
          </div>
        </div>

        {/* Dispersal time */}
        <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="flex items-center justify-center gap-2 mb-1">
            <ClockIcon className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-600">Est. Dispersal Time</span>
          </div>
          <div className="text-2xl font-bold text-blue-600">
            {safetyData.dispersalTime}
          </div>
        </div>

        {/* Pressure points */}
        <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
          <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Crowd Pressure Points</div>
          <div className="space-y-1">
            {data.crowdPressurePoints.map((point, index) => (
              <div key={index} className="flex items-center gap-2 text-xs">
                <ExclamationTriangleIcon className="h-3 w-3 text-amber-500" />
                <span className="text-gray-600 dark:text-gray-400">{point.name} - {point.pressure}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Export supported event types for conditional rendering
export const supportedEventTypes = ['parade'];
