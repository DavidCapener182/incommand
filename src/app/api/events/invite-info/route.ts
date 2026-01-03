import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabaseClient } from '@/lib/supabaseServer';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

// Hash code for comparison (same as in invites route)
function hashCode(code: string): string {
  return crypto.scryptSync(code, 'incommand-invite-salt', 64).toString('hex');
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
      return NextResponse.json({ error: 'Missing invite code' }, { status: 400 });
    }

    const supabase = getServiceSupabaseClient();
    const codeHash = hashCode(code);

    // Find the invite by code hash
    const { data: invite, error: inviteError } = await supabase
      .from('event_invites')
      .select(`
        id,
        event_id,
        status,
        events (
          id,
          event_name
        )
      `)
      .eq('token_hash', codeHash)
      .eq('status', 'active')
      .single();

    if (inviteError || !invite) {
      return NextResponse.json({ error: 'Invalid or expired invite code' }, { status: 404 });
    }

    const events = (invite as any).events;
    const eventName = Array.isArray(events)
      ? events[0]?.event_name
      : events?.event_name;

    return NextResponse.json({
      eventName: eventName || 'Event',
      eventId: (invite as any).event_id,
      inviteId: (invite as any).id
    });

  } catch (error) {
    console.error('Error fetching invite info:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
