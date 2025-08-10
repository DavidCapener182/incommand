import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export interface UserPresence {
  id: string;
  name: string;
  color: string;
  avatar?: string;
  cursor?: { x: number; y: number };
  typing?: { field: string; timestamp: number };
  focused?: string;
}

interface UsePresenceReturn {
  users: UserPresence[];
  updateCursor: (x: number, y: number) => void;
  updateTyping: (field: string, isTyping: boolean) => void;
  updateFocus: (field: string) => void;
  isConnected: boolean;
}

const COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
];

const getUserColor = (userId: string): string => {
  const hash = userId.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  return COLORS[Math.abs(hash) % COLORS.length];
};

export const usePresence = (channelName: string): UsePresenceReturn => {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserPresence[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const channelRef = useRef<any>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const updateCursor = useCallback((x: number, y: number) => {
    if (!channelRef.current || !user) return;

    channelRef.current.send({
      type: 'broadcast',
      event: 'cursor',
      payload: { x, y }
    });
  }, [user]);

  const updateTyping = useCallback((field: string, isTyping: boolean) => {
    if (!channelRef.current || !user) return;

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    if (isTyping) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'typing',
        payload: { field, timestamp: Date.now() }
      });

      // Auto-clear typing indicator after 3 seconds
      typingTimeoutRef.current = setTimeout(() => {
        updateTyping(field, false);
      }, 3000);
    } else {
      channelRef.current.send({
        type: 'broadcast',
        event: 'stop-typing',
        payload: { field }
      });
    }
  }, [user]);

  const updateFocus = useCallback((field: string) => {
    if (!channelRef.current || !user) return;

    channelRef.current.send({
      type: 'broadcast',
      event: 'focus',
      payload: { field }
    });
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const userPresence: UserPresence = {
      id: user.id,
      name: user.user_metadata?.full_name || user.email || 'Unknown User',
      color: getUserColor(user.id),
      avatar: user.user_metadata?.avatar_url
    };

    // Initialize channel with presence and broadcast
    channelRef.current = supabase.channel(channelName, {
      config: {
        presence: {
          key: user.id,
        },
        broadcast: {
          self: true,
        },
      },
    });

    // Track presence
    channelRef.current
      .on('presence', { event: 'sync' }, () => {
        const presenceState = channelRef.current.presenceState();
        const presenceUsers = Object.values(presenceState).flat().map((presence: any) => ({
          id: presence.user_id,
          name: presence.name || 'Unknown User',
          color: getUserColor(presence.user_id),
          avatar: presence.avatar,
          cursor: presence.cursor,
          typing: presence.typing,
          focused: presence.focused
        }));
        setUsers(presenceUsers);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('User joined:', key, newPresences);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('User left:', key, leftPresences);
      })
      .on('broadcast', { event: 'cursor' }, ({ payload, user_id }) => {
        if (user_id === user.id) return;
        
        setUsers(prev => 
          prev.map(u => 
            u.id === user_id 
              ? { ...u, cursor: payload }
              : u
          )
        );
      })
      .on('broadcast', { event: 'typing' }, ({ payload, user_id }) => {
        if (user_id === user.id) return;
        
        setUsers(prev => 
          prev.map(u => 
            u.id === user_id 
              ? { ...u, typing: payload }
              : u
          )
        );
      })
      .on('broadcast', { event: 'stop-typing' }, ({ payload, user_id }) => {
        if (user_id === user.id) return;
        
        setUsers(prev => 
          prev.map(u => 
            u.id === user_id 
              ? { ...u, typing: undefined }
              : u
          )
        );
      })
      .on('broadcast', { event: 'focus' }, ({ payload, user_id }) => {
        if (user_id === user.id) return;
        
        setUsers(prev => 
          prev.map(u => 
            u.id === user_id 
              ? { ...u, focused: payload.field }
              : u
          )
        );
      })
      .subscribe(async (status) => {
        setIsConnected(status === 'SUBSCRIBED');
        
        if (status === 'SUBSCRIBED') {
          await channelRef.current.track(userPresence);
        }
      });

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      if (channelRef.current) {
        channelRef.current.unsubscribe();
      }
    };
  }, [channelName, user]);

  return {
    users,
    updateCursor,
    updateTyping,
    updateFocus,
    isConnected
  };
};
