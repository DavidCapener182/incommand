'use client'

import React, { useState, useEffect } from 'react'
import { Trophy, TrendingUp, User } from 'lucide-react'

interface Operator {
  userId?: string
  userName?: string
  callsign?: string
  averageQuality?: number
  logCount?: number
}

interface TopOperatorsCardProps {
  topOperators?: Operator[]
  className?: string
}

// --- Helper for Colors ---
const getScoreColor = (score: number) => {
  if (score >= 90) return { color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20', bar: 'bg-emerald-500' }
  if (score >= 75) return { color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20', bar: 'bg-blue-500' }
  if (score >= 60) return { color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20', bar: 'bg-amber-500' }
  return { color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20', bar: 'bg-red-500' }
}

export default function TopOperatorsCard({ topOperators = [], className = '' }: TopOperatorsCardProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Calculate average quality for summary badge
  const averageQuality = topOperators.length > 0
    ? Math.round(topOperators.reduce((acc, curr) => acc + (curr.averageQuality || 0), 0) / topOperators.length)
    : 0

  if (!mounted) return null

  return (
    <div className={`w-full ${className}`}>
      {/* Card Container */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden hover:shadow-xl hover:scale-[1.005] transition-all duration-300 ease-out animate-in fade-in slide-in-from-bottom-4">
        
        {/* Header Section */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-amber-600 dark:text-amber-400">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">
                Top Operators
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Quality leaders by performance
              </p>
            </div>
          </div>
          
          {/* Summary Badge */}
          <div className="flex flex-col items-end">
            <span className="text-2xl font-bold text-slate-900 dark:text-white leading-none">
              {averageQuality}
            </span>
            <span className="text-xs font-medium text-amber-500 flex items-center gap-1 mt-1">
              <TrendingUp className="w-3 h-3" /> Avg. Quality
            </span>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-6">
          {topOperators.length > 0 ? (
            <div className="space-y-3">
              {topOperators.map((operator, index) => {
                const score = operator.averageQuality || 0
                const logCount = operator.logCount || 0
                const name = operator.callsign || operator.userName || 'Unknown'
                const styles = getScoreColor(score)

                return (
                  <div
                    key={operator.userId || index}
                    className="group flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-200"
                  >
                    {/* Rank & Name */}
                    <div className="flex items-center gap-4 flex-1">
                      <div className={`flex items-center justify-center w-10 h-10 rounded-lg font-bold text-sm ${
                        index === 0 ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' :
                        index === 1 ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400' :
                        index === 2 ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-500' :
                        'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                      }`}>
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                      </div>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-slate-400" />
                        <span className="text-sm font-semibold text-slate-900 dark:text-white">
                          {name}
                        </span>
                      </div>
                    </div>

                    {/* Score & Progress */}
                    <div className="flex items-center gap-4 flex-1">
                      <div className="flex items-center gap-2 flex-1 max-w-[200px]">
                        <span className={`text-sm font-bold ${styles.color} min-w-[35px]`}>
                          {score}
                        </span>
                        <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                          <div 
                            className={`h-2 rounded-full transition-all duration-500 ${styles.bar}`}
                            style={{ width: `${score}%` }}
                          />
                        </div>
                      </div>
                      <span className="text-sm text-slate-600 dark:text-slate-400 min-w-[50px] text-right">
                        {logCount} {logCount === 1 ? 'entry' : 'entries'}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400 flex flex-col items-center">
              <Trophy className="w-8 h-8 mb-2 opacity-50" />
              <p>No operator data available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
