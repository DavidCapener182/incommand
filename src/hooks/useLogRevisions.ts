/**
 * Custom hook for real-time log revision tracking
 * Monitors incident_log_revisions table for changes
 */

import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { RealtimeChannel } from '@supabase/supabase-js'
import { logger } from '@/lib/logger'

interface RevisionNotification {
  incidentLogId: string
  revisionNumber: number
  fieldChanged: string
  changeType: string
  changedBy: string
  timestamp: string
}

export function useLogRevisions(eventId: string | null, onRevisionCreated?: (notification: RevisionNotification) => void) {
  const subscriptionRef = useRef<RealtimeChannel | null>(null)
  const previousEventIdRef = useRef<string | null>(null)
  const [revisionCount, setRevisionCount] = useState<Record<string, number>>({})
  const [latestRevisions, setLatestRevisions] = useState<RevisionNotification[]>([])

  useEffect(() => {
    if (!eventId || eventId === previousEventIdRef.current) {
      return
    }

    previousEventIdRef.current = eventId

    logger.debug('Setting up revision subscription', { 
      component: 'useLogRevisions', 
      action: 'setup',
      eventId 
    })

    // Subscribe to incident_log_revisions changes
    subscriptionRef.current = supabase
      .channel(`log_revisions_${eventId}`)
      .on('postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'incident_log_revisions'
        },
        async (payload) => {
          logger.debug('Revision created', {
            component: 'useLogRevisions',
            action: 'revisionInsert',
            revision: payload.new
          })

          const revision = payload.new as any

          // Get the incident log to check if it belongs to this event
          const { data: incidentLog } = await supabase
            .from('incident_logs')
            .select('event_id, log_number')
            .eq('id', revision.incident_log_id)
            .single()

          if (incidentLog && incidentLog.event_id === eventId) {
            const notification: RevisionNotification = {
              incidentLogId: revision.incident_log_id,
              revisionNumber: revision.revision_number,
              fieldChanged: revision.field_changed,
              changeType: revision.change_type,
              changedBy: revision.changed_by_callsign || revision.changed_by_user_id,
              timestamp: revision.created_at
            }

            // Update revision count
            setRevisionCount(prev => ({
              ...prev,
              [revision.incident_log_id]: (prev[revision.incident_log_id] || 0) + 1
            }))

            // Add to latest revisions
            setLatestRevisions(prev => [notification, ...prev].slice(0, 10))

            // Call callback if provided
            if (onRevisionCreated) {
              onRevisionCreated(notification)
            }

            logger.debug('Revision notification processed', {
              component: 'useLogRevisions',
              action: 'revisionNotification',
              logNumber: incidentLog.log_number,
              revision: notification
            })
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          logger.debug('Revision subscription active', {
            component: 'useLogRevisions',
            action: 'subscribed',
            eventId
          })
        } else if (status === 'CHANNEL_ERROR') {
          logger.error('Revision subscription error', {
            component: 'useLogRevisions',
            action: 'error',
            eventId
          })
        }
      })

    return () => {
      if (subscriptionRef.current) {
        logger.debug('Cleaning up revision subscription', {
          component: 'useLogRevisions',
          action: 'cleanup',
          eventId
        })
        subscriptionRef.current.unsubscribe()
        subscriptionRef.current = null
      }
    }
  }, [eventId, onRevisionCreated])

  return {
    revisionCount,
    latestRevisions
  }
}

