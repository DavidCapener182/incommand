/**
 * Live Chat Service
 * Real-time team communication with incident threads
 */

import { supabase } from '@/lib/supabase'
import type { RealtimeChannel } from '@supabase/supabase-js'

export interface ChatMessage {
  id: string
  channelId: string
  incidentId?: string
  userId: string
  userCallsign: string
  message: string
  messageType: 'text' | 'system' | 'alert' | 'file' | 'location'
  metadata?: {
    fileName?: string
    fileUrl?: string
    latitude?: number
    longitude?: number
    replyToId?: string
    mentions?: string[]
    priority?: 'normal' | 'high' | 'urgent'
  }
  reactions?: Record<string, string[]> // emoji -> user IDs
  isEdited: boolean
  editedAt?: string
  createdAt: string
  readBy: string[]
}

export interface ChatChannel {
  id: string
  name: string
  type: 'general' | 'incident' | 'team' | 'private'
  eventId?: string
  incidentId?: string
  participants: string[]
  lastMessage?: ChatMessage
  unreadCount: number
  createdAt: string
  isActive: boolean
}

export interface TypingIndicator {
  userId: string
  userCallsign: string
  channelId: string
  timestamp: string
}

export class ChatService {
  private channels: Map<string, RealtimeChannel> = new Map()
  private typingTimeouts: Map<string, NodeJS.Timeout> = new Map()

  /**
   * Subscribe to channel
   */
  async subscribeToChannel(
    channelId: string,
    onMessage: (message: ChatMessage) => void,
    onTyping?: (indicator: TypingIndicator) => void,
    onPresence?: (users: any[]) => void
  ): Promise<RealtimeChannel> {
    // Unsubscribe from existing channel
    if (this.channels.has(channelId)) {
      await this.unsubscribeFromChannel(channelId)
    }

    const channel = supabase.channel(`chat_${channelId}`)

    // Listen for new messages
    channel
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `channel_id=eq.${channelId}`
      }, (payload) => {
        onMessage(payload.new as ChatMessage)
      })

    // Listen for typing indicators
    if (onTyping) {
      channel.on('broadcast', { event: 'typing' }, (payload) => {
        onTyping(payload.payload as TypingIndicator)
      })
    }

    // Track presence
    if (onPresence) {
      channel
        .on('presence', { event: 'sync' }, () => {
          const state = channel.presenceState()
          const users = Object.values(state).flat()
          onPresence(users)
        })
        .on('presence', { event: 'join' }, ({ key, newPresences }) => {
          console.log('User joined:', key, newPresences)
        })
        .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
          console.log('User left:', key, leftPresences)
        })
    }

    await channel.subscribe()
    this.channels.set(channelId, channel)

    return channel
  }

  /**
   * Unsubscribe from channel
   */
  async unsubscribeFromChannel(channelId: string): Promise<void> {
    const channel = this.channels.get(channelId)
    if (channel) {
      await channel.unsubscribe()
      this.channels.delete(channelId)
    }
  }

  /**
   * Send message
   */
  async sendMessage(
    channelId: string,
    userId: string,
    userCallsign: string,
    message: string,
    metadata?: ChatMessage['metadata']
  ): Promise<ChatMessage | null> {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          channel_id: channelId,
          user_id: userId,
          user_callsign: userCallsign,
          message,
          message_type: metadata?.fileUrl ? 'file' : metadata?.latitude ? 'location' : 'text',
          metadata,
          created_at: new Date().toISOString(),
          read_by: [userId]
        })
        .select()
        .single()

      if (error) throw error

      return data as unknown as ChatMessage
    } catch (error) {
      console.error('Error sending message:', error)
      return null
    }
  }

  /**
   * Send typing indicator
   */
  async sendTypingIndicator(
    channelId: string,
    userId: string,
    userCallsign: string
  ): Promise<void> {
    const channel = this.channels.get(channelId)
    if (!channel) return

    await channel.send({
      type: 'broadcast',
      event: 'typing',
      payload: {
        userId,
        userCallsign,
        channelId,
        timestamp: new Date().toISOString()
      }
    })

    // Clear existing timeout
    const existingTimeout = this.typingTimeouts.get(`${channelId}_${userId}`)
    if (existingTimeout) {
      clearTimeout(existingTimeout)
    }

    // Auto-clear after 3 seconds
    const timeout = setTimeout(() => {
      // Send stop typing
      this.typingTimeouts.delete(`${channelId}_${userId}`)
    }, 3000)

    this.typingTimeouts.set(`${channelId}_${userId}`, timeout)
  }

  /**
   * Track presence
   */
  async trackPresence(
    channelId: string,
    userId: string,
    userCallsign: string,
    metadata?: any
  ): Promise<void> {
    const channel = this.channels.get(channelId)
    if (!channel) return

    await channel.track({
      userId,
      userCallsign,
      online_at: new Date().toISOString(),
      ...metadata
    })
  }

  /**
   * Mark messages as read
   */
  async markAsRead(messageIds: string[], userId: string): Promise<void> {
    try {
      for (const messageId of messageIds) {
        // TODO: Implement add_message_reader RPC function
        // await supabase.rpc('add_message_reader', {
        //   message_id: messageId,
        //   reader_id: userId
        // })
      }
    } catch (error) {
      console.error('Error marking as read:', error)
    }
  }

  /**
   * React to message
   */
  async addReaction(
    messageId: string,
    userId: string,
    emoji: string
  ): Promise<void> {
    try {
      // TODO: Implement add_message_reaction RPC function
      // await supabase.rpc('add_message_reaction', {
      //   message_id: messageId,
      //   user_id: userId,
      //   emoji_code: emoji
      // })
    } catch (error) {
      console.error('Error adding reaction:', error)
    }
  }

  /**
   * Get channel history
   */
  async getMessageHistory(
    channelId: string,
    limit: number = 50,
    before?: string
  ): Promise<ChatMessage[]> {
    try {
      let query = supabase
        .from('chat_messages')
        .select('*')
        .eq('channel_id', channelId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (before) {
        query = query.lt('created_at', before)
      }

      const { data, error } = await query

      if (error) throw error

      return (data as unknown as ChatMessage[]).reverse()
    } catch (error) {
      console.error('Error fetching message history:', error)
      return []
    }
  }

  /**
   * Create incident thread
   */
  async createIncidentThread(
    incidentId: string,
    incidentType: string,
    eventId: string
  ): Promise<ChatChannel | null> {
    try {
      const { data, error } = await supabase
        .from('chat_channels')
        .insert({
          name: `Incident Thread: ${incidentType}`,
          type: 'incident',
          event_id: eventId,
          incident_id: incidentId,
          is_active: true,
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error

      return data as unknown as ChatChannel
    } catch (error) {
      console.error('Error creating incident thread:', error)
      return null
    }
  }

  /**
   * Search messages
   */
  async searchMessages(
    channelId: string,
    query: string
  ): Promise<ChatMessage[]> {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('channel_id', channelId)
        .textSearch('message', query)
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) throw error

      return data as unknown as ChatMessage[]
    } catch (error) {
      console.error('Error searching messages:', error)
      return []
    }
  }

  /**
   * Cleanup
   */
  async cleanup(): Promise<void> {
    // Unsubscribe from all channels
    for (const [channelId, channel] of this.channels) {
      await channel.unsubscribe()
    }
    this.channels.clear()

    // Clear typing timeouts
    for (const timeout of this.typingTimeouts.values()) {
      clearTimeout(timeout)
    }
    this.typingTimeouts.clear()
  }
}

// Export singleton instance
export const chatService = new ChatService()
