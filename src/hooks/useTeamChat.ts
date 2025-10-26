'use client'

import { useState, useEffect, useCallback } from 'react'
import { chatService, type ChatMessage, type ChatChannel } from '@/lib/collaboration/chatService'
import { useAuth } from '@/contexts/AuthContext'

interface UseTeamChatReturn {
  messages: ChatMessage[]
  channels: ChatChannel[]
  sendMessage: (content: string, metadata?: any) => Promise<void>
  loading: boolean
  error: string | null
  typingUsers: string[]
  onlineUsers: string[]
}

export function useTeamChat(
  eventId: string,
  companyId: string,
  channelName: string
): UseTeamChatReturn {
  const { user } = useAuth()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [channels, setChannels] = useState<ChatChannel[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [typingUsers, setTypingUsers] = useState<string[]>([])
  const [onlineUsers, setOnlineUsers] = useState<string[]>([])

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Load channels
        const channelData = await chatService.getChannels(eventId, companyId)
        setChannels(channelData)

        // Load message history
        const messageData = await chatService.getChannelHistory(
          eventId,
          companyId,
          channelName,
          50
        )
        setMessages(messageData)
      } catch (err) {
        console.error('Error loading team chat data:', err)
        setError('Failed to load chat data')
      } finally {
        setLoading(false)
      }
    }

    if (eventId && companyId && channelName) {
      loadInitialData()
    }
  }, [eventId, companyId, channelName])

  // Set up real-time subscription
  useEffect(() => {
    if (!eventId || !companyId || !channelName) return

    let channel: any = null

    const setupSubscription = async () => {
      try {
        channel = await chatService.subscribeToTeamChannel(
          eventId,
          companyId,
          channelName,
          {
            onMessage: (message: ChatMessage) => {
              setMessages(prev => [...prev, message])
            },
            onTyping: (indicator) => {
              setTypingUsers(prev => {
                const filtered = prev.filter(user => user !== indicator.userCallsign)
                return [...filtered, indicator.userCallsign]
              })
              
              // Clear typing indicator after 3 seconds
              setTimeout(() => {
                setTypingUsers(prev => 
                  prev.filter(user => user !== indicator.userCallsign)
                )
              }, 3000)
            },
            onPresence: (users) => {
              setOnlineUsers(users.map((user: any) => user.userCallsign || user.userId))
            }
          }
        )
      } catch (err) {
        console.error('Error setting up subscription:', err)
        setError('Failed to connect to chat')
      }
    }

    setupSubscription()

    return () => {
      if (channel) {
        chatService.unsubscribeFromChannel(`${eventId}_${companyId}_${channelName}`)
      }
    }
  }, [eventId, companyId, channelName])

  const sendMessage = useCallback(async (content: string, metadata?: any) => {
    if (!user) return
    
    try {
      const userCallsign = user.user_metadata?.callsign || user.email?.split('@')[0] || 'User'
      const message = await chatService.sendTeamMessage(
        eventId,
        companyId,
        channelName,
        user.id,
        userCallsign,
        content,
        metadata
      )

      if (message) {
        setMessages(prev => [...prev, message])
      }
    } catch (err) {
      console.error('Error sending message:', err)
      setError('Failed to send message')
    }
  }, [eventId, companyId, channelName, user])

  return {
    messages,
    channels,
    sendMessage,
    loading,
    error,
    typingUsers,
    onlineUsers
  }
}
