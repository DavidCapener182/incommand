import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import type { SupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { z } from 'zod'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { normalizePriority } from '@/utils/incidentStyles'

const summaryParamsSchema = z.object({
  eventId: z.string().optional(),
})

interface IncidentRecord {
  id: string
  timestamp: string | null
  created_at?: string | null
  incident_type: string | null
  priority: string | null
  status: string | null
  responded_at?: string | null
  resolved_at?: string | null
  occurrence?: string | null
}

interface AnalyticsSummaryPayload {
  total: number
  high: number
  avg_response: number
  peak_hour: string
  notable: string[]
}

function getIncidentTimestamp(incident: IncidentRecord): string | null {
  return incident.timestamp || incident.created_at || null
}

function calculateResponseTimeMinutes(incident: IncidentRecord): number | null {
  const reportedAt = getIncidentTimestamp(incident)
  const respondedAt = incident.responded_at || incident.resolved_at || null

  if (!reportedAt || !respondedAt) {
    return null
  }

  const reported = new Date(reportedAt).getTime()
  const responded = new Date(respondedAt).getTime()

  if (Number.isNaN(reported) || Number.isNaN(responded) || responded < reported) {
    return null
  }

  const diffMinutes = (responded - reported) / (1000 * 60)
  return diffMinutes
}

function getHourBucket(timestamp: string | null): string | null {
  if (!timestamp) return null
  const date = new Date(timestamp)
  if (Number.isNaN(date.getTime())) return null
  return date.toISOString().slice(0, 13) + ':00'
}

function buildSummaryPayload(incidents: IncidentRecord[]): AnalyticsSummaryPayload {
  const now = Date.now()
  const twentyFourHoursAgo = now - 24 * 60 * 60 * 1000

  const recentIncidents = incidents.filter((incident) => {
    const ts = getIncidentTimestamp(incident)
    if (!ts) return false
    const time = new Date(ts).getTime()
    if (Number.isNaN(time)) return false
    return time >= twentyFourHoursAgo && time <= now
  })

  const total = recentIncidents.length

  const high = recentIncidents.filter((incident) => {
    const normalized = normalizePriority(incident.priority ?? undefined)
    return normalized === 'high' || normalized === 'urgent'
  }).length

  const responseTimes = recentIncidents
    .map(calculateResponseTimeMinutes)
    .filter((value): value is number => typeof value === 'number')

  const avgResponse = responseTimes.length
    ? Number((responseTimes.reduce((sum, current) => sum + current, 0) / responseTimes.length).toFixed(1))
    : 0

  const hourlyBuckets = new Map<string, number>()
  for (const incident of recentIncidents) {
    const bucket = getHourBucket(getIncidentTimestamp(incident))
    if (!bucket) continue
    hourlyBuckets.set(bucket, (hourlyBuckets.get(bucket) ?? 0) + 1)
  }

  let peakHour = 'N/A'
  if (hourlyBuckets.size > 0) {
    const [hour] = Array.from(hourlyBuckets.entries()).sort((a, b) => b[1] - a[1])[0]
    peakHour = hour
  }

  const notable = recentIncidents
    .filter((incident) => {
      const normalized = normalizePriority(incident.priority ?? undefined)
      return normalized === 'high' || normalized === 'urgent'
    })
    .sort((a, b) => {
      const timeA = new Date(getIncidentTimestamp(a) ?? 0).getTime()
      const timeB = new Date(getIncidentTimestamp(b) ?? 0).getTime()
      return timeB - timeA
    })
    .slice(0, 3)
    .map((incident) => {
      const when = getIncidentTimestamp(incident)
      const formatted = when
        ? new Date(when).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
        : 'Unknown time'
      const type = incident.incident_type || 'Incident'
      return `${formatted} – ${type}`
    })

  return {
    total,
    high,
    avg_response: avgResponse,
    peak_hour: peakHour,
    notable,
  }
}

async function fetchRecentIncidents(supabase: SupabaseClient, eventId?: string | null) {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  let query = supabase
    .from('incident_logs')
    .select('id, timestamp, created_at, incident_type, priority, status, responded_at, resolved_at, occurrence, event_id')
    .or(`timestamp.gte.${since},created_at.gte.${since}`)
    .order('timestamp', { ascending: false })
    .limit(500)

  if (eventId) {
    query = query.eq('event_id', eventId)
  }

  const { data, error } = await query

  if (error) {
    throw error
  }

  return (data ?? []) as IncidentRecord[]
}

function buildSummaryPrompt(summary: AnalyticsSummaryPayload): string {
  const notableLine = summary.notable.length > 0
    ? `- Notable incidents: ${summary.notable.join(', ')}`
    : '- Notable incidents: None highlighted'

  return `Analyze the following event operations data and produce a concise operational summary (max 3 sentences):

- Total incidents (last 24h): ${summary.total}
- High priority incidents: ${summary.high}
- Average response time: ${summary.avg_response} minutes
- Peak hour: ${summary.peak_hour}
${notableLine}

Focus on key trends, critical incidents, and operational posture.`
}

export async function GET(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies })

  try {
    const url = new URL(request.url)
    const params = summaryParamsSchema.parse({
      eventId: url.searchParams.get('eventId') ?? undefined,
    })

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let eventId = url.searchParams.get('eventId') ?? null

    if (!eventId) {
      const { data: currentEvent, error: currentEventError } = await supabase
        .from('events')
        .select('id')
        .eq('is_current', true)
        .maybeSingle()

      if (currentEventError) {
        throw currentEventError
      }

      eventId = currentEvent?.id ?? null
    }

    const incidents = await fetchRecentIncidents(supabase, eventId)
    const summary = buildSummaryPayload(incidents)

    const prompt = buildSummaryPrompt(summary)

    const aiResponse = await fetch(`${request.nextUrl.origin}/api/v1/ai/prompt`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        max_tokens: 180,
        temperature: 0.4,
      }),
    })

    if (!aiResponse.ok) {
      const { error } = await aiResponse.json().catch(() => ({ error: 'AI service failure' }))
      return NextResponse.json({
        summary,
        ai_summary: null,
        ai_error: error ?? 'Failed to generate AI summary',
      })
    }

    const aiData = await aiResponse.json()

    return NextResponse.json({
      summary,
      ai_summary: aiData.summary ?? null,
      ai_model: aiData.model ?? 'gpt-4-turbo-preview',
    })
  } catch (error) {
    console.error('Analytics summary error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
