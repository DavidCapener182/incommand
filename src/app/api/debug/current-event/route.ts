import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { data: event, error } = await supabase
      .from('events')
      .select('id, event_name, event_type, venue_name')
      .eq('is_current', true)
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      event,
      message: 'Current event data retrieved successfully'
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch current event' }, { status: 500 })
  }
}
