import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ExclamationTriangleIcon, 
  ClockIcon, 
  MapPinIcon, 
  UserGroupIcon, 
  CloudIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  MinusIcon
} from '@heroicons/react/24/outline'
import { getPatternConfidenceColor, getSeverityColor } from '@/lib/ml/patternDetection'
import type { PatternAnalysis, IncidentPattern } from '@/lib/ml/patternDetection'

interface PatternAnalysisDashboardProps {
  eventId: string
  className?: string
}

export default function PatternAnalysisDashboard({ 
  eventId, 
  className = '' 
}: PatternAnalysisDashboardProps) {
  const [analysis, setAnalysis] = useState<PatternAnalysis | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedPattern, setSelectedPattern] = useState<IncidentPattern | null>(null)

  const fetchPatternAnalysis = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/v1/events/${eventId}/patterns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: 'openai' })
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch pattern analysis')
      }
      
      const data = await response.json()
      setAnalysis(data.analysis)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPatternAnalysis()
  }, [eventId])

  const getPatternIcon = (type: string) => {
    switch (type) {
      case 'delayed_response':
        return <ClockIcon className="h-5 w-5" />
      case 'crowd_density':
        return <UserGroupIcon className="h-5 w-5" />
      case 'repeat_zone':
        return <MapPinIcon className="h-5 w-5" />
      case 'staff_overload':
        return <ExclamationTriangleIcon className="h-5 w-5" />
      case 'weather_impact':
        return <CloudIcon className="h-5 w-5" />
      default:
        return <ChartBarIcon className="h-5 w-5" />
    }
  }

  const getPatternTitle = (type: string) => {
    switch (type) {
      case 'delayed_response':
        return 'Delayed Response'
      case 'crowd_density':
        return 'Crowd Density'
      case 'repeat_zone':
        return 'Repeat Zone'
      case 'staff_overload':
        return 'Staff Overload'
      case 'weather_impact':
        return 'Weather Impact'
      default:
        return 'Unknown Pattern'
    }
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing':
        return <ArrowTrendingUpIcon className="h-4 w-4 text-red-500" />
      case 'decreasing':
        return <ArrowTrendingDownIcon className="h-4 w-4 text-green-500" />
      case 'stable':
        return <MinusIcon className="h-4 w-4 text-gray-500" />
      default:
        return null
    }
  }

  const getOverallRiskColor = (risk: string) => {
    switch (risk) {
      case 'critical':
        return 'text-red-700 bg-red-100 border-red-200'
      case 'high':
        return 'text-orange-700 bg-orange-100 border-orange-200'
      case 'medium':
        return 'text-yellow-700 bg-yellow-100 border-yellow-200'
      case 'low':
        return 'text-green-700 bg-green-100 border-green-200'
      default:
        return 'text-gray-700 bg-gray-100 border-gray-200'
    }
  }

  if (loading) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/6"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 ${className}`}>
        <div className="text-center">
          <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Analysis Error
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <button
            onClick={fetchPatternAnalysis}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry Analysis
          </button>
        </div>
      </div>
    )
  }

  if (!analysis) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 ${className}`}>
        <div className="text-center text-gray-500 dark:text-gray-400">
          No pattern analysis available
        </div>
      </div>
    )
  }

  return (
    <div className={`card-depth ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              Pattern Analysis
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              AI-powered incident pattern detection
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className={`px-3 py-1 rounded-full text-sm font-medium border ${getOverallRiskColor(analysis.overallRisk)}`}>
              {analysis.overallRisk.toUpperCase()} RISK
            </div>
            <div className={`text-sm ${getPatternConfidenceColor(analysis.confidence)}`}>
              {analysis.confidence}% confidence
            </div>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
          {analysis.summary}
        </p>
      </div>

      {/* Patterns Grid */}
      <div className="p-6">
        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Detected Patterns ({analysis.patterns.length})
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AnimatePresence>
            {analysis.patterns.map((pattern, index) => (
              <motion.div
                key={pattern.type}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.1 }}
                className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setSelectedPattern(pattern)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {getPatternIcon(pattern.type)}
                    <h5 className="font-medium text-gray-900 dark:text-white">
                      {getPatternTitle(pattern.type)}
                    </h5>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getSeverityColor(pattern.severity)}`}>
                    {pattern.severity}
                  </span>
                </div>
                
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  {pattern.description}
                </p>
                
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-4">
                    <span className="text-gray-500">
                      {pattern.metrics.count} incidents ({pattern.metrics.percentage}%)
                    </span>
                    <div className="flex items-center gap-1">
                      {getTrendIcon(pattern.metrics.trend)}
                      <span className="text-gray-500">{pattern.metrics.trend}</span>
                    </div>
                  </div>
                  <span className={`${getPatternConfidenceColor(pattern.confidence)}`}>
                    {pattern.confidence}%
                  </span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {analysis.patterns.length === 0 && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <ChartBarIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No concerning patterns detected</p>
          </div>
        )}
      </div>

      {/* Recommendations */}
      {analysis.recommendations.length > 0 && (
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-blue-50 dark:bg-blue-900/20">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Recommendations
          </h4>
          <ul className="space-y-2">
            {analysis.recommendations.map((rec, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                <span className="text-blue-600 dark:text-blue-400 mt-1">•</span>
                {rec}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Pattern Detail Modal */}
      <AnimatePresence>
        {selectedPattern && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setSelectedPattern(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getPatternIcon(selectedPattern.type)}
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                      {getPatternTitle(selectedPattern.type)}
                    </h3>
                  </div>
                  <button
                    onClick={() => setSelectedPattern(null)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                  >
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              
              <div className="p-6 space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Description</h4>
                  <p className="text-gray-700 dark:text-gray-300">{selectedPattern.description}</p>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Recommendation</h4>
                  <p className="text-gray-700 dark:text-gray-300">{selectedPattern.recommendation}</p>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Metrics</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg">
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {selectedPattern.metrics.count}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Incidents</div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg">
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {selectedPattern.metrics.percentage}%
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Of Total</div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg">
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {selectedPattern.confidence}%
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Confidence</div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Timeframe</h4>
                  <p className="text-gray-700 dark:text-gray-300">{selectedPattern.timeframe}</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
