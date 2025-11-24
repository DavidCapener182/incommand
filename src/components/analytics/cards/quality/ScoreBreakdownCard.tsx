'use client'

import React, { useState, useEffect } from 'react'
import { CheckCircle2, Clock, Scale } from 'lucide-react'

interface ScoreBreakdownCardProps {
  completeness?: number
  timeliness?: number
  factualLanguage?: number
  className?: string
}

interface MetricCardProps {
  title: string
  score: number
  description: string
  icon: React.ComponentType<{ className?: string }>
  delay?: number
}

// --- Configuration ---
const SCORE_CONFIG = {
  excellent: { threshold: 90, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20', ring: 'ring-emerald-100 dark:ring-emerald-900/30' },
  good: { threshold: 75, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20', ring: 'ring-blue-100 dark:ring-blue-900/30' },
  fair: { threshold: 60, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20', ring: 'ring-amber-100 dark:ring-amber-900/30' },
  poor: { threshold: 0, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20', ring: 'ring-red-100 dark:ring-red-900/30' }
}

const getStyle = (score: number) => {
  if (score >= SCORE_CONFIG.excellent.threshold) return SCORE_CONFIG.excellent
  if (score >= SCORE_CONFIG.good.threshold) return SCORE_CONFIG.good
  if (score >= SCORE_CONFIG.fair.threshold) return SCORE_CONFIG.fair
  return SCORE_CONFIG.poor
}

// --- Sub-Component for Individual Metric ---
const MetricCard = ({ title, score, description, icon: Icon, delay = 0 }: MetricCardProps) => {
  const [displayScore, setDisplayScore] = useState(0)
  const style = getStyle(score)

  useEffect(() => {
    let start = 0
    const duration = 1500
    const startTime = performance.now()

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)
      const easeOut = 1 - Math.pow(1 - progress, 4) // Quartic ease-out
      
      setDisplayScore(Math.floor(start + (score - start) * easeOut))

      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }
    
    // Add small stagger delay
    const timeoutId = setTimeout(() => {
      requestAnimationFrame(animate)
    }, delay)

    return () => clearTimeout(timeoutId)
  }, [score, delay])

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-lg hover:scale-[1.02] transition-all duration-300 group">
      <div className="flex items-start justify-between mb-4">
        <div className={`p-2 rounded-lg ${style.bg} ${style.color} transition-colors duration-300`}>
          <Icon className="w-6 h-6" />
        </div>
        <div className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${style.bg} ${style.color} ring-1 ring-inset ${style.ring}`}>
          {score >= 90 ? 'Excellent' : score >= 75 ? 'Good' : score >= 60 ? 'Fair' : 'Review'}
        </div>
      </div>
      
      <div className="space-y-1">
        <h4 className="font-medium text-slate-500 dark:text-slate-400 text-sm uppercase tracking-wide">
          {title}
        </h4>
        <div className="flex items-baseline gap-1">
          <span className={`text-4xl font-bold ${style.color} transition-colors duration-300`}>
            {displayScore}
          </span>
          <span className="text-lg text-slate-400 font-medium">/100</span>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-300 pt-2 leading-snug">
          {description}
        </p>
      </div>
    </div>
  )
}

export default function ScoreBreakdownCard({ 
  completeness = 0, 
  timeliness = 0, 
  factualLanguage = 0, 
  className = '' 
}: ScoreBreakdownCardProps) {
  return (
    <div className={`w-full ${className}`}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Completeness Card */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-backwards">
          <MetricCard 
            title="Completeness"
            score={completeness}
            description="All required fields and data points were successfully captured."
            icon={CheckCircle2}
            delay={0}
          />
        </div>

        {/* Timeliness Card */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100 fill-mode-backwards">
          <MetricCard 
            title="Timeliness"
            score={timeliness}
            description="Logs were submitted promptly after the incident occurred."
            icon={Clock}
            delay={100}
          />
        </div>

        {/* Factual Language Card */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200 fill-mode-backwards">
          <MetricCard 
            title="Factual Language"
            score={factualLanguage}
            description="Content used objective, verifiable, and neutral language."
            icon={Scale}
            delay={200}
          />
        </div>

      </div>
    </div>
  )
}

