'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import EventCreationModal from './EventCreationModal'

interface Event {
  id: string
  event_name: string
  venue_name: string
  event_type: string
  event_description?: string
  support_acts?: any[]
}

export default function CurrentEvent() {
  const [currentEvent, setCurrentEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    console.log('CurrentEvent component mounted')
    fetchCurrentEvent()
  }, [])

  const fetchCurrentEvent = async () => {
    try {
      console.log('Starting to fetch current event...')
      const { data } = await supabase
        .from('events')
        .select(`
          id,
          event_name,
          venue_name,
          event_type,
          event_description,
          support_acts
        `)
        .eq('is_current', true)
        .single()

      console.log('Raw events response:', { data })

      if (!data) {
        console.log('No current event found')
        setCurrentEvent(null)
        return
      }

      // Fix venue name capitalization
      data.venue_name = data.venue_name
        .split(' ')
        .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ')

      console.log('Setting current event:', data)
      setCurrentEvent(data as Event)
    } catch (err) {
      console.error('Unexpected error:', err)
      setError('An unexpected error occurred')
      setCurrentEvent(null)
    } finally {
      setLoading(false)
    }
  }

  const handleCloseModal = () => {
    setShowModal(false)
  }

  const handleEventCreated = async () => {
    await fetchCurrentEvent()
    setShowModal(false)
  }

  console.log('Rendering with state:', { currentEvent, loading, error, showModal })

  if (loading) {
    return (
      <div className="bg-white shadow sm:rounded-lg p-6">
        <div className="animate-pulse flex space-x-4">
          <div className="flex-1 space-y-4 py-1">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-5 py-4">
          {currentEvent ? (
            <div className="space-y-3">
              <div className="flex items-start">
                <span className="text-sm font-medium text-gray-500 w-24 pt-1">Current Event</span>
                <div>
                  <span className="text-base font-semibold text-gray-900 ml-2">
                    {currentEvent.event_name}
                  </span>
                  {currentEvent.support_acts && currentEvent.support_acts.length > 0 && (
                    <span className="text-sm font-normal text-gray-500 ml-2">
                      (+ {currentEvent.support_acts.length} support {currentEvent.support_acts.length === 1 ? 'act' : 'acts'})
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center">
                <span className="text-sm font-medium text-gray-500 w-24">Venue</span>
                <span className="text-sm font-semibold text-gray-900 ml-2">{currentEvent.venue_name}</span>
              </div>
              <div className="flex items-center">
                <span className="text-sm font-medium text-gray-500 w-24">Type</span>
                <span className="text-sm font-semibold text-gray-900 ml-2">{currentEvent.event_type}</span>
              </div>
              <div className="mt-4">
                <p className="text-sm text-gray-600 leading-relaxed">
                  {currentEvent.event_description || (() => {
                    const type = currentEvent.event_type.toLowerCase();
                    if (type.includes('concert')) {
                      return `Key crowd management focus: Monitor stage barriers and potential mosh areas. Watch for crowd surge during popular songs. Ensure clear exit paths and manage entry flow at peak times.`;
                    } else if (type.includes('comedy')) {
                      return `Crowd considerations: Manage seating transitions and interval queuing. Monitor bar areas during breaks. Standard entry/exit flow management required.`;
                    } else if (type.includes('theatre')) {
                      return `Focus areas: Coordinated seating entry/exit, especially during intermission. Monitor merchandise areas and manage cloakroom queues.`;
                    } else if (type.includes('sport')) {
                      return `Priority: Separate opposing fan sections. Enhanced monitoring at refreshment areas during breaks. Coordinate with stewards for crowd flow at key moments.`;
                    } else {
                      return `Crowd management priorities: Monitor venue capacity at key areas. Maintain clear exit routes. Regular checks of high-traffic zones required.`;
                    }
                  })()}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-900">
                No Current Event
              </h3>
              <p className="text-sm text-gray-500">
                No event is currently selected. Create a new event to get started.
              </p>
              <div>
                <button
                  onClick={() => setShowModal(true)}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-[#2A3990] hover:bg-[#1e2a6a] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2A3990]"
                >
                  Create Event
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <EventCreationModal
        isOpen={showModal && !currentEvent}
        onClose={handleCloseModal}
        onEventCreated={handleEventCreated}
      />
    </>
  )
} 