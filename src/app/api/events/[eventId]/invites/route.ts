import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { getServiceSupabaseClient } from '@/lib/supabaseServer';
import { cookies } from 'next/headers';
import crypto from 'crypto';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

interface CreateInviteRequest {
  role: 'medic' | 'security' | 'production' | 'read_only';
  intended_email?: string;
  allow_multiple?: boolean;
  max_uses?: number;
  expires_at: string; // ISO string
  metadata?: Record<string, any>;
}

// Generate a simple 6-digit invite code
function generateInviteCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Hash code for secure storage
function hashCode(code: string): string {
  return crypto.scryptSync(code, 'incommand-invite-salt', 64).toString('hex');
}

// Verify code against hash
function verifyCode(code: string, hash: string): boolean {
  const codeHash = crypto.scryptSync(code, 'incommand-invite-salt', 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(codeHash), Buffer.from(hash));
}

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
    const body: CreateInviteRequest = await request.json();

    // Validate required fields
    if (!body.role || !body.expires_at) {
      return NextResponse.json(
        { error: 'Missing required fields: role, expires_at' },
        { status: 400 }
      );
    }

    // Check if user is event organizer
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id, created_by')
      .eq('id', eventId)
      .single();

    if (eventError || !event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Check if user is event organizer or superadmin
    const isSuperadmin = user.user_metadata?.role === 'superadmin';
    const isEventOrganizer = event.created_by === user.id;
    
    if (!isSuperadmin && !isEventOrganizer) {
      return NextResponse.json({ error: 'Not authorized to create invites for this event' }, { status: 403 });
    }

    // Generate simple 6-digit code
    const inviteCode = generateInviteCode();
    const codeHash = hashCode(inviteCode);

    // Create invite record using service client to bypass RLS
    const serviceSupabase = getServiceSupabaseClient();
    const { data: invite, error: inviteError } = await (serviceSupabase as any)
      .from('event_invites')
      .insert({
        event_id: eventId,
        created_by: user.id,
        intended_email: body.intended_email,
        role: body.role,
        token_hash: codeHash,
        allow_multiple: body.allow_multiple || false,
        max_uses: body.max_uses || 1,
        expires_at: body.expires_at,
        metadata: body.metadata || {}
      })
      .select()
      .single();

    if (inviteError) {
      // If table doesn't exist, return error
      if (inviteError.code === '42P01') {
        return NextResponse.json({ error: 'Event invites feature not available. Please contact support to set up the required database tables.' }, { status: 503 });
      }
      
      logger.error('Failed to create invite', inviteError, {
        component: 'EventInvitesAPI',
        action: 'createInvite',
        eventId,
        userId: user.id
      });
      return NextResponse.json({ error: 'Failed to create invite' }, { status: 500 });
    }

    // Log invite creation using service client
    await (serviceSupabase as any).from('audit_log').insert({
      table_name: 'event_invites',
      record_id: invite.id,
      action: 'create_invite',
      action_type: 'create',
      user_id: user.id,
      event_id: eventId,
      resource_type: 'event_invite',
      details: {
        role: body.role,
        intended_email: body.intended_email,
        expires_at: body.expires_at
      }
    });

    logger.info('Event invite created', {
      component: 'EventInvitesAPI',
      action: 'createInvite',
      eventId,
      inviteId: invite.id,
      role: body.role,
      userId: user.id
    });

    // Return the unhashed token for the client (this is the only time it's returned)
    // Create direct invite link
    const inviteLink = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/invite?code=${inviteCode}`;
    
    return NextResponse.json({
      success: true,
      invite: {
        id: invite.id,
        code: inviteCode, // 6-digit code
        link: inviteLink, // Direct invite link
        role: invite.role,
        expires_at: invite.expires_at,
        max_uses: invite.max_uses,
        allow_multiple: invite.allow_multiple
      }
    });

  } catch (error) {
    logger.error('Error creating event invite', error, {
      component: 'EventInvitesAPI',
      action: 'createInvite'
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(
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

    // Check if user is event organizer
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id, created_by')
      .eq('id', eventId)
      .single();

    if (eventError || !event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Check if user is event organizer or superadmin
    const isSuperadmin = user.user_metadata?.role === 'superadmin';
    const isEventOrganizer = event.created_by === user.id;
    
    if (!isSuperadmin && !isEventOrganizer) {
      return NextResponse.json({ error: 'Not authorized to view invites for this event' }, { status: 403 });
    }

    // Get all invites for the event using service client to bypass RLS
    const serviceSupabase = getServiceSupabaseClient();
    const { data: invites, error: invitesError } = await serviceSupabase
      .from('event_invites')
      .select(`
        id,
        role,
        intended_email,
        allow_multiple,
        max_uses,
        used_count,
        expires_at,
        last_used_at,
        status,
        created_at,
        metadata
      `)
      .eq('event_id', eventId)
      .order('created_at', { ascending: false });

    if (invitesError) {
      // If table doesn't exist, return empty array
      if (invitesError.code === '42P01') {
        return NextResponse.json({ invites: [] });
      }
      
      logger.error('Failed to fetch invites', invitesError, {
        component: 'EventInvitesAPI',
        action: 'getInvites',
        eventId,
        userId: user.id
      });
      return NextResponse.json({ error: 'Failed to fetch invites' }, { status: 500 });
    }

    return NextResponse.json({ invites });

  } catch (error) {
    logger.error('Error fetching event invites', error, {
      component: 'EventInvitesAPI',
      action: 'getInvites'
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
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
    const { searchParams } = new URL(request.url);
    const inviteId = searchParams.get('inviteId');
    const body = await request.json().catch(() => ({}));
    const isPermanentDelete = body.permanent === true;

    if (!inviteId) {
      return NextResponse.json({ error: 'Missing inviteId parameter' }, { status: 400 });
    }

    // Check if user is event organizer
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id, created_by')
      .eq('id', eventId)
      .single();

    if (eventError || !event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Check if user is event organizer or superadmin
    const isSuperadmin = user.user_metadata?.role === 'superadmin';
    const isEventOrganizer = event.created_by === user.id;
    
    if (!isSuperadmin && !isEventOrganizer) {
      return NextResponse.json({ error: 'Not authorized to revoke invites for this event' }, { status: 403 });
    }

    // Handle revoke or permanent delete using service client to bypass RLS
    const serviceSupabase = getServiceSupabaseClient();
    let operationError;
    let actionType;

    if (isPermanentDelete) {
      // Permanently delete the invite
      const { error: deleteError } = await serviceSupabase
        .from('event_invites')
        .delete()
        .eq('id', inviteId)
        .eq('event_id', eventId);
      
      operationError = deleteError;
      actionType = 'delete_invite';
    } else {
      // Revoke the invite (soft delete)
      const { error: revokeError } = await (serviceSupabase as any)
        .from('event_invites')
        .update({ status: 'revoked' })
        .eq('id', inviteId)
        .eq('event_id', eventId);
      
      operationError = revokeError;
      actionType = 'revoke_invite';
    }

    if (operationError) {
      logger.error(`Failed to ${isPermanentDelete ? 'delete' : 'revoke'} invite`, operationError, {
        component: 'EventInvitesAPI',
        action: actionType,
        eventId,
        inviteId,
        userId: user.id
      });
      return NextResponse.json({ error: `Failed to ${isPermanentDelete ? 'delete' : 'revoke'} invite` }, { status: 500 });
    }

    // Log the operation
    await (serviceSupabase as any).from('audit_log').insert({
      table_name: 'event_invites',
      record_id: inviteId,
      action: actionType,
      action_type: 'delete',
      user_id: user.id,
      event_id: eventId,
      resource_type: 'event_invite',
      details: {
        permanent: isPermanentDelete
      }
    });

    logger.info(`Event invite ${isPermanentDelete ? 'deleted' : 'revoked'}`, {
      component: 'EventInvitesAPI',
      action: actionType,
      eventId,
      inviteId,
      userId: user.id
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    logger.error('Error revoking event invite', error, {
      component: 'EventInvitesAPI',
      action: 'revokeInvite'
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
