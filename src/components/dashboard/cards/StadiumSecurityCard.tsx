'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  ShieldCheckIcon, 
  ExclamationTriangleIcon, 
  UserGroupIcon,
  EyeIcon
} from '@heroicons/react/24/outline'
import { mockEventData } from '@/data/mockEventData'

interface StadiumSecurityCardProps {
  className?: string
}

export default function StadiumSecurityCard({ className }: StadiumSecurityCardProps) {
  const data = mockEventData.football
  
  // Provide defaults for missing properties
  const arrests = data.arrests || 0
  const securityAlerts = data.securityAlerts || 0

  const securityMetrics = [
    {
      label: 'Fan Ejections',
      value: data.ejections,
      icon: UserGroupIcon,
      color: data.ejections > 5 ? 'text-red-500' : data.ejections > 2 ? 'text-amber-500' : 'text-green-500',
      bgColor: data.ejections > 5 ? 'bg-red-50 dark:bg-red-900/20' : data.ejections > 2 ? 'bg-amber-50 dark:bg-amber-900/20' : 'bg-green-50 dark:bg-green-900/20'
    },
    {
      label: 'Arrests',
      value: arrests,
      icon: ShieldCheckIcon,
      color: arrests > 2 ? 'text-red-500' : arrests > 0 ? 'text-amber-500' : 'text-green-500',
      bgColor: arrests > 2 ? 'bg-red-50 dark:bg-red-900/20' : arrests > 0 ? 'bg-amber-50 dark:bg-amber-900/20' : 'bg-green-50 dark:bg-green-900/20'
    },
    {
      label: 'Steward Interventions',
      value: data.stewardInterventions,
      icon: EyeIcon,
      color: data.stewardInterventions > 15 ? 'text-amber-500' : 'text-blue-500',
      bgColor: data.stewardInterventions > 15 ? 'bg-amber-50 dark:bg-amber-900/20' : 'bg-blue-50 dark:bg-blue-900/20'
    },
    {
      label: 'Pitch Invasions',
      value: data.pitchInvasionAlerts,
      icon: ExclamationTriangleIcon,
      color: data.pitchInvasionAlerts > 0 ? 'text-red-500' : 'text-green-500',
      bgColor: data.pitchInvasionAlerts > 0 ? 'bg-red-50 dark:bg-red-900/20' : 'bg-green-50 dark:bg-green-900/20'
    }
  ]

  return (
    <Card className={`card-depth ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold">
          <ShieldCheckIcon className="h-5 w-5 text-blue-600" />
          Stadium Security
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          {securityMetrics.map((metric, index) => {
            const IconComponent = metric.icon
            return (
              <div
                key={index}
                className={`p-3 rounded-lg ${metric.bgColor} border border-gray-200 dark:border-gray-700`}
              >
                <div className="flex items-center justify-between mb-2">
                  <IconComponent className={`h-4 w-4 ${metric.color}`} />
                  <Badge 
                    variant={metric.value > 0 ? 'destructive' : 'secondary'}
                    className="text-xs"
                  >
                    {metric.value}
                  </Badge>
                </div>
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  {metric.label}
                </p>
              </div>
            )
          })}
        </div>
        
        <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Security Status</span>
            <Badge 
              variant={data.ejections > 5 || data.arrests > 2 ? 'destructive' : data.ejections > 2 || data.arrests > 0 ? 'secondary' : 'default'}
              className="text-xs"
            >
              {data.ejections > 5 || data.arrests > 2 ? 'High Alert' : data.ejections > 2 || data.arrests > 0 ? 'Moderate' : 'Normal'}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Export supported event types for conditional rendering
export const supportedEventTypes = ['football'];
