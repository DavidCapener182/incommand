'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { motion } from 'framer-motion'
import { 
  ExclamationTriangleIcon, 
  ClockIcon, 
  CheckCircleIcon, 
  FolderOpenIcon 
} from '@heroicons/react/24/outline'

import { useIncidentSummary } from '@/contexts/IncidentSummaryContext'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

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
    color: 'text-red-700 dark:text-red-300',
    accent: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300',
    dot: 'bg-red-500',
  },
  {
    key: 'in_progress',
    label: 'In Progress',
    description: 'Actively being resolved',
    color: 'text-yellow-700 dark:text-yellow-300',
    accent: 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
    dot: 'bg-yellow-500',
  },
  {
    key: 'closed',
    label: 'Closed',
    description: 'Resolved & verified',
    color: 'text-green-700 dark:text-green-300',
    accent: 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300',
    dot: 'bg-green-500',
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

  const statusItems = [
    { 
      label: 'Open', 
      value: statusCounts.open, 
      color: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300', 
      icon: <ExclamationTriangleIcon className="h-4 w-4" />,
      key: 'open' as SummaryStatus | 'total'
    },
    { 
      label: 'In Progress', 
      value: statusCounts.in_progress, 
      color: 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300', 
      icon: <ClockIcon className="h-4 w-4" />,
      key: 'in_progress' as SummaryStatus | 'total'
    },
    { 
      label: 'Closed', 
      value: statusCounts.closed, 
      color: 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300', 
      icon: <CheckCircleIcon className="h-4 w-4" />,
      key: 'closed' as SummaryStatus | 'total'
    },
    { 
      label: 'Total', 
      value: counts.total, 
      color: 'bg-gray-50 text-gray-700 dark:bg-gray-800/60 dark:text-gray-100', 
      icon: <FolderOpenIcon className="h-4 w-4" />,
      key: 'total' as SummaryStatus | 'total'
    },
  ]

  return (
    <motion.div 
      className={classes('h-full flex flex-col', className)}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <Card className="h-full flex flex-col justify-between bg-white dark:bg-gray-800 rounded-3xl shadow-lg p-6 sm:p-8">
        <div className="flex flex-col space-y-8">
          {/* Header Section */}
          <div>
            <div className="flex items-center gap-3 mb-5">
              <svg className="h-6 w-6 text-[#4338CA]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">Incident Summary</h3>
            </div>
          </div>

          {/* Divider */}
          <hr className="border-slate-200 dark:border-slate-700 mb-6" />

          {/* Status Grid */}
          <div>
            <div className="space-y-2">
              {/* Open Incidents */}
              <div className="flex items-center justify-between p-3 rounded-md bg-slate-50 dark:bg-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
                  <span className="font-semibold text-slate-600 dark:text-slate-300">Open</span>
                </div>
                <span className="text-lg font-bold text-slate-900 dark:text-white">{statusCounts.open}</span>
              </div>

              {/* In Progress Incidents */}
              <div className="flex items-center justify-between p-3 rounded-md bg-slate-50 dark:bg-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500"></div>
                  <span className="font-semibold text-slate-600 dark:text-slate-300">In Progress</span>
                </div>
                <span className="text-lg font-bold text-slate-900 dark:text-white">{statusCounts.in_progress}</span>
              </div>

              {/* Closed Incidents */}
              <div className="flex items-center justify-between p-3 rounded-md bg-slate-50 dark:bg-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
                  <span className="font-semibold text-slate-600 dark:text-slate-300">Closed</span>
                </div>
                <span className="text-lg font-bold text-slate-900 dark:text-white">{statusCounts.closed}</span>
              </div>

              {/* Divider */}
              <div className="border-t border-slate-200 dark:border-slate-700 my-4"></div>

              {/* Total Incidents */}
              <div className="flex items-center justify-between p-3">
                <span className="font-bold text-lg text-slate-600 dark:text-slate-200">Total</span>
                <span className="text-xl font-extrabold text-[#4338CA]">{counts.total}</span>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  )
}

export default IncidentSummaryBar
