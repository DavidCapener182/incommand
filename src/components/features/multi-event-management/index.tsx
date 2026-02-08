'use client'

/**
 * Multi-Event Management Feature
 * Manage multiple concurrent events under one organisation.
 * Available on: Command, Enterprise plans
 */

import React, { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useEventContext } from '@/contexts/EventContext'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  CalendarDaysIcon,
  MapPinIcon,
  ArrowsRightLeftIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline'

interface EventRow {
  id: string
  event_name: string
  venue_name: string
  event_type: string
  event_date: string | null
  is_current: boolean
}

export default function MultiEventManagement() {
  const { eventId, switchEvent } = useEventContext()
  const [events, setEvents] = useState<EventRow[]>([])
  const [loading, setLoading] = useState(true)
  const [switching, setSwitching] = useState<string | null>(null)

  const fetchEvents = useCallback(async () => {
    try {
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
        .select('id, event_name, venue_name, event_type, event_date, is_current')
        .eq('company_id', companyId)
        .order('event_date', { ascending: false })

      if (data) setEvents(data as EventRow[])
    } catch (err) {
      console.error('MultiEventManagement: failed to fetch events', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  const handleSwitch = async (id: string) => {
    setSwitching(id)
    await switchEvent(id)
    await fetchEvents()
    setSwitching(null)
  }

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-8 w-64 bg-muted rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Multi-Event Management</h1>
        <p className="text-sm text-muted-foreground mt-1">
          View and switch between all events in your organisation.
        </p>
      </div>

      {events.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <CalendarDaysIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No events found</h3>
            <p className="text-sm text-muted-foreground">Create an event first from the dashboard.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {events.map((ev) => {
            const isActive = ev.id === eventId
            return (
              <Card
                key={ev.id}
                className={isActive ? 'ring-2 ring-primary' : ''}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1 min-w-0">
                      <CardTitle className="text-base truncate">{ev.event_name}</CardTitle>
                      <CardDescription className="flex items-center gap-1">
                        <MapPinIcon className="h-3.5 w-3.5" />
                        {ev.venue_name}
                      </CardDescription>
                    </div>
                    {isActive && (
                      <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 shrink-0">
                        Active
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <CalendarDaysIcon className="h-4 w-4" />
                      {ev.event_date
                        ? new Date(ev.event_date).toLocaleDateString()
                        : 'No date'}
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {ev.event_type}
                    </Badge>
                  </div>

                  {isActive ? (
                    <Button variant="outline" size="sm" className="w-full" disabled>
                      <CheckCircleIcon className="h-4 w-4 mr-2" />
                      Currently active
                    </Button>
                  ) : (
                    <Button
                      variant="primary"
                      size="sm"
                      className="w-full"
                      onClick={() => handleSwitch(ev.id)}
                      disabled={switching !== null}
                    >
                      <ArrowsRightLeftIcon className="h-4 w-4 mr-2" />
                      {switching === ev.id ? 'Switching...' : 'Switch to this event'}
                    </Button>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}



