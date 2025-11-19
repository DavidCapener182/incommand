'use client'

import React, { useState, useEffect } from 'react'
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  MinusIcon,
  ShieldCheckIcon,
  MoreHorizontal,
  ChevronRight
} from 'lucide-react'
import { cn } from '@/lib/utils'
import ReadinessDetailsModal from './ReadinessDetailsModal'
import type { ReadinessScore } from '@/lib/analytics/readinessEngine'

interface ReadinessIndexCardProps {
  eventId: string | null
  className?: string
  initialData?: ReadinessScore | null
}

type ReadinessData = ReadinessScore

// --- Helper Components ---
const CardFrame = ({ children, className, onClick }: { children: React.ReactNode; className?: string; onClick?: () => void }) => (
  <div 
    onClick={onClick}
    className={cn(
      "flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md h-full cursor-pointer group", 
      className
    )}
  >
    {children}
  </div>
)

const CardHeader = ({ icon: Icon, title, action }: { icon: any; title: string; action?: boolean }) => (
  <div className="flex items-center justify-between mb-4">
    <div className="flex items-center gap-2.5">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
        <Icon className="h-4 w-4" />
      </div>
      <span className="text-sm font-semibold text-slate-700">{title}</span>
    </div>
    {action && (
      <button className="text-slate-400 hover:text-slate-600 transition-colors">
        <MoreHorizontal className="h-5 w-5" />
      </button>
    )}
  </div>
)

const ReadinessBar = ({ label, score, colorClass }: { label: string; score: number; colorClass: string }) => (
  <div className="w-full">
    <div className="flex justify-between items-center mb-1.5">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</span>
      <span className={cn("text-xs font-bold", colorClass.replace('bg-', 'text-'))}>{score}%</span>
    </div>
    <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
      <div 
        className={cn("h-full rounded-full transition-all duration-700 ease-out", colorClass)} 
        style={{ width: `${score}%` }} 
      />
    </div>
  </div>
)

export default function ReadinessIndexCard({
  eventId,
  className = '',
  initialData,
}: ReadinessIndexCardProps) {
  const [readiness, setReadiness] = useState<ReadinessData | null>(initialData ?? null)
  const [loading, setLoading] = useState(!initialData)
  const [error, setError] = useState<string | null>(null)
  const [showDetails, setShowDetails] = useState(false)

  // --- Fetch Logic ---
  useEffect(() => {
    if (typeof initialData === 'undefined') return
    setReadiness(initialData ?? null)
    setLoading(false)
  }, [initialData])

  useEffect(() => {
    if (!eventId) {
      setReadiness(null)
      return
    }
    let cancelled = false

    const fetchReadiness = async (silent = false) => {
      if (!eventId) return
      if (!silent) {
        setLoading(true)
        setError(null)
      }
      try {
        const response = await fetch(`/api/analytics/readiness-index?event_id=${eventId}`)
        const data = await response.json()
        
        if (!cancelled) {
          if (data.readiness) {
            setReadiness(data.readiness)
            setError(null)
          } else if (!response.ok && !readiness) {
            setError(data.error || 'Failed to fetch')
          }
        }
      } catch (err) {
        if (!cancelled && !readiness) setError('Connection error')
      } finally {
        if (!silent && !cancelled) setLoading(false)
      }
    }

    fetchReadiness(Boolean(initialData))
    const interval = setInterval(() => fetchReadiness(true), 30000)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [eventId, initialData])

  // --- Visual Helpers ---
  const getStatusColor = (score: number) => {
    if (score >= 90) return { text: 'text-emerald-500', bg: 'bg-emerald-500' }
    if (score >= 75) return { text: 'text-yellow-500', bg: 'bg-yellow-500' } // Yellow range
    if (score >= 50) return { text: 'text-orange-500', bg: 'bg-orange-500' } // Orange range
    return { text: 'text-red-500', bg: 'bg-red-500' }
  }

  const getTrendIcon = () => {
    if (!readiness) return null
    const colors = getStatusColor(readiness.overall_score)
    
    if (readiness.trend === 'improving') return <ArrowTrendingUpIcon className={cn("h-4 w-4", colors.text)} />
    if (readiness.trend === 'declining') return <ArrowTrendingDownIcon className={cn("h-4 w-4 text-red-500")} />
    return <MinusIcon className="h-4 w-4 text-slate-300" />
  }

  // --- Loading State ---
  if (loading && !readiness) {
    return (
      <CardFrame className={className}>
        <CardHeader icon={ShieldCheckIcon} title="Readiness Score" />
        <div className="flex flex-col items-center justify-center flex-1 gap-4">
           <div className="h-24 w-24 rounded-full border-4 border-slate-100 border-t-blue-500 animate-spin" />
           <span className="text-sm text-slate-400 animate-pulse">Calculating Score...</span>
        </div>
      </CardFrame>
    )
  }

  // --- Error/Empty State ---
  if ((error && !readiness) || !eventId || !readiness) {
    return (
      <CardFrame className={className}>
        <CardHeader icon={ShieldCheckIcon} title="Readiness Score" />
        <div className="flex flex-col items-center justify-center flex-1 text-center text-slate-400">
           <ExclamationTriangleIcon className="h-10 w-10 mb-2 opacity-50" />
           <p className="text-sm">Score unavailable</p>
        </div>
      </CardFrame>
    )
  }

  const score = readiness.overall_score
  const statusColors = getStatusColor(score)
  const strokeDash = 2 * Math.PI * 42 // r=42
  const strokeOffset = strokeDash - (score / 100) * strokeDash

  return (
    <>
      <CardFrame className={className} onClick={() => setShowDetails(true)}>
        <CardHeader icon={ShieldCheckIcon} title="Readiness Score" action />
        
        <div className="flex items-center gap-5">
           {/* Radial Progress Chart */}
           <div className="relative flex h-24 w-24 flex-none items-center justify-center">
              {/* Track */}
              <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 100 100">
                <circle
                  className="text-slate-100"
                  cx="50" cy="50" r="42"
                  fill="none" stroke="currentColor" strokeWidth="8"
                />
                {/* Progress Ring */}
                <circle
                  className={cn("transition-all duration-1000 ease-out", statusColors.text)}
                  cx="50" cy="50" r="42"
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={strokeDash}
                  strokeDashoffset={strokeOffset}
                />
              </svg>
              
              {/* Center Text */}
              <div className="flex flex-col items-center">
                 <span className={cn("text-2xl font-bold leading-none", statusColors.text)}>{score}</span>
                 <div className="mt-1">{getTrendIcon()}</div>
              </div>
           </div>
           
           {/* Metrics List */}
           <div className="flex-1 space-y-3 min-w-0">
              <ReadinessBar 
                label="Staffing" 
                score={readiness.component_scores.staffing.score} 
                colorClass={getStatusColor(readiness.component_scores.staffing.score).bg}
              />
              <ReadinessBar 
                label="Incidents" 
                score={readiness.component_scores.incident_pressure.score} 
                colorClass={getStatusColor(readiness.component_scores.incident_pressure.score).bg}
              />
              <ReadinessBar 
                label={readiness.component_scores.crowd_density.details?.metric_label || 'Crowd'} 
                score={readiness.component_scores.crowd_density.score} 
                colorClass={getStatusColor(readiness.component_scores.crowd_density.score).bg}
              />
           </div>
        </div>
        
        {/* Footer Link */}
        <div className="mt-4 flex items-center justify-center border-t border-slate-50 pt-3">
           <div className="flex items-center gap-1 text-xs font-medium text-slate-400 group-hover:text-blue-600 transition-colors">
              View detailed report <ChevronRight className="h-3 w-3" />
           </div>
        </div>
      </CardFrame>

      {showDetails && (
        <ReadinessDetailsModal
          isOpen={showDetails}
          onClose={() => setShowDetails(false)}
          readiness={readiness}
          eventId={eventId}
        />
      )}
    </>
  )
}