'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { RadioMessage, RadioMessageCategory, RadioMessagePriority } from '@/types/radio'
import { 
  RadioIcon, 
  ClockIcon, 
  ExclamationTriangleIcon,
  CheckCircleIcon,
  InformationCircleIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline'
import { cn } from '@/lib/utils'

interface IncidentRadioMessagesProps {
  incidentId: string
  eventId?: string | null
  className?: string
}

const categoryColors: Record<RadioMessageCategory, string> = {
  emergency: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
  incident: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400',
  routine: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
  coordination: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
  other: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
}

const priorityColors: Record<RadioMessagePriority, string> = {
  critical: 'text-red-600 dark:text-red-400',
  high: 'text-orange-600 dark:text-orange-400',
  medium: 'text-yellow-600 dark:text-yellow-400',
  low: 'text-gray-600 dark:text-gray-400',
}

export default function IncidentRadioMessages({ 
  incidentId, 
  eventId,
  className 
}: IncidentRadioMessagesProps) {
  const [messages, setMessages] = useState<RadioMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchRadioMessages = useCallback(async () => {
    if (!incidentId) return

    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams({
        incident_id: incidentId,
        limit: '10',
      })
      if (eventId) {
        params.append('event_id', eventId)
      }

      const response = await fetch(`/api/radio/messages?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch radio messages')
      }

      const { data } = await response.json()
      setMessages(data || [])
    } catch (err: any) {
      console.error('Error fetching radio messages:', err)
      setError(err.message || 'Failed to load radio messages')
    } finally {
      setLoading(false)
    }
  }, [incidentId, eventId])

  useEffect(() => {
    fetchRadioMessages()
  }, [fetchRadioMessages])

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('en-GB', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className={cn('bg-card border border-border rounded-xl p-4', className)}>
        <div className="flex items-center justify-center py-4">
          <ArrowPathIcon className="h-5 w-5 animate-spin text-gray-400" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={cn('bg-card border border-border rounded-xl p-4', className)}>
        <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm">
          <ExclamationTriangleIcon className="h-4 w-4" />
          <span>{error}</span>
        </div>
      </div>
    )
  }

  if (messages.length === 0) {
    return null // Don't show section if no messages
  }

  return (
    <div className={cn('bg-card border border-border rounded-xl p-4 sm:p-6 shadow-sm', className)}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <RadioIcon className="h-5 w-5 text-blue-600" />
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            Related Radio Traffic
          </h3>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            ({messages.length})
          </span>
        </div>
        <button
          onClick={fetchRadioMessages}
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
          title="Refresh"
        >
          <ArrowPathIcon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
        </button>
      </div>

      <div className="space-y-2">
        {messages.map((message) => (
          <div
            key={message.id}
            className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2 flex-wrap">
                {message.category && (
                  <span className={cn(
                    'text-xs font-medium px-2 py-0.5 rounded',
                    categoryColors[message.category]
                  )}>
                    {message.category}
                  </span>
                )}
                {message.priority && (
                  <span className={cn(
                    'text-xs font-medium',
                    priorityColors[message.priority]
                  )}>
                    {message.priority}
                  </span>
                )}
                {message.channel && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {message.channel}
                  </span>
                )}
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                <ClockIcon className="h-3 w-3" />
                {formatTime(message.created_at)}
              </span>
            </div>

            <div className="space-y-1">
              {message.from_callsign && (
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  <span className="font-medium">From:</span> {message.from_callsign}
                  {message.to_callsign && (
                    <> <span className="font-medium">To:</span> {message.to_callsign}</>
                  )}
                </div>
              )}

              <p className="text-sm text-gray-900 dark:text-white">
                {message.transcription || message.message}
              </p>

              {message.audio_url && (
                <div className="pt-1">
                  <audio controls className="w-full h-8" src={message.audio_url}>
                    Your browser does not support the audio element.
                  </audio>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

