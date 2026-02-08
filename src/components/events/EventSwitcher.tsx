'use client'

import React, { useCallback, useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useEventContext } from '@/contexts/EventContext'
import { ChevronUpDownIcon, CheckIcon } from '@heroicons/react/24/outline'
import { cn } from '@/lib/utils'

interface EventRow {
  id: string
  event_name: string
  venue_name: string
  event_type: string
  is_current: boolean
  event_date: string | null
}

export default function EventSwitcher({ className = '' }: { className?: string }) {
  const { eventId, switchEvent, loading: ctxLoading } = useEventContext()
  const [events, setEvents] = useState<EventRow[]>([])
  const [open, setOpen] = useState(false)
  const [switching, setSwitching] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const fetchEvents = useCallback(async () => {
    const { data: user } = await supabase.auth.getUser()
    if (!user?.user?.id) return

    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.user.id)
      .single()

    const companyId = (profile as { company_id?: string } | null)?.company_id
    if (!companyId) return

    const { data } = await supabase
      .from('events')
      .select('id, event_name, venue_name, event_type, is_current, event_date')
      .eq('company_id', companyId)
      .order('event_date', { ascending: false })

    if (data) setEvents(data as EventRow[])
  }, [])

  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const currentEvent = events.find((e) => e.id === eventId)

  const handleSwitch = async (id: string) => {
    if (id === eventId) {
      setOpen(false)
      return
    }
    setSwitching(true)
    await switchEvent(id)
    setSwitching(false)
    setOpen(false)
  }

  if (events.length <= 1) return null

  return (
    <div ref={ref} className={cn('relative', className)}>
      <button
        onClick={() => setOpen(!open)}
        disabled={switching || ctxLoading}
        className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium hover:bg-accent transition-colors disabled:opacity-50 w-full"
      >
        <span className="truncate flex-1 text-left">
          {currentEvent?.event_name ?? 'Select event'}
        </span>
        <ChevronUpDownIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
      </button>

      {open && (
        <div className="absolute top-full left-0 z-50 mt-1 w-full min-w-[240px] rounded-lg border border-border bg-popover shadow-lg">
          <div className="py-1 max-h-64 overflow-y-auto">
            {events.map((ev) => (
              <button
                key={ev.id}
                onClick={() => handleSwitch(ev.id)}
                className={cn(
                  'flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent transition-colors text-left',
                  ev.id === eventId && 'bg-accent/50'
                )}
              >
                <CheckIcon
                  className={cn('h-4 w-4 shrink-0', ev.id === eventId ? 'text-primary' : 'invisible')}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{ev.event_name}</p>
                  <p className="truncate text-xs text-muted-foreground">{ev.venue_name}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
