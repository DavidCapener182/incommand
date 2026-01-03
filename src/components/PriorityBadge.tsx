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
      return 'bg-red-600/10 dark:bg-red-600/20 hover:bg-red-600/10 text-red-500 border-red-600/60'
    case 'high':
      return 'bg-red-600/10 dark:bg-red-600/20 hover:bg-red-600/10 text-red-500 border-red-600/60'
    case 'medium':
      return 'bg-amber-600/10 dark:bg-amber-600/20 hover:bg-amber-600/10 text-amber-500 border-amber-600/60'
    case 'low':
      return 'bg-emerald-600/10 dark:bg-emerald-600/20 hover:bg-emerald-600/10 text-emerald-500 border-emerald-600/60'
    default:
      return 'bg-gray-600/10 dark:bg-gray-600/20 hover:bg-gray-600/10 text-gray-500 border-gray-600/60'
  }
}

function getPriorityDotColor(priority: string): string {
  const normalized = normalizePriority(priority as Priority)
  
  switch (normalized) {
    case 'urgent':
      return 'bg-red-500'
    case 'high':
      return 'bg-red-500'
    case 'medium':
      return 'bg-amber-500'
    case 'low':
      return 'bg-emerald-500'
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
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold shadow-none ${badgeStyle} ${className || ''}`}
      aria-label={`${getPriorityLabel(priority as Priority)} priority`}
    >
      <div className={`h-1.5 w-1.5 rounded-full ${dotColor} mr-2`} />
      <span>{getPriorityLabel(priority as Priority)}</span>
    </span>
  )
}
