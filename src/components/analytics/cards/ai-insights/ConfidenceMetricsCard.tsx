'use client'

import React, { useState, useEffect } from 'react'
import { Trophy, TrendingUp, BrainCircuit, ScanSearch, Sparkles } from 'lucide-react'

interface ConfidenceMetrics {
  overall: number
  trends: number
  predictions: number
  patterns: number
}

interface ConfidenceMetricsCardProps {
  confidence: ConfidenceMetrics
  className?: string
}

// Helper for Overall Color
const getOverallColor = (score: number) => {
  if (score >= 90) return 'text-emerald-600 dark:text-emerald-400'
  if (score >= 75) return 'text-blue-600 dark:text-blue-400'
  if (score >= 60) return 'text-amber-600 dark:text-amber-400'
  return 'text-red-600 dark:text-red-400'
}

// Sub-Component for Individual Metric Block
interface MetricBlockProps {
  label: string
  value: number
  icon: React.ComponentType<{ className?: string }>
  colorClass: string
  bgClass: string
  delay: number
}

const MetricBlock = ({ label, value, icon: Icon, colorClass, bgClass, delay }: MetricBlockProps) => {
  const [displayValue, setDisplayValue] = useState(0)

  useEffect(() => {
    const timeout = setTimeout(() => {
      let start = 0
      const duration = 1500
      const startTime = performance.now()

      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime
        const progress = Math.min(elapsed / duration, 1)
        const easeOut = 1 - Math.pow(1 - progress, 4)
        
        setDisplayValue(Math.floor(start + (value - start) * easeOut))

        if (progress < 1) {
          requestAnimationFrame(animate)
        }
      }

      requestAnimationFrame(animate)
    }, delay)

    return () => clearTimeout(timeout)
  }, [value, delay])

  return (
    <div 
      className={`
        group flex flex-col items-center justify-center p-4 rounded-xl border border-transparent
        transition-all duration-300 hover:scale-[1.02] hover:shadow-md
        ${bgClass} hover:border-slate-200 dark:hover:border-slate-700
      `}
    >
      <div className={`p-2 rounded-full mb-2 bg-white dark:bg-slate-800 shadow-sm group-hover:shadow-md transition-all duration-300 ${colorClass}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className={`text-3xl font-bold mb-1 ${colorClass}`}>
        {displayValue}%
      </div>
      <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
        {label}
      </div>
    </div>
  )
}

export default function ConfidenceMetricsCard({ confidence, className = '' }: ConfidenceMetricsCardProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  const overallColor = getOverallColor(confidence.overall)

  return (
    <div className={`w-full ${className}`}>
      {/* Card Container */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden hover:shadow-xl hover:scale-[1.005] transition-all duration-300 ease-out animate-in fade-in slide-in-from-bottom-4">
        
        {/* Header Section */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg text-yellow-600 dark:text-yellow-400">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">
                AI Confidence
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Reliability of current insights
              </p>
            </div>
          </div>
          
          {/* Summary Badge */}
          <div className="flex flex-col items-end">
            <span className={`text-2xl font-bold leading-none ${overallColor}`}>
              {confidence.overall}%
            </span>
            <span className="text-xs font-medium text-slate-400 flex items-center gap-1 mt-1">
              <Sparkles className="w-3 h-3" /> Overall Score
            </span>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          
          <MetricBlock 
            label="Trend Analysis" 
            value={confidence.trends} 
            icon={TrendingUp}
            colorClass="text-emerald-600 dark:text-emerald-400"
            bgClass="bg-emerald-50/50 dark:bg-emerald-900/10"
            delay={100}
          />

          <MetricBlock 
            label="Predictions" 
            value={confidence.predictions} 
            icon={BrainCircuit}
            colorClass="text-purple-600 dark:text-purple-400"
            bgClass="bg-purple-50/50 dark:bg-purple-900/10"
            delay={200}
          />

          <MetricBlock 
            label="Pattern Match" 
            value={confidence.patterns} 
            icon={ScanSearch}
            colorClass="text-orange-600 dark:text-orange-400"
            bgClass="bg-orange-50/50 dark:bg-orange-900/10"
            delay={300}
          />

        </div>
      </div>
    </div>
  )
}

