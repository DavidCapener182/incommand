'use client'

import React, { useState, useEffect, useRef } from 'react'
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

interface CurrentEventProps {
  currentTime?: string;
  currentEvent: Event | null;
  loading: boolean;
  error: string | null;
  onEventCreated: () => void;
}

export default function CurrentEvent({ 
  currentTime,
  currentEvent,
  loading,
  error,
  onEventCreated,
}: CurrentEventProps) {
  const [showModal, setShowModal] = useState(false)
  const [isBriefExpanded, setBriefExpanded] = useState(false)
  const [isBriefOverflowing, setBriefOverflowing] = useState(false)
  const briefRef = useRef<HTMLParagraphElement>(null)

  useEffect(() => {
    if (currentEvent && briefRef.current) {
      // Check for overflow only when not expanded
      if (!isBriefExpanded) {
        setBriefOverflowing(briefRef.current.scrollHeight > briefRef.current.clientHeight);
      } else {
        // When expanded, we can assume it was overflowing before, so keep the button
        setBriefOverflowing(true);
      }
    }
  }, [currentEvent, isBriefExpanded]);

  const handleCloseModal = () => {
    setShowModal(false)
  }

  const handleEventCreated = () => {
    onEventCreated();
    setShowModal(false)
  }

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
              <div className="flex items-start justify-between">
              <div className="flex items-start">
                  <span className="text-sm font-medium text-gray-500 w-24 pt-1 md:hidden">Event</span>
                  <span className="hidden md:inline text-sm font-medium text-gray-500 w-24 pt-1">Current Event</span>
                <div>
                  <span className="text-base font-semibold text-gray-900 ml-2">
                    {currentEvent.event_name}
                  </span>
                    <div className="hidden md:inline">
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
                </div>
                <div className="md:hidden">
                  {currentTime && (
                    <span className="text-base font-bold text-gray-900">{currentTime}</span>
                  )}
                </div>
              </div>
              <div className="hidden md:block">
                <>
              <div className="flex items-center">
                <span className="text-sm font-medium text-gray-500 w-24">Venue</span>
                <span className="text-sm font-semibold text-gray-900 ml-2">{currentEvent.venue_name}</span>
              </div>
              <div className="flex items-center">
                <span className="text-sm font-medium text-gray-500 w-24">Type</span>
                <span className="text-sm font-semibold text-gray-900 ml-2">{currentEvent.event_type}</span>
              </div>
              <div className="mt-4">
                <span className="text-sm font-medium text-gray-700">Security Brief</span>
                <p
                  ref={briefRef}
                  className={`text-sm text-gray-600 leading-relaxed mt-2 ${!isBriefExpanded ? 'line-clamp-3' : ''}`}
                >
                  {(currentEvent.event_description || (() => {
                    const type = currentEvent.event_type.toLowerCase();
                    if (type.includes('concert')) {
                      return `Monitor stage barriers and crowd surges, especially during popular songs. Ensure clear exits and manage entry flow at peak times. Previous incidents involving Blink-182 concerts have included crowd surfing, mosh pits, and occasional instances of unruly behavior. Co-op Live has a history of successfully managing large events but has experienced occasional challenges with crowd control during high-energy performances.`;
                    } else if (type.includes('comedy')) {
                      return `Manage seating transitions and interval queues. Monitor bar areas during breaks.`;
                    } else if (type.includes('theatre')) {
                      return `Coordinate seating entry/exit and monitor merchandise and cloakroom queues.`;
                    } else if (type.includes('sport')) {
                      return `Separate opposing fans and monitor refreshment areas during breaks.`;
                    } else {
                      return `Monitor venue capacity and maintain clear exit routes.`;
                    }
                  })())}
                </p>
                {(isBriefOverflowing || isBriefExpanded) && (
                  <button
                    onClick={() => setBriefExpanded(!isBriefExpanded)}
                    className="text-sm text-blue-600 hover:underline mt-1"
                  >
                    {isBriefExpanded ? 'Show less' : 'Show more'}
                  </button>
                )}
                  </div>
                </>
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