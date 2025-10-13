'use client'

import { useState, useEffect } from 'react'
import { 
  SparklesIcon, 
  ShieldCheckIcon,
  ChartBarIcon,
  ClockIcon
} from '@heroicons/react/24/outline'
import { getComplianceSummary } from '@/lib/analytics/complianceMetrics'
import { getPerformanceSummary } from '@/lib/analytics/performanceMetrics'
import { calculateLogQualityMetrics } from '@/lib/analytics/logQualityMetrics'

interface AnalyticsKPICardsProps {
  eventId?: string
  className?: string
}

interface QuickStats {
  qualityScore: number
  complianceGrade: string
  complianceStatus: 'excellent' | 'good' | 'fair' | 'poor'
  avgResponseTime: number
  activeIncidents: number
}

function getScoreColor(score: number): string {
  if (score >= 90) return 'text-green-600 dark:text-green-400'
  if (score >= 75) return 'text-blue-600 dark:text-blue-400'
  if (score >= 60) return 'text-amber-600 dark:text-amber-400'
  return 'text-red-600 dark:text-red-400'
}

function getGradeColor(grade: string): string {
  const gradeColors: Record<string, string> = {
    'A': 'text-green-600 dark:text-green-400',
    'B': 'text-blue-600 dark:text-blue-400',
    'C': 'text-amber-600 dark:text-amber-400',
    'D': 'text-orange-600 dark:text-orange-400',
    'F': 'text-red-600 dark:text-red-400'
  }
  return gradeColors[grade] || 'text-gray-600 dark:text-gray-400'
}

export default function AnalyticsKPICards({ eventId, className = '' }: AnalyticsKPICardsProps) {
  const [stats, setStats] = useState<QuickStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchQuickStats() {
      try {
        setLoading(true)
        
        // Get last 24 hours data
        const endDate = new Date()
        const startDate = new Date(endDate.getTime() - 24 * 60 * 60 * 1000)

        const [qualityMetrics, complianceSummary, perfSummary] = await Promise.all([
          calculateLogQualityMetrics(startDate, endDate, eventId).catch(() => null),
          getComplianceSummary(eventId).catch(() => null),
          getPerformanceSummary(eventId).catch(() => null)
        ])

        setStats({
          qualityScore: qualityMetrics?.overallScore || 0,
          complianceGrade: complianceSummary?.grade || 'N/A',
          complianceStatus: complianceSummary?.status || 'fair',
          avgResponseTime: perfSummary?.avgResponseTime || 0,
          activeIncidents: perfSummary?.activeIncidents || 0
        })
      } catch (error) {
        console.error('Error fetching analytics KPIs:', error)
        setStats({
          qualityScore: 0,
          complianceGrade: 'N/A',
          complianceStatus: 'fair',
          avgResponseTime: 0,
          activeIncidents: 0
        })
      } finally {
        setLoading(false)
      }
    }

    fetchQuickStats()
    
    // Refresh every 5 minutes
    const interval = setInterval(fetchQuickStats, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [eventId])

  if (loading) {
    return (
      <div className={`grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 ${className}`}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white/95 dark:bg-[#23408e]/95 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-[#2d437a]/50 px-3 py-2.5 animate-pulse">
            <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-20 mb-2"></div>
            <div className="h-8 bg-gray-200 dark:bg-gray-600 rounded w-16 mb-1"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-24"></div>
          </div>
        ))}
      </div>
    )
  }

  if (!stats) return null

  return (
    <div className={`grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 ${className}`}>
      {/* Log Quality Score */}
      <div className="relative bg-white/95 dark:bg-[#23408e]/95 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-[#2d437a]/50 px-3 py-2.5 hover:shadow-lg transition-all duration-200 group">
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <SparklesIcon className="h-4 w-4 text-blue-500" />
              <span className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide">
                Log Quality
              </span>
            </div>
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <span className={`text-3xl font-bold ${getScoreColor(stats.qualityScore)}`}>
                {stats.qualityScore}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">/100</span>
              <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                Today&apos;s average
              </span>
            </div>
          </div>
          <div className="mt-0.5">
            <div className="relative w-10 h-10">
              <svg className="transform -rotate-90 w-10 h-10">
                <circle
                  cx="20"
                  cy="20"
                  r="16"
                  stroke="currentColor"
                  strokeWidth="3"
                  fill="none"
                  className="text-gray-200 dark:text-gray-600"
                />
                <circle
                  cx="20"
                  cy="20"
                  r="16"
                  stroke="currentColor"
                  strokeWidth="3"
                  fill="none"
                  strokeDasharray={`${(stats.qualityScore / 100) * 100.53} 100.53`}
                  strokeLinecap="round"
                  className={getScoreColor(stats.qualityScore)}
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Compliance Grade */}
      <div className="relative bg-white/95 dark:bg-[#23408e]/95 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-[#2d437a]/50 px-3 py-2.5 hover:shadow-lg transition-all duration-200 group">
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <ShieldCheckIcon className="h-4 w-4 text-green-500" />
              <span className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide">
                Compliance
              </span>
            </div>
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <span className={`text-3xl font-bold ${getGradeColor(stats.complianceGrade)}`}>
                {stats.complianceGrade}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                JESIP/JDM Grade
              </span>
              <span className="text-xs font-medium text-gray-400 dark:text-gray-500 italic whitespace-nowrap">
                {stats.complianceStatus.charAt(0).toUpperCase() + stats.complianceStatus.slice(1)}
              </span>
            </div>
          </div>
          <div className="mt-0.5">
            {stats.complianceStatus === 'excellent' && (
              <span className="text-2xl">🏆</span>
            )}
            {stats.complianceStatus === 'good' && (
              <span className="text-2xl">✅</span>
            )}
            {stats.complianceStatus === 'fair' && (
              <span className="text-2xl">⚠️</span>
            )}
            {stats.complianceStatus === 'poor' && (
              <span className="text-2xl">❌</span>
            )}
          </div>
        </div>
      </div>

      {/* Response Time */}
      <div className="relative bg-white/95 dark:bg-[#23408e]/95 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-[#2d437a]/50 px-3 py-2.5 hover:shadow-lg transition-all duration-200 group">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <ClockIcon className="h-4 w-4 text-purple-500" />
              <span className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide">
                Avg Response
              </span>
            </div>
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <span className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                {stats.avgResponseTime}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                min
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                Last 24 hours
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Active Incidents */}
      <div className="relative bg-white/95 dark:bg-[#23408e]/95 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-[#2d437a]/50 px-3 py-2.5 hover:shadow-lg transition-all duration-200 group">
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <ChartBarIcon className="h-4 w-4 text-orange-500" />
              <span className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide">
                Active Now
              </span>
            </div>
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <span
                className={`text-3xl font-bold ${
                  stats.activeIncidents === 0 ? 'text-green-600 dark:text-green-400'
                    : stats.activeIncidents < 5 ? 'text-blue-600 dark:text-blue-400'
                    : stats.activeIncidents < 10 ? 'text-amber-600 dark:text-amber-400'
                    : 'text-red-600 dark:text-red-400'
                }`}
              >
                {stats.activeIncidents}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                Open incidents
              </span>
            </div>
          </div>
          {stats.activeIncidents > 0 && (
            <div className="mt-0.5">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
