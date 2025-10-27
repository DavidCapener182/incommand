'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  UserGroupIcon,
  EyeIcon,
  NoSymbolIcon
} from '@heroicons/react/24/outline'
import { mockEventData } from '@/data/mockEventData'

interface StadiumSecurityCardProps {
  className?: string
}

export default function StadiumSecurityCard({ className }: StadiumSecurityCardProps) {
  const security = mockEventData.football?.security

  const ejections = security?.ejections ?? 0
  const arrests = security?.arrests ?? 0
  const stewardInterventions = security?.stewardInterventions ?? 0
  const pitchInvasionAlerts = security?.pitchInvasionAlerts ?? 0
  const disorderIncidents = security?.disorderIncidents ?? 0

  const totalAlerts = ejections + arrests + pitchInvasionAlerts + disorderIncidents

  const securityMetrics = [
    {
      label: 'Fan Ejections',
      value: ejections,
      icon: UserGroupIcon,
      color: ejections > 5 ? 'text-red-500' : ejections > 2 ? 'text-amber-500' : 'text-emerald-500',
      bgColor:
        ejections > 5
          ? 'bg-red-50 dark:bg-red-900/20'
          : ejections > 2
            ? 'bg-amber-50 dark:bg-amber-900/20'
            : 'bg-emerald-50 dark:bg-emerald-900/20',
    },
    {
      label: 'Arrests',
      value: arrests,
      icon: ShieldCheckIcon,
      color: arrests > 2 ? 'text-red-500' : arrests > 0 ? 'text-amber-500' : 'text-emerald-500',
      bgColor:
        arrests > 2
          ? 'bg-red-50 dark:bg-red-900/20'
          : arrests > 0
            ? 'bg-amber-50 dark:bg-amber-900/20'
            : 'bg-emerald-50 dark:bg-emerald-900/20',
    },
    {
      label: 'Steward Interventions',
      value: stewardInterventions,
      icon: EyeIcon,
      color: stewardInterventions > 18 ? 'text-amber-500' : 'text-blue-500',
      bgColor:
        stewardInterventions > 18
          ? 'bg-amber-50 dark:bg-amber-900/20'
          : 'bg-blue-50 dark:bg-blue-900/20',
    },
    {
      label: 'Pitch Alerts',
      value: pitchInvasionAlerts,
      icon: ExclamationTriangleIcon,
      color: pitchInvasionAlerts > 0 ? 'text-red-500' : 'text-emerald-500',
      bgColor:
        pitchInvasionAlerts > 0
          ? 'bg-red-50 dark:bg-red-900/20'
          : 'bg-emerald-50 dark:bg-emerald-900/20',
    },
    {
      label: 'Disorder',
      value: disorderIncidents,
      icon: NoSymbolIcon,
      color: disorderIncidents > 0 ? 'text-amber-500' : 'text-emerald-500',
      bgColor:
        disorderIncidents > 0
          ? 'bg-amber-50 dark:bg-amber-900/20'
          : 'bg-emerald-50 dark:bg-emerald-900/20',
    },
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
              variant={totalAlerts > 7 ? 'destructive' : totalAlerts > 3 ? 'secondary' : 'default'}
              className="text-xs"
            >
              {totalAlerts > 7 ? 'High Alert' : totalAlerts > 3 ? 'Active Monitoring' : 'Stable'}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {stewardInterventions} steward interventions recorded this hour.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

// Export supported event types for conditional rendering
export const supportedEventTypes = ['football']
