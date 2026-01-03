'use client'

import React, { useState, useEffect } from 'react'
import { Clock, CheckCircle2, AlertTriangle, AlertCircle } from 'lucide-react'

interface TimestampAccuracyCardProps {
  timestampAccuracy: number
  className?: string
}

// --- Helper for Color/Status ---
const getStatusConfig = (score: number) => {
  if (score >= 98) {
    return {
      color: 'text-emerald-600 dark:text-emerald-400',
      stroke: '#10B981',
      bg: 'bg-emerald-50 dark:bg-emerald-900/20',
      border: 'border-emerald-100 dark:border-emerald-900/30',
      icon: CheckCircle2,
      label: 'High Precision'
    }
  }
  if (score >= 90) {
    return {
      color: 'text-blue-600 dark:text-blue-400',
      stroke: '#3B82F6',
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      border: 'border-blue-100 dark:border-blue-900/30',
      icon: Clock,
      label: 'Standard Accuracy'
    }
  }
  if (score >= 75) {
    return {
      color: 'text-amber-600 dark:text-amber-400',
      stroke: '#F59E0B',
      bg: 'bg-amber-50 dark:bg-amber-900/20',
      border: 'border-amber-100 dark:border-amber-900/30',
      icon: AlertTriangle,
      label: 'Verification Needed'
    }
  }
  return {
    color: 'text-red-600 dark:text-red-400',
    stroke: '#EF4444',
    bg: 'bg-red-50 dark:bg-red-900/20',
    border: 'border-red-100 dark:border-red-900/30',
    icon: AlertCircle,
    label: 'Accuracy Critical'
  }
}

export default function TimestampAccuracyCard({ 
  timestampAccuracy = 0, 
  className = '' 
}: TimestampAccuracyCardProps) {
  const [mounted, setMounted] = useState(false)
  const [displayScore, setDisplayScore] = useState(0)
  const config = getStatusConfig(timestampAccuracy)
  const StatusIcon = config.icon

  // Circular Progress Config
  const radius = 36
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = mounted 
    ? circumference - ((timestampAccuracy / 100) * circumference) 
    : circumference

  useEffect(() => {
    setMounted(true)
    
    // Count up animation
    let start = 0
    const duration = 1500
    const startTime = performance.now()

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)
      const easeOut = 1 - Math.pow(1 - progress, 4)
      
      setDisplayScore(start + (timestampAccuracy - start) * easeOut)
      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }

    requestAnimationFrame(animate)
  }, [timestampAccuracy])

  if (!mounted) return null

  return (
    <div className={`w-full h-full ${className}`}>
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden hover:shadow-lg hover:scale-[1.02] transition-all duration-300 ease-out animate-in slide-in-from-bottom-4 h-full flex flex-col">
        
        <div className="p-6 flex items-center justify-between gap-4">
          
          {/* Text Content */}
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2 mb-2">
              <div className={`p-1.5 rounded-md ${config.bg} ${config.color}`}>
                <Clock className="w-4 h-4" />
              </div>
              <h4 className="font-bold text-slate-700 dark:text-slate-200 text-sm uppercase tracking-wide">
                Timestamps
              </h4>
            </div>
            
            <div className="flex items-baseline gap-1">
              <span className={`text-4xl font-bold ${config.color}`}>
                {displayScore.toFixed(1)}
              </span>
              <span className="text-lg text-slate-400 font-medium">%</span>
            </div>
            
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Dual timestamps accurate
            </p>
            {/* Status Badge */}
            <div className={`inline-flex items-center gap-1.5 mt-3 px-2.5 py-1.5 rounded-md text-xs font-medium border ${config.bg} ${config.border} ${config.color}`}>
               <StatusIcon className="w-3.5 h-3.5" />
               {config.label}
            </div>
          </div>
          {/* Circular Indicator */}
          <div className="relative w-24 h-24 flex-shrink-0">
            <svg className="w-full h-full transform -rotate-90">
              {/* Background Ring */}
              <circle
                cx="48"
                cy="48"
                r={radius}
                stroke="currentColor"
                strokeWidth="6"
                fill="none"
                className="text-slate-100 dark:text-slate-800"
              />
              {/* Progress Ring */}
              <circle
                cx="48"
                cy="48"
                r={radius}
                stroke={config.stroke}
                strokeWidth="6"
                fill="none"
                strokeLinecap="round"
                style={{
                  strokeDasharray: circumference,
                  strokeDashoffset: strokeDashoffset,
                  transition: 'stroke-dashoffset 1.5s ease-out'
                }}
              />
            </svg>
            
            {/* Center Icon */}
            <div className="absolute inset-0 flex items-center justify-center">
              <StatusIcon className={`w-6 h-6 ${config.color}`} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
