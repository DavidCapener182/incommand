import React, { useCallback, useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import type { EventBenchmarkingResult } from '@/lib/analytics/benchmarking'
import BenchmarkingHeader from './benchmarking/BenchmarkingHeader'
import BenchmarkingWarningBanner from './benchmarking/BenchmarkingWarningBanner'
import BenchmarkingPerformanceSummary from './benchmarking/BenchmarkingPerformanceSummary'
import BenchmarkingMetricsComparison from './benchmarking/BenchmarkingMetricsComparison'
import BenchmarkingStrengths from './benchmarking/BenchmarkingStrengths'
import BenchmarkingImprovements from './benchmarking/BenchmarkingImprovements'
import BenchmarkingRecommendations from './benchmarking/BenchmarkingRecommendations'
import BenchmarkingLoadingState from './benchmarking/BenchmarkingLoadingState'
import { BenchmarkingEmptyState } from './benchmarking/BenchmarkingEmptyStates'

interface BenchmarkingDashboardProps {
  eventId: string
  className?: string
}

interface BenchmarkingData {
  result: EventBenchmarkingResult
  loading: boolean
  error: string | null
  debug?: {
    eventsUsed: Array<{ id: string; name: string; date: string; company_id: string; incident_count: number }>
    currentEventId: string
    currentEventName: string
    comparisonAvailable: boolean
    eventTypeUsed?: string
    eventTypeSource?: string
  }
}

const buildFallbackBenchmarkingResult = (): EventBenchmarkingResult => ({
  currentEvent: {
    venueType: 'Arena',
    metrics: {
      incidentsPerHour: 2.8,
      averageResponseTime: 11.5,
      resolutionRate: 89.2,
      staffEfficiency: 82.4,
      crowdDensityScore: 1.6,
      severityDistribution: {
        low: 52,
        medium: 33,
        high: 12,
        critical: 3
      }
    }
  },
  benchmark: {
    venueType: 'Arena',
    totalEvents: 68,
    averageMetrics: {
      incidentsPerHour: 3.1,
      averageResponseTime: 14.8,
      resolutionRate: 84.6,
      staffEfficiency: 78.1,
      crowdDensityScore: 1.9,
      severityDistribution: {
        low: 48,
        medium: 36,
        high: 13,
        critical: 3
      }
    },
    percentileRankings: {
      incidentsPerHour: 62,
      responseTime: 71,
      resolutionRate: 68,
      staffEfficiency: 66
    }
  },
  percentileRanking: 67,
  comparison: 'Performance is above average for similar arena events with faster-than-typical response times and steady resolution efficiency.',
  strengths: [
    'Response teams are resolving incidents faster than 70% of comparable events.',
    'Staff utilization indicates healthy coverage with minimal bottlenecks.',
    'Incident volume per hour is trending below the benchmark average.'
  ],
  improvements: [
    'Capture more detail on crowd density hotspots to anticipate surges.',
    'Increase proactive sweeps during peak arrival windows.',
    'Expand escalation playbooks for medium severity incidents.'
  ],
  recommendations: [
    'Introduce mid-shift micro-briefings to maintain response tempo.',
    'Deploy mobile teams at known congestion points during ingress.',
    'Invest in incident analytics to surface recurring patterns before the next event.'
  ]
})

export default function BenchmarkingDashboard({ 
  eventId, 
  className = '' 
}: BenchmarkingDashboardProps) {
  const [data, setData] = useState<BenchmarkingData>({
    result: buildFallbackBenchmarkingResult(),
    loading: true,
    error: null
  })

  const fetchBenchmarkingData = useCallback(async () => {
    if (!eventId || eventId.trim() === '') {
      setData({
        result: buildFallbackBenchmarkingResult(),
        loading: false,
        error: 'No event selected for benchmarking'
      })
      return
    }

    setData(prev => ({ ...prev, loading: true, error: null }))

    try {
      const response = await fetch(`/api/v1/events/${eventId}/benchmarking`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: 'openai' }),
        cache: 'no-store'
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        if (errorData.message) {
          throw new Error(errorData.message)
        }
        throw new Error(`Failed to fetch benchmarking data (${response.status})`)
      }

      const payload = await response.json()
      
      // Check if we have an error message about insufficient data - but still show cards
      if (!payload.success && payload.message) {
        // Still show the cards, just with a warning
        setData({
          result: buildFallbackBenchmarkingResult(),
          loading: false,
          error: payload.message,
          debug: payload.debug
        })
        return
      }
      
      const benchmarkingResult = (payload?.benchmarking ?? null) as EventBenchmarkingResult | null

      if (benchmarkingResult?.currentEvent) {
        setData({
          result: benchmarkingResult,
          loading: false,
          error: payload.debug && !payload.debug.comparisonAvailable ? `No other ${benchmarkingResult.currentEvent.venueType} events found for comparison` : null,
          debug: payload.debug
        })
      } else {
        setData({
          result: buildFallbackBenchmarkingResult(),
          loading: false,
          error: 'Benchmarking service returned no data; showing simulated comparison.',
          debug: payload.debug
        })
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      console.error('BenchmarkingDashboard fetch error:', err)
      setData({
        result: buildFallbackBenchmarkingResult(),
        loading: false,
        error: `Unable to fetch benchmarking data: ${message}`
      })
    }
  }, [eventId])

  useEffect(() => {
    fetchBenchmarkingData()
  }, [fetchBenchmarkingData])

  if (data.loading) {
    return <BenchmarkingLoadingState className={className} />
  }

  // Only show empty state if no event selected - otherwise show cards even without comparison data
  if (data.error && data.error.toLowerCase().includes('no event selected')) {
    return <BenchmarkingEmptyState error={data.error} className={className} />
  }

  // If no result at all, show empty state
  if (!data.result || !data.result.currentEvent) {
    return <BenchmarkingEmptyState onRetry={fetchBenchmarkingData} className={className} />
  }

  const { result } = data

  return (
    <Card className={`overflow-hidden ${className}`}>
      <BenchmarkingHeader result={result} />
      <BenchmarkingWarningBanner error={data.error} />
      
      {/* Debug Info - show which events are being compared */}
      {data.debug && (
        <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800">
          <details className="text-xs">
            <summary className="cursor-pointer text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 font-medium">
              🔍 Debug: Events being compared ({data.debug.eventsUsed.length} event{data.debug.eventsUsed.length !== 1 ? 's' : ''})
            </summary>
            <div className="mt-2 space-y-1 text-slate-600 dark:text-slate-400">
              <div className="font-semibold">Current Event:</div>
              <div className="ml-4">
                {data.debug.currentEventName} (ID: {data.debug.currentEventId})
                {data.debug.eventTypeUsed && (
                  <span className="ml-2 text-xs text-slate-500">
                    - Type: {data.debug.eventTypeUsed} (from {data.debug.eventTypeSource})
                  </span>
                )}
              </div>
              {data.debug.eventsUsed.length > 0 ? (
                <>
                  <div className="font-semibold mt-2">Comparison Events:</div>
                  {data.debug.eventsUsed.map((e, idx) => (
                    <div key={e.id} className="ml-4">
                      {idx + 1}. {e.name} ({new Date(e.date).toLocaleDateString()}) - {e.incident_count} incidents (Company: {e.company_id.slice(0, 8)}...)
                    </div>
                  ))}
                </>
              ) : (
                <div className="ml-4 text-amber-600 dark:text-amber-400">No comparison events found</div>
              )}
            </div>
          </details>
        </div>
      )}
      
      <BenchmarkingPerformanceSummary result={result} />
      <BenchmarkingMetricsComparison result={result} />
      {/* Three cards in one row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 p-4">
        <BenchmarkingStrengths result={result} />
        <BenchmarkingImprovements result={result} />
        <BenchmarkingRecommendations result={result} />
      </div>
    </Card>
  )
}
