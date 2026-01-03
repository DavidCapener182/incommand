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
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-6 py-3 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] flex items-center justify-between">
      
      {/* Left Section: Title & Context */}
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-bold text-slate-900 tracking-tight">New Incident</h1>
        
        {/* Divider */}
        <div className="h-5 w-px bg-slate-200 hidden sm:block" />
        
        {/* Event Context Badge */}
        <div className="hidden sm:flex items-center gap-2 text-xs">
          <span className="text-slate-500 font-medium">Event:</span>
          <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200 text-slate-700 font-semibold shadow-sm">
            <CalendarDaysIcon className="h-3.5 w-3.5 text-slate-400" />
            <span className="truncate max-w-[200px]">{eventName}</span>
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
        <div className="h-6 w-px bg-slate-200 mx-1 hidden md:block" />

        {/* Close Button */}
        <button
          onClick={() => {
            onResetForm()
            onClose()
          }}
          className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors duration-200"
          aria-label="Close modal"
        >
          <XMarkIcon className="h-5 w-5" strokeWidth={2.5} />
        </button>
      </div>
    </header>
  )
}