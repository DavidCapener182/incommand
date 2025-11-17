/**
 * Readiness Index Card Component
 * Feature 1: Real-Time Operational Readiness Index
 * 
 * Dashboard card displaying current operational readiness score
 */

'use client'

import React, { useState, useEffect } from 'react'
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  MinusIcon,
  InformationCircleIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import ReadinessDetailsModal from './ReadinessDetailsModal'
import type { ReadinessScore } from '@/lib/analytics/readinessEngine'

interface ReadinessIndexCardProps {
  eventId: string | null
  className?: string
  initialData?: ReadinessScore | null
}

type ReadinessData = ReadinessScore

export default function ReadinessIndexCard({
  eventId,
  className = '',
  initialData,
}: ReadinessIndexCardProps) {
  const [readiness, setReadiness] = useState<ReadinessData | null>(initialData ?? null)
  const [loading, setLoading] = useState(!initialData)
  const [error, setError] = useState<string | null>(null)
  const [showDetails, setShowDetails] = useState(false)

  useEffect(() => {
    if (typeof initialData === 'undefined') return
    setReadiness(initialData ?? null)
    setLoading(false)
  }, [initialData])

  useEffect(() => {
    if (!eventId) {
      setReadiness(null)
      return
    }

    let cancelled = false

    const fetchReadiness = async (silent = false) => {
      if (!eventId) return
      if (!silent) {
        setLoading(true)
        setError(null)
      } else {
        setError(null)
      }

      try {
        const response = await fetch(`/api/analytics/readiness-index?event_id=${eventId}`)
        
        let data
        try {
          data = await response.json()
        } catch (jsonError) {
          // If JSON parsing fails, treat as error
          if (!response.ok) {
            throw new Error(response.statusText || 'Failed to fetch readiness index')
          }
          throw new Error('Invalid response format')
        }
        
        if (!cancelled) {
          if (response.ok && data.success && data.readiness) {
            setReadiness(data.readiness)
            setError(null) // Clear any previous errors
          } else if (data.readiness) {
            // If we have readiness data even if success is false, use it
            setReadiness(data.readiness)
            setError(null)
          } else if (!response.ok) {
            // Only set error if response is not ok AND we don't have data
            const errorMessage = data.error || data.details || 'Failed to fetch readiness index'
            // Only show error if we don't have cached data
            if (!readiness) {
              setError(errorMessage)
            }
          } else if (data.success === false) {
            // Response is ok but success is false - might be a calculation issue
            if (!readiness && !silent) {
              setError(data.error || 'Unable to calculate readiness index')
            }
          }
        }
      } catch (err) {
        console.error('Error fetching readiness index:', err)
        if (!cancelled) {
          // Only set error if we don't have cached data
          if (!readiness) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error'
            // Don't show network errors if we have cached data
            if (!(err instanceof TypeError && readiness)) {
              setError(errorMessage)
            }
          }
        }
      } finally {
        if (!silent && !cancelled) {
          setLoading(false)
        }
      }
    }

    // If we already have initial data, refresh silently to avoid flicker
    fetchReadiness(Boolean(initialData))
    const interval = setInterval(() => fetchReadiness(true), 30 * 1000)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [eventId, initialData])

  const getScoreColor = (score: number): string => {
    if (score >= 80) return 'text-green-600 dark:text-green-400'
    if (score >= 60) return 'text-amber-600 dark:text-amber-400'
    return 'text-red-600 dark:text-red-400'
  }

  const getScoreBgColor = (score: number): string => {
    if (score >= 80) return 'bg-green-100 dark:bg-green-900/20'
    if (score >= 60) return 'bg-amber-100 dark:bg-amber-900/20'
    return 'bg-red-100 dark:bg-red-900/20'
  }

  const getStatusIcon = (score: number) => {
    if (score >= 80) return CheckCircleIcon
    if (score >= 60) return ExclamationTriangleIcon
    return XCircleIcon
  }

  const getTrendIcon = () => {
    if (!readiness) return null
    switch (readiness.trend) {
      case 'improving':
        return <ArrowTrendingUpIcon className="h-4 w-4 text-green-600" />
      case 'declining':
        return <ArrowTrendingDownIcon className="h-4 w-4 text-red-600" />
      default:
        return <MinusIcon className="h-4 w-4 text-gray-400" />
    }
  }

  const getStatusLabel = (score: number): string => {
    if (score >= 80) return 'Ready'
    if (score >= 60) return 'Moderate'
    return 'Critical'
  }

  if (!eventId) {
    return null
  }

  if (loading && !readiness) {
    return (
      <Card className={`h-full flex flex-col justify-between bg-white dark:bg-gray-800 rounded-3xl shadow-lg p-4 sm:p-5 ${className}`}>
        <div className="flex flex-col space-y-3">
          <div>
            <div className="flex items-center justify-between mb-0">
              <div className="flex items-center space-x-3">
                <ShieldCheckIcon className="h-5 w-5 text-[#4361EE]" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Operational Readiness</h3>
              </div>
            </div>
          </div>
          <hr className="border-gray-200 dark:border-gray-700" />
          <div className="flex items-center justify-center h-32">
            <div className="animate-pulse text-gray-400">Loading...</div>
          </div>
        </div>
      </Card>
    )
  }

  if (error && !readiness) {
    return (
      <Card className={`h-full flex flex-col justify-between bg-white dark:bg-gray-800 rounded-3xl shadow-lg p-4 sm:p-5 ${className}`}>
        <div className="flex flex-col space-y-3">
          <div>
            <div className="flex items-center justify-between mb-0">
              <div className="flex items-center space-x-3">
                <ShieldCheckIcon className="h-5 w-5 text-[#4361EE]" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Operational Readiness</h3>
              </div>
            </div>
          </div>
          <hr className="border-gray-200 dark:border-gray-700" />
          <div className="flex flex-col items-center justify-center h-32 space-y-2">
            <ExclamationTriangleIcon className="h-8 w-8 text-amber-500" />
            <div className="text-amber-600 dark:text-amber-400 text-sm text-center px-4">
              Unable to calculate readiness index
            </div>
            <div className="text-gray-500 dark:text-gray-400 text-xs text-center px-4">
              This may be temporary. The system will retry automatically.
            </div>
          </div>
        </div>
      </Card>
    )
  }

  if (!readiness) {
    return null
  }

  const StatusIcon = getStatusIcon(readiness.overall_score)
  const highSeverityAlerts = readiness.alerts.filter((a) => a.severity === 'high')

  return (
    <>
      <Card className={`cursor-pointer hover:shadow-md transition-shadow h-full flex flex-col justify-between bg-white dark:bg-gray-800 rounded-3xl shadow-lg p-4 sm:p-5 ${className}`} onClick={() => setShowDetails(true)}>
        <div className="flex flex-col space-y-3">
          {/* Header Section */}
          <div>
            <div className="flex items-center justify-between mb-0">
              <div className="flex items-center space-x-3">
                <ShieldCheckIcon className="h-5 w-5 text-[#4361EE]" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Operational Readiness
                </h3>
              </div>
              {getTrendIcon()}
            </div>
          </div>

          {/* Divider */}
          <hr className="border-gray-200 dark:border-gray-700" />

          {/* Content */}
          <div>
          {/* Progress Bar Section */}
          <div className="mb-3">
            <div className="relative w-full h-12 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
              {/* Progress Bar Fill */}
              <div
                className={`absolute inset-y-0 left-0 flex items-center px-4 transition-all duration-500 ease-out ${
                  readiness.overall_score >= 80
                    ? 'bg-green-100 dark:bg-green-900/30'
                    : readiness.overall_score >= 60
                    ? 'bg-amber-100 dark:bg-amber-900/30'
                    : 'bg-red-100 dark:bg-red-900/30'
                }`}
                style={{ width: `${readiness.overall_score}%` }}
              >
                {/* Icon and Score */}
                <div className="flex items-center space-x-3">
                  <StatusIcon
                    className={`h-5 w-5 ${getScoreColor(readiness.overall_score)}`}
                  />
                  <div>
                    <div className={`text-xl font-bold ${getScoreColor(readiness.overall_score)}`}>
                      {readiness.overall_score}
                    </div>
                    <div className={`text-xs font-medium ${getScoreColor(readiness.overall_score)}`}>
                      {getStatusLabel(readiness.overall_score)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Component breakdown (collapsed) */}
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Staffing</span>
              <span className={getScoreColor(readiness.component_scores.staffing.score)}>
                {readiness.component_scores.staffing.score}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Incidents</span>
              <span className={getScoreColor(readiness.component_scores.incident_pressure.score)}>
                {readiness.component_scores.incident_pressure.score}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">
                {readiness.component_scores.crowd_density.details?.metric_label || 'Crowd'}
              </span>
              <span className={getScoreColor(readiness.component_scores.crowd_density.score)}>
                {readiness.component_scores.crowd_density.score}%
              </span>
            </div>
          </div>

          {/* Alerts */}
          {highSeverityAlerts.length > 0 && (
            <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-1 text-red-600 text-xs">
                <ExclamationTriangleIcon className="h-4 w-4" />
                <span>{highSeverityAlerts.length} critical alert(s)</span>
              </div>
            </div>
          )}

          {/* Click hint */}
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-center text-xs text-gray-500 dark:text-gray-400">
              <InformationCircleIcon className="h-3 w-3 mr-1" />
              Click for details
            </div>
          </div>
          </div>
        </div>
      </Card>

      {showDetails && readiness && (
        <ReadinessDetailsModal
          isOpen={showDetails}
          onClose={() => setShowDetails(false)}
          readiness={readiness}
          eventId={eventId}
        />
      )}
    </>
  )
}

