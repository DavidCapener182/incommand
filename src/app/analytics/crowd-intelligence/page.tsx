'use client'

import React, { useEffect, useState } from 'react'
import { useEventContext } from '@/contexts/EventContext'
import { CrowdBehaviorMonitor } from '@/components/analytics/CrowdBehaviorMonitor'
import { WelfareSentimentPanel } from '@/components/analytics/WelfareSentimentPanel'
import { CrowdAlertsList } from '@/components/analytics/CrowdAlertsList'
import { CrowdIntelligenceSummary } from '@/types/crowdIntelligence'

export default function CrowdIntelligencePage() {
  const { eventId, loading: eventLoading } = useEventContext()
  const [summary, setSummary] = useState<CrowdIntelligenceSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!eventId) {
      setLoading(false)
      return
    }

    const controller = new AbortController()

    async function loadSummary() {
      setLoading(true)
      setError(null)

      try {
        const response = await fetch(`/api/crowd-intelligence?eventId=${eventId}`, {
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error('Failed to load crowd intelligence data')
        }

        const payload = await response.json()
        setSummary(payload.data)
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          setError(err?.message ?? 'Unexpected error')
        }
      } finally {
        setLoading(false)
      }
    }

    loadSummary()
    return () => controller.abort()
  }, [eventId])

  if (eventLoading || loading) {
    return (
      <div className="space-y-4 p-6">
        <div className="h-6 w-48 animate-pulse rounded bg-muted" />
        <div className="grid gap-4 md:grid-cols-2">
          <div className="h-64 animate-pulse rounded-2xl bg-muted" />
          <div className="h-64 animate-pulse rounded-2xl bg-muted" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
          {error}
        </div>
      </div>
    )
  }

  if (!summary) {
    return (
      <div className="p-6">
        <div className="rounded-2xl border border-border/60 bg-background p-6 text-sm text-muted-foreground">
          Select an event to view crowd intelligence insights.
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Crowd Intelligence</h1>
        <p className="text-sm text-muted-foreground">
          Behaviour detection, welfare sentiment and crowd comfort signals for the current event.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <CrowdBehaviorMonitor insights={summary.behaviorInsights} loading={false} />
        </div>
        <CrowdAlertsList alerts={summary.criticalAlerts} />
      </div>

      <WelfareSentimentPanel insights={summary.welfareInsights} />
    </div>
  )
}


