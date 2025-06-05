'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { BuildingOffice2Icon } from '@heroicons/react/24/outline'

interface Event {
  id: string
  expected_attendance: number
}

export default function VenueOccupancy() {
  const [currentCount, setCurrentCount] = useState<number>(0)
  const [expectedAttendance, setExpectedAttendance] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentEventId, setCurrentEventId] = useState<string | null>(null)

  useEffect(() => {
    fetchCurrentEventAndOccupancy()

    // Set up real-time subscription for venue_occupancy updates
    const subscription = supabase
      .channel('venue_occupancy_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'venue_occupancy',
          filter: currentEventId ? `event_id=eq.${currentEventId}` : undefined
        },
        (payload) => {
          console.log('Venue occupancy update:', payload)
          if (payload.new) {
            setCurrentCount(payload.new.current_count || 0)
          }
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [currentEventId])

  const fetchCurrentEventAndOccupancy = async () => {
    try {
      // First get the current event
      const { data: event } = await supabase
        .from('events')
        .select('id, expected_attendance')
        .eq('is_current', true)
        .single()

      if (event) {
        setCurrentEventId(event.id)
        setExpectedAttendance(event.expected_attendance)

        // Then get the current occupancy
        const { data: occupancy } = await supabase
          .from('venue_occupancy')
          .select('current_count')
          .eq('event_id', event.id)
          .single()

        if (occupancy) {
          setCurrentCount(occupancy.current_count || 0)
        }
      }
    } catch (err) {
      console.error('Error fetching venue occupancy:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white shadow sm:rounded-lg">
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-12 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white shadow sm:rounded-lg">
      <div className="p-4">
        <div className="flex flex-col items-center justify-center space-y-1">
          <div className="text-[#2A3990] w-8 h-8">
            <BuildingOffice2Icon className="w-full h-full" />
          </div>
          <p className="text-4xl font-bold text-gray-900">
            {currentCount}{expectedAttendance ? ` / ${expectedAttendance}` : ''}
          </p>
          <h3 className="text-sm font-medium text-gray-500">
            Venue Occupancy
            {expectedAttendance && currentCount > 0 && (
              <span className="text-sm ml-2">
                ({Math.round((currentCount / expectedAttendance) * 100)}%)
              </span>
            )}
          </h3>
          {expectedAttendance && expectedAttendance > 0 && (
            <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
              <div 
                className="bg-[#2A3990] h-1.5 rounded-full transition-all duration-300" 
                style={{ 
                  width: `${Math.min(Math.round((currentCount / expectedAttendance) * 100), 100)}%`,
                  backgroundColor: currentCount > expectedAttendance ? '#ef4444' : '#2A3990'
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 