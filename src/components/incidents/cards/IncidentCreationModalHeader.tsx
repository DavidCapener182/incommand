'use client'

import React from 'react'
import QuickTabs from '@/components/QuickTabs'
import { XMarkIcon, CalendarDaysIcon } from '@heroicons/react/24/outline'
import type { User } from '@supabase/supabase-js'
import type { Event } from '@/types/shared'

export interface IncidentCreationModalHeaderProps {
  events: Event[]
  selectedEventId: string | null
  eventsLoading: boolean
  currentEventFallback: Event | null
  user: User | null
  onIncidentCreated: () => Promise<void>
  onClose: () => void
  onResetForm: () => void
}

export default function IncidentCreationModalHeader({
  events,
  selectedEventId,
  eventsLoading,
  currentEventFallback,
  user,
  onIncidentCreated,
  onClose,
  onResetForm,
}: IncidentCreationModalHeaderProps) {
  
  const eventName = (() => {
    const chosen = events.find(e => e.id === selectedEventId)
      || events.find(e => e.is_current)
      || currentEventFallback
      || events[0];
    if (chosen?.event_name) return chosen.event_name;
    return eventsLoading ? 'Loading...' : 'No events available';
  })()

  return (
    <header className="relative z-30 w-full border-b border-slate-200/80 bg-white/95 px-4 py-4 backdrop-blur-xl shadow-[0_10px_28px_-20px_rgba(15,23,42,0.55)] sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-[1880px] items-center justify-between gap-4">
        {/* Left Section: Title & Context */}
        <div className="flex min-w-0 items-center gap-4">
          <h1 className="text-xl font-bold tracking-tight text-slate-900">New Incident</h1>

          <div className="hidden h-6 w-px bg-slate-200 sm:block" />

          {/* Event Context Badge */}
          <div className="hidden items-center gap-2 text-xs sm:flex">
            <span className="font-semibold uppercase tracking-[0.12em] text-slate-500">Event</span>
            <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-gradient-to-r from-slate-50 to-white px-3 py-1.5 text-slate-700 shadow-sm">
              <CalendarDaysIcon className="h-3.5 w-3.5 text-slate-400" />
              <span className="max-w-[280px] truncate font-semibold">{eventName}</span>
            </div>
          </div>
        </div>

        {/* Right Section: Quick Actions */}
        <div className="flex items-center gap-3">
          {/* Quick Tabs */}
          <div className="hidden md:block">
            <QuickTabs
              eventId={selectedEventId || ''}
              onIncidentLogged={async () => {
                await onIncidentCreated();
              }}
              currentUser={user}
            />
          </div>

          {/* Divider */}
          <div className="mx-1 hidden h-7 w-px bg-slate-200 md:block" />

          {/* Close Button */}
          <button
            onClick={() => {
              onResetForm()
              onClose()
            }}
            className="rounded-xl border border-transparent p-2 text-slate-400 transition-all duration-200 hover:border-slate-200 hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close modal"
          >
            <XMarkIcon className="h-5 w-5" strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </header>
  )
}
