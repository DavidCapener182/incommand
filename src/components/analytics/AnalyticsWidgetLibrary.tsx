'use client'

import React from 'react'
import { motion } from 'framer-motion'
import {
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  MinusIcon,
  SparklesIcon
} from '@heroicons/react/24/outline'

// ============================================================================
// BASE WIDGET COMPONENTS
// ============================================================================

interface BaseWidgetProps {
  title: string
  value: string | number
  subtitle?: string
  className?: string
  loading?: boolean
}

export function MetricWidget({
  title,
  value,
  subtitle,
  className = '',
  loading = false
}: BaseWidgetProps) {
  if (loading) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 ${className}`}>
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          {subtitle && <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>}
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 ${className}`}
    >
      <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
        {title}
      </h3>
      <div className="text-3xl font-bold text-gray-900 dark:text-white">
        {value}
      </div>
      {subtitle && (
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {subtitle}
        </p>
      )}
    </motion.div>
  )
}

// ============================================================================
// TREND WIDGET
// ============================================================================

interface TrendWidgetProps extends BaseWidgetProps {
  change: number
  changeLabel?: string
  trend?: 'up' | 'down' | 'stable'
  reverseColors?: boolean // True if down is good (e.g., response time)
}

export function TrendWidget({
  title,
  value,
  change,
  changeLabel,
  trend: customTrend,
  reverseColors = false,
  className = '',
  loading = false
}: TrendWidgetProps) {
  const trend = customTrend || (change > 0 ? 'up' : change < 0 ? 'down' : 'stable')
  const isPositive = reverseColors ? trend === 'down' : trend === 'up'
  const isNegative = reverseColors ? trend === 'up' : trend === 'down'

  if (loading) {
    return <MetricWidget title={title} value="—" loading={true} className={className} />
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 ${className}`}
    >
      <div className="flex items-start justify-between mb-2">
        <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
          {title}
        </h3>
        <div className={`flex items-center gap-1 text-sm font-medium ${
          isPositive ? 'text-green-600 dark:text-green-400' :
          isNegative ? 'text-red-600 dark:text-red-400' :
          'text-gray-500 dark:text-gray-400'
        }`}>
          {trend === 'up' && <ArrowTrendingUpIcon className="h-4 w-4" />}
          {trend === 'down' && <ArrowTrendingDownIcon className="h-4 w-4" />}
          {trend === 'stable' && <MinusIcon className="h-4 w-4" />}
          <span>{Math.abs(change).toFixed(1)}%</span>
        </div>
      </div>
      <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
        {value}
      </div>
      {changeLabel && (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {changeLabel}
        </p>
      )}
    </motion.div>
  )
}

// ============================================================================
// COMPARISON WIDGET
// ============================================================================

interface ComparisonWidgetProps {
  title: string
  current: number
  previous: number
  currentLabel?: string
  previousLabel?: string
  unit?: string
  className?: string
  loading?: boolean
}

export function ComparisonWidget({
  title,
  current,
  previous,
  currentLabel = 'Current',
  previousLabel = 'Previous',
  unit = '',
  className = '',
  loading = false
}: ComparisonWidgetProps) {
  const change = previous > 0 ? ((current - previous) / previous) * 100 : 0
  const isImprovement = change >= 0

  if (loading) {
    return <MetricWidget title={title} value="—" loading={true} className={className} />
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 ${className}`}
    >
      <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">
        {title}
      </h3>
      
      <div className="space-y-3">
        {/* Current */}
        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              {current}{unit}
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {currentLabel}
            </span>
          </div>
        </div>

        {/* Comparison Bar */}
        <div className="relative h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min((current / Math.max(current, previous)) * 100, 100)}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className={`absolute h-full ${
              isImprovement 
                ? 'bg-green-500 dark:bg-green-400' 
                : 'bg-red-500 dark:bg-red-400'
            }`}
          />
        </div>

        {/* Previous */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500 dark:text-gray-400">
            {previousLabel}: {previous}{unit}
          </span>
          <span className={`font-medium ${
            isImprovement 
              ? 'text-green-600 dark:text-green-400' 
              : 'text-red-600 dark:text-red-400'
          }`}>
            {change > 0 ? '+' : ''}{change.toFixed(1)}%
          </span>
        </div>
      </div>
    </motion.div>
  )
}

// ============================================================================
// PROGRESS WIDGET
// ============================================================================

interface ProgressWidgetProps {
  title: string
  current: number
  target: number
  unit?: string
  showPercentage?: boolean
  className?: string
  loading?: boolean
}

export function ProgressWidget({
  title,
  current,
  target,
  unit = '',
  showPercentage = true,
  className = '',
  loading = false
}: ProgressWidgetProps) {
  const percentage = Math.min((current / target) * 100, 100)
  const isComplete = current >= target

  if (loading) {
    return <MetricWidget title={title} value="—" loading={true} className={className} />
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 ${className}`}
    >
      <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">
        {title}
      </h3>
      
      <div className="space-y-3">
        {/* Values */}
        <div className="flex items-baseline justify-between">
          <div>
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              {current}{unit}
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
              / {target}{unit}
            </span>
          </div>
          {showPercentage && (
            <span className="text-lg font-semibold text-gray-700 dark:text-gray-300">
              {percentage.toFixed(0)}%
            </span>
          )}
        </div>

        {/* Progress Bar */}
        <div className="relative h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className={`absolute h-full ${
              isComplete 
                ? 'bg-green-500 dark:bg-green-400' 
                : 'bg-blue-500 dark:bg-blue-400'
            }`}
          />
        </div>

        {/* Status */}
        {isComplete && (
          <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400 font-medium">
            <SparklesIcon className="h-4 w-4" />
            <span>Target achieved!</span>
          </div>
        )}
      </div>
    </motion.div>
  )
}

// ============================================================================
// STAT GRID WIDGET
// ============================================================================

interface StatItem {
  label: string
  value: string | number
  color?: string
}

interface StatGridWidgetProps {
  title: string
  stats: StatItem[]
  columns?: 2 | 3 | 4
  className?: string
  loading?: boolean
}

export function StatGridWidget({
  title,
  stats,
  columns = 2,
  className = '',
  loading = false
}: StatGridWidgetProps) {
  if (loading) {
    return <MetricWidget title={title} value="—" loading={true} className={className} />
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 ${className}`}
    >
      <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-4">
        {title}
      </h3>
      
      <div className={`grid grid-cols-${columns} gap-4`}>
        {stats.map((stat, index) => (
          <div key={index} className="text-center">
            <div className={`text-2xl font-bold ${stat.color || 'text-gray-900 dark:text-white'}`}>
              {stat.value}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {stat.label}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  )
}

// ============================================================================
// ALERT WIDGET
// ============================================================================

interface AlertWidgetProps {
  title: string
  message: string
  severity: 'info' | 'warning' | 'error' | 'success'
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
}

export function AlertWidget({
  title,
  message,
  severity,
  action,
  className = ''
}: AlertWidgetProps) {
  const colors = {
    info: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-200',
    warning: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-900 dark:text-yellow-200',
    error: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-900 dark:text-red-200',
    success: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-900 dark:text-green-200'
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className={`rounded-xl border p-4 ${colors[severity]} ${className}`}
    >
      <h4 className="font-semibold mb-1">{title}</h4>
      <p className="text-sm opacity-90">{message}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="mt-3 text-sm font-medium underline hover:no-underline"
        >
          {action.label}
        </button>
      )}
    </motion.div>
  )
}
