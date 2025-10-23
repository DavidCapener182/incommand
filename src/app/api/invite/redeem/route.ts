import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabaseClient } from '@/lib/supabaseServer';
import crypto from 'crypto';
import { logger } from '@/lib/logger';
import type { User as SupabaseUser } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

interface RedeemInviteRequest {
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
    const match = users.find(user => (user.email ?? '').toLowerCase() === normalizedEmail);

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
    // Add a small delay to prevent rapid requests during development
    if (process.env.NODE_ENV === 'development') {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    const body: RedeemInviteRequest = await request.json();

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
      return NextResponse.json({ error: 'Invalid or expired invite token' }, { status: 404 });
    }

    // Check if invite is expired
    if (new Date(invite.expires_at) < new Date()) {
      // Mark as expired
      await supabase
        .from('event_invites')
        .update({ status: 'expired' })
        .eq('id', invite.id);

      return NextResponse.json({ error: 'Invite has expired' }, { status: 410 });
    }

    // Check if invite has reached max uses
    const maxUses = invite.max_uses ?? 1;

    if (invite.used_count >= maxUses) {
      return NextResponse.json({ error: 'Invite has reached maximum uses' }, { status: 410 });
    }

    // Check if email matches intended email (if specified)
    if (invite.intended_email && invite.intended_email.toLowerCase() !== body.email.toLowerCase()) {
      return NextResponse.json({ error: 'Email does not match intended recipient' }, { status: 403 });
    }

    let userId: string;
    let isNewUser = false;

    const { user, error: userLookupError } = await findUserByEmail(supabase, body.email);

    if (userLookupError) {
      logger.error('Failed to list users for invite redemption', userLookupError, {
        component: 'InviteRedeemAPI',
        action: 'listUsers',
        email: body.email,
      });
      return NextResponse.json({ error: 'Failed to verify existing users' }, { status: 500 });
    }

    if (!user) {
      // Create new user
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: body.email,
        email_confirm: true,
        user_metadata: {
          full_name: body.name,
          invite_redeemed: true
        }
      });

      if (createError || !newUser.user) {
        logger.error('Failed to create user for invite redemption', createError, {
          component: 'InviteRedeemAPI',
          action: 'createUser',
          email: body.email,
          inviteId: invite.id
        });
        return NextResponse.json({ error: 'Failed to create user account' }, { status: 500 });
      }

      userId = newUser.user.id;
      isNewUser = true;
    } else {
      userId = user.id;
    }

    // Check if user is already a member of this event
    const { data: existingMember, error: memberError } = await supabase
      .from('event_members')
      .select('id, status')
      .eq('event_id', invite.event_id)
      .eq('user_id', userId)
      .single();

    if (memberError && memberError.code !== 'PGRST116') { // PGRST116 = no rows returned
      logger.error('Error checking existing membership', memberError, {
        component: 'InviteRedeemAPI',
        action: 'checkMembership',
        eventId: invite.event_id,
        userId
      });
      return NextResponse.json({ error: 'Failed to check membership status' }, { status: 500 });
    }

    // Allow redemption even if user is already a member - we'll update their membership
    // This allows for role changes or membership updates

    // Create or update event membership
    const memberData = {
      event_id: invite.event_id,
      user_id: userId,
      invite_id: invite.id,
      full_name: body.name,
      email: body.email,
      role: invite.role,
      is_temporary: true,
      expires_at: invite.expires_at,
      status: 'active' as const
    };

    let memberId: string;
    if (existingMember) {
      // Update existing membership
      const { data: updatedMember, error: updateError } = await supabase
        .from('event_members')
        .update(memberData)
        .eq('id', existingMember.id)
        .select('id')
        .single();

      if (updateError) {
        logger.error('Failed to update event membership', updateError, {
          component: 'InviteRedeemAPI',
          action: 'updateMembership',
          eventId: invite.event_id,
          userId
        });
        return NextResponse.json({ error: 'Failed to update membership' }, { status: 500 });
      }

      memberId = updatedMember.id;
    } else {
      // Create new membership
      const { data: newMember, error: createError } = await supabase
        .from('event_members')
        .insert(memberData)
        .select('id')
        .single();

      if (createError) {
        logger.error('Failed to create event membership', createError, {
          component: 'InviteRedeemAPI',
          action: 'createMembership',
          eventId: invite.event_id,
          userId
        });
        return NextResponse.json({ error: 'Failed to create membership' }, { status: 500 });
      }

      memberId = newMember.id;
    }

    // Update invite usage count
    const newUsedCount = invite.used_count + 1;
    const inviteStatus = newUsedCount >= maxUses ? 'locked' : 'active';

    const { error: updateInviteError } = await supabase
      .from('event_invites')
      .update({
        used_count: newUsedCount,
        last_used_at: new Date().toISOString(),
        status: inviteStatus,
      })
      .eq('id', invite.id);

    if (updateInviteError) {
      logger.error('Failed to update invite usage', updateInviteError, {
        component: 'InviteRedeemAPI',
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
      logger.error('Failed to generate session token', sessionError, {
        component: 'InviteRedeemAPI',
        action: 'generateSession',
        email: body.email,
        userId
      });
      return NextResponse.json({ error: 'Failed to create authentication session' }, { status: 500 });
    }

    // Log invite redemption
    await supabase.from('audit_log').insert({
      user_id: userId,
      action: 'redeem_invite',
      resource_type: 'event_invite',
      resource_id: invite.id,
      details: {
        event_id: invite.event_id,
        role: invite.role,
        is_new_user: isNewUser,
        member_id: memberId
      }
    });

    logger.info('Invite redeemed successfully', {
      component: 'InviteRedeemAPI',
      action: 'redeemInvite',
      eventId: invite.event_id,
      inviteId: invite.id,
      userId,
      role: invite.role,
      isNewUser
    });

    const incidentsRedirect = invite.event_id ? `/incidents?event=${invite.event_id}` : '/incidents';

    return NextResponse.json({
      success: true,
      session_token: sessionData.properties.action_link,
      redirect_url: incidentsRedirect,
      message: 'Invite redeemed successfully. You are now logged in.',
      is_new_user: isNewUser
    });

  } catch (error) {
    logger.error('Error redeeming invite', error, {
      component: 'InviteRedeemAPI',
      action: 'redeemInvite'
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
