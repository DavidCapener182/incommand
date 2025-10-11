'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline'

interface ProgressiveDisclosureCardProps {
  title: string
  summary: string
  children: React.ReactNode
  defaultExpanded?: boolean
  className?: string
  compact?: boolean
  onToggle?: (expanded: boolean) => void
}

export default function ProgressiveDisclosureCard({
  title,
  summary,
  children,
  defaultExpanded = false,
  className = '',
  compact = false,
  onToggle
}: ProgressiveDisclosureCardProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)

  const handleToggle = () => {
    const newExpanded = !isExpanded
    setIsExpanded(newExpanded)
    onToggle?.(newExpanded)
  }

  return (
    <motion.div
      className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden ${className}`}
      layout
      transition={{ duration: 0.2 }}
    >
      {/* Header - Always Visible */}
      <button
        onClick={handleToggle}
        className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset"
        aria-expanded={isExpanded}
        aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${title}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 dark:text-white truncate">
              {title}
            </h3>
            {!compact && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                {summary}
              </p>
            )}
          </div>
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="ml-3 flex-shrink-0"
          >
            <ChevronDownIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          </motion.div>
        </div>
      </button>

      {/* Content - Conditionally Visible */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 border-t border-gray-200 dark:border-gray-700">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// Specialized variants for common use cases
export function IncidentProgressiveCard({
  incident,
  children,
  ...props
}: {
  incident: any
  children: React.ReactNode
} & Omit<ProgressiveDisclosureCardProps, 'title' | 'summary'>) {
  return (
    <ProgressiveDisclosureCard
      title={`Incident ${incident.id || 'N/A'}`}
      summary={incident.occurrence || 'No details available'}
      compact
      {...props}
    >
      {children}
    </ProgressiveDisclosureCard>
  )
}

export function StaffProgressiveCard({
  staff,
  children,
  ...props
}: {
  staff: any
  children: React.ReactNode
} & Omit<ProgressiveDisclosureCardProps, 'title' | 'summary'>) {
  return (
    <ProgressiveDisclosureCard
      title={staff.name || 'Unknown Staff'}
      summary={`${staff.callsign || 'No callsign'} • ${staff.role || 'Unknown role'}`}
      compact
      {...props}
    >
      {children}
    </ProgressiveDisclosureCard>
  )
}

export function AnalyticsProgressiveCard({
  title,
  value,
  children,
  ...props
}: {
  title: string
  value: string | number
  children: React.ReactNode
} & Omit<ProgressiveDisclosureCardProps, 'title' | 'summary'>) {
  return (
    <ProgressiveDisclosureCard
      title={title}
      summary={`Current: ${value}`}
      compact
      {...props}
    >
      {children}
    </ProgressiveDisclosureCard>
  )
}
