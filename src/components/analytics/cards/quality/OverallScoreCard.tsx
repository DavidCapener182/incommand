'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { Sparkles, Trophy, Target, AlertCircle, CheckCircle2 } from 'lucide-react'

interface OverallScoreCardProps {
  overallScore?: number
  totalLogs?: number
  className?: string
}

interface ScoreConfig {
  threshold: number
  label: string
  color: string
  bgClass: string
  textClass: string
  icon: React.ComponentType<{ className?: string }>
}

const SCORE_CONFIG: Record<string, ScoreConfig> = {
  excellent: {
    threshold: 90,
    label: 'Excellent',
    color: '#10B981', // Emerald 500
    bgClass: 'bg-emerald-50 dark:bg-emerald-900/20',
    textClass: 'text-emerald-600 dark:text-emerald-400',
    icon: Trophy
  },
  good: {
    threshold: 75,
    label: 'Good',
    color: '#3B82F6', // Blue 500
    bgClass: 'bg-blue-50 dark:bg-blue-900/20',
    textClass: 'text-blue-600 dark:text-blue-400',
    icon: CheckCircle2
  },
  fair: {
    threshold: 60,
    label: 'Fair',
    color: '#F59E0B', // Amber 500
    bgClass: 'bg-amber-50 dark:bg-amber-900/20',
    textClass: 'text-amber-600 dark:text-amber-400',
    icon: Target
  },
  poor: {
    threshold: 0,
    label: 'Needs Improvement',
    color: '#EF4444', // Red 500
    bgClass: 'bg-red-50 dark:bg-red-900/20',
    textClass: 'text-red-600 dark:text-red-400',
    icon: AlertCircle
  }
}

const getScoreConfig = (score: number): ScoreConfig => {
  if (score >= SCORE_CONFIG.excellent.threshold) return SCORE_CONFIG.excellent
  if (score >= SCORE_CONFIG.good.threshold) return SCORE_CONFIG.good
  if (score >= SCORE_CONFIG.fair.threshold) return SCORE_CONFIG.fair
  return SCORE_CONFIG.poor
}

export default function OverallScoreCard({ overallScore = 0, totalLogs = 0, className = '' }: OverallScoreCardProps) {
  const [mounted, setMounted] = useState(false)
  const [displayScore, setDisplayScore] = useState(0)

  // Hydration & Animation Trigger
  useEffect(() => {
    setMounted(true)
    // Simple count-up animation for the number
    let start = 0
    const duration = 1500
    const startTime = performance.now()

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)
      // Ease out quart
      const easeOut = 1 - Math.pow(1 - progress, 4)
      
      setDisplayScore(Math.floor(start + (overallScore - start) * easeOut))

      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }

    requestAnimationFrame(animate)
  }, [overallScore])

  const config = useMemo(() => getScoreConfig(overallScore), [overallScore])
  const Icon = config.icon

  // SVG Circle Calculations
  const radius = 56
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = mounted 
    ? circumference - ((overallScore / 100) * circumference) 
    : circumference

  if (!mounted) return null

  return (
    <div className={`w-full ${className}`}>
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden hover:shadow-xl hover:scale-[1.005] transition-all duration-300 ease-out animate-in fade-in slide-in-from-bottom-4">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${config.bgClass} ${config.textClass} transition-colors duration-500`}>
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">
                Overall Quality
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                System-wide log health
              </p>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-8 flex flex-col sm:flex-row items-center justify-between gap-8">
          
          {/* Left Side: Text Info */}
          <div className="flex flex-col items-center sm:items-start text-center sm:text-left space-y-2">
            <div className="flex items-baseline gap-1">
              <span 
                className="text-6xl font-bold tracking-tight transition-colors duration-500"
                style={{ color: config.color }}
              >
                {displayScore}
              </span>
              <span className="text-xl text-slate-400 font-medium">/100</span>
            </div>
            
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${config.bgClass} ${config.textClass} transition-colors duration-500`}>
              <Icon className="w-4 h-4" />
              {config.label}
            </div>

            <p className="text-sm text-slate-500 dark:text-slate-400 pt-2">
              Based on <strong className="text-slate-700 dark:text-slate-300">{totalLogs.toLocaleString()}</strong> total log entries
            </p>
          </div>

          {/* Right Side: Circular Progress */}
          <div className="relative w-40 h-40 flex-shrink-0">
            {/* Background Ring */}
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="80"
                cy="80"
                r={radius}
                stroke="currentColor"
                strokeWidth="10"
                fill="none"
                className="text-slate-100 dark:text-slate-800"
              />
              {/* Progress Ring */}
              <circle
                cx="80"
                cy="80"
                r={radius}
                stroke={config.color}
                strokeWidth="10"
                fill="none"
                strokeLinecap="round"
                style={{
                  strokeDasharray: circumference,
                  strokeDashoffset: strokeDashoffset,
                  transition: 'stroke-dashoffset 1.5s ease-out, stroke 0.5s ease'
                }}
              />
            </svg>
            
            {/* Center Icon */}
            <div className="absolute inset-0 flex items-center justify-center" style={{ color: config.color }}>
              <Icon className="w-10 h-10 transition-colors duration-500" />
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

