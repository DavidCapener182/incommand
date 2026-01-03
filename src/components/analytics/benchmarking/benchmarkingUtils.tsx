import React from 'react'
import { 
  ChartBarIcon,
  ClockIcon,
  CheckCircleIcon,
  UserGroupIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  MinusIcon
} from '@heroicons/react/24/outline'
import type { ReactNode } from 'react'

export const getMetricIcon = (metric: string): ReactNode => {
  switch (metric) {
    case 'incidentsPerHour':
      return <ChartBarIcon className="h-5 w-5" />
    case 'averageResponseTime':
      return <ClockIcon className="h-5 w-5" />
    case 'resolutionRate':
      return <CheckCircleIcon className="h-5 w-5" />
    case 'staffEfficiency':
      return <UserGroupIcon className="h-5 w-5" />
    default:
      return <ChartBarIcon className="h-5 w-5" />
  }
}

export const getMetricLabel = (metric: string): string => {
  switch (metric) {
    case 'incidentsPerHour':
      return 'Incidents per Hour'
    case 'averageResponseTime':
      return 'Response Time'
    case 'resolutionRate':
      return 'Resolution Rate'
    case 'staffEfficiency':
      return 'Staff Efficiency'
    default:
      return metric
  }
}

export const getMetricValue = (metric: string, value: number): string => {
  switch (metric) {
    case 'incidentsPerHour':
      return `${value.toFixed(2)}`
    case 'averageResponseTime':
      return `${value.toFixed(1)}m`
    case 'resolutionRate':
    case 'staffEfficiency':
      return `${value.toFixed(1)}%`
    default:
      return value.toString()
  }
}

export const getTrendIcon = (current: number, benchmark: number): ReactNode => {
  if (current > benchmark) {
    return <ArrowTrendingUpIcon className="h-4 w-4 text-red-500" />
  } else if (current < benchmark) {
    return <ArrowTrendingDownIcon className="h-4 w-4 text-green-500" />
  } else {
    return <MinusIcon className="h-4 w-4 text-gray-500" />
  }
}

export const getTrendColor = (current: number, benchmark: number): string => {
  if (current > benchmark) {
    return 'text-red-600'
  } else if (current < benchmark) {
    return 'text-green-600'
  } else {
    return 'text-gray-600'
  }
}

