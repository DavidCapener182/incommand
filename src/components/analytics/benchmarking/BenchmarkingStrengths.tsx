'use client'

import { useState, useEffect } from 'react'
import { Trophy, CheckCircle2 } from 'lucide-react'
import type { EventBenchmarkingResult } from '@/lib/analytics/benchmarking'

interface BenchmarkingStrengthsProps {
  result: EventBenchmarkingResult
  className?: string
}

interface StrengthItemProps {
  text: string
  index: number
}

const StrengthItem = ({ text, index }: StrengthItemProps) => {
  return (
    <li
      className="group flex items-start gap-3 p-3 rounded-xl border border-emerald-100 dark:border-emerald-900/30 bg-emerald-50/50 dark:bg-emerald-900/10 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-all duration-300 ease-out animate-in fade-in slide-in-from-bottom-2 fill-mode-backwards"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="mt-0.5 p-1 rounded-full bg-emerald-200/50 dark:bg-emerald-800/50 text-emerald-700 dark:text-emerald-400 flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
        <CheckCircle2 className="w-3.5 h-3.5" />
      </div>
      <span className="text-sm font-medium text-emerald-900 dark:text-emerald-100 leading-relaxed">
        {text}
      </span>
    </li>
  )
}

export default function BenchmarkingStrengths({
  result,
  className = ''
}: BenchmarkingStrengthsProps) {
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
        <div className="p-5 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border-b border-emerald-100 dark:border-emerald-900/30 flex items-center gap-3">
          <div className="p-2 bg-white/80 dark:bg-emerald-900/50 rounded-lg text-emerald-600 dark:text-emerald-400 shadow-sm">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-base font-bold text-emerald-950 dark:text-emerald-50">
              Performance Strengths
            </h4>
            <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">
              Areas where you exceed industry benchmarks
            </p>
          </div>
        </div>
        {/* List Section */}
        <div className="p-5">
          {!result.strengths || result.strengths.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400 italic">
              No strengths identified yet. Add more events to enable comparison.
            </p>
          ) : (
            <ul className="space-y-3">
              {result.strengths.map((strength, index) => (
                <StrengthItem
                  key={index}
                  text={strength}
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

