'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { logger } from '../lib/logger'
import { EventType, getEventStrategy } from '../lib/strategies/eventStrategies'

interface EventContextType {
  eventId: string | null
  eventType: EventType | null
  eventData: any | null
  loading: boolean
  error: string | null
  refreshEvent: () => Promise<void>
}

const EventContext = createContext<EventContextType>({
  eventId: null,
  eventType: null,
  eventData: null,
  loading: true,
  error: null,
  refreshEvent: async () => {}
})

export function EventProvider({ children }: { children: React.ReactNode }) {
  const [eventId, setEventId] = useState<string | null>(null)
  const [eventType, setEventType] = useState<EventType | null>(null)
  const [eventData, setEventData] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCurrentEvent = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch current event
      const { data: event, error: eventError } = await supabase
        .from('events')
        .select('*, event_name, venue_name, event_type, event_description, support_acts')
        .eq('is_current', true)
        .single()

      if (eventError) {
        logger.error('Failed to fetch current event', eventError, { 
          component: 'EventContext', 
          action: 'fetchCurrentEvent' 
        })
        setError('Failed to load current event')
        setEventId(null)
        setEventType(null)
        setEventData(null)
        return
      }

      if (event) {
        setEventId(event.id)
        // Normalize event type to lowercase for consistency
        const detectedEventType = (event.event_type?.toLowerCase() as EventType) || 'concert'
        setEventType(detectedEventType)
        setEventData(event)
        logger.debug('Current event loaded', { 
          component: 'EventContext', 
          action: 'fetchCurrentEvent',
          eventId: event.id,
          eventType: event.event_type
        })
      } else {
        setEventId(null)
        setEventType(null)
        setEventData(null)
      }
    } catch (err) {
      logger.error('Unexpected error fetching current event', err, { 
        component: 'EventContext', 
        action: 'fetchCurrentEvent' 
      })
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }, [])

  const refreshEvent = useCallback(async () => {
    await fetchCurrentEvent()
  }, [fetchCurrentEvent])

  useEffect(() => {
    fetchCurrentEvent()
  }, [fetchCurrentEvent])

  return (
    <EventContext.Provider value={{
      eventId,
      eventType,
      eventData,
      loading,
      error,
      refreshEvent
    }}>
      {children}
    </EventContext.Provider>
  )
}

export const useEventContext = () => {
  const context = useContext(EventContext)
  if (context === undefined) {
    throw new Error('useEventContext must be used within an EventProvider')
  }
  return context
}

// Hook to get event strategy based on current event type
export const useEventStrategy = () => {
  const { eventType } = useEventContext()
  return getEventStrategy(eventType || 'concert')
}
