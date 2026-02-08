'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent } from '@/components/ui/card'
import {
  UsersIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline'

interface LiveMetricsPanelProps {
  eventId: string
  refreshInterval?: number
}

interface Metrics {
  occupancyPercent: number
  activeIncidents: number
  staffDeployed: number
  avgResponseMin: number
}

export default function LiveMetricsPanel({ eventId, refreshInterval = 30000 }: LiveMetricsPanelProps) {
  const [metrics, setMetrics] = useState<Metrics>({
    occupancyPercent: 0,
    activeIncidents: 0,
    staffDeployed: 0,
    avgResponseMin: 0,
  })
  const [loading, setLoading] = useState(true)

  const fetchMetrics = useCallback(async () => {
    try {
      const [
        { data: incidents },
        { data: assignments },
        { data: event },
      ] = await Promise.all([
        supabase
          .from('incident_logs')
          .select('id, is_closed, created_at, updated_at')
          .eq('event_id', eventId),
        supabase
          .from('position_assignments')
          .select('id')
          .eq('event_id', eventId),
        supabase
          .from('events')
          .select('expected_attendance')
          .eq('id', eventId)
          .single(),
      ])

      const incidentList = (incidents || []) as any[]
      const active = incidentList.filter((i) => !i.is_closed).length
      const withResponse = incidentList.filter((i) => i.created_at && i.updated_at)
      const avgResponse = withResponse.length > 0
        ? withResponse.reduce((acc: number, i: any) => {
            const diff = new Date(i.updated_at).getTime() - new Date(i.created_at).getTime()
            return acc + diff / 60000
          }, 0) / withResponse.length
        : 0

      const capacity = (event as any)?.expected_attendance || 0
      const occupancy = capacity > 0 ? Math.min(Math.round((incidentList.length / capacity) * 100), 100) : 0

      setMetrics({
        occupancyPercent: occupancy,
        activeIncidents: active,
        staffDeployed: (assignments || []).length,
        avgResponseMin: Math.round(avgResponse * 10) / 10,
      })
    } catch (err) {
      console.error('LiveMetricsPanel: failed to fetch', err)
    } finally {
      setLoading(false)
    }
  }, [eventId])

  useEffect(() => {
    fetchMetrics()
    const id = setInterval(fetchMetrics, refreshInterval)
    return () => clearInterval(id)
  }, [fetchMetrics, refreshInterval])

  const cards = [
    {
      label: 'Occupancy',
      value: `${metrics.occupancyPercent}%`,
      icon: UsersIcon,
      color: 'text-blue-500',
    },
    {
      label: 'Active incidents',
      value: String(metrics.activeIncidents),
      icon: ExclamationTriangleIcon,
      color: metrics.activeIncidents > 5 ? 'text-red-500' : 'text-yellow-500',
    },
    {
      label: 'Staff deployed',
      value: String(metrics.staffDeployed),
      icon: CheckCircleIcon,
      color: 'text-green-500',
    },
    {
      label: 'Avg response',
      value: `${metrics.avgResponseMin}m`,
      icon: ClockIcon,
      color: 'text-purple-500',
    },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {cards.map((c) => (
        <Card key={c.label}>
          <CardContent className="p-4 flex items-center gap-3">
            <c.icon className={`h-8 w-8 shrink-0 ${c.color}`} />
            <div>
              <p className="text-xs text-muted-foreground">{c.label}</p>
              <p className="text-xl font-bold">{loading ? '—' : c.value}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
