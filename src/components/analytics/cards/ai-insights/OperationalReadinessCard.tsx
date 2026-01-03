'use client'

import React, { useState, useEffect } from 'react'
import { 
  Activity, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Users, 
  AlertTriangle, 
  CloudRain, 
  Truck, 
  Box, 
  UserPlus 
} from 'lucide-react'
import type { ReadinessScore } from '@/lib/analytics/readinessEngine'

interface OperationalReadinessCardProps {
  readiness?: ReadinessScore | null
  className?: string
}

const READINESS_LABELS: Record<string, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
  staffing: { label: 'Staffing', icon: Users },
  incident_pressure: { label: 'Incident Pressure', icon: AlertTriangle },
  weather: { label: 'Weather', icon: CloudRain },
  transport: { label: 'Transport', icon: Truck },
  assets: { label: 'Assets', icon: Box },
  crowd_density: { label: 'Crowd Density', icon: UserPlus },
}

// Helper for Score Colors
const getScoreColor = (score: number) => {
  if (score >= 90) return { text: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500', ring: '#10B981' }
  if (score >= 75) return { text: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-500', ring: '#3B82F6' }
  if (score >= 60) return { text: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500', ring: '#F59E0B' }
  return { text: 'text-red-600 dark:text-red-400', bg: 'bg-red-500', ring: '#EF4444' }
}

// Sub-Component for Individual Score Item
interface ScoreItemProps {
  labelKey: string
  score: number
  index: number
}

const ScoreItem = ({ labelKey, score, index }: ScoreItemProps) => {
  const config = READINESS_LABELS[labelKey] || { label: labelKey, icon: Activity }
  const Icon = config.icon
  const styles = getScoreColor(score)
  const [width, setWidth] = useState(0)

  useEffect(() => {
    const timeout = setTimeout(() => {
      setWidth(score)
    }, index * 100 + 300)
    return () => clearTimeout(timeout)
  }, [score, index])

  return (
    <div className="group p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 hover:border-blue-200 dark:hover:border-blue-800 transition-all duration-300">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-slate-400 dark:text-slate-500 group-hover:text-blue-500 transition-colors" />
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide">
            {config.label}
          </span>
        </div>
        <span className={`text-sm font-bold ${styles.text}`}>
          {score}%
        </span>
      </div>
      
      {/* Mini Progress Bar */}
      <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
        <div 
          className={`h-full rounded-full transition-all duration-1000 ease-out ${styles.bg}`}
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  )
}

export default function OperationalReadinessCard({ readiness, className = '' }: OperationalReadinessCardProps) {
  const [mounted, setMounted] = useState(false)
  const [displayScore, setDisplayScore] = useState(0)

  useEffect(() => {
    setMounted(true)
    
    if (!readiness) return

    // Count up animation
    let start = 0
    const duration = 1500
    const startTime = performance.now()

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)
      const easeOut = 1 - Math.pow(1 - progress, 4)
      
      setDisplayScore(start + (readiness.overall_score - start) * easeOut)

      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }

    requestAnimationFrame(animate)
  }, [readiness])

  if (!mounted || !readiness) return null

  const overallStyles = getScoreColor(readiness.overall_score)
  
  // Circular Progress Config
  const radius = 42
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - ((readiness.overall_score / 100) * circumference)

  return (
    <div className={`w-full ${className}`}>
      {/* Card Container */}
      <div 
        id="ai-operational-readiness"
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden hover:shadow-xl hover:scale-[1.005] transition-all duration-300 ease-out animate-in fade-in slide-in-from-bottom-4"
      >
        
        {/* Header Section */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
          <div className="flex items-center gap-4">
            {/* Score Ring */}
            <div className="relative w-20 h-20 flex-shrink-0">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r={radius}
                  stroke="currentColor"
                  strokeWidth="6"
                  fill="none"
                  className="text-slate-100 dark:text-slate-800"
                />
                <circle
                  cx="50"
                  cy="50"
                  r={radius}
                  stroke={overallStyles.ring}
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
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-xl font-bold ${overallStyles.text}`}>
                  {Math.round(displayScore)}%
                </span>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50 mb-1">
                Operational Readiness
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-500 dark:text-slate-400">
                  Overall Status:
                </span>
                <div className={`flex items-center gap-1 text-sm font-medium ${
                  readiness.trend === 'improving' ? 'text-emerald-600' : 
                  readiness.trend === 'declining' ? 'text-red-600' : 'text-slate-600'
                }`}>
                  {readiness.trend === 'improving' && <TrendingUp className="w-4 h-4" />}
                  {readiness.trend === 'declining' && <TrendingDown className="w-4 h-4" />}
                  {readiness.trend === 'stable' && <Minus className="w-4 h-4" />}
                  <span className="capitalize">{readiness.trend}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Components Grid */}
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {Object.entries(readiness.component_scores)
            .slice(0, 6)
            .map(([key, value], index) => (
              <ScoreItem 
                key={key} 
                labelKey={key} 
                score={value.score} 
                index={index}
              />
            ))}
        </div>
      </div>
    </div>
  )
}

