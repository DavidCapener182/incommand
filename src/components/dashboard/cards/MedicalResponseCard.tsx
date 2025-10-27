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
  const medical = mockEventData.football?.medical

  const active = medical?.active ?? 0
  const critical = medical?.critical ?? 0
  const nonCritical = medical?.nonCritical ?? Math.max(active - critical, 0)
  const avgResponseTime = medical?.avgResponseTime ?? '—'

  const medicalMetrics = [
    {
      label: 'Active Incidents',
      value: active,
      icon: HeartIcon,
      color: active > 4 ? 'text-red-500' : active > 2 ? 'text-amber-500' : 'text-emerald-500',
      bgColor:
        active > 4
          ? 'bg-red-50 dark:bg-red-900/20'
          : active > 2
            ? 'bg-amber-50 dark:bg-amber-900/20'
            : 'bg-emerald-50 dark:bg-emerald-900/20'
    },
    {
      label: 'Critical',
      value: critical,
      icon: ExclamationTriangleIcon,
      color: critical > 0 ? 'text-red-500' : 'text-emerald-500',
      bgColor: critical > 0 ? 'bg-red-50 dark:bg-red-900/20' : 'bg-emerald-50 dark:bg-emerald-900/20'
    },
    {
      label: 'Non-Critical',
      value: nonCritical,
      icon: CheckCircleIcon,
      color: nonCritical > 5 ? 'text-amber-500' : 'text-blue-500',
      bgColor: nonCritical > 5 ? 'bg-amber-50 dark:bg-amber-900/20' : 'bg-blue-50 dark:bg-blue-900/20'
    }
  ]

  const parseMinutes = () => {
    const numeric = parseFloat(avgResponseTime)
    if (!Number.isNaN(numeric)) {
      return numeric
    }
    const match = avgResponseTime.match(/^(\d+)(?:m|\s*m)/i)
    if (match) {
      return parseInt(match[1], 10)
    }
    return 0
  }

  const getResponseTimeColor = () => {
    const minutes = parseMinutes()
    if (minutes > 5) return 'text-red-500'
    if (minutes > 3) return 'text-amber-500'
    return 'text-emerald-500'
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
            {avgResponseTime}
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
              variant={critical > 0 ? 'destructive' : active > 3 ? 'secondary' : 'default'}
              className="text-xs"
            >
              {critical > 0 ? 'Critical Alert' : active > 3 ? 'High Activity' : 'Normal'}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Export supported event types for conditional rendering
export const supportedEventTypes = ['football'];
