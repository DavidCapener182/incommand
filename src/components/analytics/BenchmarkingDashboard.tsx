import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  ChartBarIcon,
  ClockIcon,
  CheckCircleIcon,
  UserGroupIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  MinusIcon,
  TrophyIcon,
  ExclamationTriangleIcon,
  LightBulbIcon
} from '@heroicons/react/24/outline'
import { getPerformanceColor, getPerformanceLabel } from '@/lib/analytics/benchmarking'
import type { EventBenchmarkingResult, BenchmarkingMetrics } from '@/lib/analytics/benchmarking'

interface BenchmarkingDashboardProps {
  eventId: string
  className?: string
}

interface BenchmarkingData {
  result: EventBenchmarkingResult
  loading: boolean
  error: string | null
}

export default function BenchmarkingDashboard({ 
  eventId, 
  className = '' 
}: BenchmarkingDashboardProps) {
  const [data, setData] = useState<BenchmarkingData>({
    result: {} as EventBenchmarkingResult,
    loading: false,
    error: null
  })

  const fetchBenchmarkingData = async () => {
    setData(prev => ({ ...prev, loading: true, error: null }))
    
    if (!eventId || eventId === '') {
      setData(prev => ({ 
        ...prev, 
        loading: false, 
        error: 'No event selected' 
      }))
      return
    }
    
    try {
      console.log('Fetching benchmarking data for event:', eventId)
      const response = await fetch(`/api/v1/events/${eventId}/benchmarking`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: 'openai' })
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch benchmarking data')
      }
      
      const result = await response.json()
      setData({ result: result.benchmarking, loading: false, error: null })
    } catch (err) {
      setData(prev => ({ 
        ...prev, 
        loading: false, 
        error: err instanceof Error ? err.message : 'Unknown error' 
      }))
    }
  }

  useEffect(() => {
    console.log('BenchmarkingDashboard mounted with eventId:', eventId)
    if (eventId && eventId.trim() !== '') {
      fetchBenchmarkingData()
    } else {
      console.log('No valid eventId provided, skipping benchmarking fetch')
      setData(prev => ({ 
        ...prev, 
        loading: false, 
        error: 'No event selected for benchmarking' 
      }))
    }
  }, [eventId])

  const getMetricIcon = (metric: string) => {
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

  const getMetricLabel = (metric: string) => {
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

  const getMetricValue = (metric: string, value: number) => {
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

  const getTrendIcon = (current: number, benchmark: number) => {
    if (current > benchmark) {
      return <ArrowTrendingUpIcon className="h-4 w-4 text-red-500" />
    } else if (current < benchmark) {
      return <ArrowTrendingDownIcon className="h-4 w-4 text-green-500" />
    } else {
      return <MinusIcon className="h-4 w-4 text-gray-500" />
    }
  }

  const getTrendColor = (current: number, benchmark: number) => {
    if (current > benchmark) {
      return 'text-red-600'
    } else if (current < benchmark) {
      return 'text-green-600'
    } else {
      return 'text-gray-600'
    }
  }

  if (data.loading) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (data.error) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 ${className}`}>
        <div className="text-center">
          <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {data.error.includes('No event') ? 'No Event Selected' : 'Benchmarking Error'}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{data.error}</p>
          {!data.error.includes('No event') && (
            <button
              onClick={fetchBenchmarkingData}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Retry Analysis
            </button>
          )}
        </div>
      </div>
    )
  }

  if (!data.result || !data.result.currentEvent) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 ${className}`}>
        <div className="text-center text-gray-500 dark:text-gray-400">
          No benchmarking data available
        </div>
      </div>
    )
  }

  const { result } = data
  const { currentEvent, benchmark } = result

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Venue Benchmarking
            </h3>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              Performance vs {benchmark.totalEvents} similar {currentEvent.venueType} events
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-center">
              <div className={`text-2xl font-bold ${getPerformanceColor(result.percentileRanking)}`}>
                {result.percentileRanking}th
              </div>
              <div className="text-xs text-gray-500">Percentile</div>
            </div>
            <div className="text-right">
              <div className={`text-sm font-semibold ${getPerformanceColor(result.percentileRanking)}`}>
                {getPerformanceLabel(result.percentileRanking)}
              </div>
              <div className="text-xs text-gray-500">Performance</div>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Summary */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-start gap-2">
          <TrophyIcon className="h-5 w-5 text-yellow-500 mt-1" />
          <div>
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-1">Performance Summary</h4>
            <p className="text-xs text-gray-700 dark:text-gray-300">{result.comparison}</p>
          </div>
        </div>
      </div>

      {/* Metrics Comparison */}
      <div className="p-4">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
          Metrics Comparison
        </h4>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
          {Object.entries(currentEvent.metrics).map(([metric, value]) => {
            if (typeof value !== 'number' || metric === 'crowdDensityScore') return null
            
            // Map metric names to percentile ranking keys
            const percentileKey = metric === 'averageResponseTime' ? 'responseTime' : metric as keyof typeof benchmark.percentileRankings
            const benchmarkValue = benchmark.averageMetrics[metric as keyof BenchmarkingMetrics] as number
            const percentile = benchmark.percentileRankings[percentileKey] || 50
            
            return (
              <motion.div
                key={metric}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getMetricIcon(metric)}
                    <span className="font-medium text-gray-900 dark:text-white">
                      {getMetricLabel(metric)}
                    </span>
                  </div>
                  <div className={`text-sm font-medium ${getPerformanceColor(percentile)}`}>
                    {percentile}th percentile
                  </div>
                </div>
                
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Current</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {getMetricValue(metric, value)}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Benchmark</span>
                    <span className="text-gray-700 dark:text-gray-300">
                      {getMetricValue(metric, benchmarkValue)}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Trend</span>
                    <div className={`flex items-center gap-1 ${getTrendColor(value, benchmarkValue)}`}>
                      {getTrendIcon(value, benchmarkValue)}
                      <span className="text-sm">
                        {value > benchmarkValue ? 'Above' : value < benchmarkValue ? 'Below' : 'Equal'}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Strengths */}
      {result.strengths && result.strengths.length > 0 && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-green-50 dark:bg-green-900/20">
          <h4 className="text-sm font-semibold text-green-800 dark:text-green-200 mb-2 flex items-center gap-2">
            <TrophyIcon className="h-4 w-4" />
            Performance Strengths
          </h4>
          <ul className="space-y-1">
            {result.strengths.map((strength, index) => (
              <li key={index} className="flex items-start gap-2 text-xs text-green-700 dark:text-green-300">
                <span className="text-green-600 dark:text-green-400 mt-1">•</span>
                {strength}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Areas for Improvement */}
      {result.improvements && result.improvements.length > 0 && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-yellow-50 dark:bg-yellow-900/20">
          <h4 className="text-sm font-semibold text-yellow-800 dark:text-yellow-200 mb-2 flex items-center gap-2">
            <ExclamationTriangleIcon className="h-4 w-4" />
            Areas for Improvement
          </h4>
          <ul className="space-y-1">
            {result.improvements.map((improvement, index) => (
              <li key={index} className="flex items-start gap-2 text-xs text-yellow-700 dark:text-yellow-300">
                <span className="text-yellow-600 dark:text-yellow-400 mt-1">•</span>
                {improvement}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Recommendations */}
      {result.recommendations && result.recommendations.length > 0 && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-blue-50 dark:bg-blue-900/20">
          <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-200 mb-2 flex items-center gap-2">
            <LightBulbIcon className="h-4 w-4" />
            Recommendations
          </h4>
          <ul className="space-y-1">
            {result.recommendations.map((recommendation, index) => (
              <li key={index} className="flex items-start gap-2 text-xs text-blue-700 dark:text-blue-300">
                <span className="text-blue-600 dark:text-blue-400 mt-1">•</span>
                {recommendation}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}