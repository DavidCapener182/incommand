'use client'

import React, { useEffect, useState } from 'react'
import { ChartBarIcon, ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline'
import { useEventContext } from '@/contexts/EventContext'
import { useIncidents } from '@/hooks/useIncidents'
import Link from 'next/link'

interface MobileAnalyticsProps {
  onBack?: () => void
}

export default function MobileAnalytics({ onBack }: MobileAnalyticsProps) {
  const { eventId } = useEventContext()
  const { incidents, loading } = useIncidents(eventId || '')
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const highPriority = incidents.filter(
    (i) => (i.priority || '').toLowerCase() === 'high' || (i.priority || '').toLowerCase() === 'urgent'
  ).length
  const openCount = incidents.filter((i) => (i.status || '').toLowerCase() !== 'closed').length
  const total = incidents.length

  return (
    <div className="space-y-5 p-4 pb-24">
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400"
        >
          ← Back
        </button>
      )}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-incommand-brand-mobile/10 dark:bg-incommand-brand-mobile/20">
          <ChartBarIcon className="h-5 w-5 text-incommand-brand-mobile dark:text-blue-400" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Analytics</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">Event snapshot</p>
        </div>
      </div>

      {!mounted || !eventId ? (
        <div className="card-mobile animate-pulse p-6" />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div className="card-mobile">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                Total incidents
              </p>
              <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
                {loading ? '—' : total}
              </p>
            </div>
            <div className="card-mobile">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                Open
              </p>
              <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
                {loading ? '—' : openCount}
              </p>
            </div>
            <div className="card-mobile">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                High priority
              </p>
              <p className="mt-1 text-2xl font-bold text-red-600 dark:text-red-400">
                {loading ? '—' : highPriority}
              </p>
            </div>
            <div className="card-mobile">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                Closed
              </p>
              <p className="mt-1 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {loading ? '—' : total - openCount}
              </p>
            </div>
          </div>

          <Link
            href="/analytics"
            className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-incommand-surface-alt"
          >
            <span className="font-medium text-gray-900 dark:text-white">Full analytics dashboard</span>
            <ArrowTopRightOnSquareIcon className="h-5 w-5 text-gray-400" />
          </Link>
        </>
      )}
    </div>
  )
}
