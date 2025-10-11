import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ChartBarIcon,
  ClockIcon,
  CheckCircleIcon,
  StarIcon,
  TrendingUpIcon,
  UserGroupIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import { Line, Bar } from 'recharts'

interface PerformanceMetrics {
  performance_score: number
  incidents_handled: number
  avg_response_time_minutes: number
  log_quality_score: number
  resolution_rate: number
}

interface StaffPerformance {
  id: number
  profile_id: string
  event_id: string
  performance_score: number
  incidents_handled: number
  avg_response_time_minutes: number
  log_quality_score: number
  resolution_rate: number
  supervisor_rating: number | null
  supervisor_notes: string | null
  calculated_at: string
  profile: {
    id: string
    first_name: string
    last_name: string
    callsign: string | null
    email: string
  }
}

interface StaffPerformanceDashboardProps {
  eventId: string
  className?: string
}

export default function StaffPerformanceDashboard({ 
  eventId,
  className = '' 
}: StaffPerformanceDashboardProps) {
  const [performances, setPerformances] = useState<StaffPerformance[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedStaff, setSelectedStaff] = useState<StaffPerformance | null>(null)

  const fetchPerformanceData = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/v1/events/${eventId}/staff-performance`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch performance data')
      }
      
      const data = await response.json()
      setPerformances(data.performances || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (eventId) {
      fetchPerformanceData()
    }
  }, [eventId])

  const getPerformanceColor = (score: number) => {
    if (score >= 90) return 'text-green-600 bg-green-100'
    if (score >= 80) return 'text-blue-600 bg-blue-100'
    if (score >= 70) return 'text-yellow-600 bg-yellow-100'
    if (score >= 60) return 'text-orange-600 bg-orange-100'
    return 'text-red-600 bg-red-100'
  }

  const getPerformanceLabel = (score: number) => {
    if (score >= 90) return 'Excellent'
    if (score >= 80) return 'Very Good'
    if (score >= 70) return 'Good'
    if (score >= 60) return 'Above Average'
    if (score >= 50) return 'Average'
    return 'Needs Improvement'
  }

  const getPerformanceIcon = (score: number) => {
    if (score >= 80) return <StarIcon className="h-5 w-5" />
    if (score >= 60) return <CheckCircleIcon className="h-5 w-5" />
    return <ExclamationTriangleIcon className="h-5 w-5" />
  }

  const formatResponseTime = (minutes: number | null) => {
    if (!minutes) return 'N/A'
    if (minutes < 1) return '< 1 min'
    return `${minutes.toFixed(1)} min`
  }

  if (loading) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
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
            Performance Error
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <button
            onClick={fetchPerformanceData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  const averageScore = performances.length > 0 
    ? performances.reduce((sum, p) => sum + p.performance_score, 0) / performances.length 
    : 0

  const topPerformers = performances
    .sort((a, b) => b.performance_score - a.performance_score)
    .slice(0, 3)

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              Staff Performance Dashboard
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Performance metrics and scoring for current event
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {averageScore.toFixed(1)}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Average Score
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Overview */}
      <div className="p-6">
        {/* Top Performers */}
        {topPerformers.length > 0 && (
          <div className="mb-6">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Top Performers
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {topPerformers.map((performer, index) => (
                <motion.div
                  key={performer.profile_id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="text-lg font-bold text-blue-600">
                        #{index + 1}
                      </div>
                      <StarIcon className="h-5 w-5 text-yellow-500" />
                    </div>
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${getPerformanceColor(performer.performance_score)}`}>
                      {performer.performance_score}%
                    </div>
                  </div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {performer.profile.first_name} {performer.profile.last_name}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {performer.profile.callsign || performer.profile.email}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Performance Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Staff Member
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Performance Score
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Incidents Handled
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Avg Response Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Log Quality
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Resolution Rate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              <AnimatePresence>
                {performances.map((performance) => (
                  <motion.tr
                    key={performance.profile_id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center">
                            <span className="text-white font-medium">
                              {performance.profile.first_name[0]}{performance.profile.last_name[0]}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {performance.profile.first_name} {performance.profile.last_name}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {performance.profile.callsign || performance.profile.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getPerformanceColor(performance.performance_score)}`}>
                          {getPerformanceIcon(performance.performance_score)}
                          {performance.performance_score}%
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {getPerformanceLabel(performance.performance_score)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {performance.incidents_handled}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {formatResponseTime(performance.avg_response_time_minutes)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {performance.log_quality_score}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {performance.resolution_rate.toFixed(1)}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => setSelectedStaff(performance)}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        View Details
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        {performances.length === 0 && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <ChartBarIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No performance data available for this event</p>
          </div>
        )}
      </div>

      {/* Performance Details Modal */}
      <AnimatePresence>
        {selectedStaff && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setSelectedStaff(null)}
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
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                      Performance Details
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {selectedStaff.profile.first_name} {selectedStaff.profile.last_name}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedStaff(null)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                  >
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                      <div className="text-3xl font-bold text-gray-900 dark:text-white">
                        {selectedStaff.performance_score}%
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Overall Performance Score
                      </div>
                      <div className="mt-2">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getPerformanceColor(selectedStaff.performance_score)}`}>
                          {getPerformanceIcon(selectedStaff.performance_score)}
                          {getPerformanceLabel(selectedStaff.performance_score)}
                        </span>
                      </div>
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {selectedStaff.incidents_handled}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Incidents Handled
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {formatResponseTime(selectedStaff.avg_response_time_minutes)}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Average Response Time
                      </div>
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {selectedStaff.log_quality_score}%
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Log Quality Score
                      </div>
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {selectedStaff.resolution_rate.toFixed(1)}%
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Resolution Rate
                      </div>
                    </div>
                  </div>
                </div>

                {selectedStaff.supervisor_notes && (
                  <div className="mt-6">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      Supervisor Notes
                    </h4>
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                      <p className="text-gray-700 dark:text-gray-300">
                        {selectedStaff.supervisor_notes}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
