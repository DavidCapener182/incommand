'use client'

import React from 'react'
import { CheckCircle, AlertTriangle, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

export type StatusType = 'normal' | 'busy' | 'alert'

interface StatusIndicatorProps {
  status: StatusType
  message?: string
  className?: string
  showIcon?: boolean
}

const statusConfig = {
  normal: {
    bg: 'bg-green-100',
    text: 'text-green-800',
    border: 'border-green-200',
    icon: CheckCircle,
    label: 'Normal'
  },
  busy: {
    bg: 'bg-amber-100',
    text: 'text-amber-800',
    border: 'border-amber-200',
    icon: AlertTriangle,
    label: 'Busy'
  },
  alert: {
    bg: 'bg-red-100',
    text: 'text-red-800',
    border: 'border-red-200',
    icon: AlertCircle,
    label: 'Alert'
  }
}

export default function StatusIndicator({
  status,
  message,
  className = '',
  showIcon = true
}: StatusIndicatorProps) {
  const config = statusConfig[status]
  const Icon = config.icon

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium border',
        config.bg,
        config.text,
        config.border,
        className
      )}
      title={message || config.label}
    >
      {showIcon && <Icon className="h-3 w-3" />}
      <span>{message || config.label}</span>
    </div>
  )
}

// Compact version for card corners (just a colored dot)
export function StatusDot({ status, className = '' }: { status: StatusType; className?: string }) {
  const dotColors = {
    normal: 'bg-green-500',
    busy: 'bg-amber-500',
    alert: 'bg-red-500'
  }

  return (
    <div
      className={cn(
        'absolute top-3 right-3 w-2 h-2 rounded-full',
        dotColors[status],
        className
      )}
      title={statusConfig[status].label}
    />
  )
}

