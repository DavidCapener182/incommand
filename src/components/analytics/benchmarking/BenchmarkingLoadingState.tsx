'use client'

import { Loader2 } from 'lucide-react'

interface BenchmarkingLoadingStateProps {
  className?: string
}

export default function BenchmarkingLoadingState({ className = '' }: BenchmarkingLoadingStateProps) {
  return (
    <div className={`w-full max-w-6xl mx-auto p-4 ${className}`}>
      {/* Main Dashboard Container Skeleton */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden relative">
        {/* Loading Overlay / Spinner */}
        <div className="absolute top-4 right-4 z-10">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-full border border-slate-200 dark:border-slate-700 shadow-sm">
            <Loader2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 animate-spin" />
            <span className="text-xs font-medium text-slate-600 dark:text-slate-300">Calculating benchmarks...</span>
          </div>
        </div>

        {/* Header Section Skeleton */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex flex-col sm:flex-row justify-between gap-6">
            <div className="flex gap-4">
              {/* Icon Placeholder */}
              <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
              <div className="space-y-2.5">
                {/* Title Placeholder */}
                <div className="h-5 w-48 bg-slate-200 dark:bg-slate-700 rounded-md animate-pulse" />
                {/* Subtitle Placeholder */}
                <div className="h-3 w-32 bg-slate-100 dark:bg-slate-800 rounded-md animate-pulse" />
              </div>
            </div>
            
            {/* Rank Badge Placeholder */}
            <div className="flex gap-4">
              <div className="h-12 w-24 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
              <div className="h-12 w-24 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
            </div>
          </div>
        </div>

        {/* Metrics Grid Skeleton */}
        <div className="p-6">
          <div className="h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded mb-4 animate-pulse" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30"
              >
                <div className="flex justify-between mb-4">
                  <div className="flex gap-2">
                    <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-800 animate-pulse" />
                    <div className="h-4 w-20 bg-slate-200 dark:bg-slate-700 rounded mt-2 animate-pulse" />
                  </div>
                  <div className="h-4 w-12 bg-slate-100 dark:bg-slate-800 rounded-full animate-pulse" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <div className="h-3 w-16 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
                    <div className="h-5 w-10 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                  </div>
                  <div className="h-px bg-slate-100 dark:bg-slate-800" />
                  <div className="flex justify-between">
                    <div className="h-3 w-16 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
                    <div className="h-3 w-10 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Insights Skeleton */}
        <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/30">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Strengths Skeleton */}
            <div className="space-y-3">
              <div className="h-4 w-40 bg-slate-200 dark:bg-slate-700 rounded mb-2 animate-pulse" />
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-10 w-full bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse" />
              ))}
            </div>
            {/* Improvements Skeleton */}
            <div className="space-y-3">
              <div className="h-4 w-40 bg-slate-200 dark:bg-slate-700 rounded mb-2 animate-pulse" />
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-10 w-full bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

