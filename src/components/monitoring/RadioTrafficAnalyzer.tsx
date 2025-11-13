'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { RadioMessage, RadioMessageCategory, RadioMessagePriority } from '@/types/radio'
import {
  RadioIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ClockIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/supabase'

interface RadioTrafficAnalyzerProps {
  eventId: string | null
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
  critical: 'text-red-600 dark:text-red-400 font-semibold',
  high: 'text-orange-600 dark:text-orange-400 font-semibold',
  medium: 'text-yellow-600 dark:text-yellow-400',
  low: 'text-gray-600 dark:text-gray-400',
}

export default function RadioTrafficAnalyzer({ eventId, className }: RadioTrafficAnalyzerProps) {
  const [messages, setMessages] = useState<RadioMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<RadioMessageCategory | 'all'>('all')
  const [selectedPriority, setSelectedPriority] = useState<RadioMessagePriority | 'all'>('all')
  const [selectedChannel, setSelectedChannel] = useState<string>('all')
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [expandedMessageId, setExpandedMessageId] = useState<string | null>(null)

  const fetchMessages = useCallback(async () => {
    if (!eventId) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Build query
      let query = supabase
        .from('radio_messages' as any)
        .select('*')
        .eq('event_id', eventId)
        .order('created_at', { ascending: false })
        .limit(100)

      // Apply filters
      if (selectedCategory !== 'all') {
        query = query.eq('category', selectedCategory)
      }
      if (selectedPriority !== 'all') {
        query = query.eq('priority', selectedPriority)
      }
      if (selectedChannel !== 'all') {
        query = query.eq('channel', selectedChannel)
      }

      const { data, error: queryError } = await query

      if (queryError) {
        // If table doesn't exist, return empty array
        if (queryError.code === '42P01' || queryError.message?.includes('does not exist')) {
          setMessages([])
          setLoading(false)
          return
        }
        throw queryError
      }

      const messageRows = Array.isArray(data) ? (data as unknown as RadioMessage[]) : []
      let filteredMessages = messageRows

      // Apply search filter
      if (searchQuery.trim()) {
        const lowerQuery = searchQuery.toLowerCase()
        filteredMessages = filteredMessages.filter(msg => {
          const messageText = (msg.message || msg.transcription || '').toLowerCase()
          const fromCallsign = (msg.from_callsign || '').toLowerCase()
          const toCallsign = (msg.to_callsign || '').toLowerCase()
          return messageText.includes(lowerQuery) ||
                 fromCallsign.includes(lowerQuery) ||
                 toCallsign.includes(lowerQuery) ||
                 msg.channel.toLowerCase().includes(lowerQuery)
        })
      }

      setMessages(filteredMessages)
    } catch (err: any) {
      console.error('Error fetching radio messages:', err)
      setError(err.message || 'Failed to load radio messages')
    } finally {
      setLoading(false)
    }
  }, [eventId, selectedCategory, selectedPriority, selectedChannel, searchQuery])

  useEffect(() => {
    fetchMessages()

    if (autoRefresh) {
      const interval = setInterval(fetchMessages, 10000) // Refresh every 10 seconds
      return () => clearInterval(interval)
    }
  }, [fetchMessages, autoRefresh])

  // Get unique channels for filter
  const channels = Array.from(new Set(messages.map(m => m.channel))).sort()

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
    return (
      <div className={cn('p-4 bg-gray-50 dark:bg-gray-800 rounded-lg', className)}>
        <p className="text-sm text-gray-500 dark:text-gray-400">Please select an event to view radio traffic</p>
      </div>
    )
  }

  return (
    <div className={cn('bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm', className)}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <RadioIcon className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Radio Traffic Analyzer
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={cn(
                'p-2 rounded-md transition-colors',
                autoRefresh
                  ? 'text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                  : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              )}
              title={autoRefresh ? 'Auto-refresh on' : 'Auto-refresh off'}
            >
              <ArrowPathIcon className={cn('h-5 w-5', autoRefresh && 'animate-spin')} />
            </button>
            <button
              onClick={() => fetchMessages()}
              className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
              title="Refresh"
            >
              <ArrowPathIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="space-y-3">
          {/* Search */}
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search messages, callsigns, or channels..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Filter Row */}
          <div className="flex flex-wrap gap-2">
            {/* Category Filter */}
            <div className="flex items-center gap-2">
              <FunnelIcon className="h-4 w-4 text-gray-400" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value as RadioMessageCategory | 'all')}
                className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Categories</option>
                <option value="emergency">Emergency</option>
                <option value="incident">Incident</option>
                <option value="routine">Routine</option>
                <option value="coordination">Coordination</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Priority Filter */}
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value as RadioMessagePriority | 'all')}
              className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Priorities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>

            {/* Channel Filter */}
            <select
              value={selectedChannel}
              onChange={(e) => setSelectedChannel(e.target.value)}
              className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Channels</option>
              {channels.map(channel => (
                <option key={channel} value={channel}>{channel}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Messages List */}
      <div className="p-4">
        {loading && messages.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <ArrowPathIcon className="h-6 w-6 animate-spin text-blue-600" />
            <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">Loading messages...</span>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-sm text-red-500 dark:text-red-400">{error}</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-8">
            <RadioIcon className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600 mb-2" />
            <p className="text-sm text-gray-500 dark:text-gray-400">No radio messages found</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  'p-3 rounded-lg border transition-colors',
                  expandedMessageId === message.id
                    ? 'border-blue-300 dark:border-blue-600 bg-blue-50 dark:bg-blue-900/10'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-gray-50 dark:bg-gray-900/50'
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
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
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {message.channel}
                      </span>
                      <span className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
                        <ClockIcon className="h-3 w-3" />
                        {formatTime(message.created_at)}
                      </span>
                    </div>

                    <p className={cn(
                      'text-sm text-gray-900 dark:text-white',
                      expandedMessageId === message.id ? '' : 'line-clamp-2'
                    )}>
                      {message.transcription || message.message}
                    </p>

                    {(message.from_callsign || message.to_callsign) && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {message.from_callsign}
                        {message.to_callsign && ` → ${message.to_callsign}`}
                      </div>
                    )}

                    {expandedMessageId === message.id && (
                      <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700 space-y-1">
                        {message.incident_id && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            <span className="font-medium">Linked Incident:</span> {message.incident_id}
                          </div>
                        )}
                        {message.task_id && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            <span className="font-medium">Linked Task:</span> {message.task_id}
                          </div>
                        )}
                        {message.audio_url && (
                          <div className="text-xs">
                            <a
                              href={message.audio_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 dark:text-blue-400 hover:underline"
                            >
                              View Audio
                            </a>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => setExpandedMessageId(
                      expandedMessageId === message.id ? null : message.id
                    )}
                    className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  >
                    {expandedMessageId === message.id ? (
                      <ChevronUpIcon className="h-4 w-4" />
                    ) : (
                      <ChevronDownIcon className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {messages.length > 0 && (
          <div className="mt-4 text-center text-xs text-gray-500 dark:text-gray-400">
            Showing {messages.length} message{messages.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>
    </div>
  )
}

