'use client'

import { useState, useEffect } from 'react'
import { AlertTriangle, ArrowUpRight } from 'lucide-react'
import type { EventBenchmarkingResult } from '@/lib/analytics/benchmarking'

interface BenchmarkingImprovementsProps {
  result: EventBenchmarkingResult
  className?: string
}

interface ImprovementItemProps {
  text: string
  index: number
}

const ImprovementItem = ({ text, index }: ImprovementItemProps) => {
  return (
    <li
      className="group flex items-start gap-3 p-3 rounded-xl border border-amber-100 dark:border-amber-900/30 bg-amber-50/50 dark:bg-amber-900/10 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-all duration-300 ease-out animate-in fade-in slide-in-from-bottom-2 fill-mode-backwards"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="mt-0.5 p-1 rounded-full bg-amber-200/50 dark:bg-amber-800/50 text-amber-700 dark:text-amber-400 flex-shrink-0 group-hover:rotate-45 transition-transform duration-300">
        <ArrowUpRight className="w-3.5 h-3.5" />
      </div>
      <span className="text-sm font-medium text-amber-900 dark:text-amber-100 leading-relaxed">
        {text}
      </span>
    </li>
  )
}

export default function BenchmarkingImprovements({
  result,
  className = ''
}: BenchmarkingImprovementsProps) {
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
        <div className="p-5 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-b border-amber-100 dark:border-amber-900/30 flex items-center gap-3">
          <div className="p-2 bg-white/80 dark:bg-amber-900/50 rounded-lg text-amber-600 dark:text-amber-400 shadow-sm">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-base font-bold text-amber-950 dark:text-amber-50">
              Areas for Improvement
            </h4>
            <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">
              Actionable insights to boost performance
            </p>
          </div>
        </div>

        {/* List Section */}
        <div className="p-5">
          {!result.improvements || result.improvements.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400 italic">
              No improvement areas identified yet. Add more events to enable comparison.
            </p>
          ) : (
            <ul className="space-y-3">
              {result.improvements.map((improvement, index) => (
                <ImprovementItem
                  key={index}
                  text={improvement}
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

