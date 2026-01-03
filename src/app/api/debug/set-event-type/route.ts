import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { eventType } = await request.json()
    
    if (!eventType) {
      return NextResponse.json({ error: 'eventType is required' }, { status: 400 })
    }

    // Update the current event's event_type
    const { data, error } = await (supabase as any)
      .from('events')
      .update({ event_type: eventType })
      .eq('is_current', true)
      .select('id, event_name, event_type')

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data,
      message: `Event type updated to ${eventType}`
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update event type' }, { status: 500 })
  }
}
