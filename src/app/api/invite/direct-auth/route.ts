import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabaseClient } from '@/lib/supabaseServer';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import crypto from 'crypto';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

interface DirectAuthRequest {
  email: string;
  name: string;
  code: string;
}

// Hash code for comparison (same as in invites route)
function hashCode(code: string): string {
  return crypto.scryptSync(code, 'incommand-invite-salt', 64).toString('hex');
}

export async function POST(request: NextRequest) {
  try {
    const body: DirectAuthRequest = await request.json();

    if (!body.email || !body.name || !body.code) {
      return NextResponse.json(
        { error: 'Missing required fields: email, name, invite code' },
        { status: 400 }
      );
    }

    const supabase = getServiceSupabaseClient();
    const codeHash = hashCode(body.code);

    // Find the invite by code hash
    const { data: invite, error: inviteError } = await supabase
      .from('event_invites')
      .select(`
        id,
        event_id,
        role,
        allow_multiple,
        max_uses,
        used_count,
        expires_at,
        status,
        intended_email
      `)
      .eq('token_hash', codeHash)
      .eq('status', 'active')
      .single();

    if (inviteError || !invite) {
      return NextResponse.json({ error: 'Invalid or expired invite code' }, { status: 404 });
    }

    // Check if email matches intended email (if specified)
    if (invite.intended_email && invite.intended_email.toLowerCase() !== body.email.toLowerCase()) {
      return NextResponse.json({ error: 'Email does not match intended recipient' }, { status: 403 });
    }

    // Check if invite has expired
    if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
      await supabase.from('event_invites').update({ status: 'expired' }).eq('id', invite.id);
      return NextResponse.json({ error: 'Invite has expired' }, { status: 400 });
    }

    // Check if invite has reached max uses
    if ((invite.used_count || 0) >= (invite.max_uses || 1) && !invite.allow_multiple) {
      return NextResponse.json({ error: 'Invite has reached its maximum uses' }, { status: 400 });
    }

    // Create or get user
    let userId: string;
    let isNewUser = false;

    // Check if user already exists
    const { data: existingUser, error: userError } = await supabase.auth.admin.listUsers();
    
    if (userError) {
      logger.error('Error listing users', userError, {
        component: 'DirectAuthAPI',
        action: 'listUsers'
      });
      return NextResponse.json({ error: 'Failed to check existing users' }, { status: 500 });
    }

    const user = existingUser.users?.find(u => u.email === body.email);
    
    if (!user) {
      // Create new user
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: body.email,
        email_confirm: true,
        user_metadata: {
          full_name: body.name,
        },
      });

      if (createError || !newUser.user) {
        logger.error('Error creating user', createError, {
          component: 'DirectAuthAPI',
          action: 'createUser',
          email: body.email
        });
        return NextResponse.json({ error: 'Failed to create user account' }, { status: 500 });
      }

      userId = newUser.user.id;
      isNewUser = true;
    } else {
      userId = user.id;
    }

    // Create or update profile
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        email: body.email,
        full_name: body.name,
        company: 'Default Company', // TODO: Get from user input or settings
      }, { onConflict: 'id' });

    if (profileError) {
      logger.error('Error upserting profile', profileError, {
        component: 'DirectAuthAPI',
        action: 'upsertProfile',
        userId
      });
      return NextResponse.json({ error: 'Failed to create profile' }, { status: 500 });
    }

    // Create or update event membership
    const { error: memberError } = await supabase
      .from('event_members')
      .upsert({
        event_id: invite.event_id,
        user_id: userId,
        invite_id: invite.id,
        full_name: body.name,
        email: body.email,
        role: invite.role,
        is_temporary: true,
      }, { onConflict: 'event_id,user_id' });

    if (memberError) {
      logger.error('Error upserting event member', memberError, {
        component: 'DirectAuthAPI',
        action: 'upsertEventMember',
        userId,
        eventId: invite.event_id
      });
      return NextResponse.json({ error: 'Failed to create event membership' }, { status: 500 });
    }

    // Update invite usage
    const { error: updateError } = await supabase
      .from('event_invites')
      .update({
        used_count: (invite.used_count || 0) + 1,
        last_used_at: new Date().toISOString(),
        status: invite.allow_multiple ? 'active' : 'locked'
      })
      .eq('id', invite.id);

    if (updateError) {
      logger.error('Error updating invite usage', updateError, {
        component: 'DirectAuthAPI',
        action: 'updateInviteUsage',
        inviteId: invite.id
      });
    }

    // Generate a session token for the user
    const { data: sessionData, error: sessionError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: body.email,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/incidents`
      }
    });

    if (sessionError || !sessionData) {
      logger.error('Failed to generate session', sessionError, {
        component: 'DirectAuthAPI',
        action: 'generateSession',
        email: body.email
      });
      return NextResponse.json({ error: 'Failed to create authentication session' }, { status: 500 });
    }

    // Log successful authentication
    await supabase.from('audit_log').insert({
      table_name: 'profiles',
      record_id: userId,
      action: 'direct_auth_success',
      action_type: 'authentication',
      user_id: userId,
      event_id: invite.event_id,
      details: {
        invite_id: invite.id,
        role: invite.role,
        is_new_user: isNewUser
      }
    });

    return NextResponse.json({
      success: true,
      auth_link: sessionData.properties.action_link,
      message: 'Authentication successful! Click the link to sign in.',
      is_new_user: isNewUser
    });

  } catch (error: any) {
    logger.error('Unhandled error in direct auth', error, {
      component: 'DirectAuthAPI',
      action: 'directAuth'
    });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
