'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { logger } from '../lib/logger'
import { EventType, getEventStrategy } from '../lib/strategies/eventStrategies'
import type { Database } from '@/types/supabase'

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

      // Get user's company_id first for proper data isolation
      const { data: user } = await supabase.auth.getUser();
      
      if (!user?.user?.id) {
        logger.error('No authenticated user found', null, { 
          component: 'EventContext', 
          action: 'fetchCurrentEvent' 
        })
        setError('No authenticated user found')
        setEventId(null)
        setEventType(null)
        setEventData(null)
        return
      }

      const { data: profile, error: profileError } = await supabase
        .from<Database['public']['Tables']['profiles']['Row'], Database['public']['Tables']['profiles']['Update']>('profiles')
        .select('company_id')
        .eq('id', user.user.id)
        .single()

      if (profileError || !profile?.company_id) {
        logger.error('Failed to fetch user profile or company_id', profileError, { 
          component: 'EventContext', 
          action: 'fetchCurrentEvent' 
        })
        setError('Failed to load user profile')
        setEventId(null)
        setEventType(null)
        setEventData(null)
        return
      }

      // Fetch most recent current event with company_id filter for data isolation
      const { data: event, error: eventError } = await supabase
        .from<Database['public']['Tables']['events']['Row'], Database['public']['Tables']['events']['Update']>('events')
        .select('*, event_name, venue_name, event_type, event_description, support_acts')
        .eq('is_current', true)
        .eq('company_id', profile.company_id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

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
        // Map database event types to strategy event types
        const eventTypeMapping: Record<string, EventType> = {
          'Concert': 'concert',
          'Football': 'football',
          'Parade': 'parade', 
          'Festival': 'festival',
          'Corporate': 'concert',
          'Other': 'concert',
          'concert': 'concert',
          'football': 'football',
          'festival': 'festival',
          'parade': 'parade'
        }
        const detectedEventType = eventTypeMapping[event.event_type] || 'concert'
        console.log('🔍 EventContext: Setting event type', {
          databaseEventType: event.event_type,
          mappedEventType: detectedEventType,
          eventName: event.event_name
        })
        setEventType(detectedEventType)
        setEventData(event)
        logger.debug('Current event loaded', { 
          component: 'EventContext', 
          action: 'fetchCurrentEvent',
          eventId: event.id,
          eventType: event.event_type,
          mappedEventType: detectedEventType
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
