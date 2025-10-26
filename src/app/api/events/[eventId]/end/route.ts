import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { getServiceSupabaseClient } from '@/lib/supabaseServer';
import { cookies } from 'next/headers';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { eventId } = params;

    // Check if user is event organizer or superadmin
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id, event_name, created_by, is_current')
      .eq('id', eventId)
      .single();

    if (eventError || !event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const isSuperadmin = user.user_metadata?.role === 'superadmin';
    const isEventOrganizer = event.created_by === user.id;
    
    if (!isSuperadmin && !isEventOrganizer) {
      return NextResponse.json({ error: 'Not authorized to end this event' }, { status: 403 });
    }

    if (!event.is_current) {
      return NextResponse.json({ error: 'Event is already ended' }, { status: 400 });
    }

    // Use service client to bypass RLS and end the event
    const serviceSupabase = getServiceSupabaseClient();
    const { error: updateError } = await serviceSupabase
      .from('events')
      .update({ 
        is_current: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', eventId);

    if (updateError) {
      logger.error('Failed to end event', updateError, {
        component: 'EndEventAPI',
        action: 'endEvent',
        eventId,
        userId: user.id
      });
      return NextResponse.json({ error: 'Failed to end event' }, { status: 500 });
    }

    // Log the event ending
    await serviceSupabase.from('audit_log').insert({
      table_name: 'events',
      record_id: eventId,
      action: 'end_event',
      action_type: 'update',
      user_id: user.id,
      event_id: eventId,
      resource_type: 'event',
      details: {
        event_name: event.event_name,
        previous_status: 'current',
        new_status: 'ended'
      }
    });

    logger.info('Event ended successfully', {
      component: 'EndEventAPI',
      action: 'endEvent',
      eventId,
      eventName: event.event_name,
      userId: user.id
    });

    return NextResponse.json({ 
      success: true,
      message: `Event "${event.event_name}" has been ended successfully. You can now create a new event.`
    });

  } catch (error) {
    logger.error('Error ending event', error, {
      component: 'EndEventAPI',
      action: 'endEvent'
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
