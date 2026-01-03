'use client'

import { useState, useEffect } from 'react'
import { 
  BarChart2,
  Trophy,
  Building2,
  Users,
  Medal,
  TrendingUp,
  HelpCircle
} from 'lucide-react'
import { getPerformanceColor, getPerformanceLabel } from '@/lib/analytics/benchmarking'
import type { EventBenchmarkingResult } from '@/lib/analytics/benchmarking'

interface BenchmarkingHeaderProps {
  result: EventBenchmarkingResult
  className?: string
}

const getBadgeStyle = (percentile: number): string => {
  if (percentile >= 90) return 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800'
  if (percentile >= 75) return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800'
  if (percentile >= 50) return 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800'
  return 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800'
}

export default function BenchmarkingHeader({ result, className = '' }: BenchmarkingHeaderProps) {
  const { currentEvent, benchmark, percentileRanking } = result
  const [mounted, setMounted] = useState(false)
  const [displayPercentile, setDisplayPercentile] = useState(0)

  useEffect(() => {
    setMounted(true)
    
    // Percentile Count-up Animation
    let start = 0
    const duration = 1500
    const startTime = performance.now()

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)
      const easeOut = 1 - Math.pow(1 - progress, 4)
      
      setDisplayPercentile(Math.floor(start + (percentileRanking - start) * easeOut))

      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }

    requestAnimationFrame(animate)
  }, [percentileRanking])

  if (!mounted) {
    return (
      <div className={`p-4 border-b border-gray-200 dark:border-gray-700 ${className}`}>
        <div className="h-20 bg-gray-100 dark:bg-gray-800 animate-pulse rounded" />
      </div>
    )
  }

  const hasComparisonData = benchmark.totalEvents > 0
  const colorClass = hasComparisonData ? getPerformanceColor(percentileRanking) : 'text-slate-400'
  const badgeClass = hasComparisonData ? getBadgeStyle(percentileRanking) : 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
  const label = hasComparisonData ? getPerformanceLabel(percentileRanking) : 'No Comparison'

  // Calculate how many events this one beat
  const eventsBeat = hasComparisonData 
    ? Math.round((percentileRanking / 100) * benchmark.totalEvents)
    : 0

  return (
    <div className={`p-6 border-b border-slate-100 dark:border-slate-800 ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        {/* Left: Title & Context */}
        <div className="flex items-start gap-4">
          <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl text-indigo-600 dark:text-indigo-400 shadow-sm">
            <BarChart2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              Venue Benchmarking
              {hasComparisonData && percentileRanking >= 90 && (
                <Trophy className="w-4 h-4 text-yellow-500 fill-yellow-500 animate-bounce" />
              )}
            </h3>
            <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                <Building2 className="w-3 h-3" /> {currentEvent.venueType}
              </span>
              <span>vs.</span>
              <span className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                <Users className="w-3 h-3" /> {benchmark.totalEvents || 0} {benchmark.totalEvents === 1 ? 'Event' : 'Events'} in System
              </span>
            </div>
            {!hasComparisonData && (
              <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
                ℹ️ This is the only {currentEvent.venueType} event. Add more events to enable comparison.
              </p>
            )}
            {hasComparisonData && benchmark.totalEvents < 3 && (
              <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
                ⚠️ Limited data: Percentiles are more accurate with 3+ events
              </p>
            )}
          </div>
        </div>

        {/* Right: Ranking Metrics */}
        <div className="flex items-center gap-6 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
          {hasComparisonData ? (
            <>
              {/* Percentile Stat */}
              <div className="text-center px-2">
                <div className="flex items-baseline justify-center gap-0.5">
                  <span className={`text-3xl font-black tracking-tight ${colorClass}`}>
                    {displayPercentile}
                  </span>
                  <span className={`text-sm font-bold ${colorClass}`}>th</span>
                </div>
                <div className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">
                  Percentile
                </div>
                <div className="mt-1 flex items-center gap-1 justify-center group relative">
                  <HelpCircle className="w-3 h-3 text-slate-400 hover:text-slate-600 cursor-help" />
                  <div className="absolute bottom-full right-0 mb-2 w-64 p-3 bg-slate-900 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                    <div className="font-semibold mb-1">What does this mean?</div>
                    <div className="space-y-1">
                      <div>You performed better than <strong>{eventsBeat} out of {benchmark.totalEvents}</strong> similar events.</div>
                      <div className="text-slate-300 mt-2">Example: 75th percentile = better than 75% of events (top 25%)</div>
                      <div className="text-slate-300">Higher percentile = better performance</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="w-px h-10 bg-slate-200 dark:bg-slate-700" />

              {/* Performance Badge */}
              <div className="text-center px-2">
                <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wide border ${badgeClass} mb-1`}>
                  {percentileRanking >= 90 ? (
                    <Medal className="w-3 h-3" />
                  ) : (
                    <TrendingUp className="w-3 h-3" />
                  )}
                  {label}
                </div>
                <div className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">
                  Performance
                </div>
              </div>
            </>
          ) : (
            <div className="text-center px-4">
              <div className="text-lg font-semibold text-slate-400 dark:text-slate-500">
                No Comparison Available
              </div>
              <div className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 mt-1">
                Add more {currentEvent.venueType} events to compare
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

