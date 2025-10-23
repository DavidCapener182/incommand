import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabaseClient } from '@/lib/supabaseServer';
import crypto from 'crypto';
import { logger } from '@/lib/logger';
import type { User as SupabaseUser } from '@supabase/supabase-js';

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

async function findUserByEmail(
  supabase: ReturnType<typeof getServiceSupabaseClient>,
  email: string,
) {
  const normalizedEmail = email.toLowerCase();
  const perPage = 100;
  let page = 1;

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });

    if (error) {
      return { user: null as SupabaseUser | null, error };
    }

    const users = data?.users ?? [];
    const match = users.find(existing => (existing.email ?? '').toLowerCase() === normalizedEmail);

    if (match) {
      return { user: match as SupabaseUser, error: null };
    }

    if (!data?.nextPage || data.nextPage <= page || users.length === 0) {
      break;
    }

    page = data.nextPage;
  }

  return { user: null as SupabaseUser | null, error: null };
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

    const maxUses = invite.max_uses ?? 1;

    if (invite.used_count >= maxUses) {
      return NextResponse.json({ error: 'Invite has reached its maximum uses' }, { status: 400 });
    }

    // Create or get user
    let userId: string;
    let isNewUser = false;

    const { user, error: listUsersError } = await findUserByEmail(supabase, body.email);

    if (listUsersError) {
      logger.error('Error listing users', listUsersError, {
        component: 'DirectAuthAPI',
        action: 'listUsers',
        email: body.email,
      });
      return NextResponse.json({ error: 'Failed to check existing users' }, { status: 500 });
    }

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
    const newUsedCount = invite.used_count + 1;
    const inviteStatus = newUsedCount >= maxUses ? 'locked' : 'active';

    const { error: updateError } = await supabase
      .from('event_invites')
      .update({
        used_count: newUsedCount,
        last_used_at: new Date().toISOString(),
        status: inviteStatus
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
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const redirectParams = new URLSearchParams({
      inviteId: invite.id,
      role: invite.role,
      eventId: invite.event_id,
      isTemporary: 'true',
    });

    const { data: sessionData, error: sessionError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: body.email,
      options: {
        redirectTo: `${baseUrl}/auth/magic-link?${redirectParams.toString()}`
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
      user_id: userId,
      event_id: invite.event_id,
      action: 'direct_auth_success',
      details: {
        invite_id: invite.id,
        role: invite.role,
        is_new_user: isNewUser
      }
    });

    const incidentsRedirect = invite.event_id ? `/incidents?event=${invite.event_id}` : '/incidents';

    return NextResponse.json({
      success: true,
      auth_link: sessionData.properties.action_link,
      message: 'Authentication successful! Click the link to sign in.',
      is_new_user: isNewUser,
      redirect_url: incidentsRedirect,
    });

  } catch (error: any) {
    logger.error('Unhandled error in direct auth', error, {
      component: 'DirectAuthAPI',
      action: 'directAuth'
    });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
