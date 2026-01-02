import { supabase } from './supabase'
import { websocketService } from './websocketService'
import { logger } from './logger'

export interface IncidentSummaryCounts {
  open: number
  in_progress: number
  closed: number
  total: number
}

/**
 * Broadcasts incident summary update via WebSocket
 * @param eventId - The event ID to get incident counts for
 * @param channelName - The WebSocket channel name (default: 'incident-summary')
 */
export async function broadcastIncidentSummaryUpdate(
  eventId: string,
  channelName: string = 'incident-summary'
): Promise<void> {
  try {
    const client = supabase as any
    const { data: incidents, error } = await client
      .from('incident_logs')
      .select('is_closed, status')
      .eq('event_id', eventId)
      .not('incident_type', 'in', ['Attendance', 'Sit Rep']) // Exclude non-countable incidents

    if (error) {
      logger.error('Failed to fetch incidents for summary broadcast', error, {
        component: 'IncidentSummaryBroadcast',
        action: 'fetchIncidents',
        eventId,
      })
      return
    }

    const incidentList = (incidents ?? []) as Array<{ is_closed?: boolean; status?: string }>

    if (incidentList.length === 0) {
      // Broadcast empty counts
      websocketService.sendIncidentSummaryUpdate(channelName, {
        open: 0,
        in_progress: 0,
        closed: 0,
        total: 0,
        timestamp: new Date().toISOString()
      })
      return
    }

    const summary = incidentList.reduce(
      (acc, incident) => {
        const status = String(incident?.status ?? '').toLowerCase()
        const isClosed = Boolean(incident?.is_closed) || status === 'closed' || status === 'resolved'
        const isInProgress = status === 'in_progress' || status === 'in progress'
        
        if (isClosed) {
          acc.closed += 1
        } else if (isInProgress) {
          acc.in_progress += 1
        } else {
          acc.open += 1
        }
        
        return acc
      },
      { open: 0, in_progress: 0, closed: 0, total: incidentList.length }
    )
    
    websocketService.sendIncidentSummaryUpdate(channelName, {
      ...summary,
      timestamp: new Date().toISOString()
    })

    logger.debug('Incident summary broadcast sent', {
      component: 'IncidentSummaryBroadcast',
      action: 'broadcast',
      eventId,
      summary,
    })
  } catch (error) {
    logger.error('Failed to broadcast incident summary update', error, {
      component: 'IncidentSummaryBroadcast',
      action: 'broadcast',
      eventId,
    })
  }
}

/**
 * Broadcasts incident summary update for a specific incident
 * @param incidentId - The incident ID to get the event from
 * @param channelName - The WebSocket channel name (default: 'incident-summary')
 */
export async function broadcastIncidentSummaryUpdateByIncidentId(
  incidentId: string,
  channelName: string = 'incident-summary'
): Promise<void> {
  try {
    const client = supabase as any
    // First get the event_id from the incident
    const { data: incident, error: incidentError } = await client
      .from('incident_logs')
      .select('event_id')
      .eq('id', parseInt(incidentId))
      .maybeSingle()

    if (incidentError || !incident?.event_id) {
      logger.warn('Could not find event_id for incident', {
        component: 'IncidentSummaryBroadcast',
        action: 'getEventId',
        incidentId,
        error: incidentError,
      })
      return
    }

    await broadcastIncidentSummaryUpdate(incident.event_id, channelName)
  } catch (error) {
    logger.error('Failed to broadcast incident summary update by incident ID', error, {
      component: 'IncidentSummaryBroadcast',
      action: 'broadcastByIncidentId',
      incidentId,
    })
  }
}
