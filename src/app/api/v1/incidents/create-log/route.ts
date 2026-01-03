/**
 * API Route: Create Auditable Incident Log
 * POST /api/v1/incidents/create-log
 * 
 * Creates an immutable incident log entry with full audit trail support
 */

import { NextRequest, NextResponse } from 'next/server'
import { secureApiHandler } from '@/lib/apiSecurity'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { createImmutableLog } from '@/lib/auditableLogging'

import { CreateAuditableLogRequest, CreateLogResponse } from '@/types/auditableLog'
import { isMatchFlowType, type MatchFlowType } from '@/utils/matchFlowParser'
import type { Database } from '@/types/supabase'
import type { SupabaseClient } from '@supabase/supabase-js'


export async function POST(request: NextRequest) {
  return secureApiHandler(request, async (supabase, user, request) => {
    try {
      // Cast supabase to typed client for proper type inference
      const typedSupabase = supabase as SupabaseClient<Database>

      // Parse request body
      const body: CreateAuditableLogRequest = await request.json()

      // Validate required fields
      if (!body.occurrence || !body.action_taken || !body.incident_type) {
        return NextResponse.json(
          { success: false, error: 'Missing required fields: occurrence, action_taken, incident_type' },
          { status: 400 }
        )
      }

      if (!body.time_of_occurrence) {
        return NextResponse.json(
          { success: false, error: 'time_of_occurrence is required' },
          { status: 400 }
        )
      }

      if (!body.entry_type || !['contemporaneous', 'retrospective'].includes(body.entry_type)) {
        return NextResponse.json(
          { success: false, error: 'entry_type must be "contemporaneous" or "retrospective"' },
          { status: 400 }
        )
      }

      // Validate retrospective justification
      if (body.entry_type === 'retrospective') {
        if (!body.retrospective_justification || body.retrospective_justification.trim().length === 0) {
          return NextResponse.json(
            { success: false, error: 'Retrospective entries require a justification' },
            { status: 400 }
          )
        }
      }

      // Get user's current callsign from profile or assignment
      const { data: profile } = await typedSupabase
        .from('profiles')
        .select('first_name, last_name, email')
        .eq('id', user.id)
        .single()

      // Try to get current callsign assignment
      const { data: assignment } = await typedSupabase
        .from('callsign_assignments')
        .select('callsign_positions(callsign, short_code)')
        .eq('user_id', user.id)
        .eq('event_id', body.event_id)
        .single()

      const profileData = profile as any;
      const userCallsign = (assignment as any)?.callsign_positions?.callsign || 
                          (assignment as any)?.callsign_positions?.short_code ||
                          `${profileData?.first_name?.[0]}${profileData?.last_name?.[0]}`.toUpperCase() ||
                          'Unknown'

      // Generate log number
      const { data: eventData } = await typedSupabase
        .from('events')
        .select('event_name, name, event_date, date')
        .eq('id', body.event_id)
        .single()

      const eventDataTyped = eventData as any;
      const eventNameValue = eventDataTyped?.event_name ?? eventDataTyped?.name ?? 'Event'
      const eventPrefix = eventNameValue.substring(0, 3).toUpperCase()
      const resolvedDate = eventDataTyped?.event_date ?? eventDataTyped?.date
      const eventDate = resolvedDate ? new Date(resolvedDate).toISOString().split('T')[0].replace(/-/g, '') : new Date().toISOString().split('T')[0].replace(/-/g, '')
      
      // Get count for log number
      const { count } = await typedSupabase
        .from('incident_logs')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', body.event_id)

      const logNumber = `${eventPrefix}-${eventDate}-${String((count || 0) + 1).padStart(3, '0')}`

      // Determine if this should be logged as operational log vs incident
      const operationalLogTypes = [
        'Artist On Stage', 'Artist Off Stage', 'Artist on Stage', 'Artist off Stage',
        'Attendance', 'Event Timing', 'Timings', 'Sit Rep', 'Staffing',
        'Accreditation', 'Accessibility', 'Accsessablity' // Include typo variant
      ];
      const isMatchFlowLog = isMatchFlowType(body.incident_type);
      const shouldBeLogged = isMatchFlowLog || operationalLogTypes.includes(body.incident_type) || body.priority === 'low';

      // Calculate match flow specific fields
      let matchMinute: number | null = null;
      let homeScore: number | null = null;
      let awayScore: number | null = null;

      if (isMatchFlowLog) {
        // Get previous match flow logs to calculate score and match minute
        type MatchFlowLogRecord = {
          incident_type: string;
          time_of_occurrence: string | null;
          home_score: number | null;
          away_score: number | null;
          match_minute: number | null;
        };

        const { data: previousLogsRaw } = await typedSupabase
          .from('incident_logs')
          .select('incident_type, time_of_occurrence, home_score, away_score, match_minute')
          .eq('event_id', body.event_id)
          .eq('type', 'match_log')
          .order('time_of_occurrence', { ascending: true });

        const previousLogs = (previousLogsRaw ?? []) as unknown as MatchFlowLogRecord[];

        // Calculate current score by counting goal incidents
        // Simple approach: count Home Goal and Away Goal incident types
        let currentHomeScore = 0;
        let currentAwayScore = 0;
        
        if (previousLogs.length > 0) {
          for (const log of previousLogs) {
            if (log.incident_type === 'Home Goal') {
              currentHomeScore++;
            } else if (log.incident_type === 'Away Goal') {
              currentAwayScore++;
            }
          }
        }

        // Handle goal logs - increment score
        if (body.incident_type === 'Home Goal') {
          homeScore = currentHomeScore + 1;
          awayScore = currentAwayScore;
          console.log('[CreateLog] Home Goal - Counted:', { currentHomeScore, currentAwayScore }, 'New score:', { homeScore, awayScore });
        } else if (body.incident_type === 'Away Goal') {
          homeScore = currentHomeScore;
          awayScore = currentAwayScore + 1;
          console.log('[CreateLog] Away Goal - Counted:', { currentHomeScore, currentAwayScore }, 'New score:', { homeScore, awayScore });
        } else {
          // For phase logs, keep current score
          homeScore = currentHomeScore;
          awayScore = currentAwayScore;
        }

        // Calculate match minute for phase logs
        const kickOffFirstHalf = previousLogs.find(
          (log: MatchFlowLogRecord) => log.incident_type === 'Kick-Off (First Half)'
        );
        const kickOffSecondHalf = previousLogs.find(
          (log: MatchFlowLogRecord) => log.incident_type === 'Kick-Off (Second Half)'
        );
        const halfTime = previousLogs.find(
          (log: MatchFlowLogRecord) => log.incident_type === 'Half-Time'
        );
        
        if (kickOffFirstHalf && kickOffFirstHalf.time_of_occurrence) {
          const occurrenceTime = new Date(body.time_of_occurrence).getTime();
          const kickOffTime = new Date(kickOffFirstHalf.time_of_occurrence).getTime();
          const elapsedMs = occurrenceTime - kickOffTime;
          const elapsedMinutes = Math.floor(elapsedMs / 60000);

          const halfTimeBoundary = halfTime?.time_of_occurrence
            ? new Date(halfTime.time_of_occurrence).getTime()
            : null;

          if (halfTimeBoundary && occurrenceTime > halfTimeBoundary) {
            // After half-time, add 45 minutes
            matchMinute = 45 + elapsedMinutes;
          } else {
            // First half
            matchMinute = elapsedMinutes;
          }
        }
      }

      // Prepare log data
      const logData = {
        log_number: logNumber,
        occurrence: body.occurrence,
        action_taken: body.action_taken,
        incident_type: body.incident_type,
        callsign_from: body.callsign_from,
        callsign_to: body.callsign_to,
        time_of_occurrence: body.time_of_occurrence,
        time_logged: body.time_logged || new Date().toISOString(),
        timestamp: body.time_of_occurrence, // For backward compatibility
        entry_type: body.entry_type,
        retrospective_justification: body.retrospective_justification,
        logged_by_callsign: userCallsign,
        priority: body.priority || 'medium',
        photo_url: body.photo_url,
        event_id: body.event_id,
        status: shouldBeLogged ? 'logged' : (body.status || 'open'),
        is_closed: shouldBeLogged,
        location: body.location_name || '', // Map location_name to database location field
        // Match flow log specific fields
        ...(isMatchFlowLog && {
          type: 'match_log',
          category: 'football',
          ...(matchMinute !== null && { match_minute: matchMinute }),
          ...(homeScore !== null && { home_score: homeScore }),
          ...(awayScore !== null && { away_score: awayScore }),
        }),
      }

      // Create immutable log
      const result = await createImmutableLog(logData, user.id)

      if (!result.success) {
        return NextResponse.json(
          { success: false, error: result.error },
          { status: 400 }
        )
      }

      const response: CreateLogResponse = {
        success: true,
        log: result.log,
        warnings: result.warnings
      }

      return NextResponse.json(response, { status: 201 })
    } catch (error: any) {
      console.error('Error creating auditable log:', error)
      return NextResponse.json(
        { success: false, error: error.message || 'Internal server error' },
        { status: 500 }
      )
    }
  })
}
