'use client'

import React, { useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  MinusIcon,
  ChartBarIcon,
  CalendarIcon,
  ClockIcon,
  UsersIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import { triggerHaptic } from '@/utils/hapticFeedback'
import MobileOptimizedChart from '../MobileOptimizedChart'

interface EventComparison {
  id: string
  name: string
  date: string
  duration: number // hours
  incidents: number
  staff: number
  resolutionTime: number // minutes
  satisfaction: number // 1-5
  company: string
}

interface ComparisonMetric {
  label: string
  current: number
  previous: number
  change: number
  changePercent: number
  trend: 'up' | 'down' | 'stable'
  icon: React.ComponentType<any>
}

interface ComparativeAnalyticsProps {
  currentEvent: EventComparison
  previousEvent: EventComparison
  onEventSelect?: (eventId: string) => void
  className?: string
}

export default function ComparativeAnalytics({
  currentEvent,
  previousEvent,
  onEventSelect,
  className = ''
}: ComparativeAnalyticsProps) {
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null)
  const [timeframe, setTimeframe] = useState<'hourly' | 'daily' | 'weekly'>('hourly')

  // Calculate comparison metrics
  const metrics: ComparisonMetric[] = useMemo(() => [
    {
      label: 'Total Incidents',
      current: currentEvent.incidents,
      previous: previousEvent.incidents,
      change: currentEvent.incidents - previousEvent.incidents,
      changePercent: previousEvent.incidents > 0 
        ? ((currentEvent.incidents - previousEvent.incidents) / previousEvent.incidents) * 100 
        : 0,
      trend: currentEvent.incidents > previousEvent.incidents ? 'up' : 
             currentEvent.incidents < previousEvent.incidents ? 'down' : 'stable',
      icon: ExclamationTriangleIcon
    },
    {
      label: 'Staff Deployment',
      current: currentEvent.staff,
      previous: previousEvent.staff,
      change: currentEvent.staff - previousEvent.staff,
      changePercent: previousEvent.staff > 0 
        ? ((currentEvent.staff - previousEvent.staff) / previousEvent.staff) * 100 
        : 0,
      trend: currentEvent.staff > previousEvent.staff ? 'up' : 
             currentEvent.staff < previousEvent.staff ? 'down' : 'stable',
      icon: UsersIcon
    },
    {
      label: 'Resolution Time',
      current: currentEvent.resolutionTime,
      previous: previousEvent.resolutionTime,
      change: currentEvent.resolutionTime - previousEvent.resolutionTime,
      changePercent: previousEvent.resolutionTime > 0 
        ? ((currentEvent.resolutionTime - previousEvent.resolutionTime) / previousEvent.resolutionTime) * 100 
        : 0,
      trend: currentEvent.resolutionTime < previousEvent.resolutionTime ? 'up' : 
             currentEvent.resolutionTime > previousEvent.resolutionTime ? 'down' : 'stable',
      icon: ClockIcon
    },
    {
      label: 'Event Duration',
      current: currentEvent.duration,
      previous: previousEvent.duration,
      change: currentEvent.duration - previousEvent.duration,
      changePercent: previousEvent.duration > 0 
        ? ((currentEvent.duration - previousEvent.duration) / previousEvent.duration) * 100 
        : 0,
      trend: currentEvent.duration > previousEvent.duration ? 'up' : 
             currentEvent.duration < previousEvent.duration ? 'down' : 'stable',
      icon: CalendarIcon
    },
    {
      label: 'Satisfaction Score',
      current: currentEvent.satisfaction,
      previous: previousEvent.satisfaction,
      change: currentEvent.satisfaction - previousEvent.satisfaction,
      changePercent: previousEvent.satisfaction > 0 
        ? ((currentEvent.satisfaction - previousEvent.satisfaction) / previousEvent.satisfaction) * 100 
        : 0,
      trend: currentEvent.satisfaction > previousEvent.satisfaction ? 'up' : 
             currentEvent.satisfaction < previousEvent.satisfaction ? 'down' : 'stable',
      icon: ChartBarIcon
    }
  ], [currentEvent, previousEvent])

  // Generate comparison chart data
  const chartData = useMemo(() => {
    const timeframes = {
      hourly: Array.from({ length: 24 }, (_, i) => i),
      daily: Array.from({ length: 7 }, (_, i) => i),
      weekly: Array.from({ length: 4 }, (_, i) => i)
    }

    return timeframes[timeframe].map((period, index) => ({
      x: period,
      y1: Math.floor(Math.random() * 50) + 10, // Current event
      y2: Math.floor(Math.random() * 50) + 10, // Previous event
      label: timeframe === 'hourly' ? `${period}:00` : 
             timeframe === 'daily' ? `Day ${period + 1}` : 
             `Week ${period + 1}`
    }))
  }, [timeframe])

  const handleMetricSelect = useCallback((metric: string) => {
    setSelectedMetric(metric === selectedMetric ? null : metric)
    triggerHaptic.light()
  }, [selectedMetric])

  const formatValue = (value: number, label: string) => {
    switch (label) {
      case 'Resolution Time':
        return `${value} min`
      case 'Event Duration':
        return `${value} hrs`
      case 'Satisfaction Score':
        return `${value}/5`
      default:
        return value.toString()
    }
  }

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <ArrowTrendingUpIcon className="h-4 w-4 text-green-500" />
      case 'down':
        return <ArrowTrendingDownIcon className="h-4 w-4 text-red-500" />
      default:
        return <MinusIcon className="h-4 w-4 text-gray-500" />
    }
  }

  const getTrendColor = (trend: 'up' | 'down' | 'stable', metric: string) => {
    // For resolution time, down is good (green), up is bad (red)
    if (metric === 'Resolution Time') {
      return trend === 'down' ? 'text-green-500' : 
             trend === 'up' ? 'text-red-500' : 'text-gray-500'
    }
    
    // For satisfaction, up is good (green), down is bad (red)
    if (metric === 'Satisfaction Score') {
      return trend === 'up' ? 'text-green-500' : 
             trend === 'down' ? 'text-red-500' : 'text-gray-500'
    }
    
    // For others, up is generally good (green), down is bad (red)
    return trend === 'up' ? 'text-green-500' : 
           trend === 'down' ? 'text-red-500' : 'text-gray-500'
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Event Comparison
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Compare current event with previous event
          </p>
        </div>
        
        {/* Timeframe Selector */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">View:</span>
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value as any)}
            className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
          >
            <option value="hourly">Hourly</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
          </select>
        </div>
      </div>

      {/* Event Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg"
        >
          <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
            Current Event
          </h3>
          <p className="text-blue-700 dark:text-blue-300 text-sm">
            {currentEvent.name}
          </p>
          <p className="text-blue-600 dark:text-blue-400 text-xs">
            {new Date(currentEvent.date).toLocaleDateString()} • {currentEvent.duration}h duration
          </p>
          <p className="text-blue-500 dark:text-blue-500 text-xs font-medium">
            {currentEvent.company}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg"
        >
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Previous Event
          </h3>
          <p className="text-gray-700 dark:text-gray-300 text-sm">
            {previousEvent.name}
          </p>
          <p className="text-gray-600 dark:text-gray-400 text-xs">
            {previousEvent.date === 'N/A' ? 'N/A' : new Date(previousEvent.date).toLocaleDateString()} • {previousEvent.duration}h duration
          </p>
          <p className="text-gray-500 dark:text-gray-500 text-xs font-medium">
            {previousEvent.company}
          </p>
        </motion.div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {metrics.map((metric, index) => (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => handleMetricSelect(metric.label)}
            className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
              selectedMetric === metric.label
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <metric.icon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                <span className="font-medium text-gray-900 dark:text-white text-sm">
                  {metric.label}
                </span>
              </div>
              {getTrendIcon(metric.trend)}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatValue(metric.current, metric.label)}
                </span>
                <span className={`text-sm font-medium ${getTrendColor(metric.trend, metric.label)}`}>
                  {metric.changePercent > 0 ? '+' : ''}{metric.changePercent.toFixed(1)}%
                </span>
              </div>

              <div className="text-xs text-gray-600 dark:text-gray-400">
                vs {formatValue(metric.previous, metric.label)} (previous)
              </div>

              <div className="flex items-center gap-1 text-xs">
                <span className="text-gray-500">Change:</span>
                <span className={getTrendColor(metric.trend, metric.label)}>
                  {metric.change > 0 ? '+' : ''}{formatValue(metric.change, metric.label)}
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Comparison Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900 dark:text-white">
            {selectedMetric || 'Overall Performance'} Comparison
          </h3>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-gray-600 dark:text-gray-400">Current Event</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
              <span className="text-gray-600 dark:text-gray-400">Previous Event</span>
            </div>
          </div>
        </div>

        <MobileOptimizedChart
          data={chartData}
          title=""
          type="line"
          height={300}
          showLegend={false}
        />
      </motion.div>

      {/* Insights */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200 dark:border-blue-800"
      >
        <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-3">
          Key Insights
        </h3>
        <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
          {metrics.map(metric => {
            const improvement = metric.trend === 'up' && (metric.label === 'Resolution Time' ? false : true) ||
                               metric.trend === 'down' && metric.label === 'Resolution Time'
            
            return (
              <li key={metric.label} className="flex items-start gap-2">
                <span className={`mt-0.5 ${improvement ? 'text-green-500' : 'text-red-500'}`}>
                  {improvement ? '✓' : '⚠'}
                </span>
                <span>
                  <strong>{metric.label}:</strong> {improvement ? 'Improved' : 'Declined'} by {Math.abs(metric.changePercent).toFixed(1)}% 
                  ({formatValue(Math.abs(metric.change), metric.label)} {improvement ? 'better' : 'worse'})
                </span>
              </li>
            )
          })}
        </ul>
      </motion.div>
    </div>
  )
}

// Helper function to create sample event data
export function createSampleEvents(): EventComparison[] {
  return [
    {
      id: 'current',
      name: 'Summer Festival 2024',
      date: '2024-07-15',
      duration: 12,
      incidents: 87,
      staff: 45,
      resolutionTime: 8.5,
      satisfaction: 4.2
    },
    {
      id: 'previous',
      name: 'Spring Concert 2024',
      date: '2024-04-20',
      duration: 10,
      incidents: 92,
      staff: 42,
      resolutionTime: 12.3,
      satisfaction: 3.8
    }
  ]
}
