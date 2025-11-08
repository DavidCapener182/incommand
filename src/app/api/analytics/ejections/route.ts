import { NextResponse } from 'next/server'
import { getServiceSupabaseClient } from '@/lib/supabaseServer'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const INCIDENT_TYPES = ['Ejection', 'ejection', 'Refusal', 'refusal']

export async function GET() {
  try {
    const supabase = getServiceSupabaseClient()

    const now = Date.now()
    const oneHourAgo = new Date(now - 60 * 60 * 1000).toISOString()
    const twentyFourHoursAgo = new Date(now - 24 * 60 * 60 * 1000).toISOString()
    const fortyEightHoursAgo = new Date(now - 48 * 60 * 60 * 1000).toISOString()

    const { data: currentEvent } = await supabase
      .from('events')
      .select('id')
      .eq('is_current', true)
      .maybeSingle()

    let query = supabase
      .from('incident_logs')
      .select('id, incident_type, created_at')
      .gte('created_at', fortyEightHoursAgo)
      .in('incident_type', INCIDENT_TYPES)

    if (currentEvent?.id) {
      query = query.eq('event_id', currentEvent.id)
    }

    const { data, error } = await query

    if (error) {
      throw error
    }

    const records = data || []
    const last24 = records.filter((record) => record.created_at >= twentyFourHoursAgo)
    const previous24 = records.filter((record) => record.created_at < twentyFourHoursAgo)
    const lastHour = last24.filter((record) => record.created_at >= oneHourAgo)

    let trend: 'up' | 'down' | 'stable' = 'stable'
    if (previous24.length === 0 && last24.length > 0) {
      trend = 'up'
    } else if (last24.length > previous24.length) {
      trend = 'up'
    } else if (last24.length < previous24.length && previous24.length > 0) {
      trend = 'down'
    }

    return NextResponse.json({
      total: last24.length,
      recent: lastHour.length,
      trend,
      eventId: currentEvent?.id || null
    })
  } catch (error) {
    console.error('Failed to load ejection statistics', error)
    return NextResponse.json({ error: 'Unable to load ejection statistics' }, { status: 500 })
  }
}
