'use client'

import React, { useMemo } from 'react'
import {
  ClockIcon,
  MapPinIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  BoltIcon,
  SignalIcon,
  SignalSlashIcon,
} from '@heroicons/react/24/outline'
import { useIncidents } from '@/hooks/useIncidents'

interface MobileIncidentHomeProps {
  eventId: string | null
  eventName: string
  connectionStatus: 'online' | 'offline'
  loadingEvent?: boolean
  onLogNewIncident: () => void
}

export default function MobileIncidentHome({
  eventId,
  eventName,
  connectionStatus,
  loadingEvent,
  onLogNewIncident,
}: MobileIncidentHomeProps) {
  const { incidents, loading } = useIncidents(eventId || '')

  const recentIncidents = useMemo(() => incidents, [incidents])
  const isOnline = connectionStatus === 'online'

  // Helper for priority chip styles (match desktop pill look)
  const getPriorityStyles = (priority: string = 'medium') => {
    const p = priority.toLowerCase()
    if (p === 'high' || p === 'urgent') {
      return {
        container: 'text-red-600 bg-red-50 border border-red-200 dark:text-red-200 dark:bg-red-900/20 dark:border-red-800/60',
        dot: 'bg-red-500'
      }
    }
    if (p === 'low') {
      return {
        container: 'text-emerald-700 bg-emerald-50 border border-emerald-200 dark:text-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800/60',
        dot: 'bg-emerald-500'
      }
    }
    return {
      container: 'text-amber-700 bg-amber-50 border border-amber-200 dark:text-amber-200 dark:bg-amber-900/20 dark:border-amber-800/60',
      dot: 'bg-amber-500'
    }
  }

  return (
    <div className="space-y-5 p-4 pb-24">
      
      {/* --- Card 1: Event Status & Actions --- */}
      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-gray-800 dark:bg-incommand-surface">
        <div className="border-b border-gray-50 bg-gray-50/50 p-4 dark:border-gray-800 dark:bg-white/5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                Current Event
              </p>
              <h2 className="mt-0.5 text-lg font-bold text-gray-900 dark:text-white">
                {loadingEvent ? (
                  <span className="animate-pulse text-gray-300">Loading...</span>
                ) : (
                  eventName
                )}
              </h2>
            </div>
            
            <div
              className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide shadow-sm backdrop-blur-md ${
                isOnline
                  ? 'border-emerald-200/50 bg-emerald-50/80 text-emerald-700 dark:border-emerald-800/50 dark:bg-emerald-900/20 dark:text-emerald-400'
                  : 'border-rose-200/50 bg-rose-50/80 text-rose-700 dark:border-rose-800/50 dark:bg-rose-900/20 dark:text-rose-400'
              }`}
            >
              {isOnline ? (
                <SignalIcon className="h-3 w-3" />
              ) : (
                <SignalSlashIcon className="h-3 w-3" />
              )}
              <span>{isOnline ? 'Online' : 'Offline'}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <ClockIcon className="h-4 w-4 text-gray-400" />
            <span>Ready for new entries</span>
          </div>
          <button
            type="button"
            onClick={onLogNewIncident}
            className="flex items-center gap-2 rounded-xl bg-[#2A3990] px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-900/10 transition-transform active:scale-95 dark:shadow-blue-900/20"
          >
            <span>Log Incident</span>
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-white/20 font-mono text-[10px] leading-none">
              +
            </span>
          </button>
        </div>
      </div>

      {/* --- Card 2: Recent Incidents List --- */}
      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-gray-800 dark:bg-incommand-surface">
        <div className="flex items-center justify-between border-b border-gray-100 bg-white p-4 dark:border-gray-800 dark:bg-incommand-surface">
          <div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">
              Recent Incidents
            </h3>
            <p className="text-[10px] text-gray-500 dark:text-gray-400">
              Latest activity feed
            </p>
          </div>
          <span className="flex h-6 min-w-[1.5rem] items-center justify-center rounded-md bg-gray-100 px-2 text-xs font-bold text-gray-600 dark:bg-gray-800 dark:text-gray-300">
            {recentIncidents.length}
          </span>
        </div>

        <div className="divide-y divide-gray-100 dark:divide-gray-800/50">
          {/* Loading / Empty States */}
          {(!eventId || (loading && recentIncidents.length === 0)) && (
            <div className="flex flex-col items-center justify-center py-10 text-center">
               <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-[#2A3990] mb-3"/>
               <p className="text-xs text-gray-500">Syncing incidents...</p>
            </div>
          )}
          
          {!loading && eventId && recentIncidents.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center text-gray-500">
              <CheckCircleIcon className="mb-2 h-10 w-10 text-gray-300 dark:text-gray-700" />
              <p className="text-sm font-medium">All clear</p>
              <p className="text-xs opacity-70">No incidents logged yet</p>
            </div>
          )}

          {/* List Items */}
          {recentIncidents.map((incident) => {
            const status = incident.status?.toLowerCase()
            const isClosed = incident.is_closed || status === 'closed' || status === 'resolved'
            const priority = (incident.priority || 'medium').toLowerCase()
            const { container: priorityClass, dot: dotClass } = getPriorityStyles(priority)

            return (
              <div
                key={incident.id}
                className="group relative flex items-start gap-3 p-4 transition-colors hover:bg-gray-50/50 dark:hover:bg-white/5"
              >
                {/* Icon Box */}
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-colors ${
                    isClosed
                      ? 'border-emerald-100 bg-emerald-50 text-emerald-600 dark:border-emerald-900/30 dark:bg-emerald-900/10 dark:text-emerald-400'
                      : 'border-gray-100 bg-gray-50 text-gray-500 dark:border-gray-800 dark:bg-gray-800 dark:text-gray-400'
                  }`}
                >
                  {isClosed ? (
                    <CheckCircleIcon className="h-5 w-5" />
                  ) : (
                    <ExclamationTriangleIcon className="h-5 w-5" />
                  )}
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="flex items-start justify-between gap-3">
                    <p className={`flex-1 truncate text-sm font-semibold ${isClosed ? 'text-gray-500' : 'text-gray-900 dark:text-gray-100'}`}>
                      {incident.type || 'Incident'}
                    </p>

                    <div className="flex flex-col items-end gap-1">
                      {/* Priority Badge (always show) */}
                      <span className={`shrink-0 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ${priorityClass}`}>
                        <span className={`h-2 w-2 rounded-full ${dotClass}`} />
                        {priority}
                      </span>
                      {/* Status for open incidents */}
                      {!isClosed && (
                        <span className="shrink-0 rounded-md bg-blue-50 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-700 dark:bg-blue-900/30 dark:text-blue-200 border border-blue-100 dark:border-blue-800/60">
                          Open
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="line-clamp-2 text-xs leading-relaxed text-gray-600 dark:text-gray-400">
                    {incident.description || 'No details provided.'}
                  </p>

                  <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-gray-400 dark:text-gray-500">
                     {/* Time */}
                    <span className="flex items-center gap-1">
                      <ClockIcon className="h-3 w-3" />
                      {incident.created_at
                        ? new Date(incident.created_at).toLocaleTimeString('en-GB', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : '--:--'}
                    </span>

                    {/* Location */}
                    {incident.location && (
                      <span className="flex items-center gap-1">
                        <MapPinIcon className="h-3 w-3" />
                        <span className="max-w-[120px] truncate">{incident.location}</span>
                      </span>
                    )}
                    
                    {/* Status Text (if not closed) */}
                    {!isClosed && (
                        <span className="flex items-center gap-1 ml-auto font-medium text-gray-500 dark:text-gray-400">
                            <BoltIcon className="h-3 w-3" />
                            {incident.status || 'Open'}
                        </span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}