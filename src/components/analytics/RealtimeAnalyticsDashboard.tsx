'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChartBarIcon,
  ClockIcon,
  UserGroupIcon,
  ExclamationTriangleIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ArrowPathIcon,
  PauseIcon,
  PlayIcon
} from '@heroicons/react/24/outline'
import MobileOptimizedChart from '../MobileOptimizedChart'
import { triggerHaptic } from '@/utils/hapticFeedback'
import { supabase } from '@/lib/supabase'

interface AnalyticsMetric {
  label: string
  value: number
  change: number
  trend: 'up' | 'down' | 'stable'
  color: string
  icon: React.ComponentType<{ className?: string }>
}

interface RealtimeAnalyticsDashboardProps {
  eventId: string
  refreshInterval?: number
  className?: string
}

export default function RealtimeAnalyticsDashboard({
  eventId,
  refreshInterval = 5000,
  className = ''
}: RealtimeAnalyticsDashboardProps) {
  const [metrics, setMetrics] = useState<AnalyticsMetric[]>([])
  const [isLive, setIsLive] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const [chartData, setChartData] = useState<any[]>([])
  const [isFetching, setIsFetching] = useState(false)

  // Fetch initial analytics data
  const fetchAnalytics = useCallback(async () => {
    if (!eventId || isFetching) {
      return
    }

    setIsFetching(true)
    try {
      const [
        { data: incidents, error: incidentError },
        { data: assignments, error: assignmentError }
      ] = await Promise.all([
        supabase
          .from('incident_logs')
          .select('id, status, created_at, updated_at')
          .eq('event_id', eventId)
          .order('created_at', { ascending: false })
          .limit(200),
        supabase
          .from('position_assignments')
          .select('id, department')
          .eq('event_id', eventId)
      ])

      if (incidentError) {
        throw incidentError
      }
      if (assignmentError) {
        throw assignmentError
      }

      const incidentList = (incidents || []) as any[]
      const assignmentList = (assignments || []) as any[]

      const activeIncidents = incidentList.filter((incident: any) => {
        const status = String(incident.status || '').toLowerCase()
        return status !== 'closed' && status !== 'resolved' && status !== 'logged'
      })

      const incidentsWithResponse = incidentList.filter(
        (incident: any) => incident.created_at && incident.updated_at
      )

      const avgResponseMinutes =
        incidentsWithResponse.length > 0
          ? incidentsWithResponse.reduce((acc, incident) => {
              const created = new Date(incident.created_at as string).getTime()
              const updated = new Date(incident.updated_at as string).getTime()
              return acc + (updated - created) / (1000 * 60)
            }, 0) / incidentsWithResponse.length
          : 0

      const monitoringHours = 6
      const now = Date.now()
      const windowStart = now - monitoringHours * 60 * 60 * 1000
      const hourlyBuckets = Array.from({ length: monitoringHours }).map((_, index) => {
        const start = windowStart + index * 60 * 60 * 1000
        const end = start + 60 * 60 * 1000
        const count = incidentList.filter((incident: any) => {
          const created = new Date(incident.created_at as string).getTime()
          return created >= start && created < end
        }).length
        return {
          label: new Date(start).toLocaleTimeString([], { hour: '2-digit' }),
          count
        }
      })

      const incidentsPerHour = hourlyBuckets[hourlyBuckets.length - 1]?.count ?? 0
      const previousHour =
        hourlyBuckets.length > 1 ? hourlyBuckets[hourlyBuckets.length - 2].count : incidentsPerHour

      const staffingDepartments = new Set(['security', 'police', 'medical', 'medic'])
      const staffOnDuty = assignmentList.filter((assignment) =>
        staffingDepartments.has(String(assignment.department || '').toLowerCase())
      ).length

      setChartData(hourlyBuckets.map((bucket, idx) => ({ x: idx, y: bucket.count })))
      setMetrics((prevMetrics) => {
        const getPrevValue = (label: string) =>
          prevMetrics.find((metric) => metric.label === label)?.value ?? null

        const buildChange = (label: string, nextValue: number) => {
          const prevValue = getPrevValue(label)
          if (prevValue === null || prevValue === 0) return 0
          return Number((((nextValue - prevValue) / prevValue) * 100).toFixed(1))
        }

        const buildTrend = (label: string, nextValue: number): AnalyticsMetric['trend'] => {
          const prevValue = getPrevValue(label)
          if (prevValue === null) return 'stable'
          if (nextValue > prevValue) return 'up'
          if (nextValue < prevValue) return 'down'
          return 'stable'
        }

        return [
          {
            label: 'Active Incidents',
            value: activeIncidents.length,
            change: buildChange('Active Incidents', activeIncidents.length),
            trend: buildTrend('Active Incidents', activeIncidents.length),
            color: 'text-red-600',
            icon: ExclamationTriangleIcon
          },
          {
            label: 'Staff On Duty',
            value: staffOnDuty,
            change: buildChange('Staff On Duty', staffOnDuty),
            trend: buildTrend('Staff On Duty', staffOnDuty),
            color: 'text-blue-600',
            icon: UserGroupIcon
          },
          {
            label: 'Avg Response Time',
            value: Number(avgResponseMinutes.toFixed(1)),
            change: buildChange('Avg Response Time', Number(avgResponseMinutes.toFixed(1))),
            trend: buildTrend('Avg Response Time', Number(avgResponseMinutes.toFixed(1))),
            color: 'text-green-600',
            icon: ClockIcon
          },
          {
            label: 'Incidents Per Hour',
            value: incidentsPerHour,
            change:
              previousHour === 0
                ? 0
                : Number((((incidentsPerHour - previousHour) / previousHour) * 100).toFixed(1)),
            trend:
              incidentsPerHour > previousHour
                ? 'up'
                : incidentsPerHour < previousHour
                ? 'down'
                : 'stable',
            color: 'text-purple-600',
            icon: ChartBarIcon
          }
        ]
      })

      setLastUpdate(new Date())
    } catch (error) {
      console.error('Failed to fetch real-time analytics:', error)
    } finally {
      setIsFetching(false)
    }
  }, [eventId, isFetching])

  // Set up auto-refresh
  useEffect(() => {
    if (!eventId) {
      setMetrics([])
      setChartData([])
      return
    }

    fetchAnalytics()
    
    if (!isLive) return

    const interval = setInterval(() => {
      fetchAnalytics()
    }, refreshInterval)

    return () => clearInterval(interval)
  }, [fetchAnalytics, refreshInterval, isLive, eventId])

  const toggleLive = () => {
    setIsLive(!isLive)
    triggerHaptic.light()
  }

  const refresh = () => {
    fetchAnalytics()
    triggerHaptic.medium()
  }

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return ArrowTrendingUpIcon
      case 'down':
        return ArrowTrendingDownIcon
      default:
        return ChartBarIcon
    }
  }

  const getTrendColor = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return 'text-green-600 dark:text-green-400'
      case 'down':
        return 'text-red-600 dark:text-red-400'
      default:
        return 'text-gray-600 dark:text-gray-400'
    }
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-blue-100 dark:bg-blue-800 rounded-lg">
            <ChartBarIcon className="h-5 w-5 text-blue-600 dark:text-blue-300" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">Live Analytics</h3>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Last updated: {lastUpdate.toLocaleTimeString()}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={refresh}
            className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            title="Refresh"
          >
            <ArrowPathIcon className="h-4 w-4" />
          </button>
          
          <button
            onClick={toggleLive}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              isLive 
                ? 'bg-red-100 text-red-700 dark:bg-red-800 dark:text-red-200' 
                : 'bg-green-100 text-green-700 dark:bg-green-800 dark:text-green-200'
            }`}
          >
            {isLive ? (
              <>
                <PauseIcon className="h-4 w-4" />
                Pause
              </>
            ) : (
              <>
                <PlayIcon className="h-4 w-4" />
                Live
              </>
            )}
          </button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-3">
        {metrics.map((metric, index) => {
          const TrendIcon = getTrendIcon(metric.trend)
          const trendColor = getTrendColor(metric.trend)
          const MetricIcon = metric.icon
          
          return (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="card-depth p-3"
            >
              <div className="flex items-center justify-between mb-2">
                <MetricIcon className={`h-5 w-5 ${metric.color}`} />
                <TrendIcon className={`h-4 w-4 ${trendColor}`} />
              </div>
              
              <div className="space-y-1">
                <p className="text-xs text-gray-600 dark:text-gray-400">{metric.label}</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {metric.value}
                </p>
                <p className={`text-xs font-medium ${trendColor}`}>
                  {metric.change > 0 ? '+' : ''}{metric.change}%
                </p>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <div className="card-depth p-4">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
            Incident Trend (Last 6 Hours)
          </h4>
          <MobileOptimizedChart
            data={chartData}
            type="area"
            height={150}
          />
        </div>
      )}
    </div>
  )
}
