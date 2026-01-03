import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface EventMembership {
  id: string;
  event_id: string;
  user_id: string;
  role: string;
  is_temporary: boolean;
  expires_at: string | null;
  status: 'active' | 'revoked' | 'expired';
  full_name: string | null;
  email: string | null;
}

export function useEventMembership() {
  const { user } = useAuth();
  const [membership, setMembership] = useState<EventMembership | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setMembership(null);
      setLoading(false);
      return;
    }

    async function fetchMembership() {
      try {
        setLoading(true);
        setError(null);

        // Get current event
        const { data: currentEvent, error: eventError } = await (supabase as any)
          .from('events')
          .select('id')
          .eq('is_current', true)
          .single();

        const eventData = currentEvent as any;
        if (eventError || !eventData) {
          setMembership(null);
          setLoading(false);
          return;
        }

        // Get user's membership for current event
        // Silently handle 406 errors (Not Acceptable) - these can occur due to RLS policies
        const { data: membershipData, error: membershipError } = await (supabase as any)
          .from('event_members')
          .select(`
            id,
            event_id,
            user_id,
            role,
            is_temporary,
            expires_at,
            status,
            full_name,
            email
          `)
          .eq('event_id', eventData.id)
          .eq('user_id', user.id)
          .eq('status', 'active')
          .single();

        if (membershipError) {
          if (membershipError.code === 'PGRST116') {
            // No membership found - user is not a temporary member
            setMembership(null);
          } else if (membershipError.code === 'PGRST301' || membershipError.status === 406) {
            // RLS policy violation or Not Acceptable - user doesn't have access to this table
            // This is expected for regular users, not an error
            setMembership(null);
          } else {
            // Only log non-RLS errors
            setError(membershipError.message);
          }
        } else {
          // Check if membership has expired
          if (membershipData.expires_at && new Date(membershipData.expires_at) < new Date()) {
            setMembership(null);
          } else {
            setMembership({
              ...membershipData,
              is_temporary: membershipData.is_temporary ?? false,
              status: membershipData.status as 'active' | 'revoked' | 'expired'
            });
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch membership');
      } finally {
        setLoading(false);
      }
    }

    fetchMembership();
  }, [user]);

  const isTemporaryMember = membership?.is_temporary || false;
  const isExpired = membership?.expires_at ? new Date(membership.expires_at) < new Date() : false;
  // Superadmins always have active membership, others need valid membership
  const hasActiveMembership = user?.user_metadata?.role === 'superadmin' || (membership && !isExpired);
  
  // For superadmins, always allow admin features regardless of membership
  // For regular users, check if they're not temporary and not expired
  const canAccessAdminFeatures = user?.user_metadata?.role === 'superadmin' || (!isTemporaryMember && !isExpired);

  return {
    membership,
    loading,
    error,
    isTemporaryMember,
    isExpired,
    hasActiveMembership,
    canAccessAdminFeatures
  };
}
