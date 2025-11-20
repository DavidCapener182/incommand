'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { 
  RadioIcon, 
  ClockIcon, 
  ArrowPathIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from '@heroicons/react/24/outline'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/supabase'

interface Incident {
  id: number
  occurrence: string
  incident_type: string
  priority?: string
  callsign_from: string
  callsign_to: string
  created_at: string
  time_of_occurrence?: string
  source?: string
}

interface RecentRadioMessagesProps {
  eventId: string | null
  onSelectMessage?: (incident: Incident) => void
  className?: string
}

const priorityColors: Record<string, string> = {
  urgent: 'text-red-600 dark:text-red-400',
  critical: 'text-red-600 dark:text-red-400',
  high: 'text-orange-600 dark:text-orange-400',
  medium: 'text-yellow-600 dark:text-yellow-400',
  low: 'text-gray-600 dark:text-gray-400',
}

export default function RecentRadioMessages({ 
  eventId, 
  onSelectMessage,
  className 
}: RecentRadioMessagesProps) {
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(true)

  const fetchRecentIncidents = useCallback(async () => {
    if (!eventId) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Fetch open incidents directly from Supabase
    const { data: incidentsData, error: incidentsError } = await supabase
          .from('incident_logs')
        .select('id, occurrence, incident_type, priority, callsign_from, callsign_to, created_at, time_of_occurrence, source')
        .eq('event_id', eventId)
        .eq('is_closed', false)
        .order('created_at', { ascending: false })
        .limit(50)

      if (incidentsError) {
        throw incidentsError
      }

      const allIncidents = (incidentsData || []) as Incident[]

      // Filter incidents by priority (case-insensitive)
      const highData = allIncidents.filter((inc: Incident) => {
        const priority = (inc.priority || '').toLowerCase()
        return priority === 'high'
      })
      const urgentData = allIncidents.filter((inc: Incident) => {
        const priority = (inc.priority || '').toLowerCase()
        return priority === 'urgent'
      })

      // Also search for incidents with urgent keywords in occurrence text
      const urgentKeywordIncidents = allIncidents.filter((incident: Incident) => {
        const lowerText = (incident.occurrence || '').toLowerCase()
        const isUrgentKeyword = lowerText.includes('urgent') || 
                               lowerText.includes('asap') || 
                               lowerText.includes('immediately') ||
                               lowerText.includes('emergency')
        const priority = (incident.priority || '').toLowerCase()
        return isUrgentKeyword && priority !== 'high' && priority !== 'urgent'
      })

      // Combine and deduplicate by ID, prioritize urgent, then high, then urgent keywords
      const allCombined = [...urgentData, ...highData, ...urgentKeywordIncidents]
      const uniqueIncidents = Array.from(
        new Map(allCombined.map((inc: Incident) => [inc.id, inc])).values()
      )
        .sort((a, b) => {
          // Sort by priority first (urgent > high > others), then by time
          const priorityOrder: Record<string, number> = { urgent: 3, high: 2, medium: 1, low: 0 }
          const aPriority = (a.priority || 'medium').toLowerCase()
          const bPriority = (b.priority || 'medium').toLowerCase()
          
          // Check if occurrence contains urgent keywords
          const aText = (a.occurrence || '').toLowerCase()
          const bText = (b.occurrence || '').toLowerCase()
          const aIsUrgent = aText.includes('urgent') || aText.includes('asap') || aText.includes('immediately')
          const bIsUrgent = bText.includes('urgent') || bText.includes('asap') || bText.includes('immediately')
          
          const aScore = priorityOrder[aPriority] || 0
          const bScore = priorityOrder[bPriority] || 0
          
          // Boost urgent keyword incidents
          const aFinalScore = aIsUrgent && aScore < 2 ? 1.5 : aScore
          const bFinalScore = bIsUrgent && bScore < 2 ? 1.5 : bScore
          
          if (aFinalScore !== bFinalScore) {
            return bFinalScore - aFinalScore
          }
          
          // Sort by most recent (use time_of_occurrence if available, else created_at)
          const aTime = new Date(a.time_of_occurrence || a.created_at).getTime()
          const bTime = new Date(b.time_of_occurrence || b.created_at).getTime()
          return bTime - aTime
        })
        .slice(0, 5)

      setIncidents(uniqueIncidents)
    } catch (err: any) {
      console.error('Error fetching incidents:', err)
      setError(err.message || 'Failed to load incidents')
    } finally {
      setLoading(false)
    }
  }, [eventId])

  useEffect(() => {
    fetchRecentIncidents()
    
    if (autoRefresh) {
      const interval = setInterval(fetchRecentIncidents, 30000) // Refresh every 30 seconds
      return () => clearInterval(interval)
    }
  }, [eventId, autoRefresh, fetchRecentIncidents])

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

  const handleIncidentClick = (incident: Incident) => {
    if (onSelectMessage) {
      onSelectMessage(incident)
    }
  }

  if (!eventId) {
    return null
  }

  // Always show the component, even if loading or no incidents
  if (loading && incidents.length === 0) {
    return (
      <div className={cn('bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg p-3', className)}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <RadioIcon className="h-4 w-4 text-blue-600" />
            <span className="text-xs font-semibold text-gray-900 dark:text-white">
              Recent High-Priority Incidents
            </span>
          </div>
          <ArrowPathIcon className="h-4 w-4 animate-spin text-blue-600" />
        </div>
      </div>
    )
  }

  // Show component even if no incidents - user can still see it exists
  if (incidents.length === 0 && !error) {
    return (
      <div className={cn('bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg p-3', className)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <RadioIcon className="h-4 w-4 text-blue-600" />
            <span className="text-xs font-semibold text-gray-900 dark:text-white">
              Recent High-Priority Incidents
            </span>
          </div>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            No recent high-priority or urgent incidents
          </span>
        </div>
      </div>
    )
  }

  if (error && incidents.length === 0) {
    return (
      <div className={cn('bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg p-3', className)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <RadioIcon className="h-4 w-4 text-blue-600" />
            <span className="text-xs font-semibold text-gray-900 dark:text-white">
              Recent High-Priority Incidents
            </span>
          </div>
          <span className="text-xs text-red-500 dark:text-red-400">
            {error}
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg p-3', className)}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <RadioIcon className="h-4 w-4 text-blue-600" />
          <span className="text-xs font-semibold text-gray-900 dark:text-white">
            Recent High-Priority Incidents
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            ({incidents.length})
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={cn(
              'p-1 rounded transition-colors',
              autoRefresh 
                ? 'text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/20' 
                : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
            )}
            title={autoRefresh ? 'Auto-refresh on' : 'Auto-refresh off'}
          >
            <ArrowPathIcon className={cn('h-3 w-3', autoRefresh && 'animate-spin')} />
          </button>
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1 hover:bg-blue-100 dark:hover:bg-blue-900/20 rounded transition-colors"
            title={expanded ? 'Collapse' : 'Expand'}
          >
            {expanded ? (
              <ChevronUpIcon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            ) : (
              <ChevronDownIcon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            )}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="space-y-2 mt-2">
          {incidents.map((incident) => (
            <div
              key={incident.id}
              onClick={() => handleIncidentClick(incident)}
              className={cn(
                'p-2 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700',
                'hover:border-blue-300 dark:hover:border-blue-600 cursor-pointer transition-colors',
                onSelectMessage && 'hover:shadow-sm'
              )}
            >
              <div className="flex items-start justify-between gap-2 mb-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {incident.incident_type && (
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400">
                      {incident.incident_type}
                    </span>
                  )}
                  {incident.priority && (
                    <span className={cn(
                      'text-[10px] font-medium',
                      priorityColors[incident.priority.toLowerCase()] || priorityColors.medium
                    )}>
                      {incident.priority}
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-gray-500 dark:text-gray-400 flex items-center gap-1">
                  <ClockIcon className="h-3 w-3" />
                  {formatTime(incident.time_of_occurrence || incident.created_at)}
                </span>
              </div>

              <p className="text-xs text-gray-900 dark:text-white line-clamp-2">
                {incident.occurrence}
              </p>

              {(incident.callsign_from || incident.callsign_to) && (
                <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">
                  {incident.callsign_from}
                  {incident.callsign_to && ` → ${incident.callsign_to}`}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {!expanded && incidents.length > 0 && (
        <div 
          onClick={() => setExpanded(true)}
          className="cursor-pointer"
        >
          <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
            <span className="line-clamp-1">
              {incidents[0].occurrence}
            </span>
            <span className="text-gray-400">
              {formatTime(incidents[0].time_of_occurrence || incidents[0].created_at)}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

