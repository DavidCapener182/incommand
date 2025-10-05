'use client'

import React, { createContext, useCallback, useContext, useMemo, useState } from 'react'

import { useWebSocket } from '@/hooks/useWebSocket'
import type { WebSocketMessage } from '@/lib/websocketService'

interface IncidentSummaryCounts {
  open: number
  in_progress: number
  closed: number
  total: number
}

interface IncidentSummaryState {
  counts: IncidentSummaryCounts
  lastUpdated: string | null
}

interface IncidentSummaryContextValue extends IncidentSummaryState {
  updateCounts: (partial: Partial<IncidentSummaryCounts>, timestamp?: string) => void
}

const defaultCounts: IncidentSummaryCounts = {
  open: 0,
  in_progress: 0,
  closed: 0,
  total: 0,
}

const IncidentSummaryContext = createContext<IncidentSummaryContextValue | null>(null)

export function IncidentSummaryProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<IncidentSummaryState>({
    counts: defaultCounts,
    lastUpdated: null,
  })

  const updateCounts = useCallback(
    (partial: Partial<IncidentSummaryCounts>, timestamp?: string) => {
      setState((prev) => {
        const nextCounts: IncidentSummaryCounts = {
          ...prev.counts,
          ...partial,
        }

        const open = partial.open ?? prev.counts.open
        const inProgress = partial.in_progress ?? prev.counts.in_progress
        const closed = partial.closed ?? prev.counts.closed
        const total = partial.total ?? open + inProgress + closed

        nextCounts.open = open
        nextCounts.in_progress = inProgress
        nextCounts.closed = closed
        nextCounts.total = total

        const hasChanged =
          nextCounts.open !== prev.counts.open ||
          nextCounts.in_progress !== prev.counts.in_progress ||
          nextCounts.closed !== prev.counts.closed ||
          nextCounts.total !== prev.counts.total

        if (!hasChanged && (!timestamp || prev.lastUpdated === timestamp)) {
          return prev
        }

        return {
          counts: nextCounts,
          lastUpdated: timestamp ?? new Date().toISOString(),
        }
      })
    },
    []
  )

  const handleMessage = useCallback(
    (message: WebSocketMessage) => {
      if (message.type !== 'incident_summary_update' || !message.payload) {
        return
      }

      const { open, in_progress, closed, timestamp, total } = message.payload as {
        open?: number
        in_progress?: number
        closed?: number
        total?: number
        timestamp?: string
      }

      updateCounts(
        {
          open,
          in_progress,
          closed,
          total,
        },
        timestamp
      )
    },
    [updateCounts]
  )

  useWebSocket({
    channelName: 'incident-summary',
    onMessage: handleMessage,
  })

  const value = useMemo<IncidentSummaryContextValue>(
    () => ({
      counts: state.counts,
      lastUpdated: state.lastUpdated,
      updateCounts,
    }),
    [state.counts, state.lastUpdated, updateCounts]
  )

  return <IncidentSummaryContext.Provider value={value}>{children}</IncidentSummaryContext.Provider>
}

export function useIncidentSummary() {
  const context = useContext(IncidentSummaryContext)
  if (!context) {
    throw new Error('useIncidentSummary must be used within an IncidentSummaryProvider')
  }
  return context
}
