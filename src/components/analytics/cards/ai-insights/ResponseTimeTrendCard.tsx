'use client'

import React, { useState, useEffect } from 'react'
import { 
  Clock, 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Zap 
} from 'lucide-react'

interface TrendAnalysis {
  type?: 'increasing' | 'decreasing' | 'stable'
  description?: string
  confidence?: number
  recommendation?: string
}

interface ResponseTimeTrendCardProps {
  trend?: TrendAnalysis
  className?: string
}

// Configuration
const TREND_CONFIG = {
  increasing: {
    icon: TrendingUp,
    color: 'text-red-500 dark:text-red-400',
    bg: 'bg-red-50 dark:bg-red-900/20',
    border: 'border-red-100 dark:border-red-900/30',
    label: 'Slowing Down'
  },
  decreasing: {
    icon: TrendingDown,
    color: 'text-emerald-500 dark:text-emerald-400',
    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    border: 'border-emerald-100 dark:border-emerald-900/30',
    label: 'Improving'
  },
  stable: {
    icon: Activity,
    color: 'text-blue-500 dark:text-blue-400',
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    border: 'border-blue-100 dark:border-blue-900/30',
    label: 'Consistent'
  }
}

export default function ResponseTimeTrendCard({ trend, className = '' }: ResponseTimeTrendCardProps) {
  const [mounted, setMounted] = useState(false)
  const [confidenceWidth, setConfidenceWidth] = useState(0)

  // Safe default fallback
  const safeType = trend?.type && TREND_CONFIG[trend.type] ? trend.type : 'stable'
  const config = TREND_CONFIG[safeType]
  const Icon = config.icon

  useEffect(() => {
    setMounted(true)
    
    // Animate confidence bar
    const timer = setTimeout(() => {
      setConfidenceWidth(trend?.confidence || 0)
    }, 200)

    return () => clearTimeout(timer)
  }, [trend])

  if (!mounted) return null

  return (
    <div className={`w-full ${className}`}>
      {/* Card Container */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden hover:shadow-xl hover:scale-[1.005] transition-all duration-300 ease-out animate-in fade-in slide-in-from-bottom-4">
        
        {/* Header Section */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg text-orange-600 dark:text-orange-400">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">
                Response Times
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Latency trend analysis
              </p>
            </div>
          </div>
          
          {/* Type Badge */}
          <div className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${config.bg} ${config.color} ${config.border}`}>
            {config.label}
          </div>
        </div>

        {/* Content Section */}
        <div className="p-6 space-y-6">
          
          {/* Main Trend Indicator */}
          <div className="flex items-start gap-4">
            <div className={`mt-1 p-2 rounded-full ${config.bg} ${config.color}`}>
              <Icon className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-900 dark:text-white leading-relaxed">
                {trend?.description || 'Data insufficient for trend analysis.'}
              </p>
            </div>
          </div>

          {/* Confidence Meter */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-medium">
              <span className="text-slate-500 dark:text-slate-400">AI Confidence</span>
              <span className="text-slate-900 dark:text-white">{trend?.confidence?.toFixed(0) || 0}%</span>
            </div>
            <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div 
                className="h-full rounded-full transition-all duration-1000 ease-out"
                style={{ 
                  width: `${confidenceWidth}%`,
                  backgroundColor: safeType === 'increasing' ? '#ef4444' : safeType === 'decreasing' ? '#10b981' : '#3b82f6'
                }}
              />
            </div>
          </div>

          {/* Recommendation Box */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 mb-2 text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              <Zap className="w-3.5 h-3.5" />
              Recommendation
            </div>
            <p className="text-sm text-slate-700 dark:text-slate-300 font-medium">
              {trend?.recommendation || 'No specific action recommended at this time.'}
            </p>
          </div>

        </div>
      </div>
    </div>
  )
}

