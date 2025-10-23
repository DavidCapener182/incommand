import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const inviteId = searchParams.get('inviteId');
    const role = searchParams.get('role');
    const eventId = searchParams.get('eventId');
    const isTemporary = searchParams.get('isTemporary') === 'true';

    if (!inviteId || !role || !eventId) {
      logger.error('Missing invite callback parameters', null, {
        component: 'InviteCallbackAPI',
        action: 'validateParams',
        inviteId: inviteId ?? undefined,
        role: role ?? undefined,
        eventId: eventId ?? undefined,
        isTemporary,
        url: request.url
      });
      return NextResponse.redirect(new URL('/login?error=invalid_invite', request.url));
    }

    logger.info('Invite callback received', {
      component: 'InviteCallbackAPI',
      action: 'inviteCallback',
      inviteId,
      role,
      eventId,
      isTemporary,
      url: request.url
    });

    const supabase = createRouteHandlerClient({ cookies });

    // Get user from the session (after magic link verification)
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      logger.error('Failed to get user from session in invite callback', userError, {
        component: 'InviteCallbackAPI',
        action: 'getUser',
        inviteId,
        eventId
      });
      return NextResponse.redirect(new URL('/login?error=authentication_failed', request.url));
    }

    logger.info('User authenticated successfully', {
      component: 'InviteCallbackAPI',
      action: 'userAuthenticated',
      userId: user.id,
      email: user.email,
      inviteId,
      eventId
    });

    // Create or update profile
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name || user.email,
      }, { onConflict: 'id' });

    if (profileError) {
      logger.error('Error upserting profile in invite callback', profileError, {
        component: 'InviteCallbackAPI',
        action: 'upsertProfile',
        userId: user.id,
        eventId
      });
    }

    // Create or update event membership
    const { error: memberError } = await supabase
      .from('event_members')
      .upsert({
        event_id: eventId,
        user_id: user.id,
        invite_id: inviteId,
        full_name: user.user_metadata?.full_name || user.email,
        email: user.email,
        role: role,
        is_temporary: isTemporary,
      }, { onConflict: 'event_id,user_id' });

    if (memberError) {
      logger.error('Error upserting event member in invite callback', memberError, {
        component: 'InviteCallbackAPI',
        action: 'upsertEventMember',
        userId: user.id,
        eventId,
        inviteId
      });
    }

    // Log successful invite redemption
    await supabase.from('audit_log').insert({
      user_id: user.id,
      event_id: eventId,
      action: 'invite_redemption_success',
      details: {
        invite_id: inviteId,
        role: role,
        is_temporary: isTemporary
      }
    });

    logger.info('Redirecting to incidents page', {
      component: 'InviteCallbackAPI',
      action: 'redirectToIncidents',
      userId: user.id,
      eventId
    });

    // Redirect to the incidents page
    return NextResponse.redirect(new URL('/incidents', request.url));

  } catch (error: any) {
    logger.error('Unhandled error in invite callback', error, {
      component: 'InviteCallbackAPI',
      action: 'inviteCallback'
    });
    return NextResponse.redirect(new URL('/login?error=system_error', request.url));
  }
}