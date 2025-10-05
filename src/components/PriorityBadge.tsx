'use client'

import React from 'react'
import {
  getPriorityBadgeClass,
  getPriorityDisplayConfig,
  getPriorityLabel,
  normalizePriority,
  type Priority,
} from '../utils/incidentStyles'

interface PriorityBadgeProps {
  priority?: Priority | string | null
  className?: string
}

export default function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  const normalized = normalizePriority(priority as Priority)

  if (normalized === 'unknown') {
    return null
  }

  const config = getPriorityDisplayConfig(priority as Priority)
  const Icon = config.icon

  const classes = [
    'inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide shadow-sm backdrop-blur-sm',
    getPriorityBadgeClass(priority as Priority),
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <span className={classes} aria-label={`${getPriorityLabel(priority as Priority)} priority`}>
      <Icon size={16} aria-hidden />
      <span>{getPriorityLabel(priority as Priority)}</span>
    </span>
  )
}
