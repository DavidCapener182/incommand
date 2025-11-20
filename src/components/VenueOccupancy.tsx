// @ts-nocheck
'use client'

import React, { useEffect, useState, useRef, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { Database } from '@/types/supabase'
import { BuildingOffice2Icon, ClockIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import { RealtimeChannel } from '@supabase/supabase-js'
import { useToast } from '../contexts/ToastContext'
import { predictCrowdFlow, type CrowdFlowPrediction } from '@/lib/analytics/crowdFlowPrediction'

interface Props {
  currentEventId: string | null
}

export default function VenueOccupancy({ currentEventId }: Props) {
  const [currentCount, setCurrentCount] = useState<number>(0)
  const [loading, setLoading] = useState(false) // Start with false to prevent initial flash
  const [expectedAttendance, setExpectedAttendance] = useState<number>(1000) // Initialize with default
  const [capacityToastId, setCapacityToastId] = useState<string | null>(null)
  const capacityToastIdRef = useRef<string | null>(null)
  const subscriptionRef = useRef<RealtimeChannel | null>(null)
  const lastAlertTimeRef = useRef<number>(0)
  const isCreatingToastRef = useRef<boolean>(false)
  const hasInitializedRef = useRef<boolean>(false)
  const lastKnownCountRef = useRef<number>(0) // Track last known good value
  const currentEventIdRef = useRef<string | null>(null) // Track current event ID
  const { addToast, removeToast, clearAll } = useToast()
  const [prediction, setPrediction] = useState<CrowdFlowPrediction | null>(null)
  const [showPrediction, setShowPrediction] = useState(false)

  // Store toast functions in refs to prevent dependency changes
  const addToastRef = useRef(addToast)
  const clearAllRef = useRef(clearAll)
  const removeToastRef = useRef(removeToast)
  
  // Update refs when functions change
  useEffect(() => {
    addToastRef.current = addToast
    clearAllRef.current = clearAll
    removeToastRef.current = removeToast
  }, [addToast, clearAll, removeToast])

  // Function to handle capacity alerts - use refs to avoid dependency issues
  const handleCapacityAlert = useCallback((percentage: number, count: number, expected: number) => {
    const now = Date.now();
    const timeSinceLastAlert = now - lastAlertTimeRef.current;
    
    // Debounce: Only allow alerts every 2 seconds to prevent spam
    if (timeSinceLastAlert < 2000) {
      return;
    }
    
    // ALWAYS clear all existing capacity toasts first to prevent duplicates
    clearAllRef.current();
    setCapacityToastId(null);
    capacityToastIdRef.current = null;
    
    // Show toast for 90%+ capacity
    if (percentage >= 90) {
      lastAlertTimeRef.current = now;
      
      const toastId = Math.random().toString(36).substr(2, 9)
      setCapacityToastId(toastId)
      capacityToastIdRef.current = toastId
      
      const toastData = {
        id: toastId,
        type: percentage >= 100 ? 'error' as const : 'warning' as const,
        title: percentage >= 100 ? '🚨 Venue at Full Capacity!' : '⚠️ Venue Nearing Capacity',
        message: `Current occupancy: ${count.toLocaleString()}/${expected.toLocaleString()} (${Math.round(percentage)}%)`,
        duration: 0, // Persistent toast
        urgent: percentage >= 100,
      };
      
      addToastRef.current(toastData);
    }
  }, []) // No dependencies - uses refs instead

  // Cleanup function to handle unsubscribe
  const cleanup = () => {
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe();
      subscriptionRef.current = null;
    }
  };

  useEffect(() => {
    if (!currentEventId) {
      cleanup()
      hasInitializedRef.current = false
      currentEventIdRef.current = null
      setLoading(false)
      return
    }
    
    // If event ID hasn't changed, don't re-initialize
    if (currentEventIdRef.current === currentEventId && hasInitializedRef.current) {
      return
    }
    
    // Event ID changed, update ref
    currentEventIdRef.current = currentEventId
    
    // Don't reset loading if we've already initialized for this event
    // Also, if we already have data, don't show loading state
    if (!hasInitializedRef.current) {
      // Only show loading if we don't have any data yet
      if (lastKnownCountRef.current === 0 && currentCount === 0) {
        setLoading(true)
      }
      // Preserve last known count if available
      if (lastKnownCountRef.current > 0) {
        setCurrentCount(lastKnownCountRef.current)
      }
    }
    
    // Clear any existing capacity toast when component mounts or event changes
    if (capacityToastIdRef.current) {
      removeToastRef.current(capacityToastIdRef.current);
      setCapacityToastId(null);
      capacityToastIdRef.current = null;
    }
    isCreatingToastRef.current = false;

    // Fetch initial occupancy and expected attendance
    const fetchData = async () => {
      try {
        // Get expected attendance from events table
        const { data: eventData, error: eventError } = await supabase
          .from<Database['public']['Tables']['events']['Row'], Database['public']['Tables']['events']['Update']>('events')
          .select('expected_attendance')
          .eq('id', currentEventId)
          .maybeSingle()

        if (eventError) {
          throw eventError
        }
        
        let newExpected = 0
        if (eventData?.expected_attendance) {
          newExpected = typeof eventData.expected_attendance === 'string' 
            ? parseInt(eventData.expected_attendance) 
            : eventData.expected_attendance
          setExpectedAttendance(newExpected)
        } else {
          setExpectedAttendance(1000) // Default fallback
          newExpected = 1000
        }

        // Get latest attendance count
        const { data: attendanceData, error: attendanceError } = await supabase
          .from('attendance_records')
          .select('count')
          .eq('event_id', currentEventId)
          .order('timestamp', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (attendanceError) {
          // Don't throw here, just use default values
          // Don't reset count if we already have a value
          if (lastKnownCountRef.current === 0) {
            setCurrentCount(0)
          }
          setExpectedAttendance(newExpected)
          setLoading(false)
          hasInitializedRef.current = true
          return
        }

        if (attendanceData) {
          const newCount = attendanceData.count
          setCurrentCount(newCount)
          lastKnownCountRef.current = newCount // Store the last known good value
          
          // Check capacity for initial data - use newExpected instead of expectedAttendance
          if (newExpected > 0) {
            const initialPercentage = Math.min((newCount / newExpected) * 100, 100);
            handleCapacityAlert(initialPercentage, newCount, newExpected);
            
            // Fetch predictions
            try {
              const flowPrediction = await predictCrowdFlow(supabase, currentEventId, newExpected, 60)
              setPrediction(flowPrediction)
            } catch (predError) {
              console.warn('Could not generate crowd flow prediction:', predError)
            }
          }
        } else {
          // Only set to 0 if we don't have a last known value
          if (lastKnownCountRef.current === 0) {
            setCurrentCount(0)
          }
        }
      } catch (err) {
        console.error('Error fetching occupancy data:', err)
        // Don't reset count if we have a last known value
        if (lastKnownCountRef.current === 0) {
          setCurrentCount(0)
        }
        setExpectedAttendance(1000) // Default fallback
      } finally {
        setLoading(false)
        hasInitializedRef.current = true
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
          const newRecord = payload.new as { count: number };
          if (newRecord && typeof newRecord.count === 'number') {
            setCurrentCount(prevCount => {
              // Only update if the count actually changed
              if (prevCount !== newRecord.count) {
                lastKnownCountRef.current = newRecord.count // Update last known value
                // Use functional update to get latest expectedAttendance
                setExpectedAttendance(currentExpected => {
                  const newPercentage = currentExpected > 0 ? Math.min((newRecord.count / currentExpected) * 100, 100) : 0;
                  handleCapacityAlert(newPercentage, newRecord.count, currentExpected);
                  
                  // Update predictions when count changes
                  if (currentExpected > 0) {
                    predictCrowdFlow(supabase, currentEventId, currentExpected, 60)
                      .then(setPrediction)
                      .catch(err => console.warn('Prediction update failed:', err))
                  }
                  
                  return currentExpected;
                });
                return newRecord.count;
              }
              return prevCount;
            });
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
          const updatedRecord = payload.new as { count: number };
          if (updatedRecord && typeof updatedRecord.count === 'number') {
            setCurrentCount(prevCount => {
              // Only update if the count actually changed
              if (prevCount !== updatedRecord.count) {
                lastKnownCountRef.current = updatedRecord.count // Update last known value
                // Use functional update to get latest expectedAttendance
                setExpectedAttendance(currentExpected => {
                  const newPercentage = currentExpected > 0 ? Math.min((updatedRecord.count / currentExpected) * 100, 100) : 0;
                  handleCapacityAlert(newPercentage, updatedRecord.count, currentExpected);
                  return currentExpected;
                });
                return updatedRecord.count;
              }
              return prevCount;
            });
          }
        }
      )
      .subscribe();

    fetchData();

    // Set up a fallback polling mechanism in case real-time updates fail
    // Use a longer interval to reduce flickering
    const pollForUpdates = setInterval(async () => {
      try {
        const { data: attendanceData, error } = await supabase
          .from('attendance_records')
          .select('count')
          .eq('event_id', currentEventId)
          .order('timestamp', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!error && attendanceData) {
          setCurrentCount(prev => {
            // Only update if count actually changed to prevent unnecessary re-renders
            if (attendanceData.count !== prev) {
              lastKnownCountRef.current = attendanceData.count // Update last known value
              // Use functional update to get latest expectedAttendance
              setExpectedAttendance(currentExpected => {
                // Only trigger alert if percentage changed significantly (more than 1%)
                const newPercentage = currentExpected > 0 ? Math.min((attendanceData.count / currentExpected) * 100, 100) : 0;
                const prevPercentage = currentExpected > 0 ? Math.min((prev / currentExpected) * 100, 100) : 0;
                if (Math.abs(newPercentage - prevPercentage) > 1) {
                  handleCapacityAlert(newPercentage, attendanceData.count, currentExpected);
                }
                return currentExpected;
              });
              return attendanceData.count;
            }
            return prev;
          });
        }
      } catch (err) {
        // Ignore polling errors silently
      }
    }, 120000); // Poll every 120 seconds (2 minutes) to reduce flickering

    // Cleanup on unmount or when currentEventId changes
    return () => {
      cleanup();
      clearInterval(pollForUpdates);
      hasInitializedRef.current = false;
      
      // Remove capacity toast when component unmounts or event changes
      if (capacityToastIdRef.current) {
        removeToastRef.current(capacityToastIdRef.current);
        setCapacityToastId(null);
        capacityToastIdRef.current = null;
      }
      isCreatingToastRef.current = false;
    };
      }, [currentEventId, handleCapacityAlert]); // Removed removeToast from dependencies - using ref instead


  // Calculate percentage and determine progress bar color
  const percentage = expectedAttendance > 0 ? Math.min((currentCount / expectedAttendance) * 100, 100) : 0;
  
  // Only show loading if we truly have no data and are loading
  // If we have data (even if loading is true), show the data
  const hasData = currentCount > 0 || expectedAttendance > 0
  const displayCount = (loading && !hasData) ? '...' : currentCount.toLocaleString();
  const displayExpected = (loading && !hasData) ? '...' : expectedAttendance.toLocaleString();
  const displayPercentage = (loading && !hasData) ? 0 : percentage;

  // Add a debug div that will show even if other parts fail
  if (!currentEventId) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center">
        <p className="text-sm text-gray-500">No event selected</p>
      </div>
    );
  }
  
  // Color logic: green (0-70%) → amber (70-90%) → red (90%+)
  const getProgressColor = (percent: number) => {
    if (percent >= 90) return 'bg-red-500';
    if (percent >= 70) return 'bg-amber-500';
    return 'bg-green-500';
  };

  const progressColor = getProgressColor(percentage);
  
  // Check if at critical capacity (100%)
  const isCriticalCapacity = percentage >= 100;

  // Get next prediction (10 minutes ahead)
  const nextPrediction = prediction?.predictedCounts.find(p => p.minutesAhead === 10)
  const peakPrediction = prediction?.peakPrediction
  const hasHighRisk = prediction?.predictedCounts.some(p => p.riskLevel === 'high' || p.riskLevel === 'critical')

  return (
    <div className="w-full h-full flex flex-col items-center justify-center">
      <div className="flex flex-col items-center justify-center space-y-1 w-full">
        
        <div className="text-center">
          <p className="text-lg md:text-2xl font-bold text-gray-900 dark:text-gray-100">
            {displayCount}
            <span className="text-xs md:text-base text-gray-500 dark:text-gray-100 ml-1">/ {displayExpected}</span>
          </p>
          <div className="flex items-center justify-center gap-1 mt-0.5">
            <p className="text-[10px] md:text-xs font-medium text-gray-500 dark:text-gray-100">
              Venue Occupancy
            </p>
            {hasHighRisk && (
              <ExclamationTriangleIcon className="h-3 w-3 text-amber-500" title="High risk predicted" />
            )}
          </div>
        </div>
        {expectedAttendance > 0 && (
          <div className="w-full space-y-0.5 px-3">
            <div className="flex justify-between items-center">
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
            
            {/* Next 60 Minutes Prediction */}
            {nextPrediction && !loading && (
              <div className="mt-1.5 pt-1.5 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setShowPrediction(!showPrediction)}
                  className="w-full flex items-center justify-between text-[10px] text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <ClockIcon className="h-3 w-3" />
                    <span>
                      {nextPrediction.minutesAhead}m: ~{nextPrediction.predictedCount.toLocaleString()}
                    </span>
                    {nextPrediction.riskLevel === 'critical' && (
                      <span className="text-red-500 font-semibold">⚠️</span>
                    )}
                    {nextPrediction.riskLevel === 'high' && (
                      <span className="text-amber-500">!</span>
                    )}
                  </div>
                  <span className="text-[9px]">
                    {showPrediction ? '▼' : '▶'}
                  </span>
                </button>
                
                {showPrediction && prediction && (
                  <div className="mt-1.5 space-y-1 text-[9px] text-gray-600 dark:text-gray-400">
                    {prediction.predictedCounts.slice(0, 6).map((pred) => (
                      <div key={pred.minutesAhead} className="flex items-center justify-between">
                        <span>{pred.minutesAhead}m:</span>
                        <span className={`
                          ${pred.riskLevel === 'critical' ? 'text-red-600 font-semibold' : ''}
                          ${pred.riskLevel === 'high' ? 'text-amber-600' : ''}
                          ${pred.riskLevel === 'medium' ? 'text-yellow-600' : ''}
                          ${pred.riskLevel === 'low' ? 'text-green-600' : ''}
                        `}>
                          {pred.predictedCount.toLocaleString()} ({Math.round((pred.predictedCount / expectedAttendance) * 100)}%)
                        </span>
                      </div>
                    ))}
                    {peakPrediction && (
                      <div className="pt-1 mt-1 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between font-semibold">
                          <span>Peak:</span>
                          <span className="text-amber-600">
                            {peakPrediction.count.toLocaleString()} at {new Date(peakPrediction.time).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        
      </div>
    </div>
  )
}

// Export supported event types for conditional rendering
export const supportedEventTypes = ['concert']; 
