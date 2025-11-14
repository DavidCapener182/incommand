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
} from '@heroicons/react/24/outline'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
        if (!response.ok) {
          throw new Error('Failed to fetch readiness index')
        }
        const data = await response.json()
        if (!cancelled) {
          if (data.success && data.readiness) {
            setReadiness(data.readiness)
          } else {
            throw new Error('Invalid response format')
          }
        }
      } catch (err) {
        console.error('Error fetching readiness index:', err)
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Unknown error')
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
      <Card className={`${className}`}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Operational Readiness</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="animate-pulse text-gray-400">Loading...</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error && !readiness) {
    return (
      <Card className={`${className}`}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Operational Readiness</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="text-red-600 text-sm">{error}</div>
          </div>
        </CardContent>
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
      <Card className={`cursor-pointer hover:shadow-md transition-shadow ${className}`} onClick={() => setShowDetails(true)}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold text-gray-900 dark:text-white">
              Operational Readiness
            </CardTitle>
            {getTrendIcon()}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className={`flex items-center space-x-3 ${getScoreBgColor(readiness.overall_score)} rounded-lg p-3`}>
              <StatusIcon className={`h-8 w-8 ${getScoreColor(readiness.overall_score)}`} />
              <div>
                <div className={`text-3xl font-bold ${getScoreColor(readiness.overall_score)}`}>
                  {readiness.overall_score}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  {getStatusLabel(readiness.overall_score)}
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
            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
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
        </CardContent>
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

