// @ts-nocheck
/**
 * useMatchTimer Hook
 * Calculates match timer from flow logs with support for:
 * - First half timer (0:00 to ~45:00)
 * - Half-time pause
 * - Second half timer (resumes from 45:00)
 * - Extra time display (45+1, 90+2 format)
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { FootballPhase } from '@/types/football';

export interface MatchTimerState {
  currentMinute: number;
  displayTime: string; // Formatted time (e.g., "45+1", "72", "90+3")
  phase: FootballPhase;
  isRunning: boolean;
  kickOffFirstHalf?: string;
  kickOffSecondHalf?: string;
  halfTime?: string;
  fullTime?: string;
}

export interface UseMatchTimerOptions {
  eventId: string;
  refreshInterval?: number; // Milliseconds between timer updates (default: 1000)
  enabled?: boolean; // Whether to enable real-time updates (default: true)
}

export function useMatchTimer({
  eventId,
  refreshInterval = 1000,
  enabled = true,
}: UseMatchTimerOptions): MatchTimerState {
  const [state, setState] = useState<MatchTimerState>({
    currentMinute: 0,
    displayTime: '0',
    phase: 'Pre-Match',
    isRunning: false,
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const subscriptionRef = useRef<any>(null);

  // Calculate timer state from flow logs
  const calculateTimerState = useCallback(async () => {
    if (!eventId) return;

    try {
      // Fetch all match flow logs for this event
      const { data: flowLogs, error } = await supabase
        .from('incident_logs')
        .select('incident_type, time_of_occurrence, match_minute')
        .eq('event_id', eventId)
        .eq('type', 'match_log')
        .order('time_of_occurrence', { ascending: true });

      if (error) {
        console.error('Error fetching match flow logs:', error);
        return;
      }

      if (!flowLogs || flowLogs.length === 0) {
        setState({
          currentMinute: 0,
          displayTime: '0',
          phase: 'Pre-Match',
          isRunning: false,
        });
        return;
      }

      // Find key phase markers
      const kickOffFirstHalf = flowLogs.find(
        (log) => log.incident_type === 'Kick-Off (First Half)'
      );
      const halfTime = flowLogs.find((log) => log.incident_type === 'Half-Time');
      const kickOffSecondHalf = flowLogs.find(
        (log) => log.incident_type === 'Kick-Off (Second Half)'
      );
      const fullTime = flowLogs.find((log) => log.incident_type === 'Full-Time');

      // Determine current phase
      let phase: FootballPhase = 'Pre-Match';
      let isRunning = false;
      let currentMinute = 0;

      if (fullTime) {
        phase = 'Full Time';
        isRunning = false;
        // Use the match_minute from the Full-Time log if available
        currentMinute = fullTime.match_minute || 90;
      } else if (kickOffSecondHalf) {
        phase = 'Second Half';
        isRunning = true;
        const kickOffTime = new Date(kickOffSecondHalf.time_of_occurrence).getTime();
        const now = Date.now();
        const elapsedMs = now - kickOffTime;
        const elapsedMinutes = Math.floor(elapsedMs / 60000);
        currentMinute = 45 + elapsedMinutes;
      } else if (halfTime) {
        phase = 'Half-Time';
        isRunning = false;
        // Use match_minute from Half-Time log if available, otherwise calculate
        if (halfTime.match_minute !== null) {
          currentMinute = halfTime.match_minute;
        } else if (kickOffFirstHalf) {
          const kickOffTime = new Date(kickOffFirstHalf.time_of_occurrence).getTime();
          const halfTimeTime = new Date(halfTime.time_of_occurrence).getTime();
          const elapsedMs = halfTimeTime - kickOffTime;
          currentMinute = Math.floor(elapsedMs / 60000);
        }
      } else if (kickOffFirstHalf) {
        phase = 'First Half';
        isRunning = true;
        const kickOffTime = new Date(kickOffFirstHalf.time_of_occurrence).getTime();
        const now = Date.now();
        const elapsedMs = now - kickOffTime;
        const elapsedMinutes = Math.floor(elapsedMs / 60000);
        currentMinute = elapsedMinutes;
      }

      // Format display time with extra time notation
      let displayTime: string;
      if (phase === 'First Half' && currentMinute > 45) {
        const extraTime = currentMinute - 45;
        displayTime = `45+${extraTime}`;
      } else if (phase === 'Second Half' && currentMinute > 90) {
        const extraTime = currentMinute - 90;
        displayTime = `90+${extraTime}`;
      } else {
        displayTime = currentMinute.toString();
      }

      setState({
        currentMinute,
        displayTime,
        phase,
        isRunning,
        kickOffFirstHalf: kickOffFirstHalf?.time_of_occurrence,
        kickOffSecondHalf: kickOffSecondHalf?.time_of_occurrence,
        halfTime: halfTime?.time_of_occurrence,
        fullTime: fullTime?.time_of_occurrence,
      });
    } catch (error) {
      console.error('Error calculating match timer:', error);
    }
  }, [eventId]);

  // Set up real-time subscription
  useEffect(() => {
    if (!eventId || !enabled) return;

    // Initial calculation
    calculateTimerState();

    // Set up interval for live updates
    intervalRef.current = setInterval(() => {
      calculateTimerState();
    }, refreshInterval);

    // Set up Supabase real-time subscription
    subscriptionRef.current = supabase
      .channel(`match_timer_${eventId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'incident_logs',
          filter: `event_id=eq.${eventId} AND type=eq.match_log`,
        },
        () => {
          // Recalculate on any match flow log change
          calculateTimerState();
        }
      )
      .subscribe();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }
    };
  }, [eventId, enabled, refreshInterval, calculateTimerState]);

  return state;
}

