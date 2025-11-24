'use client'

import { useState, useEffect } from 'react'
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import { calculateLogQualityMetrics, getLogQualityTrend, getTopPerformingOperators } from '@/lib/analytics/logQualityMetrics'
import type { LogQualityMetrics, LogQualityTrend } from '@/lib/analytics/logQualityMetrics'
import OverallScoreCard from './cards/quality/OverallScoreCard'
import ScoreBreakdownCard from './cards/quality/ScoreBreakdownCard'
import QualityTrendCard from './cards/quality/QualityTrendCard'
import ScoreComponentsCard from './cards/quality/ScoreComponentsCard'
import EntryTypeDistributionCard from './cards/quality/EntryTypeDistributionCard'
import CompletenessByFieldCard from './cards/quality/CompletenessByFieldCard'
import TopOperatorsCard from './cards/quality/TopOperatorsCard'

interface LogQualityDashboardProps {
  startDate: Date
  endDate: Date
  eventId?: string
}


export default function LogQualityDashboard({ startDate, endDate, eventId }: LogQualityDashboardProps) {
  const [metrics, setMetrics] = useState<LogQualityMetrics | null>(null)
  const [trend, setTrend] = useState<LogQualityTrend[]>([])
  const [topOperators, setTopOperators] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      setError(null)
      
      try {
        // Fetch real data from the database
        const [metricsData, trendData, operatorsData] = await Promise.all([
          calculateLogQualityMetrics(startDate, endDate, eventId),
          getLogQualityTrend(startDate, endDate, eventId, 'day'),
          getTopPerformingOperators(startDate, endDate, eventId, 10)
        ])
        
        setMetrics(metricsData)
        setTrend(trendData)
        setTopOperators(operatorsData)
      } catch (err) {
        console.error('Error fetching log quality data:', err)
        setError('Failed to load quality metrics')
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
  }, [startDate, endDate, eventId])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error || !metrics) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <ExclamationTriangleIcon className="h-12 w-12 text-red-600 mx-auto mb-3" />
        <p className="text-red-800 font-medium">{error || 'No data available'}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <OverallScoreCard 
        overallScore={metrics.overallScore}
        totalLogs={metrics.totalLogs}
      />

      <ScoreBreakdownCard 
        completeness={metrics.completeness}
        timeliness={metrics.timeliness}
        factualLanguage={metrics.factualLanguage}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <QualityTrendCard trend={trend} />
        <ScoreComponentsCard 
          completeness={metrics.completeness}
          timeliness={metrics.timeliness}
          factualLanguage={metrics.factualLanguage}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <EntryTypeDistributionCard 
          amendmentRate={metrics.amendmentRate}
          retrospectiveRate={metrics.retrospectiveRate}
        />
        <CompletenessByFieldCard breakdown={metrics.breakdown} />
      </div>

      <TopOperatorsCard topOperators={topOperators} />
    </div>
  )
}
