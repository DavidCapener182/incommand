'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ChartBarIcon, 
  ClockIcon, 
  UserGroupIcon,
  ExclamationTriangleIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  ArrowPathIcon,
  PauseIcon,
  PlayIcon
} from '@heroicons/react/24/outline'
import { useOptimizedRealtime } from '@/utils/optimizedRealtimeSync'
import { smartCache, cacheKeys } from '@/utils/smartCache'
import MobileOptimizedChart from '../MobileOptimizedChart'
import { triggerHaptic } from '@/utils/hapticFeedback'

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
  const { subscribe, unsubscribe } = useOptimizedRealtime()

  // Fetch initial analytics data
  const fetchAnalytics = useCallback(async () => {
    // Check cache first
    const cached = smartCache.get(cacheKeys.analytics(eventId, 'realtime'))
    if (cached) {
      updateMetrics(cached)
      return
    }

    // Fetch from API/database
    // This would be replaced with actual API call
    const data = await mockFetchAnalytics(eventId)
    
    // Cache for 1 minute
    smartCache.set(
      cacheKeys.analytics(eventId, 'realtime'),
      data,
      { ttl: 60 * 1000 }
    )

    updateMetrics(data)
    setLastUpdate(new Date())
  }, [eventId])

  // Update metrics from data
  const updateMetrics = (data: any) => {
    const newMetrics: AnalyticsMetric[] = [
      {
        label: 'Active Incidents',
        value: data.activeIncidents || 0,
        change: data.incidentChange || 0,
        trend: data.incidentChange > 0 ? 'up' : data.incidentChange < 0 ? 'down' : 'stable',
        color: 'text-red-600 dark:text-red-400',
        icon: ExclamationTriangleIcon
      },
      {
        label: 'Staff On Duty',
        value: data.staffOnDuty || 0,
        change: data.staffChange || 0,
        trend: data.staffChange > 0 ? 'up' : data.staffChange < 0 ? 'down' : 'stable',
        color: 'text-blue-600 dark:text-blue-400',
        icon: UserGroupIcon
      },
      {
        label: 'Avg Response Time',
        value: data.avgResponseTime || 0,
        change: data.responseTimeChange || 0,
        trend: data.responseTimeChange < 0 ? 'up' : data.responseTimeChange > 0 ? 'down' : 'stable',
        color: 'text-green-600 dark:text-green-400',
        icon: ClockIcon
      },
      {
        label: 'Incidents/Hour',
        value: data.incidentsPerHour || 0,
        change: data.rateChange || 0,
        trend: data.rateChange > 0 ? 'up' : data.rateChange < 0 ? 'down' : 'stable',
        color: 'text-purple-600 dark:text-purple-400',
        icon: ChartBarIcon
      }
    ]

    setMetrics(newMetrics)

    // Update chart data
    if (data.chartData) {
      setChartData(data.chartData)
    }
  }

  // Subscribe to real-time updates
  useEffect(() => {
    if (!isLive) return

    const channelId = subscribe(
      {
        table: 'incidents',
        event: '*',
        filter: `event_id=eq.${eventId}`
      },
      {
        onInsert: () => fetchAnalytics(),
        onUpdate: () => fetchAnalytics(),
        onDelete: () => fetchAnalytics()
      },
      {
        enableBatching: true,
        batchDelay: 1000 // 1 second batch for analytics
      }
    )

    return () => {
      unsubscribe(channelId)
    }
  }, [eventId, isLive, subscribe, unsubscribe, fetchAnalytics])

  // Auto-refresh
  useEffect(() => {
    if (!isLive) return

    fetchAnalytics()

    const interval = setInterval(() => {
      fetchAnalytics()
    }, refreshInterval)

    return () => clearInterval(interval)
  }, [isLive, refreshInterval, fetchAnalytics])

  const toggleLive = () => {
    setIsLive(!isLive)
    triggerHaptic.medium()
  }

  const formatChange = (change: number) => {
    const formatted = Math.abs(change).toFixed(1)
    return change > 0 ? `+${formatted}%` : change < 0 ? `-${formatted}%` : '0%'
  }

  const getTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000)
    if (seconds < 60) return `${seconds}s ago`
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    return `${hours}h ago`
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Real-time Analytics
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Last updated {getTimeAgo(lastUpdate)}
          </p>
        </div>

        {/* Live Toggle */}
        <button
          onClick={toggleLive}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
            isLive
              ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
              : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
          }`}
        >
          {isLive ? (
            <>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <span className="hidden sm:inline">Live</span>
              <PauseIcon className="h-4 w-4" />
            </>
          ) : (
            <>
              <span className="h-2 w-2 rounded-full bg-gray-400"></span>
              <span className="hidden sm:inline">Paused</span>
              <PlayIcon className="h-4 w-4" />
            </>
          )}
        </button>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <AnimatePresence mode="wait">
          {metrics.map((metric, index) => (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <div className={`p-2 rounded-lg bg-opacity-10 ${metric.color}`}>
                  <metric.icon className={`h-5 w-5 ${metric.color}`} />
                </div>
                <div className="flex items-center gap-1 text-sm">
                  {metric.trend === 'up' && (
                    <>
                      <TrendingUpIcon className="h-4 w-4 text-green-500" />
                      <span className="text-green-600 dark:text-green-400">
                        {formatChange(metric.change)}
                      </span>
                    </>
                  )}
                  {metric.trend === 'down' && (
                    <>
                      <TrendingDownIcon className="h-4 w-4 text-red-500" />
                      <span className="text-red-600 dark:text-red-400">
                        {formatChange(metric.change)}
                      </span>
                    </>
                  )}
                  {metric.trend === 'stable' && (
                    <span className="text-gray-500 dark:text-gray-400">—</span>
                  )}
                </div>
              </div>
              <div className="mt-2">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {metric.value}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {metric.label}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MobileOptimizedChart
          data={chartData}
          title="Incidents Over Time"
          type="area"
          height={250}
        />
        <MobileOptimizedChart
          data={chartData}
          title="Response Times"
          type="line"
          height={250}
        />
      </div>

      {/* Refresh Indicator */}
      {isLive && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed bottom-24 right-6 bg-green-500 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 z-50"
        >
          <ArrowPathIcon className="h-4 w-4 animate-spin" />
          <span className="text-sm font-medium">Updating...</span>
        </motion.div>
      )}
    </div>
  )
}

// Mock data fetcher (replace with actual API call)
async function mockFetchAnalytics(eventId: string) {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500))

  return {
    activeIncidents: Math.floor(Math.random() * 20) + 5,
    incidentChange: (Math.random() - 0.5) * 10,
    staffOnDuty: Math.floor(Math.random() * 30) + 15,
    staffChange: (Math.random() - 0.5) * 5,
    avgResponseTime: Math.floor(Math.random() * 10) + 2,
    responseTimeChange: (Math.random() - 0.5) * 8,
    incidentsPerHour: Math.floor(Math.random() * 8) + 2,
    rateChange: (Math.random() - 0.5) * 6,
    chartData: Array.from({ length: 24 }, (_, i) => ({
      x: i,
      y: Math.floor(Math.random() * 15) + 5,
      label: `${i}:00`
    }))
  }
}
