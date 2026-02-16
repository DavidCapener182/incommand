'use client'

import React from 'react'
import {
  getPriorityLabel,
  normalizePriority,
  type Priority,
} from '../utils/incidentStyles'

interface PriorityBadgeProps {
  priority?: Priority | string | null
  className?: string
}

function getPriorityBadgeStyle(priority: string): string {
  const normalized = normalizePriority(priority as Priority)
  
  switch (normalized) {
    case 'urgent':
      return 'bg-red-100 text-red-800 border-red-500/80 dark:bg-red-900/35 dark:text-red-200 dark:border-red-400/70'
    case 'high':
      return 'bg-rose-100 text-rose-800 border-rose-500/80 dark:bg-rose-900/35 dark:text-rose-200 dark:border-rose-400/70'
    case 'medium':
      return 'bg-amber-100 text-amber-800 border-amber-500/80 dark:bg-amber-900/35 dark:text-amber-200 dark:border-amber-400/70'
    case 'low':
      return 'bg-emerald-100 text-emerald-800 border-emerald-500/80 dark:bg-emerald-900/35 dark:text-emerald-200 dark:border-emerald-400/70'
    default:
      return 'bg-slate-100 text-slate-700 border-slate-400/70 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-500/60'
  }
}

function getPriorityDotColor(priority: string): string {
  const normalized = normalizePriority(priority as Priority)
  
  switch (normalized) {
    case 'urgent':
      return 'bg-red-600'
    case 'high':
      return 'bg-rose-600'
    case 'medium':
      return 'bg-amber-600'
    case 'low':
      return 'bg-emerald-600'
    default:
      return 'bg-gray-500'
  }
}

export default function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  const normalized = normalizePriority(priority as Priority)

  if (normalized === 'unknown') {
    return null
  }

  const badgeStyle = getPriorityBadgeStyle(priority as Priority)
  const dotColor = getPriorityDotColor(priority as Priority)

  return (
    <span 
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold shadow-none ${badgeStyle} ${className || ''}`}
      aria-label={`${getPriorityLabel(priority as Priority)} priority`}
    >
      <div className={`h-1.5 w-1.5 rounded-full ${dotColor} mr-2`} />
      <span>{getPriorityLabel(priority as Priority)}</span>
    </span>
  )
}
