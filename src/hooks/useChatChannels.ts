'use client'

import { useState, useEffect, useCallback } from 'react'
import { chatService, type ChatChannel } from '@/lib/collaboration/chatService'
import { useAuth } from '@/contexts/AuthContext'

interface UseChatChannelsReturn {
  channels: ChatChannel[]
  createChannel: (name: string, description: string, isPrivate?: boolean) => Promise<ChatChannel | null>
  deleteChannel: (channelId: string) => Promise<boolean>
  loading: boolean
  error: string | null
}

export function useChatChannels(
  eventId: string,
  companyId: string
): UseChatChannelsReturn {
  const { user } = useAuth()
  const [channels, setChannels] = useState<ChatChannel[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load channels
  useEffect(() => {
    const loadChannels = async () => {
      try {
        setLoading(true)
        setError(null)

        const channelData = await chatService.getChannels(eventId, companyId)
        setChannels(channelData)
      } catch (err) {
        console.error('Error loading channels:', err)
        setError('Failed to load channels')
      } finally {
        setLoading(false)
      }
    }

    if (eventId && companyId) {
      loadChannels()
    }
  }, [eventId, companyId])

  const createChannel = useCallback(async (
    name: string,
    description: string,
    isPrivate: boolean = false
  ): Promise<ChatChannel | null> => {
    if (!user) return null
    
    try {
      setError(null)

      const channel = await chatService.createChannel(
        eventId,
        companyId,
        name,
        description,
        user.id,
        isPrivate
      )

      if (channel) {
        setChannels(prev => [...prev, channel])
      }

      return channel
    } catch (err) {
      console.error('Error creating channel:', err)
      setError('Failed to create channel')
      return null
    }
  }, [eventId, companyId, user])

  const deleteChannel = useCallback(async (channelId: string): Promise<boolean> => {
    try {
      setError(null)

      // TODO: Implement delete channel in ChatService
      // const success = await chatService.deleteChannel(channelId)
      
      // if (success) {
      //   setChannels(prev => prev.filter(ch => ch.id !== channelId))
      // }

      // return success
      return false // Placeholder
    } catch (err) {
      console.error('Error deleting channel:', err)
      setError('Failed to delete channel')
      return false
    }
  }, [])

  return {
    channels,
    createChannel,
    deleteChannel,
    loading,
    error
  }
}
