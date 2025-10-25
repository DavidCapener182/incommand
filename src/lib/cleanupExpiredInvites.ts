import { getServiceSupabaseClient } from './supabaseServer';
import { logger } from './logger';

export async function cleanupExpiredInvites() {
  const supabase = getServiceSupabaseClient();
  
  try {
    const now = new Date().toISOString();
    
    // Mark expired invites as expired
    const { data: expiredInvites, error: inviteError } = await supabase
      .from('event_invites')
      .update({ status: 'expired' })
      .lt('expires_at', now)
      .eq('status', 'active')
      .select('id, event_id, role');

    if (inviteError) {
      logger.error('Failed to mark expired invites', inviteError, {
        component: 'cleanupExpiredInvites',
        action: 'markExpiredInvites'
      });
      return;
    }

    // Mark expired members as expired
    const { data: expiredMembers, error: memberError } = await supabase
      .from('event_members')
      .update({ status: 'expired' })
      .lt('expires_at', now)
      .eq('status', 'active')
      .select('id, event_id, user_id, role');

    if (memberError) {
      logger.error('Failed to mark expired members', memberError, {
        component: 'cleanupExpiredInvites',
        action: 'markExpiredMembers'
      });
      return;
    }

    // Log cleanup activity
    if (expiredInvites && expiredInvites.length > 0) {
      await supabase.from('audit_log').insert({
        performed_by: null, // System action
        action: 'cleanup_expired_invites',
        action_type: 'system',
        record_id: 'system',
        table_name: 'system',
        details: {
          expired_invites_count: expiredInvites.length,
          expired_members_count: expiredMembers?.length || 0
        }
      });

      logger.info('Expired invites and members cleaned up', {
        component: 'cleanupExpiredInvites',
        action: 'cleanup',
        expiredInvitesCount: expiredInvites.length,
        expiredMembersCount: expiredMembers?.length || 0
      });
    }

  } catch (error) {
    logger.error('Error during cleanup of expired invites', error, {
      component: 'cleanupExpiredInvites',
      action: 'cleanup'
    });
  }
}

// Function to revoke a specific invite and invalidate any existing sessions
export async function revokeInviteAndSessions(inviteId: string, eventId: string) {
  const supabase = getServiceSupabaseClient();
  
  try {
    // Get all members associated with this invite
    const { data: members, error: membersError } = await supabase
      .from('event_members')
      .select('user_id, id')
      .eq('invite_id', inviteId)
      .eq('status', 'active');

    if (membersError) {
      logger.error('Failed to get members for invite revocation', membersError, {
        component: 'revokeInviteAndSessions',
        action: 'getMembers',
        inviteId
      });
      return;
    }

    // Revoke the invite
    const { error: revokeError } = await supabase
      .from('event_invites')
      .update({ status: 'revoked' })
      .eq('id', inviteId);

    if (revokeError) {
      logger.error('Failed to revoke invite', revokeError, {
        component: 'revokeInviteAndSessions',
        action: 'revokeInvite',
        inviteId
      });
      return;
    }

    // Mark associated members as revoked
    if (members && members.length > 0) {
      const { error: revokeMembersError } = await supabase
        .from('event_members')
        .update({ status: 'revoked' })
        .eq('invite_id', inviteId);

      if (revokeMembersError) {
        logger.error('Failed to revoke members', revokeMembersError, {
          component: 'revokeInviteAndSessions',
          action: 'revokeMembers',
          inviteId
        });
      }

      // Sign out all affected users
      for (const member of members) {
        try {
          await supabase.auth.admin.signOut(member.user_id);
        } catch (signOutError) {
          logger.error('Failed to sign out user', signOutError, {
            component: 'revokeInviteAndSessions',
            action: 'signOutUser',
            userId: member.user_id,
            inviteId
          });
        }
      }
    }

    // Log revocation
    await supabase.from('audit_log').insert({
      performed_by: null, // System action
      action: 'revoke_invite_and_sessions',
      action_type: 'event_invite',
      record_id: inviteId,
      table_name: 'event_invites',
      details: {
        event_id: eventId,
        affected_members_count: members?.length || 0
      }
    });

    logger.info('Invite and associated sessions revoked', {
      component: 'revokeInviteAndSessions',
      action: 'revoke',
      inviteId,
      eventId,
      affectedMembersCount: members?.length || 0
    });

  } catch (error) {
    logger.error('Error revoking invite and sessions', error, {
      component: 'revokeInviteAndSessions',
      action: 'revoke',
      inviteId
    });
  }
}
