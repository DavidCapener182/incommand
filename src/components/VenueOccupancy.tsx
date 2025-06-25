'use client'

import React, { useEffect, useState, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { BuildingOffice2Icon } from '@heroicons/react/24/outline'
import { RealtimeChannel } from '@supabase/supabase-js'

interface Props {
  currentEventId: string | null
}

export default function VenueOccupancy({ currentEventId }: Props) {
  const [currentCount, setCurrentCount] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [expectedAttendance, setExpectedAttendance] = useState<number>(0)
  const subscriptionRef = useRef<RealtimeChannel | null>(null)

  // Cleanup function to handle unsubscribe
  const cleanup = () => {
    if (subscriptionRef.current) {
      console.log('Cleaning up subscription');
      subscriptionRef.current.unsubscribe();
      subscriptionRef.current = null;
    }
  };

  useEffect(() => {
    if (!currentEventId) {
      console.log('No currentEventId provided')
      cleanup()
      return
    }

    console.log('Setting up venue occupancy for event:', currentEventId)

    // Fetch initial occupancy and expected attendance
    const fetchData = async () => {
      setLoading(true)
      try {
        // Get expected attendance from events table
        const { data: eventData, error: eventError } = await supabase
          .from('events')
          .select('expected_attendance')
          .eq('id', currentEventId)
          .single()

        if (eventError) throw eventError
        if (eventData?.expected_attendance) {
          setExpectedAttendance(parseInt(eventData.expected_attendance))
        }

        // Get latest attendance count
        const { data: attendanceData, error: attendanceError } = await supabase
          .from('attendance_records')
          .select('count')
          .eq('event_id', currentEventId)
          .order('timestamp', { ascending: false })
          .limit(1)
          .single()

        if (attendanceError && attendanceError.code !== 'PGRST116') {
          throw attendanceError
        }

        if (attendanceData) {
          setCurrentCount(attendanceData.count)
        } else {
          setCurrentCount(0) // Start with 0 actual attendance
        }
      } catch (err) {
        console.error('Error fetching occupancy data:', err)
        setCurrentCount(0)
        setExpectedAttendance(0)
      } finally {
        setLoading(false)
      }
    }

    // Clean up any existing subscription before creating a new one
    cleanup()

    // Set up real-time subscription
    subscriptionRef.current = supabase
      .channel(`attendance_changes_${currentEventId}_${Date.now()}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'attendance_records',
          filter: `event_id=eq.${currentEventId}`
        },
        (payload) => {
          console.log('🔥 Attendance INSERT received:', payload);
          const newRecord = payload.new as { count: number };
          if (newRecord && typeof newRecord.count === 'number') {
            console.log('🔥 Updating venue occupancy from', currentCount, 'to', newRecord.count);
            setCurrentCount(newRecord.count);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'attendance_records',
          filter: `event_id=eq.${currentEventId}`
        },
        (payload) => {
          console.log('🔥 Attendance UPDATE received:', payload);
          const updatedRecord = payload.new as { count: number };
          if (updatedRecord && typeof updatedRecord.count === 'number') {
            console.log('🔥 Updating venue occupancy from', currentCount, 'to', updatedRecord.count);
            setCurrentCount(updatedRecord.count);
          }
        }
      )
      .subscribe((status) => {
        console.log('🔥 Subscription status:', status);
      });

    fetchData();

    // Set up a fallback polling mechanism in case real-time updates fail
    const pollForUpdates = setInterval(async () => {
      try {
        const { data: attendanceData, error } = await supabase
          .from('attendance_records')
          .select('count')
          .eq('event_id', currentEventId)
          .order('timestamp', { ascending: false })
          .limit(1)
          .single();

        if (!error && attendanceData) {
          setCurrentCount(prev => {
            if (attendanceData.count !== prev) {
              console.log('🔄 Polling found new attendance count:', attendanceData.count, '(was:', prev, ')');
              return attendanceData.count;
            }
            return prev;
          });
        }
      } catch (err) {
        // Ignore polling errors
      }
    }, 30000); // Poll every 30 seconds instead of 5 to reduce flashing

    // Cleanup on unmount or when currentEventId changes
    return () => {
      cleanup();
      clearInterval(pollForUpdates);
    };
  }, [currentEventId]);

  console.log('Render state:', { loading, currentCount, expectedAttendance });

  if (loading) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center">
        <div className="animate-pulse space-y-4 w-full">
          <div className="h-12 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </div>
      </div>
    )
  }

  // Add a debug div that will show even if other parts fail
  if (!currentEventId) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center">
        <p className="text-sm text-gray-500">No event selected</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col items-center justify-center">
      <div className="flex flex-col items-center justify-center space-y-1 w-full">
        <div className="text-center">
          <p className="text-lg md:text-2xl font-bold text-gray-900">
            {currentCount.toLocaleString()}
            <span className="text-xs md:text-base text-gray-500 ml-1">/ {expectedAttendance.toLocaleString()}</span>
          </p>
          <p className="text-[10px] md:text-xs font-medium text-gray-500 mt-0.5">
            Venue Occupancy
          </p>
        </div>
        {expectedAttendance > 0 && (
          <div className="w-full space-y-0.5">
            <div className="flex justify-between items-center px-1">
              <span className="text-[10px] font-medium" style={{ 
                color: currentCount > expectedAttendance ? '#ef4444' : 
                       currentCount >= expectedAttendance * 0.9 ? '#f97316' : 
                       '#2A3990'
              }}>
                {Math.round((currentCount / expectedAttendance) * 100)}%
              </span>
              {currentCount > expectedAttendance && (
                <span className="text-[10px] font-medium text-red-500">
                  Over Expected
                </span>
              )}
            </div>
            <div className="w-full bg-gray-100 rounded-full h-1">
              <div 
                className="h-1 rounded-full transition-all duration-300" 
                style={{ 
                  width: `${Math.min(Math.round((currentCount / expectedAttendance) * 100), 100)}%`,
                  backgroundColor: currentCount > expectedAttendance ? '#ef4444' : 
                                 currentCount >= expectedAttendance * 0.9 ? '#f97316' : 
                                 '#2A3990'
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 
