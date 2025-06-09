'use client'

import React, { useEffect, useState } from 'react'
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
  const [showEndEventConfirm, setShowEndEventConfirm] = useState(false)
  const [showReactivateConfirm, setShowReactivateConfirm] = useState<string | null>(null)

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
      // First, set all events to not current
      await supabase
        .from('events')
        .update({ is_current: false })
        .neq('id', 'dummy')

      // Then set the selected event as current
      const { error } = await supabase
        .from('events')
        .update({ 
          is_current: true,
          end_datetime: null // Clear the end datetime when reactivating
        })
        .eq('id', eventId)

      if (error) throw error
      setShowReactivateConfirm(null)
      fetchEvents() // Refresh the list
    } catch (error) {
      console.error('Error setting current event:', error)
    }
  }

  const handleEndEvent = async () => {
    if (!currentEvent) return

    try {
      const { error } = await supabase
        .from('events')
        .update({ 
          is_current: false,
          end_datetime: new Date().toISOString()
        })
        .eq('id', currentEvent.id)

      if (error) throw error
      
      setShowEndEventConfirm(false)
      fetchEvents() // Refresh the list
    } catch (err) {
      console.error('Error ending event:', err)
    }
  }

  const formatDateRange = (start: string, end: string | null) => {
    const startDate = new Date(start)
    const endDate = end ? new Date(end) : null
    
    if (!endDate) {
      return `Started ${startDate.toLocaleDateString('en-GB')}`
    }
    return `${startDate.toLocaleDateString('en-GB')} to ${endDate.toLocaleDateString('en-GB')}`
  }

  const currentEvent = events.find(event => event.is_current)
  const pastEvents = events.filter(event => !event.is_current)

  return (
    <main>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* System Status Section */}
          <div>
            <h2 className="text-2xl font-bold mb-4">System Status</h2>
            <SupabaseTest />
          </div>

          {/* Current Event Section */}
          <div>
            <h2 className="text-2xl font-bold mb-4">Current Event</h2>
            {currentEvent ? (
              <div className="bg-white shadow rounded-lg p-4 mb-4">
                <h3 className="text-lg font-semibold">{currentEvent.event_name}</h3>
                <p className="text-gray-600">
                  {formatDateRange(currentEvent.start_datetime, currentEvent.end_datetime)}
                </p>
                <span className="inline-block mt-2 px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                  Active Event
                </span>
                <button
                  onClick={() => setShowEndEventConfirm(true)}
                  className="ml-4 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
                >
                  End Event
                </button>
              </div>
            ) : (
              <p className="text-gray-600">No current event found.</p>
            )}
          </div>

          {/* Past Events Section */}
          <div>
            <h2 className="text-2xl font-bold mb-4">Past Events</h2>
            {loading ? (
              <p className="text-gray-600">Loading events...</p>
            ) : pastEvents.length > 0 ? (
              <div className="space-y-4">
                {pastEvents.map(event => (
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
                      <button
                        onClick={() => setShowReactivateConfirm(event.id)}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                      >
                        Reactivate Event
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600">No past events found</p>
            )}
          </div>
        </div>
      </div>

      {/* End Event Confirmation Modal */}
      {showEndEventConfirm && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">End Current Event?</h3>
            <p className="text-sm text-gray-500 mb-4">
              Are you sure you want to end {currentEvent?.event_name}? This will move it to past events.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowEndEventConfirm(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleEndEvent}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
              >
                End Event
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reactivate Event Confirmation Modal */}
      {showReactivateConfirm && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Reactivate Event?</h3>
            <p className="text-sm text-gray-500 mb-4">
              Are you sure you want to reactivate {events.find(e => e.id === showReactivateConfirm)?.event_name}? 
              {currentEvent && " This will end the current event."}
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowReactivateConfirm(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={() => setCurrentEvent(showReactivateConfirm)}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
              >
                Reactivate
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
} 