'use client'

import React, { useEffect, useState, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { BuildingOffice2Icon } from '@heroicons/react/24/outline'
import { RealtimeChannel } from '@supabase/supabase-js'
import { useToast } from './Toast'

interface Props {
  currentEventId: string | null
}

export default function VenueOccupancy({ currentEventId }: Props) {
  const [currentCount, setCurrentCount] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [expectedAttendance, setExpectedAttendance] = useState<number>(0)
  const [capacityToastId, setCapacityToastId] = useState<string | null>(null)
  const subscriptionRef = useRef<RealtimeChannel | null>(null)
  const { addToast, removeToast } = useToast()

  // Function to handle capacity alerts
  const handleCapacityAlert = (percentage: number, count: number, expected: number) => {
    console.log('🔔 Capacity alert check:', { percentage, count, expected, capacityToastId });
    
    // Remove existing capacity toast if present
    if (capacityToastId) {
      console.log('🗑️ Removing existing capacity toast:', capacityToastId);
      removeToast(capacityToastId)
      setCapacityToastId(null)
    }

    // Show toast for 90%+ capacity
    if (percentage >= 90) {
      console.log('🚨 Triggering capacity alert:', { percentage, count, expected });
      const toastId = Math.random().toString(36).substr(2, 9)
      setCapacityToastId(toastId)
      
      addToast({
        id: toastId,
        type: percentage >= 100 ? 'error' : 'warning',
        title: percentage >= 100 ? '🚨 Venue at Full Capacity!' : '⚠️ Venue Nearing Capacity',
        message: `Current occupancy: ${count.toLocaleString()}/${expected.toLocaleString()} (${Math.round(percentage)}%)`,
        duration: 0, // Persistent toast
        urgent: percentage >= 100, // Urgent for full capacity
      })
      
      console.log('✅ Capacity toast added:', toastId);
    } else {
      console.log('ℹ️ No capacity alert needed:', { percentage, threshold: 90 });
    }
  }

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
    
    // Set loading only once at the start
    setLoading(true)

    // Fetch initial occupancy and expected attendance
    const fetchData = async () => {
      try {
        // Get expected attendance from events table
        const { data: eventData, error: eventError } = await supabase
          .from('events')
          .select('expected_attendance')
          .eq('id', currentEventId)
          .single()

        if (eventError) throw eventError
        
        let newExpected = 0
        if (eventData?.expected_attendance) {
          newExpected = parseInt(eventData.expected_attendance)
          setExpectedAttendance(newExpected)
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
          
          // Check capacity for initial data - use newExpected instead of expectedAttendance
          if (newExpected > 0) {
            const initialPercentage = Math.min((attendanceData.count / newExpected) * 100, 100);
            handleCapacityAlert(initialPercentage, attendanceData.count, newExpected);
          }
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
            
            // Check capacity after count update
            const newPercentage = expectedAttendance > 0 ? Math.min((newRecord.count / expectedAttendance) * 100, 100) : 0;
            handleCapacityAlert(newPercentage, newRecord.count, expectedAttendance);
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
            
            // Check capacity after count update
            const newPercentage = expectedAttendance > 0 ? Math.min((updatedRecord.count / expectedAttendance) * 100, 100) : 0;
            handleCapacityAlert(newPercentage, updatedRecord.count, expectedAttendance);
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
              
              // Check capacity after count update
              const newPercentage = expectedAttendance > 0 ? Math.min((attendanceData.count / expectedAttendance) * 100, 100) : 0;
              handleCapacityAlert(newPercentage, attendanceData.count, expectedAttendance);
              
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
      
      // Remove capacity toast when component unmounts or event changes
      if (capacityToastId) {
        removeToast(capacityToastId);
        setCapacityToastId(null);
      }
    };
      }, [currentEventId, expectedAttendance, capacityToastId, removeToast]);

  console.log('🎯 VenueOccupancy render:', { 
    loading, 
    currentCount, 
    expectedAttendance, 
    currentEventId,
    percentage: expectedAttendance > 0 ? Math.min((currentCount / expectedAttendance) * 100, 100) : 0
  });

  // Don't show loading skeleton - instead show the component with loading state
  const displayCount = loading ? '...' : currentCount.toLocaleString();
  const displayExpected = loading ? '...' : expectedAttendance.toLocaleString();
  const displayPercentage = loading ? 0 : percentage;

  // Add a debug div that will show even if other parts fail
  if (!currentEventId) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center">
        <p className="text-sm text-gray-500">No event selected</p>
      </div>
    );
  }

  // Calculate percentage and determine progress bar color
  const percentage = expectedAttendance > 0 ? Math.min((currentCount / expectedAttendance) * 100, 100) : 0;
  
  // Color logic: green (0-70%) → amber (70-90%) → red (90%+)
  const getProgressColor = (percent: number) => {
    if (percent >= 90) return 'bg-red-500';
    if (percent >= 70) return 'bg-amber-500';
    return 'bg-green-500';
  };

  const progressColor = getProgressColor(percentage);
  
  // Check if at critical capacity (100%)
  const isCriticalCapacity = percentage >= 100;

  return (
    <div className="w-full h-full flex flex-col items-center justify-center">
      <div className="flex flex-col items-center justify-center space-y-1 w-full">
        {/* Component Status Indicator */}
        <div className="text-[8px] text-blue-600 bg-blue-100 px-1 rounded mb-1">
          VenueOccupancy Active
        </div>
        
        <div className="text-center">
          <p className="text-lg md:text-2xl font-bold text-gray-900 dark:text-gray-100">
            {displayCount}
            <span className="text-xs md:text-base text-gray-500 dark:text-gray-100 ml-1">/ {displayExpected}</span>
          </p>
          <p className="text-[10px] md:text-xs font-medium text-gray-500 dark:text-gray-100 mt-0.5">
            Venue Occupancy
          </p>
          {loading && (
            <div className="mt-1">
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            </div>
          )}
        </div>
        {expectedAttendance > 0 && (
          <div className="w-full space-y-0.5">
            <div className="flex justify-between items-center px-1">
              <span
                className={`text-[10px] font-medium ${isCriticalCapacity ? 'text-red-500 animate-pulse font-bold' : currentCount > expectedAttendance ? 'text-red-500' : currentCount >= expectedAttendance * 0.9 ? 'text-amber-500' : currentCount >= expectedAttendance * 0.7 ? 'text-amber-500' : 'text-green-500'}`}
              >
                {Math.round(displayPercentage)}%
              </span>
              {currentCount > expectedAttendance && (
                <span className="text-[10px] font-medium text-red-500">
                  Over Expected
                </span>
              )}
            </div>
            <div className={`w-full rounded-full h-2 ${isCriticalCapacity ? 'bg-red-100 dark:bg-red-900/30' : 'bg-gray-100 dark:bg-gray-700'} ${isCriticalCapacity ? 'border-2 border-red-300 dark:border-red-600' : ''}`}>
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${progressColor} ${isCriticalCapacity ? 'animate-pulse' : ''}`}
                style={{ width: `${displayPercentage}%` }}
              />
            </div>
          </div>
        )}
        
        {/* Debug Section - Remove in production */}
        <div className="mt-2 p-1 bg-gray-100 rounded text-xs max-h-20 overflow-y-auto">
          <div className="text-gray-600 mb-1 text-[10px]">Debug:</div>
          <div className="text-[8px]">C:{currentCount} E:{expectedAttendance} P:{Math.round(percentage)}%</div>
          <div className="text-[8px]">Toast: {capacityToastId ? 'Yes' : 'No'}</div>
          <button
            onClick={() => {
              console.log('🧪 Manual capacity alert test');
              handleCapacityAlert(percentage, currentCount, expectedAttendance);
            }}
            className="mt-1 px-1 py-0.5 bg-blue-500 text-white rounded text-[8px] hover:bg-blue-600"
          >
            Test
          </button>
        </div>
      </div>
    </div>
  )
} 
