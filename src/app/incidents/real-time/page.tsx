'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useEventContext } from '@/contexts/EventContext'
import { FeatureGate } from '@/components/FeatureGate'
import { useUserPlan } from '@/hooks/useUserPlan'
import { PageWrapper } from '@/components/layout/PageWrapper'
import IncidentMap, { type IncidentMapIncident } from '@/components/incidents/IncidentMap'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MapPinIcon } from '@heroicons/react/24/outline'

type IncidentRow = {
  id: number
  event_id: string
  incident_type: string | null
  priority: string | null
  status: string | null
  is_closed: boolean | null
  occurrence: string | null
  timestamp: string | null
  location: string | null
  latitude: number | null
  longitude: number | null
  logged_by_callsign: string | null
  updated_at?: string | null
}

function toMapIncident(row: IncidentRow): IncidentMapIncident {
  return {
    id: row.id,
    latitude: row.latitude ?? null,
    longitude: row.longitude ?? null,
    incident_type: row.incident_type,
    priority: row.priority,
    is_closed: row.is_closed,
    occurrence: row.occurrence,
    timestamp: row.timestamp,
    location: row.location,
    logged_by_callsign: row.logged_by_callsign,
  }
}

export default function RealTimeIncidentsPage() {
  const userPlan = useUserPlan() || 'starter'
  const { eventData } = useEventContext()
  const eventId = eventData?.id ?? null
  const [incidents, setIncidents] = useState<IncidentRow[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'open' | 'closed'>('all')
  const [selectedId, setSelectedId] = useState<number | null>(null)

  const fetchIncidents = useCallback(async () => {
    if (!eventId) return
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('incident_logs')
        .select('id, event_id, incident_type, priority, status, is_closed, occurrence, timestamp, location, latitude, longitude, logged_by_callsign, updated_at')
        .eq('event_id', eventId)
        .order('timestamp', { ascending: false })

      if (error) throw error
      setIncidents((data as IncidentRow[]) ?? [])
    } catch (e) {
      console.error('Error fetching incidents:', e)
      setIncidents([])
    } finally {
      setLoading(false)
    }
  }, [eventId])

  useEffect(() => {
    fetchIncidents()
  }, [fetchIncidents])

  useEffect(() => {
    if (!eventId) return
    const channel = supabase
      .channel(`incident_logs_rt_${eventId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'incident_logs', filter: `event_id=eq.${eventId}` }, () => {
        fetchIncidents()
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [eventId, fetchIncidents])

  const filtered = incidents.filter((i) => {
    if (filter === 'open') return !i.is_closed
    if (filter === 'closed') return i.is_closed
    return true
  })

  const mapIncidents = filtered.map(toMapIncident)

  return (
    <PageWrapper>
      <FeatureGate
        feature="real-time-incident-dashboard"
        plan={userPlan}
        showUpgradeCard={true}
        upgradeCardVariant="banner"
        upgradeCardDescription="Live feed of incidents with geolocation and status tracking on a map."
      >
        <div className="space-y-4">
          <div>
            <h1 className="text-2xl font-semibold">Real-Time Incident Dashboard</h1>
            <p className="text-muted-foreground text-sm">Live incidents with map and feed. Operational+ plans.</p>
          </div>

          {!eventId ? (
            <Card>
              <CardContent className="pt-6">Select an event to view the real-time incident dashboard.</CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Map</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <IncidentMap
                      incidents={mapIncidents}
                      className="w-full"
                      onIncidentClick={(inc) => setSelectedId(Number(inc.id))}
                    />
                  </CardContent>
                </Card>
              </div>
              <div>
                <Card>
                  <CardHeader className="pb-2 flex flex-row items-center justify-between">
                    <CardTitle className="text-base">Live feed</CardTitle>
                    <div className="flex gap-1">
                      {(['all', 'open', 'closed'] as const).map((f) => (
                        <button
                          key={f}
                          onClick={() => setFilter(f)}
                          className={`text-xs px-2 py-1 rounded ${filter === f ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
                        >
                          {f === 'all' ? 'All' : f === 'open' ? 'Open' : 'Closed'}
                        </button>
                      ))}
                    </div>
                  </CardHeader>
                  <CardContent className="p-0 max-h-[400px] overflow-y-auto">
                    {loading ? (
                      <div className="p-4 text-muted-foreground text-sm">Loading…</div>
                    ) : filtered.length === 0 ? (
                      <div className="p-4 text-muted-foreground text-sm">No incidents</div>
                    ) : (
                      <ul className="divide-y">
                        {filtered.slice(0, 50).map((inc) => (
                          <li
                            key={inc.id}
                            className={`p-3 text-sm cursor-pointer hover:bg-muted/50 ${selectedId === inc.id ? 'bg-muted' : ''}`}
                            onClick={() => setSelectedId(inc.id)}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <span className="font-medium truncate">{inc.incident_type ?? 'Incident'}</span>
                              <Badge variant={inc.is_closed ? 'secondary' : 'default'} className="shrink-0">
                                {inc.is_closed ? 'Closed' : 'Open'}
                              </Badge>
                            </div>
                            {inc.priority && (
                              <div className="text-xs text-muted-foreground mt-0.5">{inc.priority}</div>
                            )}
                            {inc.occurrence && (
                              <p className="text-xs mt-1 line-clamp-2">{inc.occurrence}</p>
                            )}
                            {inc.timestamp && (
                              <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                <MapPinIcon className="h-3 w-3" />
                                {inc.location || 'No location'}
                                <span>{new Date(inc.timestamp).toLocaleTimeString()}</span>
                              </div>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </FeatureGate>
    </PageWrapper>
  )
}
