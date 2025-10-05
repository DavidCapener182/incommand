'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { formatDistanceToNow } from 'date-fns'

import { useIncidentSummary } from '@/contexts/IncidentSummaryContext'

export type SummaryStatus = 'open' | 'in_progress' | 'closed'

interface IncidentSummaryBarProps {
  onFilter?: (status: SummaryStatus | null) => void
  activeStatus?: SummaryStatus | null
  className?: string
}

interface StatusConfig {
  key: SummaryStatus
  label: string
  description: string
  color: string
  accent: string
  dot: string
}

const STATUS_CONFIG: StatusConfig[] = [
  {
    key: 'open',
    label: 'Open',
    description: 'Incidents awaiting action',
    color: 'text-red-600 dark:text-red-300',
    accent: 'bg-red-50 dark:bg-red-900/30 border-red-100 dark:border-red-800/60',
    dot: 'bg-red-500',
  },
  {
    key: 'in_progress',
    label: 'In Progress',
    description: 'Actively being resolved',
    color: 'text-amber-600 dark:text-amber-300',
    accent: 'bg-amber-50 dark:bg-amber-900/30 border-amber-100 dark:border-amber-800/60',
    dot: 'bg-amber-500',
  },
  {
    key: 'closed',
    label: 'Closed',
    description: 'Resolved & verified',
    color: 'text-emerald-600 dark:text-emerald-300',
    accent: 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-100 dark:border-emerald-800/60',
    dot: 'bg-emerald-500',
  },
]

function classes(...tokens: Array<string | false | null | undefined>) {
  return tokens.filter(Boolean).join(' ')
}

export function IncidentSummaryBar({ onFilter, activeStatus = null, className }: IncidentSummaryBarProps) {
  const { counts, lastUpdated } = useIncidentSummary()
  const statusCounts = counts as Record<SummaryStatus, number>
  const [changedStatuses, setChangedStatuses] = useState<Set<SummaryStatus>>(new Set())
  const previousCountsRef = useRef(counts)

  useEffect(() => {
    const prev = previousCountsRef.current
    const changed: SummaryStatus[] = []

    STATUS_CONFIG.forEach(({ key }) => {
      if (prev[key] !== counts[key]) {
        changed.push(key)
      }
    })

    previousCountsRef.current = counts

    if (changed.length === 0) {
      return
    }

    setChangedStatuses(new Set(changed))

    const timeout = setTimeout(() => {
      setChangedStatuses(new Set())
    }, 1200)

    return () => clearTimeout(timeout)
  }, [counts])

  const formattedUpdated = useMemo(() => {
    if (!lastUpdated) {
      return 'Waiting for activity'
    }

    try {
      return `Updated ${formatDistanceToNow(new Date(lastUpdated), { addSuffix: true })}`
    } catch {
      return 'Updated moments ago'
    }
  }, [lastUpdated])

  return (
    <div className={classes('sticky top-20 z-40', className)}>
      <div className="rounded-2xl border border-gray-200/80 bg-white/90 px-4 py-3 shadow-sm backdrop-blur dark:border-white/10 dark:bg-[#1a2549]/80">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Incident Summary</h2>
            <span className="text-xs text-gray-500 dark:text-gray-400">{formattedUpdated}</span>
          </div>
          <div className="flex flex-wrap items-center gap-2 md:justify-end">
            {STATUS_CONFIG.map((status) => {
              const value = statusCounts[status.key]
              const isActive = activeStatus === status.key
              const isChanged = changedStatuses.has(status.key)

              return (
                <button
                  key={status.key}
                  type="button"
                  onClick={() => onFilter?.(isActive ? null : status.key)}
                  className={classes(
                    'group flex min-w-[110px] flex-col rounded-xl border px-3 py-2 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
                    status.accent,
                    isActive && 'border-blue-400 ring-2 ring-blue-200 dark:ring-blue-500/40',
                    isChanged && 'animate-pulse motion-reduce:animate-none'
                  )}
                  aria-pressed={isActive}
                >
                  <div className="flex items-center justify-between">
                    <span className={classes('text-xs font-semibold uppercase tracking-wide', status.color)}>
                      {status.label}
                    </span>
                    <span className={classes('h-2 w-2 rounded-full', status.dot)} aria-hidden />
                  </div>
                  <span className="mt-1 text-xl font-semibold text-gray-900 dark:text-gray-100">{value}</span>
                  <span className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">{status.description}</span>
                </button>
              )
            })}
            <div className="flex flex-col justify-center rounded-xl border border-gray-200/80 bg-gray-50 px-3 py-2 text-xs font-medium text-gray-600 dark:border-white/10 dark:bg-[#111832] dark:text-gray-300">
              <span className="uppercase tracking-wide text-[11px] text-gray-500 dark:text-gray-400">Total</span>
              <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">{counts.total}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default IncidentSummaryBar
