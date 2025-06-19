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
  const [showBrief, setShowBrief] = useState(false)

  useEffect(() => {
    console.log('CurrentEvent component mounted')
    fetchCurrentEvent()
  }, [])

  const fetchCurrentEvent = async () => {
    setCurrentEvent(null); // Clear any previous event info before fetching
    try {
      console.log('Starting to fetch current event...')
      const { data } = await supabase
        .from('events')
        .select('id, event_name, venue_name, event_type, event_description, support_acts, is_current, company_id')
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
                  {currentEvent.support_acts && (() => {
                    let acts = currentEvent.support_acts;
                    if (typeof acts === 'string') {
                      try {
                        acts = JSON.parse(acts);
                      } catch {
                        acts = [];
                      }
                    }
                    return Array.isArray(acts) && acts.length > 0 ? (
                    <span className="text-sm font-normal text-gray-500 ml-2">
                        {' + ' + acts.slice().reverse().map((act: any) => act.act_name).join(', ')}
                    </span>
                    ) : null;
                  })()}
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
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Security Brief</span>
                  <button
                    type="button"
                    className="md:hidden text-xs text-blue-600 underline focus:outline-none"
                    onClick={() => setShowBrief((prev) => !prev)}
                  >
                    {showBrief ? 'Hide' : 'Show'}
                  </button>
                </div>
                <div className={`${showBrief ? '' : 'hidden'} md:block`}>
                  <p className="text-sm text-gray-600 leading-relaxed mt-2">
                    {(currentEvent.event_description || (() => {
                      const type = currentEvent.event_type.toLowerCase();
                      if (type.includes('concert')) {
                        return `Monitor stage barriers and crowd surges, especially during popular songs. Ensure clear exits and manage entry flow at peak times.`;
                      } else if (type.includes('comedy')) {
                        return `Manage seating transitions and interval queues. Monitor bar areas during breaks.`;
                      } else if (type.includes('theatre')) {
                        return `Coordinate seating entry/exit and monitor merchandise and cloakroom queues.`;
                      } else if (type.includes('sport')) {
                        return `Separate opposing fans and monitor refreshment areas during breaks.`;
                      } else {
                        return `Monitor venue capacity and maintain clear exit routes.`;
                      }
                    })()).split(/(?<=[.!?])\s+/).slice(0,2).join(' ')}
                  </p>
                </div>
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