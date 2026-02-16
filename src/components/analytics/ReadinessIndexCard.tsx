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
} from '@heroicons/react/24/outline'
import { MoreHorizontal, ChevronRight } from 'lucide-react'
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
      "group relative flex h-full cursor-pointer flex-col justify-between overflow-hidden rounded-[var(--radius-card-primary)] border border-slate-200/90 bg-gradient-to-br from-white via-white to-slate-50/80 p-4 shadow-[0_16px_32px_-24px_rgba(15,23,42,0.38)] ring-1 ring-white/70 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_22px_40px_-24px_rgba(15,23,42,0.42)] dark:border-[#2d437a]/70 dark:bg-gradient-to-br dark:from-[#162346] dark:via-[#14203f] dark:to-[#0f1934] dark:ring-white/5", 
      className
    )}
  >
    <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500/75 via-cyan-400/60 to-transparent" />
    {children}
  </div>
)

const CardHeader = ({ icon: Icon, title, action }: { icon: any; title: string; action?: boolean }) => (
  <div className="mb-3 flex items-center justify-between">
    <div className="flex items-center gap-2.5">
      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-blue-100 to-cyan-100 text-blue-700 ring-1 ring-blue-200/70 dark:from-blue-500/25 dark:to-cyan-500/20 dark:text-blue-200 dark:ring-blue-400/35">
        <Icon className="h-3.5 w-3.5" />
      </div>
      <span className="text-[13px] font-semibold text-slate-700 dark:text-slate-100">{title}</span>
    </div>
    {action && (
      <button className="text-slate-400 transition-colors hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-200">
        <MoreHorizontal className="h-5 w-5" />
      </button>
    )}
  </div>
)

const ReadinessBar = ({ label, score, colorClass }: { label: string; score: number; colorClass: string }) => (
  <div className="w-full">
    <div className="flex justify-between items-center mb-1">
      <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">{label}</span>
      <span className={cn("text-[11px] font-bold", colorClass.replace('bg-', 'text-'))}>{score}%</span>
    </div>
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-[#1b2b53]">
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
          } else if (!response.ok) {
            // Only set error if we don't already have readiness data
            setError((prevError) => prevError || data.error || 'Failed to fetch')
          }
        }
      } catch (err) {
        if (!cancelled) {
          // Only set error if we don't already have readiness data
          setError((prevError) => prevError || 'Connection error')
        }
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
  }, [eventId, initialData]) // Removed readiness from deps to prevent infinite loop

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
        <div className="flex flex-1 flex-col items-center justify-center gap-3">
           <div className="h-24 w-24 rounded-full border-[5px] border-slate-200 border-t-blue-500 animate-spin" />
           <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400 animate-pulse">Calculating readiness</span>
        </div>
      </CardFrame>
    )
  }

  // --- Error/Empty State ---
  if ((error && !readiness) || !eventId || !readiness) {
    return (
      <CardFrame className={className}>
        <CardHeader icon={ShieldCheckIcon} title="Readiness Score" />
        <div className="flex flex-1 flex-col items-center justify-center text-center">
           <div className="relative mb-2 flex h-24 w-24 items-center justify-center">
             <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 100 100">
               <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="10" className="text-slate-200 dark:text-slate-700" />
             </svg>
             <ExclamationTriangleIcon className="h-8 w-8 text-slate-400 dark:text-slate-500" />
           </div>
           <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-300">Readiness unavailable</p>
           <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">Awaiting live readiness inputs</p>
        </div>
      </CardFrame>
    )
  }

  const score = readiness.overall_score
  const statusColors = getStatusColor(score)
  const GAUGE_RADIUS = 40
  const strokeDash = 2 * Math.PI * GAUGE_RADIUS
  const strokeOffset = strokeDash - (score / 100) * strokeDash

  return (
    <>
      <CardFrame className={className} onClick={() => setShowDetails(true)}>
        <CardHeader icon={ShieldCheckIcon} title="Readiness Score" action />
        
        <div className="flex flex-col items-center gap-2.5">
           {/* Radial Progress Chart */}
           <div className="relative flex h-32 w-32 items-center justify-center">
              {/* Track */}
              <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 100 100">
                <circle
                  className="text-slate-100 dark:text-[#20315e]"
                  cx="50" cy="50" r={GAUGE_RADIUS}
                  fill="none" stroke="currentColor" strokeWidth="10"
                />
                {/* Progress Ring */}
                <circle
                  className={cn("transition-all duration-1000 ease-out", statusColors.text)}
                  cx="50" cy="50" r={GAUGE_RADIUS}
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={strokeDash}
                  strokeDashoffset={strokeOffset}
                />
              </svg>
              
              {/* Center Text */}
              <div className="flex flex-col items-center">
                 <span className={cn("text-4xl font-black leading-none tracking-tight", statusColors.text)}>{score}</span>
                 <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">/100</span>
                 <div className="mt-0.5">{getTrendIcon()}</div>
              </div>
           </div>
           <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-300">
             Event Stability Index
           </p>
           
           {/* Metrics List */}
           <div className="w-full space-y-2.5">
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
        <div className="mt-4 flex items-center justify-center border-t border-slate-100 pt-3 dark:border-[#2d437a]/40">
           <div className="flex items-center gap-1 text-xs font-medium text-slate-400 transition-colors group-hover:text-blue-600 dark:text-slate-300 dark:group-hover:text-blue-300">
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
