'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  RadioIcon,
  ExclamationTriangleIcon,
  SignalIcon,
  ArrowRightIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/supabase'
import type { RadioMessage, RadioChannelHealth } from '@/types/radio'

interface RadioAlert {
  id: string
  type: 'critical_message' | 'overload'
  severity: 'critical' | 'high' | 'warning'
  title: string
  message: string
  channel?: string
  timestamp: string
  link?: string
}

interface RadioAlertsWidgetProps {
  eventId: string | null
  className?: string
  maxAlerts?: number
  onDismiss?: (alertId: string) => void
}

export default function RadioAlertsWidget({
  eventId,
  className,
  maxAlerts = 5,
  onDismiss,
}: RadioAlertsWidgetProps) {
  const router = useRouter()
  const [alerts, setAlerts] = useState<RadioAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set())

  const fetchAlerts = useCallback(async () => {
    if (!eventId) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const alertsList: RadioAlert[] = []

      // Fetch critical/high priority incidents from incident_logs (last hour)
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
      
    const { data: highPriorityIncidents, error: incidentsError } = await supabase
          .from('incident_logs')
        .select('id, occurrence, incident_type, priority, callsign_from, callsign_to, created_at, time_of_occurrence, source, is_closed')
        .eq('event_id', eventId)
        .eq('is_closed', false)
        .gte('created_at', oneHourAgo)
        .order('created_at', { ascending: false })
        .limit(20)

      if (incidentsError && incidentsError.code !== 'PGRST116') {
        // PGRST116 = table not found, which is okay for graceful degradation
        throw incidentsError
      }

      if (highPriorityIncidents && highPriorityIncidents.length > 0) {
        // Filter for high/urgent/critical priority incidents
        const criticalIncidents = highPriorityIncidents.filter((inc) => {
          const priority = (inc.priority || '').toLowerCase()
          return priority === 'critical' || priority === 'high' || priority === 'urgent'
        })

        criticalIncidents.forEach((incident) => {
          const priority = (incident.priority || '').toLowerCase()
          const severity = priority === 'critical' || priority === 'urgent' ? 'critical' : 'high'
          
          alertsList.push({
            id: `incident-${incident.id}`,
            type: 'critical_message',
            severity: severity as 'critical' | 'high',
            title: `High Priority Incident: ${incident.incident_type || 'Incident'}`,
            message: incident.occurrence || 'No details available',
            channel: incident.source || undefined,
            timestamp: incident.time_of_occurrence || incident.created_at,
            link: `/incidents?filter=high&id=${incident.id}`,
          })
        })
      }

      // Also fetch critical/high priority radio messages from radio_messages table (if it exists)
        const { data: criticalMessages, error: messagesError } = await supabase
        .from('radio_messages' as any)
        .select('id, channel, from_callsign, to_callsign, message, priority, category, created_at')
        .eq('event_id', eventId)
        .in('priority', ['critical', 'high'])
        .gte('created_at', oneHourAgo)
        .order('created_at', { ascending: false })
        .limit(10)

      // Don't throw error if table doesn't exist - graceful degradation
        const messageRows = Array.isArray(criticalMessages)
          ? (criticalMessages as Array<any>)
          : []

        if (messageRows.length > 0) {
          messageRows.forEach((msg) => {
          const priority = (msg.priority || '').toLowerCase()
          if (priority === 'critical' || priority === 'high') {
            alertsList.push({
              id: `msg-${msg.id}`,
              type: 'critical_message',
              severity: priority === 'critical' ? 'critical' : 'high',
              title: `Critical Radio Message${msg.channel ? ` on ${msg.channel}` : ''}`,
              message: msg.message || 'No message content',
              channel: msg.channel || undefined,
              timestamp: msg.created_at,
              link: `/monitoring/radio-analysis?channel=${encodeURIComponent(msg.channel || '')}`,
            })
          }
        })
      }

      // Fetch channel health overload indicators
    const { data: healthData, error: healthError } = await supabase
          .from('radio_channel_health' as any)
        .select('id, channel, overload_indicator, health_score, metadata, timestamp')
        .eq('event_id', eventId)
        .eq('overload_indicator', true)
        .order('timestamp', { ascending: false })
        .limit(10)

      if (healthError && healthError.code !== 'PGRST116') {
        // PGRST116 = table not found, which is okay for graceful degradation
        throw healthError
      }

        const healthRows = Array.isArray(healthData) ? (healthData as Array<any>) : []

        if (healthRows.length > 0) {
          healthRows.forEach((health) => {
          const overloadReason = health.metadata?.overloadReason || 'High message volume detected'
          alertsList.push({
            id: `health-${health.id}`,
            type: 'overload',
            severity: (health.health_score || 100) < 50 ? 'critical' : 'warning',
            title: `Channel Overload: ${health.channel}`,
            message: overloadReason,
            channel: health.channel,
            timestamp: health.timestamp,
            link: `/monitoring/radio-analysis?channel=${encodeURIComponent(health.channel)}`,
          })
        })
      }

      // Sort alerts by severity and timestamp (most recent first)
      alertsList.sort((a, b) => {
        const severityOrder = { critical: 3, high: 2, warning: 1 }
        const aSeverity = severityOrder[a.severity] || 0
        const bSeverity = severityOrder[b.severity] || 0
        if (aSeverity !== bSeverity) {
          return bSeverity - aSeverity
        }
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      })

      // Filter out dismissed alerts and limit
      const activeAlerts = alertsList
        .filter((alert) => !dismissedAlerts.has(alert.id))
        .slice(0, maxAlerts)

      setAlerts(activeAlerts)
    } catch (err: any) {
      console.error('Error fetching radio alerts:', err)
      // Graceful degradation - don't show error if tables don't exist
      if (err.code !== 'PGRST116') {
        setError(err.message || 'Failed to load radio alerts')
      }
      setAlerts([])
    } finally {
      setLoading(false)
    }
  }, [eventId, dismissedAlerts, maxAlerts])

  useEffect(() => {
    fetchAlerts()

    if (autoRefresh) {
      const interval = setInterval(fetchAlerts, 30000) // Refresh every 30 seconds
      return () => clearInterval(interval)
    }
  }, [eventId, autoRefresh, dismissedAlerts, fetchAlerts])

  const handleDismiss = (alertId: string) => {
    setDismissedAlerts((prev) => new Set(prev).add(alertId))
    if (onDismiss) {
      onDismiss(alertId)
    }
    // Remove from alerts list immediately
    setAlerts((prev) => prev.filter((alert) => alert.id !== alertId))
  }

  const handleViewAll = () => {
    router.push('/monitoring/radio-analysis')
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h ago`
    return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  }

  if (!eventId) {
    return null
  }

  if (loading && alerts.length === 0) {
    return (
      <div
        className={cn(
          'rounded-xl border bg-white dark:bg-gray-800 p-4',
          className
        )}
      >
        <div className="flex items-center gap-2">
          <RadioIcon className="h-5 w-5 text-gray-400 animate-pulse" />
          <span className="text-sm text-gray-500 dark:text-gray-400">Loading radio alerts...</span>
        </div>
      </div>
    )
  }

  if (alerts.length === 0 && !error) {
    return null // Don't show widget if there are no alerts
  }

  if (error) {
    return null // Don't show widget if there's an error (graceful degradation)
  }

  return (
    <div
      className={cn(
        'rounded-xl border bg-white dark:bg-gray-800 p-4 shadow-sm',
        className
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <RadioIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            Radio Alerts
          </h3>
          {alerts.length > 0 && (
            <span className="px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 text-xs font-medium rounded-full">
              {alerts.length}
            </span>
          )}
        </div>
        <button
          onClick={handleViewAll}
          className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
        >
          View All
          <ArrowRightIcon className="h-3 w-3" />
        </button>
      </div>

      <div className="space-y-2">
        {alerts.map((alert) => {
          const severityColors = {
            critical: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
            high: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800',
            warning: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
          }

          const iconColors = {
            critical: 'text-red-600 dark:text-red-400',
            high: 'text-orange-600 dark:text-orange-400',
            warning: 'text-yellow-600 dark:text-yellow-400',
          }

          const Icon =
            alert.type === 'overload'
              ? SignalIcon
              : ExclamationTriangleIcon

          return (
            <div
              key={alert.id}
              className={cn(
                'relative p-3 rounded-lg border transition-all hover:shadow-sm',
                severityColors[alert.severity]
              )}
            >
              <button
                onClick={() => handleDismiss(alert.id)}
                className="absolute top-2 right-2 p-1 rounded hover:bg-white/50 dark:hover:bg-gray-700/50 transition-colors"
                aria-label="Dismiss alert"
              >
                <XMarkIcon className="h-4 w-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
              </button>

              <div className="flex items-start gap-2 pr-6">
                <Icon className={cn('h-5 w-5 flex-shrink-0 mt-0.5', iconColors[alert.severity])} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={cn(
                        'text-xs font-semibold',
                        alert.severity === 'critical'
                          ? 'text-red-900 dark:text-red-200'
                          : alert.severity === 'high'
                          ? 'text-orange-900 dark:text-orange-200'
                          : 'text-yellow-900 dark:text-yellow-200'
                      )}
                    >
                      {alert.title}
                    </span>
                    <span className="text-[10px] text-gray-500 dark:text-gray-400">
                      {formatTime(alert.timestamp)}
                    </span>
                  </div>
                  <p
                    className={cn(
                      'text-xs line-clamp-2',
                      alert.severity === 'critical'
                        ? 'text-red-800 dark:text-red-300'
                        : alert.severity === 'high'
                        ? 'text-orange-800 dark:text-orange-300'
                        : 'text-yellow-800 dark:text-yellow-300'
                    )}
                  >
                    {alert.message}
                  </p>
                  {alert.channel && (
                    <span className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 inline-block">
                      Channel: {alert.channel}
                    </span>
                  )}
                  {alert.link && (
                    <button
                      onClick={() => router.push(alert.link!)}
                      className="mt-2 text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                    >
                      View Details
                      <ArrowRightIcon className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
