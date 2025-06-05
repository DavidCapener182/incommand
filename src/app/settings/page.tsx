'use client'

import React, { useEffect, useState } from 'react'
import Navigation from '../../components/Navigation'
import { supabase } from '../../lib/supabase'
import SupabaseTest from '../../components/SupabaseTest'

interface Event {
  id: string
  event_name: string
  start_datetime: string
  end_datetime: string
  is_current: boolean
}

export default function SettingsPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('start_datetime', { ascending: false })

      if (error) throw error
      setEvents(data || [])
    } catch (error) {
      console.error('Error fetching events:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEvents()
  }, [])

  const setCurrentEvent = async (eventId: string) => {
    try {
      const { error } = await supabase
        .from('events')
        .update({ is_current: true })
        .eq('id', eventId)

      if (error) throw error
      fetchEvents() // Refresh the list
    } catch (error) {
      console.error('Error setting current event:', error)
    }
  }

  const formatDateRange = (start: string, end: string) => {
    const startDate = new Date(start)
    const endDate = new Date(end)
    
    return `${startDate.toLocaleDateString('en-GB')} to ${endDate.toLocaleDateString('en-GB')}`
  }

  return (
    <main>
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* System Status Section */}
          <div>
            <h2 className="text-2xl font-bold mb-4">System Status</h2>
            <SupabaseTest />
          </div>

          {/* Past Events Section */}
          <div>
            <h2 className="text-2xl font-bold mb-4">Past Events</h2>
            {loading ? (
              <p className="text-gray-600">Loading events...</p>
            ) : events.length > 0 ? (
              <div className="space-y-4">
                {events.map(event => (
                  <div
                    key={event.id}
                    className="bg-white shadow rounded-lg p-4 flex justify-between items-center"
                  >
                    <div>
                      <h3 className="text-lg font-semibold">{event.event_name}</h3>
                      <p className="text-gray-600">
                        {formatDateRange(event.start_datetime, event.end_datetime)}
                      </p>
                    </div>
                    <div className="flex items-center space-x-4">
                      {event.is_current ? (
                        <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                          Current
                        </span>
                      ) : (
                        <button
                          onClick={() => setCurrentEvent(event.id)}
                          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                        >
                          Set as Current
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600">No events found</p>
            )}
          </div>
        </div>
      </div>
    </main>
  )
} 