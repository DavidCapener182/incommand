'use client'

import { useState, useEffect } from 'react'
import { Lightbulb, ArrowRight } from 'lucide-react'
import type { EventBenchmarkingResult } from '@/lib/analytics/benchmarking'

interface BenchmarkingRecommendationsProps {
  result: EventBenchmarkingResult
  className?: string
}

interface RecommendationItemProps {
  text: string
  index: number
}

const RecommendationItem = ({ text, index }: RecommendationItemProps) => {
  return (
    <li
      className="group flex items-start gap-3 p-3 rounded-xl border border-blue-100 dark:border-blue-900/30 bg-blue-50/50 dark:bg-blue-900/10 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-all duration-300 ease-out animate-in fade-in slide-in-from-bottom-2 fill-mode-backwards"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="mt-0.5 p-1 rounded-full bg-blue-200/50 dark:bg-blue-800/50 text-blue-700 dark:text-blue-400 flex-shrink-0 group-hover:translate-x-1 transition-transform duration-300">
        <ArrowRight className="w-3.5 h-3.5" />
      </div>
      <span className="text-sm font-medium text-blue-900 dark:text-blue-100 leading-relaxed">
        {text}
      </span>
    </li>
  )
}

export default function BenchmarkingRecommendations({
  result,
  className = ''
}: BenchmarkingRecommendationsProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <div className={`w-full ${className}`}>
      {/* Card Container */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden hover:shadow-md transition-all duration-300">
        {/* Header Section with Gradient */}
        <div className="p-5 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-b border-blue-100 dark:border-blue-900/30 flex items-center gap-3">
          <div className="p-2 bg-white/80 dark:bg-blue-900/50 rounded-lg text-blue-600 dark:text-blue-400 shadow-sm">
            <Lightbulb className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-base font-bold text-blue-950 dark:text-blue-50">
              Strategic Recommendations
            </h4>
            <p className="text-xs text-blue-700 dark:text-blue-400 font-medium">
              Data-driven steps to improve ranking
            </p>
          </div>
        </div>

        {/* List Section */}
        <div className="p-5">
          {!result.recommendations || result.recommendations.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400 italic">
              No recommendations available yet. Add more events to enable comparison.
            </p>
          ) : (
            <ul className="space-y-3">
              {result.recommendations.map((recommendation, index) => (
                <RecommendationItem
                  key={index}
                  text={recommendation}
                  index={index}
                />
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

