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
    >
      <Card className="h-full flex flex-col justify-between card-time relative p-3 sm:p-4 leading-tight">
        <CardHeader className="pb-0.5 space-y-0">
          <CardTitle className="text-sm font-semibold tracking-tight">Incident Summary</CardTitle>
          <CardDescription className="text-xs text-gray-500 dark:text-gray-400">
            Updated less than a minute ago
          </CardDescription>
        </CardHeader>

        <CardContent className="flex-1 p-0 pt-2">
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-2 text-center">
              <p className="text-[11px] font-medium text-red-700 dark:text-red-300 mb-0.5">Open</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{statusCounts.open}</p>
            </div>
            <div className="rounded-md bg-yellow-50 dark:bg-yellow-900/20 p-2 text-center">
              <p className="text-[11px] font-medium text-yellow-700 dark:text-yellow-300 mb-0.5">In Progress</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{statusCounts.in_progress}</p>
            </div>
            <div className="rounded-md bg-green-50 dark:bg-green-900/20 p-2 text-center">
              <p className="text-[11px] font-medium text-green-700 dark:text-green-300 mb-0.5">Closed</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{statusCounts.closed}</p>
            </div>
            <div className="rounded-md bg-gray-50 dark:bg-gray-700/20 p-2 text-center">
              <p className="text-[11px] font-medium text-gray-600 dark:text-gray-300 mb-0.5">Total</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{counts.total}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export default IncidentSummaryBar
