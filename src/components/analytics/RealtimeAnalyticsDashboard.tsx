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

  // Fetch initial analytics data
  const fetchAnalytics = useCallback(async () => {
    try {
      // Mock data for now - replace with actual API call
      const mockMetrics: AnalyticsMetric[] = [
        {
          label: 'Active Incidents',
          value: 3,
          change: -12.5,
          trend: 'down',
          color: 'text-red-600',
          icon: ExclamationTriangleIcon
        },
        {
          label: 'Staff On Duty',
          value: 12,
          change: 8.3,
          trend: 'up',
          color: 'text-blue-600',
          icon: UserGroupIcon
        },
        {
          label: 'Avg Response Time',
          value: 4.2,
          change: -15.2,
          trend: 'up',
          color: 'text-green-600',
          icon: ClockIcon
        },
        {
          label: 'Incidents Per Hour',
          value: 2.8,
          change: 5.1,
          trend: 'down',
          color: 'text-purple-600',
          icon: ChartBarIcon
        }
      ]
      
      const mockChartData = [
        { x: 0, y: 2 },
        { x: 1, y: 3 },
        { x: 2, y: 1 },
        { x: 3, y: 4 },
        { x: 4, y: 2 },
        { x: 5, y: 3 }
      ]
      
      setMetrics(mockMetrics)
      setChartData(mockChartData)
      setLastUpdate(new Date())
    } catch (error) {
      console.error('Failed to fetch real-time analytics:', error)
    }
  }, [])

  // Set up auto-refresh
  useEffect(() => {
    fetchAnalytics()
    
    if (!isLive) return

    const interval = setInterval(() => {
      fetchAnalytics()
    }, refreshInterval)

    return () => clearInterval(interval)
  }, [fetchAnalytics, refreshInterval, isLive])

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
