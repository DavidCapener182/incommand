'use client'

import React, { useEffect, useRef, useState } from 'react'
import {
  ShieldAlert,
  AlertCircle,
  Clock,
  CheckCircle2
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useIncidentSummary } from '@/contexts/IncidentSummaryContext'
import { CardFrame, CardHeader } from '@/components/ui/InCommandCard'

export type SummaryStatus = 'open' | 'in_progress' | 'closed'

interface IncidentSummaryBarProps {
  onFilter?: (status: SummaryStatus | null) => void
  activeStatus?: SummaryStatus | null
  className?: string
}

export function IncidentSummaryBar({ onFilter, activeStatus, className }: IncidentSummaryBarProps) {
  const { counts } = useIncidentSummary()
  const statusCounts = counts as Record<SummaryStatus, number>
  const [changedStatuses, setChangedStatuses] = useState<Set<SummaryStatus>>(new Set())
  const previousCountsRef = useRef(counts)

  useEffect(() => {
    const prev = previousCountsRef.current
    const changed: SummaryStatus[] = []
    ;(['open', 'in_progress', 'closed'] as const).forEach((key) => {
      if (prev[key] !== counts[key]) changed.push(key)
    })
    previousCountsRef.current = counts
    if (changed.length > 0) {
      setChangedStatuses(new Set(changed))
      const timeout = setTimeout(() => setChangedStatuses(new Set()), 1200)
      return () => clearTimeout(timeout)
    }
  }, [counts])

  return (
    <CardFrame className={cn('h-full min-h-0 p-3.5', className)}>
      <CardHeader icon={ShieldAlert} title="Incident Summary" />
      
      <div className="grid flex-1 min-h-0 grid-cols-2 grid-rows-[1fr_auto] gap-2.5">
        <button
          onClick={() => onFilter?.('open')}
          className={cn(
            "flex h-full min-h-[94px] flex-col items-start justify-between rounded-xl border p-3 text-left transition-all hover:shadow-md",
            activeStatus === 'open'
              ? "border-rose-300 bg-rose-50 ring-1 ring-rose-300 dark:border-rose-400/55 dark:bg-rose-900/25"
              : "border-rose-200/80 bg-rose-50/75 hover:bg-rose-50 dark:border-rose-400/35 dark:bg-rose-900/15 dark:hover:bg-rose-900/25",
            changedStatuses.has('open') && "animate-pulse"
          )}
        >
          <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-rose-600 dark:text-rose-300">
            <AlertCircle className="h-3 w-3" />
            Open
          </span>
          <span className="text-3xl font-extrabold tracking-tight text-rose-700 dark:text-rose-200">{statusCounts.open}</span>
        </button>

        <button
          onClick={() => onFilter?.('in_progress')}
          className={cn(
            "flex h-full min-h-[94px] flex-col items-start justify-between rounded-xl border p-3 text-left transition-all hover:shadow-md",
            activeStatus === 'in_progress'
              ? "border-amber-300 bg-amber-50 ring-1 ring-amber-300 dark:border-amber-400/55 dark:bg-amber-900/25"
              : "border-amber-200/80 bg-amber-50/75 hover:bg-amber-50 dark:border-amber-400/35 dark:bg-amber-900/15 dark:hover:bg-amber-900/25",
            changedStatuses.has('in_progress') && "animate-pulse"
          )}
        >
          <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-amber-700 dark:text-amber-300">
            <Clock className="h-3 w-3" />
            In Progress
          </span>
          <span className="text-3xl font-extrabold tracking-tight text-amber-700 dark:text-amber-200">{statusCounts.in_progress}</span>
        </button>

        <div className="col-span-2 mt-0.5 flex items-center gap-2">
          <button
            onClick={() => onFilter?.('closed')}
            className={cn(
              "flex min-h-[68px] flex-1 flex-col items-start justify-between rounded-xl border px-3 py-2 text-left transition-colors",
              activeStatus === 'closed'
                ? "border-emerald-300 bg-emerald-50 dark:border-emerald-400/50 dark:bg-emerald-900/20"
                : "border-emerald-200/80 bg-emerald-50/70 hover:bg-emerald-50 dark:border-emerald-400/30 dark:bg-emerald-900/10 dark:hover:bg-emerald-900/20"
            )}
          >
            <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Closed
            </span>
            <span className="text-2xl font-semibold tracking-tight text-emerald-700 dark:text-emerald-200">{statusCounts.closed}</span>
          </button>

          <button
            onClick={() => onFilter?.(null)}
            className={cn(
              "inline-flex min-h-[68px] min-w-[88px] flex-col items-start justify-center rounded-xl border px-2.5 py-2 text-left transition-colors",
              activeStatus === null
                ? "border-blue-300 bg-blue-50 dark:border-blue-400/60 dark:bg-blue-900/25"
                : "border-slate-200 bg-white/80 hover:bg-slate-50 dark:border-[#2d437a]/60 dark:bg-[#101a35]/70 dark:hover:bg-[#15264a]/70"
            )}
          >
            <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">All Incidents</span>
            <span className="text-[11px] font-semibold text-slate-900 dark:text-slate-100">Reset View</span>
          </button>
        </div>
      </div>
    </CardFrame>
  )
}

export default IncidentSummaryBar
