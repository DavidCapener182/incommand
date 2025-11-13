'use client'

/**
 * Venue Calendar Feature
 * Visual schedule of booked and available venue dates.
 * Available on: Starter, Operational, Command, Enterprise plans
 * Status: Implemented 2025-01-08
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/components/Toast'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CalendarIcon,
  MapPinIcon,
} from '@heroicons/react/24/outline'
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
  parseISO,
} from 'date-fns'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface Event {
  id: string
  event_name: string
  venue_name: string
  start_datetime: string
  end_datetime: string
  event_type: string
}

export default function VenueCalendar() {
  const { user } = useAuth()
  const { addToast } = useToast()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedVenue, setSelectedVenue] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month')

  // Fetch events
  const fetchEvents = useCallback(async () => {
    if (!user?.id) return

    try {
      // Get company_id from user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single()

      if (!profile?.company_id) {
        setLoading(false)
        return
      }

        const { data, error } = await supabase
        .from('events')
        .select('id, event_name, venue_name, start_datetime, end_datetime, event_type')
        .eq('company_id', profile.company_id)
        .order('start_datetime', { ascending: true })

        if (error) throw error
        const normalized = (data || []).map((event) => ({
          ...event,
          start_datetime: event.start_datetime || new Date().toISOString(),
          end_datetime: event.end_datetime || event.start_datetime || new Date().toISOString(),
        })) as Event[]
        setEvents(normalized)
      } catch (error) {
        console.error('Error fetching events:', error)
        addToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to load events',
      })
    } finally {
      setLoading(false)
    }
    }, [user?.id, addToast])

  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  // Get unique venues
  const venues = useMemo(() => {
    const uniqueVenues = Array.from(new Set(events.map((e) => e.venue_name)))
    return uniqueVenues.sort()
  }, [events])

  // Filter events by venue
  const filteredEvents = useMemo(() => {
    if (selectedVenue === 'all') return events
    return events.filter((e) => e.venue_name === selectedVenue)
  }, [events, selectedVenue])

  // Get events for a specific date
  const getEventsForDate = (date: Date) => {
    return filteredEvents.filter((event) => {
      if (!event.start_datetime) return false
      try {
        const startDate = parseISO(event.start_datetime.split('T')[0])
        return isSameDay(startDate, date)
      } catch {
        return false
      }
    })
  }

  // Check if date has events
  const hasEvents = (date: Date) => {
    return getEventsForDate(date).length > 0
  }

  // Check if date is booked (has events)
  const isBooked = (date: Date) => {
    return hasEvents(date)
  }

  // Calendar grid for month view
  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 }) // Monday
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Venue Calendar</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Visual schedule of booked and available venue dates
          </p>
        </div>
      </div>

      {/* Filters and Controls */}
      <div className="flex items-center gap-4 flex-wrap">
        <Select value={selectedVenue} onValueChange={setSelectedVenue}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by venue" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Venues</SelectItem>
            {venues.map((venue) => (
              <SelectItem key={venue} value={venue}>
                {venue}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentDate(subMonths(currentDate, 1))}
          >
            <ChevronLeftIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentDate(new Date())}
          >
            Today
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentDate(addMonths(currentDate, 1))}
          >
            <ChevronRightIcon className="h-4 w-4" />
          </Button>
        </div>

        <div className="text-lg font-semibold text-gray-900 dark:text-white">
          {format(currentDate, 'MMMM yyyy')}
        </div>
      </div>

      {/* Calendar Grid */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-7 gap-2">
            {/* Week day headers */}
            {weekDays.map((day) => (
              <div
                key={day}
                className="text-center text-sm font-semibold text-gray-600 dark:text-gray-400 py-2"
              >
                {day}
              </div>
            ))}

            {/* Calendar days */}
            {calendarDays.map((day, idx) => {
              const dayEvents = getEventsForDate(day)
              const isCurrentMonth = isSameMonth(day, currentDate)
              const isCurrentDay = isToday(day)
              const booked = isBooked(day)

              return (
                <div
                  key={idx}
                  className={`
                    min-h-[100px] p-2 border rounded-lg
                    ${isCurrentMonth ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-900/50'}
                    ${isCurrentDay ? 'ring-2 ring-blue-500' : ''}
                    ${booked ? 'border-green-300 bg-green-50 dark:bg-green-900/20' : 'border-gray-200 dark:border-gray-700'}
                    hover:shadow-md transition-shadow
                  `}
                >
                  <div
                    className={`
                      text-sm font-medium mb-1
                      ${isCurrentMonth ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-600'}
                      ${isCurrentDay ? 'text-blue-600 dark:text-blue-400' : ''}
                    `}
                  >
                    {format(day, 'd')}
                  </div>

                  {dayEvents.length > 0 && (
                    <div className="space-y-1">
                      {dayEvents.slice(0, 2).map((event) => (
                        <div
                          key={event.id}
                          className="text-xs p-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded truncate"
                          title={`${event.event_name} - ${event.venue_name}`}
                        >
                          {event.event_name}
                        </div>
                      ))}
                      {dayEvents.length > 2 && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          +{dayEvents.length - 2} more
                        </div>
                      )}
                    </div>
                  )}

                  {!booked && isCurrentMonth && (
                    <div className="text-xs text-gray-400 dark:text-gray-600 mt-1">
                      Available
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <div className="flex items-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-green-300 bg-green-50 dark:bg-green-900/20 rounded"></div>
          <span className="text-gray-600 dark:text-gray-400">Booked</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded"></div>
          <span className="text-gray-600 dark:text-gray-400">Available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-blue-500 rounded"></div>
          <span className="text-gray-600 dark:text-gray-400">Today</span>
        </div>
      </div>

      {/* Upcoming Events List */}
      {filteredEvents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filteredEvents
                .filter((event) => {
                  if (!event.start_datetime) return false
                  try {
                    const startDate = parseISO(event.start_datetime.split('T')[0])
                    return startDate >= new Date()
                  } catch {
                    return false
                  }
                })
                .slice(0, 10)
                .map((event) => (
                  <div
                    key={event.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900 dark:text-white">
                        {event.event_name}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mt-1">
                        <div className="flex items-center gap-1">
                          <MapPinIcon className="h-4 w-4" />
                          <span>{event.venue_name}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <CalendarIcon className="h-4 w-4" />
                          <span>
                            {event.start_datetime
                              ? format(parseISO(event.start_datetime), 'MMM d, yyyy')
                              : 'Date TBD'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Badge variant="outline">{event.event_type}</Badge>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
