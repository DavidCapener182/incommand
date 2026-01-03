'use client'

import { useState, useEffect } from 'react'
import { TrophyIcon } from '@heroicons/react/24/outline'
import type { EventBenchmarkingResult } from '@/lib/analytics/benchmarking'

interface BenchmarkingPerformanceSummaryProps {
  result: EventBenchmarkingResult
  className?: string
}

export default function BenchmarkingPerformanceSummary({ 
  result, 
  className = '' 
}: BenchmarkingPerformanceSummaryProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className={`p-4 border-b border-gray-200 dark:border-gray-700 ${className}`}>
        <div className="h-20 bg-gray-100 dark:bg-gray-800 animate-pulse rounded" />
      </div>
    )
  }

  return (
    <div className={`p-4 border-b border-gray-200 dark:border-gray-700 ${className}`}>
      <div className="group relative overflow-hidden rounded-xl border border-yellow-200 dark:border-yellow-900/50 bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900/10 dark:to-amber-900/10 p-6 shadow-sm transition-all duration-300 hover:shadow-md animate-in fade-in slide-in-from-bottom-2">
        
        {/* Decorative Background Icon */}
        <div className="absolute -right-4 -top-4 opacity-10 dark:opacity-5 transform rotate-12 group-hover:rotate-0 transition-transform duration-700">
          <TrophyIcon className="w-24 h-24 text-yellow-600 dark:text-yellow-400" />
        </div>

        <div className="relative z-10 flex items-start gap-4">
          {/* Icon Badge */}
          <div className="mt-1 flex-shrink-0 p-2 rounded-full bg-yellow-100 dark:bg-yellow-900/40 text-yellow-600 dark:text-yellow-400 shadow-sm ring-1 ring-yellow-200 dark:ring-yellow-800">
            <TrophyIcon className="w-5 h-5" />
          </div>

          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold uppercase tracking-wide text-yellow-800 dark:text-yellow-500">
                Performance Summary
              </h4>
              <svg 
                className="w-3.5 h-3.5 text-yellow-500 animate-pulse" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </div>
            
            <div className="relative">
              <svg 
                className="absolute -left-2 -top-2 w-3 h-3 text-yellow-400 dark:text-yellow-700 transform scale-x-[-1] opacity-50" 
                fill="currentColor" 
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.996 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.984zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
              </svg>
              <p className="text-base text-gray-800 dark:text-gray-200 leading-relaxed font-medium">
                {result.comparison}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

