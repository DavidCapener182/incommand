/**
 * Doctrine Assistant Component
 * Feature 2: Live Doctrine Assistant & Dynamic SOP Adjustment Engine
 * 
 * Dashboard widget showing active SOPs, pending adjustments, and suggestions
 */

'use client'

import React, { useState, useEffect } from 'react'
import {
  DocumentTextIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { DoctrineAssistantState, SOPSuggestion } from '@/types/sops'

interface DoctrineAssistantProps {
  eventId: string | null
  className?: string
}

export default function DoctrineAssistant({ eventId, className = '' }: DoctrineAssistantProps) {
  const [state, setState] = useState<DoctrineAssistantState | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (eventId) {
      fetchState()
      // Refresh every 30 seconds
      const interval = setInterval(fetchState, 30 * 1000)
      return () => clearInterval(interval)
    }
  }, [eventId])

  const fetchState = async () => {
    if (!eventId) return

    try {
      setLoading(true)
      setError(null)
      const response = await fetch(`/api/doctrine/assistant?event_id=${eventId}`)
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        // If tables don't exist yet, show empty state instead of error
        if (response.status === 500 && errorData.details?.includes('does not exist')) {
          setState({
            active_sops: [],
            pending_adjustments: [],
            suggestions: [],
            monitored_conditions: [],
            last_updated: new Date().toISOString(),
          })
          return
        }
        throw new Error(errorData.error || 'Failed to fetch doctrine assistant state')
      }
      const data = await response.json()
      if (data.success && data.state) {
        setState(data.state)
      } else {
        throw new Error('Invalid response format')
      }
    } catch (err) {
      console.error('Error fetching doctrine assistant state:', err)
      // Don't set error - show empty state instead so widget is visible
      setState({
        active_sops: [],
        pending_adjustments: [],
        suggestions: [],
        monitored_conditions: [],
        last_updated: new Date().toISOString(),
      })
    } finally {
      setLoading(false)
    }
  }

  const getUrgencyColor = (urgency: string): string => {
    switch (urgency) {
      case 'high':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
      case 'medium':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400'
      default:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
    }
  }

  const getConditionStatusColor = (status: string): string => {
    switch (status) {
      case 'critical':
        return 'text-red-600 dark:text-red-400'
      case 'warning':
        return 'text-amber-600 dark:text-amber-400'
      default:
        return 'text-green-600 dark:text-green-400'
    }
  }

  // Always render the card, even without eventId (show placeholder)
  if (!eventId) {
    return (
      <Card className={`${className}`}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Doctrine Assistant</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <div className="text-xs text-gray-500 dark:text-gray-400">
              No event selected
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (loading && !state) {
    return (
      <Card className={`${className}`}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Doctrine Assistant</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="animate-pulse text-gray-400">Loading...</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Always show the widget, even if state is null or empty
  if (!state) {
    return (
      <Card className={`${className}`}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Doctrine Assistant</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {error ? `Error: ${error}` : 'Initializing...'}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const hasPendingAdjustments = state.pending_adjustments.length > 0
  const hasSuggestions = state.suggestions.length > 0
  const criticalConditions = state.monitored_conditions.filter((c) => c.status === 'critical')

  return (
    <Card className={`h-full flex flex-col ${className}`}>
      <CardHeader className="pb-1 px-3 pt-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xs font-semibold text-gray-900 dark:text-white truncate">
            Doctrine Assistant
          </CardTitle>
          <button
            onClick={fetchState}
            className="p-0.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors flex-shrink-0"
            title="Refresh"
          >
            <ArrowPathIcon className="h-3 w-3 text-gray-600 dark:text-gray-400" />
          </button>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden flex flex-col min-h-0 px-3 pb-3">
        {/* Active SOPs */}
        <div className="mb-1.5 flex-shrink-0">
          <div className="flex items-center justify-between mb-0.5">
            <span className="text-[10px] font-medium text-gray-700 dark:text-gray-300">
              Active SOPs
            </span>
            <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 leading-tight">{state.active_sops.length}</Badge>
          </div>
          {state.active_sops.length === 0 ? (
            <div className="text-[10px] text-gray-500 dark:text-gray-400">
              No active SOPs
            </div>
          ) : (
            <div className="space-y-0.5">
              {state.active_sops.slice(0, 2).map((sop) => (
                <div
                  key={sop.id}
                  className="flex items-center space-x-1 text-[10px] text-gray-600 dark:text-gray-400"
                >
                  <DocumentTextIcon className="h-2 w-2 flex-shrink-0" />
                  <span className="truncate">{sop.title}</span>
                </div>
              ))}
              {state.active_sops.length > 2 && (
                <div className="text-[10px] text-gray-500 dark:text-gray-400">
                  +{state.active_sops.length - 2} more
                </div>
              )}
            </div>
          )}
        </div>

        {/* Pending Adjustments */}
        {hasPendingAdjustments && (
          <div className="mb-1.5 pt-1.5 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-[10px] font-medium text-amber-700 dark:text-amber-400">
                Pending
              </span>
              <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400 text-[10px] px-1 py-0 h-4 leading-tight">
                {state.pending_adjustments.length}
              </Badge>
            </div>
            <div className="space-y-0.5">
              {state.pending_adjustments.slice(0, 1).map((adj) => (
                <div
                  key={adj.id}
                  className="text-[10px] text-gray-600 dark:text-gray-400 flex items-start space-x-1"
                >
                  <ClockIcon className="h-2 w-2 mt-0.5 flex-shrink-0" />
                  <span className="truncate line-clamp-1">{adj.reason}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Suggestions */}
        {hasSuggestions && (
          <div className="mb-1.5 pt-1.5 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-[10px] font-medium text-blue-700 dark:text-blue-400">
                Suggestions
              </span>
              <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 text-[10px] px-1 py-0 h-4 leading-tight">
                {state.suggestions.length}
              </Badge>
            </div>
            <div className="space-y-0.5">
              {state.suggestions.slice(0, 1).map((suggestion, idx) => (
                <div
                  key={idx}
                  className={`p-1 rounded text-[10px] ${getUrgencyColor(suggestion.urgency)}`}
                >
                  <div className="font-medium truncate">{suggestion.sop_title}</div>
                  <div className="text-[9px] opacity-90 line-clamp-1 mt-0.5">{suggestion.reason}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Condition Status / All Clear - Always at bottom */}
        <div className="mt-auto pt-1.5 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
          {criticalConditions.length > 0 ? (
            <div className="flex items-center space-x-1 text-[10px] text-red-600 dark:text-red-400">
              <ExclamationTriangleIcon className="h-2.5 w-2.5 flex-shrink-0" />
              <span className="truncate">{criticalConditions.length} critical</span>
            </div>
          ) : !hasPendingAdjustments && !hasSuggestions ? (
            <div className="flex items-center space-x-1 text-[10px] text-green-600 dark:text-green-400">
              <CheckCircleIcon className="h-2.5 w-2.5 flex-shrink-0" />
              <span className="truncate">All normal</span>
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}

