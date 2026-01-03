'use client'

import React, { useState, useEffect } from 'react'
import { 
  Lightbulb, 
  TrendingUp, 
  AlertTriangle, 
  Calendar, 
  Link as LinkIcon, 
  Search 
} from 'lucide-react'

interface PatternAnalysis {
  type: 'trend' | 'anomaly' | 'seasonal' | 'correlation'
  description: string
  confidence: number
  impact: 'low' | 'medium' | 'high' | 'critical'
  recommendation: string
}

interface PatternAnalysisCardProps {
  patterns: PatternAnalysis[]
  className?: string
}

// Configuration
const SEVERITY_CONFIG = {
  low: {
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    border: 'border-blue-100 dark:border-blue-900/30',
    bar: 'bg-blue-500',
    badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
  },
  medium: {
    color: 'text-orange-600 dark:text-orange-400',
    bg: 'bg-orange-50 dark:bg-orange-900/20',
    border: 'border-orange-100 dark:border-orange-900/30',
    bar: 'bg-orange-500',
    badge: 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300'
  },
  high: {
    color: 'text-red-600 dark:text-red-400',
    bg: 'bg-red-50 dark:bg-red-900/20',
    border: 'border-red-100 dark:border-red-900/30',
    bar: 'bg-red-500',
    badge: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'
  },
  critical: {
    color: 'text-purple-600 dark:text-purple-400',
    bg: 'bg-purple-50 dark:bg-purple-900/20',
    border: 'border-purple-100 dark:border-purple-900/30',
    bar: 'bg-purple-500',
    badge: 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300'
  }
}

const TYPE_ICONS = {
  trend: TrendingUp,
  anomaly: AlertTriangle,
  seasonal: Calendar,
  correlation: LinkIcon
}

// Sub-Component for Individual Pattern
interface PatternItemProps {
  pattern: PatternAnalysis
  index: number
}

const PatternItem = ({ pattern, index }: PatternItemProps) => {
  const [width, setWidth] = useState(0)
  const config = SEVERITY_CONFIG[pattern.impact] || SEVERITY_CONFIG.low
  const Icon = TYPE_ICONS[pattern.type] || Lightbulb
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setWidth(pattern.confidence)
    }, index * 150 + 200)
    return () => clearTimeout(timer)
  }, [pattern.confidence, index])

  return (
    <div 
      className={`
        group relative flex flex-col gap-3 p-4 rounded-xl border transition-all duration-300
        hover:shadow-md hover:scale-[1.01] bg-white dark:bg-slate-800
        ${config.border}
        animate-in fade-in slide-in-from-bottom-2 fill-mode-backwards
      `}
      style={{ animationDelay: `${index * 100}ms` }}
    >
      {/* Hover Glow Effect */}
      <div className={`absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none ${config.bg}`} />
      <div className="relative z-10 flex justify-between items-start gap-3">
        <div className="flex items-start gap-3">
          <div className={`mt-0.5 p-1.5 rounded-lg flex-shrink-0 ${config.bg} ${config.color}`}>
            <Icon className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${config.badge}`}>
                {pattern.type}
              </span>
              <span className={`text-[10px] font-semibold uppercase tracking-wide opacity-70 ${config.color}`}>
                {pattern.impact} Impact
              </span>
            </div>
            <h4 className="text-sm font-semibold text-slate-900 dark:text-white leading-snug">
              {pattern.description}
            </h4>
          </div>
        </div>
      </div>
      <div className="relative z-10 pl-[3.25rem]">
        <p className="text-xs text-slate-600 dark:text-slate-400 mb-3 leading-relaxed">
          <span className="font-medium text-slate-700 dark:text-slate-300">Action:</span> {pattern.recommendation}
        </p>
        
        {/* Confidence Bar */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-1000 ease-out ${config.bar}`}
              style={{ width: `${width}%` }}
            />
          </div>
          <span className="text-[10px] font-medium text-slate-400 w-8 text-right">
            {pattern.confidence}%
          </span>
        </div>
      </div>
    </div>
  )
}

export default function PatternAnalysisCard({ patterns, className = '' }: PatternAnalysisCardProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <div className={`w-full h-full flex flex-col ${className}`}>
      {/* Card Container */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden hover:shadow-xl transition-all duration-300 ease-out animate-in fade-in slide-in-from-bottom-4 flex flex-col h-full">
        
        {/* Header Section */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-purple-600 dark:text-purple-400">
              <Lightbulb className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">
                Pattern Analysis
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                AI-detected correlations & anomalies
              </p>
            </div>
          </div>
          
          {/* Count Badge */}
          <div className="px-3 py-1 rounded-full bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs font-bold border border-purple-100 dark:border-purple-800">
            {patterns.length} Signals Found
          </div>
        </div>

        {/* Content Section */}
        <div className="p-6 bg-slate-50/50 dark:bg-slate-900/50 flex-1 overflow-y-auto">
          {patterns.length > 0 ? (
            <div className="space-y-4">
              {patterns.map((pattern, index) => (
                <PatternItem 
                  key={index} 
                  pattern={pattern} 
                  index={index} 
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl bg-white/50 dark:bg-slate-800/50">
              <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-full mb-3">
                <Search className="w-6 h-6 text-slate-400" />
              </div>
              <h4 className="text-sm font-medium text-slate-900 dark:text-white mb-1">
                No Patterns Detected Yet
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs">
                The AI needs more incident data to identify reliable trends or correlations. Continue logging events.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

