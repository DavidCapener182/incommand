'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { RadioChannelHealth, RadioChannel } from '@/types/radio'
import {
  SignalIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/supabase'

interface ChannelHealthCardProps {
  eventId: string | null
  channel?: string // If provided, show single channel; otherwise show all channels
  className?: string
}

export default function ChannelHealthCard({ eventId, channel, className }: ChannelHealthCardProps) {
  const [channels, setChannels] = useState<RadioChannel[]>([])
  const [healthData, setHealthData] = useState<RadioChannelHealth[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(true)

  const fetchChannelHealth = useCallback(async () => {
    if (!eventId) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Fetch channels
      const channelsResponse = await fetch(`/api/radio/channels?event_id=${eventId}`)
      const channelsResult = await channelsResponse.json()

      if (!channelsResponse.ok) {
        throw new Error(channelsResult.error || 'Failed to fetch channels')
      }

      let channelsData = (channelsResult.data || []) as RadioChannel[]

      // Filter by specific channel if provided
      if (channel) {
        channelsData = channelsData.filter(c => c.channel === channel)
      }

      setChannels(channelsData)

      // Fetch health data for each channel
      const healthPromises = channelsData.map(async (ch) => {
        try {
          const healthResponse = await fetch(
            `/api/radio/channels/${encodeURIComponent(ch.channel)}/health?event_id=${eventId}&hours=24`
          )
          const healthResult = await healthResponse.json()

          if (healthResponse.ok && healthResult.data) {
            return healthResult.data as RadioChannelHealth[]
          }
          return []
        } catch (err) {
          console.error(`Error fetching health for channel ${ch.channel}:`, err)
          return []
        }
      })

      const allHealthData = (await Promise.all(healthPromises)).flat()
      setHealthData(allHealthData)
    } catch (err: any) {
      console.error('Error fetching channel health:', err)
      setError(err.message || 'Failed to load channel health')
    } finally {
      setLoading(false)
    }
  }, [eventId, channel])

  useEffect(() => {
    fetchChannelHealth()

    if (autoRefresh) {
      const interval = setInterval(fetchChannelHealth, 30000) // Refresh every 30 seconds
      return () => clearInterval(interval)
    }
  }, [eventId, channel, autoRefresh, fetchChannelHealth])

  const getHealthColor = (score: number | null) => {
    if (score === null) return 'text-gray-400'
    if (score >= 80) return 'text-green-600 dark:text-green-400'
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400'
    if (score >= 40) return 'text-orange-600 dark:text-orange-400'
    return 'text-red-600 dark:text-red-400'
  }

  const getHealthBgColor = (score: number | null) => {
    if (score === null) return 'bg-gray-100 dark:bg-gray-800'
    if (score >= 80) return 'bg-green-100 dark:bg-green-900/20'
    if (score >= 60) return 'bg-yellow-100 dark:bg-yellow-900/20'
    if (score >= 40) return 'bg-orange-100 dark:bg-orange-900/20'
    return 'bg-red-100 dark:bg-red-900/20'
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  }

  if (!eventId) {
    return (
      <div className={cn('p-4 bg-gray-50 dark:bg-gray-800 rounded-lg', className)}>
        <p className="text-sm text-gray-500 dark:text-gray-400">Please select an event to view channel health</p>
      </div>
    )
  }

  return (
    <div className={cn('bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm', className)}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SignalIcon className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {channel ? `Channel: ${channel}` : 'Channel Health'}
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
              onClick={() => fetchChannelHealth()}
              className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
              title="Refresh"
            >
              <ArrowPathIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {loading && channels.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <ArrowPathIcon className="h-6 w-6 animate-spin text-blue-600" />
            <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">Loading channel health...</span>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-sm text-red-500 dark:text-red-400">{error}</p>
          </div>
        ) : channels.length === 0 ? (
          <div className="text-center py-8">
            <SignalIcon className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600 mb-2" />
            <p className="text-sm text-gray-500 dark:text-gray-400">No channels found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {channels.map((ch) => {
              const latestHealth = healthData
                .filter(h => h.channel === ch.channel)
                .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0]

              const healthScore = latestHealth?.health_score ?? ch.health_score

              return (
                <div
                  key={ch.channel}
                  className={cn(
                    'p-4 rounded-lg border',
                    ch.overload_indicator
                      ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/10'
                      : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50'
                  )}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <SignalIcon className="h-5 w-5 text-blue-600" />
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {ch.channel}
                      </h3>
                      {ch.overload_indicator && (
                        <ExclamationTriangleIcon className="h-5 w-5 text-red-600 dark:text-red-400" />
                      )}
                    </div>
                    <div className={cn(
                      'px-3 py-1 rounded-full text-sm font-semibold',
                      getHealthBgColor(healthScore),
                      getHealthColor(healthScore)
                    )}>
                      {healthScore !== null ? `${healthScore}/100` : 'N/A'}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="text-gray-500 dark:text-gray-400 text-xs mb-1">Messages</div>
                      <div className="font-semibold text-gray-900 dark:text-white">
                        {ch.message_count.toLocaleString()}
                      </div>
                    </div>

                    {latestHealth && (
                      <>
                        {latestHealth.avg_response_time_seconds !== null && (
                          <div>
                            <div className="text-gray-500 dark:text-gray-400 text-xs mb-1">Avg Response</div>
                            <div className="font-semibold text-gray-900 dark:text-white">
                              {latestHealth.avg_response_time_seconds.toFixed(1)}s
                            </div>
                          </div>
                        )}

                        <div>
                          <div className="text-gray-500 dark:text-gray-400 text-xs mb-1">Status</div>
                          <div className={cn(
                            'font-semibold',
                            latestHealth.overload_indicator
                              ? 'text-red-600 dark:text-red-400'
                              : 'text-green-600 dark:text-green-400'
                          )}>
                            {latestHealth.overload_indicator ? 'Overloaded' : 'Normal'}
                          </div>
                        </div>
                      </>
                    )}

                    {ch.latest_message_at && (
                      <div>
                        <div className="text-gray-500 dark:text-gray-400 text-xs mb-1">Last Message</div>
                        <div className="font-semibold text-gray-900 dark:text-white">
                          {formatTime(ch.latest_message_at)}
                        </div>
                      </div>
                    )}
                  </div>

                  {latestHealth?.overload_indicator && latestHealth.metadata?.overloadReason && (
                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex items-start gap-2">
                        <ExclamationTriangleIcon className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5" />
                        <div className="text-xs text-red-600 dark:text-red-400">
                          {latestHealth.metadata.overloadReason}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

