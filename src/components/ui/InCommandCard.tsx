'use client'

import React from 'react'
import { MoreHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface CardFrameProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  className?: string
  onMouseEnter?: () => void
  onMouseLeave?: () => void
}

export const CardFrame = ({
  children,
  className,
  onMouseEnter,
  onMouseLeave,
  ...rest
}: CardFrameProps) => (
  <div
    onMouseEnter={onMouseEnter}
    onMouseLeave={onMouseLeave}
    {...rest}
    className={cn(
      'group relative flex h-full flex-col overflow-hidden rounded-[var(--radius-card-primary)] border border-slate-200/90 bg-gradient-to-br from-white via-slate-50/60 to-slate-100/90 p-3.5 shadow-[0_16px_32px_-24px_rgba(15,23,42,0.38)] ring-1 ring-slate-200/50 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_22px_40px_-24px_rgba(15,23,42,0.42)] dark:border-[#2d437a]/70 dark:bg-gradient-to-br dark:from-[#162346] dark:via-[#14203f] dark:to-[#0f1934] dark:ring-white/5',
      className
    )}
  >
    <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500/70 via-cyan-400/60 to-transparent" />
    {children}
  </div>
)

export type CardHeaderIconVariant = 'blue' | 'teal' | 'green' | 'indigo' | 'amber'

const iconVariantClasses: Record<CardHeaderIconVariant, string> = {
  blue:
    'bg-gradient-to-br from-blue-100 to-cyan-100 text-blue-700 ring-blue-200/70 dark:from-blue-500/25 dark:to-cyan-500/20 dark:text-blue-200 dark:ring-blue-400/35',
  teal: 'bg-teal-100 text-teal-600 ring-teal-200/70 dark:bg-teal-900/30 dark:text-teal-400 dark:ring-teal-400/35',
  green:
    'bg-green-100 text-green-600 ring-green-200/70 dark:bg-green-900/30 dark:text-green-400 dark:ring-green-400/35',
  indigo:
    'bg-indigo-100 text-indigo-600 ring-indigo-200/70 dark:bg-indigo-900/30 dark:text-indigo-400 dark:ring-indigo-400/35',
  amber:
    'bg-amber-100 text-amber-600 ring-amber-200/70 dark:bg-amber-900/30 dark:text-amber-400 dark:ring-amber-400/35',
}

export interface CardHeaderProps {
  icon: React.ComponentType<{ className?: string }>
  title: string
  titleId?: string
  action?: () => void
  actionNode?: React.ReactNode
  variant?: CardHeaderIconVariant
  className?: string
}

export const CardHeader = ({
  icon: Icon,
  title,
  titleId,
  action,
  actionNode,
  variant = 'blue',
  className,
}: CardHeaderProps) => {
  const iconClasses = iconVariantClasses[variant]
  return (
    <div
      className={cn(
        'flex items-center justify-between shrink-0 mb-3',
        className
      )}
    >
      <div className="flex items-center gap-2">
        <div
          className={cn(
            'flex h-7 w-7 items-center justify-center rounded-lg ring-1',
            iconClasses
          )}
        >
          <Icon className="h-3.5 w-3.5" />
        </div>
        <span
          id={titleId}
          className="text-sm font-semibold text-slate-700 dark:text-slate-100"
        >
          {title}
        </span>
      </div>
      {action != null && (
        <button
          type="button"
          onClick={action}
          className="text-slate-400 transition-colors hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-200"
        >
          {actionNode ?? <MoreHorizontal className="h-4 w-4" />}
        </button>
      )}
    </div>
  )
}
