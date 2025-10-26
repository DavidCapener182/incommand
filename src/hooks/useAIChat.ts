'use client'

import { useState, useEffect, useCallback } from 'react'
import { aiChatService, type AIMessage, type ConversationContext } from '@/lib/ai/aiChatService'

interface UseAIChatReturn {
  messages: AIMessage[]
  sendMessage: (content: string) => Promise<void>
  loading: boolean
  isTyping: boolean
  error: string | null
  archiveConversation: () => Promise<boolean>
  clearConversation: () => void
}

export function useAIChat(
  conversationId: string,
  eventId: string,
  companyId: string,
  userId: string
): UseAIChatReturn {
  const [messages, setMessages] = useState<AIMessage[]>([])
  const [loading, setLoading] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load conversation history
  useEffect(() => {
    if (conversationId) {
      const history = aiChatService.getConversationHistory(conversationId)
      setMessages(history)
    }
  }, [conversationId])

  const sendMessage = useCallback(async (content: string) => {
    if (!conversationId) return

    try {
      setLoading(true)
      setIsTyping(true)
      setError(null)

      // Add user message immediately
      const userMessage: AIMessage = {
        id: `user_${Date.now()}`,
        role: 'user',
        content,
        timestamp: new Date().toISOString(),
        metadata: {
          conversationId,
          eventId,
          companyId
        }
      }

      const updatedMessages = [...messages, userMessage]
      setMessages(updatedMessages)
      await aiChatService.saveToLocalStorage(conversationId, [userMessage])

      // Build context for AI
      const context: ConversationContext = {
        eventId,
        companyId,
        userId,
        lastMessages: updatedMessages.slice(-5) // Last 5 messages for context
      }

      // Send to AI
      const aiMessage = await aiChatService.sendMessage(content, conversationId, context)

      if (aiMessage) {
        setMessages(prev => [...prev, aiMessage])
      } else {
        setError('Failed to get AI response')
      }
    } catch (err) {
      console.error('Error sending AI message:', err)
      setError('Failed to send message')
    } finally {
      setLoading(false)
      setIsTyping(false)
    }
  }, [conversationId, eventId, companyId, userId, messages])

  const archiveConversation = useCallback(async (): Promise<boolean> => {
    if (!conversationId || messages.length === 0) return false

    try {
      const success = await aiChatService.archiveConversation(
        conversationId,
        eventId,
        companyId,
        userId,
        {
          messageCount: messages.length,
          lastMessage: messages[messages.length - 1]?.content
        }
      )

      if (success) {
        setMessages([])
      }

      return success
    } catch (err) {
      console.error('Error archiving conversation:', err)
      setError('Failed to archive conversation')
      return false
    }
  }, [conversationId, eventId, companyId, userId, messages])

  const clearConversation = useCallback(() => {
    if (conversationId) {
      aiChatService.clearConversation(conversationId)
      setMessages([])
      setError(null)
    }
  }, [conversationId])

  return {
    messages,
    sendMessage,
    loading,
    isTyping,
    error,
    archiveConversation,
    clearConversation
  }
}
