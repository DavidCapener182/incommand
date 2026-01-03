// @ts-nocheck
/**
 * Match Flow Sync Service
 * Reads match flow logs from database and calculates current match state
 * Updates manualStore with database-derived data
 */

import { supabase } from '@/lib/supabase';
import { updateManualOverrides, getMergedFootballData } from '@/lib/football/manualStore';
import { FootballData, FootballLiveScore, FootballPhase } from '@/types/football';

export interface MatchFlowState {
  homeScore: number;
  awayScore: number;
  phase: FootballPhase;
  currentMinute: number;
  displayTime: string;
  kickOffFirstHalf?: string;
  kickOffSecondHalf?: string;
  halfTime?: string;
  fullTime?: string;
}

/**
 * Calculate match state from flow logs
 */
export async function calculateMatchFlowState(
  eventId: string
): Promise<MatchFlowState | null> {
  try {
    // Fetch all match flow logs for this event
    const { data: flowLogs, error } = await supabase
      .from('incident_logs')
      .select('incident_type, time_of_occurrence, home_score, away_score, match_minute')
      .eq('event_id', eventId)
      .eq('type', 'match_log')
      .order('time_of_occurrence', { ascending: true });

    if (error) {
      console.error('Error fetching match flow logs:', error);
      return null;
    }

    if (!flowLogs || flowLogs.length === 0) {
      return {
        homeScore: 0,
        awayScore: 0,
        phase: 'Pre-Match',
        currentMinute: 0,
        displayTime: '0',
      };
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

    // Calculate current score by counting goal incidents
    // Simple approach: count Home Goal and Away Goal incident types
    let homeScore = 0;
    let awayScore = 0;

    // Count goals from goal logs
    const goalLogs = flowLogs.filter(
      (log) => log.incident_type === 'Home Goal' || log.incident_type === 'Away Goal'
    );

    // Simply count the number of each goal type
    for (const log of goalLogs) {
      if (log.incident_type === 'Home Goal') {
        homeScore++;
      } else if (log.incident_type === 'Away Goal') {
        awayScore++;
      }
    }

    console.log('[MatchFlowSync] Counted goals:', { homeScore, awayScore, goalCount: goalLogs.length });

    // Determine current phase and minute
    let phase: FootballPhase = 'Pre-Match';
    let currentMinute = 0;
    let displayTime = '0';

    if (fullTime) {
      phase = 'Full Time';
      currentMinute = fullTime.match_minute || 90;
      displayTime = '90';
    } else if (kickOffSecondHalf) {
      phase = 'Second Half';
      const kickOffTime = new Date(kickOffSecondHalf.time_of_occurrence).getTime();
      const now = Date.now();
      const elapsedMs = now - kickOffTime;
      const elapsedMinutes = Math.floor(elapsedMs / 60000);
      currentMinute = 45 + elapsedMinutes;

      if (currentMinute > 90) {
        const extraTime = currentMinute - 90;
        displayTime = `90+${extraTime}`;
      } else {
        displayTime = currentMinute.toString();
      }
    } else if (halfTime) {
      phase = 'Half-Time';
      if (halfTime.match_minute !== null) {
        currentMinute = halfTime.match_minute;
        displayTime = currentMinute.toString();
      } else if (kickOffFirstHalf) {
        const kickOffTime = new Date(kickOffFirstHalf.time_of_occurrence).getTime();
        const halfTimeTime = new Date(halfTime.time_of_occurrence).getTime();
        const elapsedMs = halfTimeTime - kickOffTime;
        currentMinute = Math.floor(elapsedMs / 60000);
        displayTime = currentMinute.toString();
      }
    } else if (kickOffFirstHalf) {
      phase = 'First Half';
      const kickOffTime = new Date(kickOffFirstHalf.time_of_occurrence).getTime();
      const now = Date.now();
      const elapsedMs = now - kickOffTime;
      const elapsedMinutes = Math.floor(elapsedMs / 60000);
      currentMinute = elapsedMinutes;

      if (currentMinute > 45) {
        const extraTime = currentMinute - 45;
        displayTime = `45+${extraTime}`;
      } else {
        displayTime = currentMinute.toString();
      }
    }

    return {
      homeScore,
      awayScore,
      phase,
      currentMinute,
      displayTime,
      kickOffFirstHalf: kickOffFirstHalf?.time_of_occurrence,
      kickOffSecondHalf: kickOffSecondHalf?.time_of_occurrence,
      halfTime: halfTime?.time_of_occurrence,
      fullTime: fullTime?.time_of_occurrence,
    };
  } catch (error) {
    console.error('Error calculating match flow state:', error);
    return null;
  }
}

/**
 * Sync match flow state to manualStore
 */
export async function syncMatchFlowToStore(
  eventId: string,
  homeTeam?: string,
  awayTeam?: string,
  competition?: string
): Promise<FootballData | null> {
  try {
    const matchState = await calculateMatchFlowState(eventId);
    
    // Get current manualStore data
    const currentData = getMergedFootballData();

    // Always update the store with calculated scores, even if matchState is null (will use 0-0)
    const finalState = matchState || {
      homeScore: 0,
      awayScore: 0,
      phase: 'Pre-Match' as FootballPhase,
      currentMinute: 0,
      displayTime: '0',
    };

    console.log('[syncMatchFlowToStore] Updating store with scores:', { 
      homeScore: finalState.homeScore, 
      awayScore: finalState.awayScore,
      phase: finalState.phase 
    });

    // Update manualStore with database-derived match state
    updateManualOverrides({
      liveScore: {
        home: finalState.homeScore,
        away: finalState.awayScore,
        time: finalState.displayTime,
        phase: finalState.phase,
        homeTeam: homeTeam || currentData.liveScore.homeTeam,
        awayTeam: awayTeam || currentData.liveScore.awayTeam,
        competition: competition || currentData.liveScore.competition,
        // Remove cards and subs - they should not be displayed
        cards: { yellow: 0, red: 0 },
        subs: 0,
      },
    });

    const mergedData = getMergedFootballData();
    console.log('[syncMatchFlowToStore] Final merged data scores:', { 
      home: mergedData.liveScore.home, 
      away: mergedData.liveScore.away 
    });
    
    return mergedData;
  } catch (error) {
    console.error('Error syncing match flow to store:', error);
    // Even on error, ensure scores are 0-0
    const currentData = getMergedFootballData();
    updateManualOverrides({
      liveScore: {
        ...currentData.liveScore,
        home: 0,
        away: 0,
        cards: { yellow: 0, red: 0 },
        subs: 0,
      },
    });
    return getMergedFootballData();
  }
}

/**
 * Get event metadata (home_team, away_team, competition)
 */
export async function getEventMetadata(eventId: string): Promise<{
  homeTeam?: string;
  awayTeam?: string;
  competition?: string;
} | null> {
  try {
    // First check if columns exist by selecting all and checking what's available
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single();

    if (error) {
      // Silently fail - these columns may not exist for all event types
      return null;
    }

    // Return metadata only if columns exist (check for undefined/null)
    return {
      homeTeam: (data as any)?.home_team || undefined,
      awayTeam: (data as any)?.away_team || undefined,
      competition: (data as any)?.competition || undefined,
    };
  } catch (error) {
    // Silently fail - these columns may not exist
    return null;
  }
}

