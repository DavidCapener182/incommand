'use client'

import { useState, useEffect } from 'react'
import {
  Clock,
  AlertTriangle,
  CheckCircle2,
  Users,
  TrendingUp,
  TrendingDown,
  Minus,
  Scale,
  BarChart3,
} from 'lucide-react'
import type { EventBenchmarkingResult, BenchmarkingMetrics } from '@/lib/analytics/benchmarking'

interface BenchmarkingMetricsComparisonProps {
  result: EventBenchmarkingResult
  className?: string
}

interface MetricConfig {
  label: string
  icon: React.ComponentType<{ className?: string }>
  format: (value: number) => string
  lowerIsBetter: boolean
}

const METRIC_CONFIG: Record<string, MetricConfig> = {
  averageResponseTime: {
    label: 'Response Time',
    icon: Clock,
    format: (v) => `${v.toFixed(1)}m`,
    lowerIsBetter: true,
  },
  incidentsPerHour: {
    label: 'Incident Volume',
    icon: AlertTriangle,
    format: (v) => v.toFixed(2),
    lowerIsBetter: true,
  },
  resolutionRate: {
    label: 'Resolution Rate',
    icon: CheckCircle2,
    format: (v) => `${v.toFixed(1)}%`,
    lowerIsBetter: false,
  },
  staffEfficiency: {
    label: 'Staff Efficiency',
    icon: Users,
    format: (v) => `${v.toFixed(1)}%`,
    lowerIsBetter: false,
  },
  crowdDensityScore: {
    label: 'Crowd Density',
    icon: Users,
    format: (v) => `${v.toFixed(1)}%`,
    lowerIsBetter: true,
  },
}

interface MetricCardProps {
  metricKey: string
  value: number
  benchmarkValue: number
  percentile: number
  index: number
  config: MetricConfig
}

const getPerformanceColor = (percentile: number): string => {
  if (percentile >= 90) return 'text-emerald-600 bg-emerald-50 border-emerald-200 dark:text-emerald-400 dark:bg-emerald-900/20 dark:border-emerald-900/50'
  if (percentile >= 75) return 'text-blue-600 bg-blue-50 border-blue-200 dark:text-blue-400 dark:bg-blue-900/20 dark:border-blue-900/50'
  if (percentile >= 50) return 'text-amber-600 bg-amber-50 border-amber-200 dark:text-amber-400 dark:bg-amber-900/20 dark:border-amber-900/50'
  return 'text-red-600 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-900/20 dark:border-red-900/50'
}

const MetricCard = ({ metricKey, value, benchmarkValue, percentile, index, config }: MetricCardProps) => {
  const Icon = config.icon
  const formattedValue = config.format(value)
  const formattedBenchmark = config.format(benchmarkValue)
  const performanceStyle = getPerformanceColor(percentile)

  // Determine trend direction and whether it's better
  let trendIcon = <Minus className="w-3.5 h-3.5" />
  let trendColor = 'text-slate-400'
  let trendLabel = 'Equal'

  if (value !== benchmarkValue) {
    const isHigher = value > benchmarkValue
    const isBetter = config.lowerIsBetter ? !isHigher : isHigher

    trendIcon = isHigher ? (
      <TrendingUp className="w-3.5 h-3.5" />
    ) : (
      <TrendingDown className="w-3.5 h-3.5" />
    )
    trendColor = isBetter
      ? 'text-emerald-600 dark:text-emerald-400'
      : 'text-red-600 dark:text-red-400'
    trendLabel = isHigher ? 'Above Avg' : 'Below Avg'
  }

  return (
    <div
      className="group flex flex-col justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-300 ease-out animate-in fade-in slide-in-from-bottom-4 fill-mode-backwards"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            <Icon className="w-5 h-5" />
          </div>
          <span className="font-semibold text-slate-900 dark:text-slate-200 text-sm">
            {config.label}
          </span>
        </div>
        <div className="group relative">
          <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wide border ${performanceStyle} cursor-help`}>
            {percentile}th Percentile
          </div>
          <div className="absolute bottom-full right-0 mb-2 w-56 p-2 bg-slate-900 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
            <div className="font-semibold mb-1">Percentile Ranking</div>
            <div>Better than {percentile}% of similar events</div>
            <div className="text-slate-300 mt-1 text-[10px]">Higher = better performance</div>
          </div>
        </div>
      </div>

      {/* Data Comparison */}
      <div className="space-y-3">
        {/* Current Value (Large) */}
        <div className="flex items-baseline justify-between">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Your Event
          </span>
          <span className="text-2xl font-bold text-slate-900 dark:text-white">
            {formattedValue}
          </span>
        </div>

        {/* Divider */}
        <div className="h-px bg-slate-100 dark:bg-slate-800" />

        {/* Benchmark Value */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Industry Avg
          </span>
          <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
            {formattedBenchmark}
          </span>
        </div>

        {/* Trend Indicator */}
        <div className="flex items-center justify-between pt-1">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Deviation
          </span>
          <div className={`flex items-center gap-1.5 text-xs font-bold ${trendColor}`}>
            {trendLabel}
            {trendIcon}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function BenchmarkingMetricsComparison({ 
  result, 
  className = '' 
}: BenchmarkingMetricsComparisonProps) {
  const { currentEvent, benchmark } = result
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className={`p-4 ${className}`}>
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4 animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-48 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className={`w-full max-w-6xl mx-auto p-4 ${className}`}>
      <div className="flex items-center gap-2 mb-6">
        <Scale className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        <h4 className="text-lg font-bold text-slate-900 dark:text-white">
          Metrics Comparison
        </h4>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(currentEvent.metrics).map(([metric, value], index) => {
          // Skip non-numeric metrics or severityDistribution object
          if (typeof value !== 'number' || metric === 'severityDistribution') return null
          
          // Map metric names to percentile ranking keys (responseTime vs averageResponseTime)
          const percentileKey = metric === 'averageResponseTime' ? 'responseTime' : metric as keyof typeof benchmark.percentileRankings
          
          // Get benchmark value - handle missing metrics gracefully
          const benchmarkValue = (benchmark.averageMetrics[metric as keyof BenchmarkingMetrics] as number | undefined) ?? 0
          
          // Get percentile - handle missing percentiles gracefully (skip crowdDensityScore as it's not in percentileRankings)
          const percentile = metric === 'crowdDensityScore' 
            ? 50 // Default percentile for crowdDensityScore since it's not in percentileRankings
            : (benchmark.percentileRankings[percentileKey] ?? 50)
          
          // Get config for this metric or use default
          const config = METRIC_CONFIG[metric] || {
            label: metric.replace(/([A-Z])/g, ' $1').trim().replace(/^\w/, (c) => c.toUpperCase()),
            icon: BarChart3,
            format: (v: number) => v.toFixed(2),
            lowerIsBetter: metric === 'averageResponseTime' || metric === 'incidentsPerHour' || metric === 'crowdDensityScore',
          }
          
          return (
            <MetricCard
              key={metric}
              metricKey={metric}
              value={value}
              benchmarkValue={benchmarkValue}
              percentile={percentile}
              index={index}
              config={config}
            />
          )
        })}
      </div>
    </div>
  )
}

