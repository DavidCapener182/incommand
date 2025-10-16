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
      <Card className="h-full flex flex-col justify-between bg-white/90 dark:bg-[#1b203b] border border-gray-200/60 dark:border-gray-700/50 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200">
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-lg font-semibold tracking-tight">
            <span>Incident Summary</span>
            <span className="relative flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 text-xs font-medium">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-600"></span>
              </span>
              LIVE
            </span>
          </CardTitle>
          <CardDescription>{formattedUpdated}</CardDescription>
        </CardHeader>
        
        <CardContent>
          <h4 className="text-sm uppercase tracking-wider text-muted-foreground mb-3 font-medium">
            Incident Overview
          </h4>
          <div className="grid grid-cols-2 gap-4">
            {statusItems.map(({ label, value, color, icon, key }) => {
              const isActive = key !== 'total' && activeStatus === key
              const isChanged = key !== 'total' && changedStatuses.has(key as SummaryStatus)
              const isTotal = key === 'total'
              
              return (
                <motion.button
                  key={label}
                  type="button"
                  onClick={() => !isTotal && onFilter?.(isActive ? null : key as SummaryStatus)}
                  className={`
                    flex flex-col items-center justify-center px-4 py-4 rounded-xl shadow-sm transition-all duration-200 
                    hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50
                    ${color}
                    ${isActive ? 'ring-2 ring-blue-400/50 shadow-md' : ''}
                    ${isChanged ? 'animate-pulse motion-reduce:animate-none' : ''}
                    ${isTotal ? 'cursor-default' : 'cursor-pointer'}
                  `}
                  aria-pressed={isActive}
                  whileHover={!isTotal ? { scale: 1.02 } : {}}
                  whileTap={!isTotal ? { scale: 0.98 } : {}}
                >
                  <div className="flex items-center gap-2 font-medium mb-1">
                    {icon} 
                    <span className="text-sm">{label}</span>
                  </div>
                         <span className="text-2xl font-extrabold">{value}</span>
                </motion.button>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export default IncidentSummaryBar
