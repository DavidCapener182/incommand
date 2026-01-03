'use client'

import React, { useState, useEffect } from 'react'
import { ClipboardCheck, AlertTriangle, CheckCircle2, AlertCircle } from 'lucide-react'

interface FieldBreakdown {
  field: string
  score: number
  issues: string[]
}

interface FieldRowProps {
  field: string
  score: number
  issues: string[]
  index: number
}

// --- Helper for Colors ---
const getScoreColor = (score: number) => {
  if (score >= 90) return { color: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20' }
  if (score >= 75) return { color: 'bg-blue-500', text: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20' }
  if (score >= 60) return { color: 'bg-amber-500', text: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20' }
  return { color: 'bg-red-500', text: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20' }
}

// --- Sub-Component for Individual Field Row ---
const FieldRow = ({ field, score, issues, index }: FieldRowProps) => {
  const [width, setWidth] = useState(0)
  const styles = getScoreColor(score)
  const hasIssues = issues && issues.length > 0

  useEffect(() => {
    // Staggered animation delay based on index
    const timeout = setTimeout(() => {
      setWidth(score)
    }, index * 100 + 200)
    return () => clearTimeout(timeout)
  }, [score, index])

  return (
    <div className="group">
      <div className="flex justify-between items-end mb-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
            {field}
          </span>
          {hasIssues && (
            <div className="group/tooltip relative">
              <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/30 text-[10px] font-medium text-amber-600 dark:text-amber-400 cursor-help transition-colors hover:bg-amber-100 dark:hover:bg-amber-900/40">
                <AlertTriangle className="w-3 h-3" />
                {issues.length} Issue{issues.length !== 1 ? 's' : ''}
              </div>
              
              {/* Simple CSS Tooltip for Issues */}
              <div className="absolute bottom-full left-0 mb-2 w-48 p-2 bg-slate-800 text-white text-xs rounded shadow-lg opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all duration-200 z-10 pointer-events-none">
                <ul className="list-disc list-inside space-y-1">
                  {issues.map((issue, i) => (
                    <li key={i} className="truncate">{issue}</li>
                  ))}
                </ul>
                {/* Tooltip Arrow */}
                <div className="absolute top-full left-4 -mt-1 border-4 border-transparent border-t-slate-800" />
              </div>
            </div>
          )}
        </div>
        <span className={`text-sm font-bold ${styles.text}`}>
          {score}%
        </span>
      </div>

      {/* Progress Bar Track */}
      <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
        {/* Animated Fill */}
        <div 
          className={`h-full rounded-full transition-all duration-1000 ease-out ${styles.color} relative`}
          style={{ width: `${width}%` }}
        >
          {/* Shine effect overlay */}
          <div className="absolute inset-0 bg-white/20" />
        </div>
      </div>
    </div>
  )
}

interface CompletenessByFieldCardProps {
  breakdown?: FieldBreakdown[]
  className?: string
}

export default function CompletenessByFieldCard({ 
  breakdown = [], 
  className = '' 
}: CompletenessByFieldCardProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Calculate average for summary badge
  const averageCompleteness = breakdown.length > 0
    ? Math.round(breakdown.reduce((acc, curr) => acc + curr.score, 0) / breakdown.length)
    : 0

  if (!mounted) return null

  return (
    <div className={`w-full ${className}`}>
      {/* Card Container */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden hover:shadow-xl hover:scale-[1.005] transition-all duration-300 ease-out animate-in fade-in slide-in-from-bottom-4">
        
        {/* Header Section */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-teal-50 dark:bg-teal-900/20 rounded-lg text-teal-600 dark:text-teal-400">
              <ClipboardCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">
                Field Completeness
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Data quality by category
              </p>
            </div>
          </div>
          
          {/* Summary Badge */}
          <div className="flex flex-col items-end">
            <span className="text-2xl font-bold text-slate-900 dark:text-white leading-none">
              {averageCompleteness}%
            </span>
            <span className="text-xs font-medium text-teal-500 flex items-center gap-1 mt-1">
              <CheckCircle2 className="w-3 h-3" /> Avg. Completion
            </span>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-6 space-y-6">
          {breakdown.map((item, index) => (
            <FieldRow 
              key={item.field || index} 
              field={item.field} 
              score={item.score} 
              issues={item.issues} 
              index={index}
            />
          ))}

          {breakdown.length === 0 && (
            <div className="text-center py-8 text-slate-400 flex flex-col items-center">
              <AlertCircle className="w-8 h-8 mb-2 opacity-50" />
              <p>No field data available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
