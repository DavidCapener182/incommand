import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { getServiceSupabaseClient } from '@/lib/supabaseServer';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { inviteId, role, eventId, isTemporary, name, email } = await request.json();

    if (!inviteId || !role || !eventId || !name || !email) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const supabase = createRouteHandlerClient({ cookies });
    const serviceSupabase = getServiceSupabaseClient();

    // Get the authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      logger.error('Failed to get user from magic link auth', userError, {
        component: 'MagicLinkAuthAPI',
        action: 'getUser',
        inviteId,
        eventId
      });
      return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
    }

    // Verify the email matches the invite
    const { data: invite, error: inviteError } = await serviceSupabase
      .from('event_invites')
      .select('intended_email, status')
      .eq('id', inviteId)
      .single();

    if (inviteError || !invite) {
      logger.error('Failed to fetch invite for verification', inviteError, {
        component: 'MagicLinkAuthAPI',
        action: 'fetchInvite',
        inviteId
      });
      return NextResponse.json({ error: 'Invalid invite' }, { status: 404 });
    }

    // Check if invite is still active
    if (invite.status !== 'active') {
      return NextResponse.json({ error: 'Invite is no longer active' }, { status: 400 });
    }

    // Check if email matches the intended email (if specified)
    if (invite.intended_email && invite.intended_email.toLowerCase() !== email.toLowerCase()) {
      logger.warn('Email does not match intended recipient', {
        component: 'MagicLinkAuthAPI',
        action: 'emailMismatch',
        inviteId,
        intendedEmail: invite.intended_email,
        providedEmail: email
      });
      return NextResponse.json({ error: 'Email does not match the invited email address' }, { status: 403 });
    }

    logger.info('User authenticated via magic link', {
      component: 'MagicLinkAuthAPI',
      action: 'userAuthenticated',
      userId: user.id,
      email: user.email,
      inviteId,
      eventId
    });

    // Create or update profile
    const { error: profileError } = await serviceSupabase
      .from('profiles')
      .upsert({
        id: user.id,
        email: email,
        full_name: name,
        company: 'Default Company', // TODO: Get from user input or settings
      }, { onConflict: 'id' });

    if (profileError) {
      logger.error('Error upserting profile in magic link auth', profileError, {
        component: 'MagicLinkAuthAPI',
        action: 'upsertProfile',
        userId: user.id,
        eventId
      });
    }

    // Create or update event membership
    const { error: memberError } = await serviceSupabase
      .from('event_members')
      .upsert({
        event_id: eventId,
        user_id: user.id,
        invite_id: inviteId,
        full_name: name,
        email: email,
        role: role,
        is_temporary: isTemporary,
      }, { onConflict: 'event_id,user_id' });

    if (memberError) {
      logger.error('Error upserting event member in magic link auth', memberError, {
        component: 'MagicLinkAuthAPI',
        action: 'upsertEventMember',
        userId: user.id,
        eventId,
        inviteId
      });
    }

    // Log successful authentication
    await serviceSupabase.from('audit_log').insert({
      table_name: 'profiles',
      record_id: user.id,
      action: 'magic_link_auth_success',
      action_type: 'authentication',
      user_id: user.id,
      event_id: eventId,
      details: {
        invite_id: inviteId,
        role: role,
        is_temporary: isTemporary
      }
    });

    logger.info('Magic link authentication completed successfully', {
      component: 'MagicLinkAuthAPI',
      action: 'authComplete',
      userId: user.id,
      eventId,
      inviteId
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Authentication successful',
      userId: user.id,
      eventId
    });

  } catch (error: any) {
    logger.error('Unhandled error in magic link auth', error, {
      component: 'MagicLinkAuthAPI',
      action: 'magicLinkAuth'
    });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
