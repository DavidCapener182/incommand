'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  HeartIcon, 
  ClockIcon, 
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'
import { mockEventData } from '@/data/mockEventData'

interface MedicalResponseCardProps {
  className?: string
}

export default function MedicalResponseCard({ className }: MedicalResponseCardProps) {
  const data = mockEventData.football
  
  // Provide defaults for missing properties
  const criticalIncidents = data.criticalMedicalIncidents || 0
  const nonCriticalIncidents = data.activeMedicalIncidents - criticalIncidents

  const medicalMetrics = [
    {
      label: 'Active Incidents',
      value: data.activeMedicalIncidents,
      icon: HeartIcon,
      color: data.activeMedicalIncidents > 3 ? 'text-red-500' : data.activeMedicalIncidents > 1 ? 'text-amber-500' : 'text-green-500',
      bgColor: data.activeMedicalIncidents > 3 ? 'bg-red-50 dark:bg-red-900/20' : data.activeMedicalIncidents > 1 ? 'bg-amber-50 dark:bg-amber-900/20' : 'bg-green-50 dark:bg-green-900/20'
    },
    {
      label: 'Critical',
      value: criticalIncidents,
      icon: ExclamationTriangleIcon,
      color: criticalIncidents > 0 ? 'text-red-500' : 'text-green-500',
      bgColor: criticalIncidents > 0 ? 'bg-red-50 dark:bg-red-900/20' : 'bg-green-50 dark:bg-green-900/20'
    },
    {
      label: 'Non-Critical',
      value: nonCriticalIncidents,
      icon: CheckCircleIcon,
      color: nonCriticalIncidents > 5 ? 'text-amber-500' : 'text-blue-500',
      bgColor: nonCriticalIncidents > 5 ? 'bg-amber-50 dark:bg-amber-900/20' : 'bg-blue-50 dark:bg-blue-900/20'
    }
  ]

  const getResponseTimeColor = () => {
    const timeInMinutes = parseInt(data.averageMedicalResponseTime.split('m')[0])
    if (timeInMinutes > 5) return 'text-red-500'
    if (timeInMinutes > 3) return 'text-amber-500'
    return 'text-green-500'
  }

  const getResponseTimeBgColor = () => {
    const timeInMinutes = parseInt(data.averageMedicalResponseTime.split('m')[0])
    if (timeInMinutes > 5) return 'bg-red-50 dark:bg-red-900/20'
    if (timeInMinutes > 3) return 'bg-amber-50 dark:bg-amber-900/20'
    return 'bg-green-50 dark:bg-green-900/20'
  }

  return (
    <Card className={`card-depth ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold">
          <HeartIcon className="h-5 w-5 text-red-600" />
          Medical Response
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main response time display */}
        <div className="text-center p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-center gap-2 mb-2">
            <ClockIcon className="h-5 w-5 text-gray-600" />
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Response Time</span>
          </div>
          <div className={`text-2xl font-bold ${getResponseTimeColor()}`}>
            {data.averageMedicalResponseTime}
          </div>
        </div>

        {/* Incident breakdown */}
        <div className="grid grid-cols-3 gap-2">
          {medicalMetrics.map((metric, index) => {
            const IconComponent = metric.icon
            return (
              <div
                key={index}
                className={`p-3 rounded-lg ${metric.bgColor} border border-gray-200 dark:border-gray-700 text-center`}
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
        
        {/* Status summary */}
        <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Medical Status</span>
            <Badge 
              variant={criticalIncidents > 0 ? 'destructive' : data.activeMedicalIncidents > 3 ? 'secondary' : 'default'}
              className="text-xs"
            >
              {criticalIncidents > 0 ? 'Critical Alert' : data.activeMedicalIncidents > 3 ? 'High Activity' : 'Normal'}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Export supported event types for conditional rendering
export const supportedEventTypes = ['football'];
