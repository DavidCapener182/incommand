// @ts-nocheck
/**
 * AI Chat Service
 * Handles AI assistant conversations with Green Guide integration
 */

import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/supabase'

export interface AIMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  citations?: GreenGuideCitation[]
  metadata?: {
    conversationId: string
    eventId?: string
    companyId?: string
    archived?: boolean
  }
}

export interface GreenGuideCitation {
  page: number
  content: string
  heading?: string
  similarity?: number
}

export interface ConversationContext {
  eventId: string
  companyId: string
  userId: string
  lastMessages: AIMessage[]
  greenGuideContext?: GreenGuideCitation[]
}

export class AIChatService {
  private readonly STORAGE_KEY_PREFIX = 'ai_chat_'
  private readonly MAX_HISTORY = 10

  /**
   * Send message to AI with Green Guide context
   */
  async sendMessage(
    message: string,
    conversationId: string,
    context: ConversationContext
  ): Promise<AIMessage | null> {
    try {
      // Get Green Guide context if needed
      const greenGuideContext = await this.searchGreenGuide(message, context.eventId)
      
      // Call OpenAI API
      const response = await fetch('/api/chat/ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: context.lastMessages,
          userId: context.userId,
          eventId: context.eventId,
          companyId: context.companyId
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(`AI API error: ${response.status} - ${errorData.error || 'Unknown error'}`)
      }

      const data = await response.json()
      
      // Create AI message
      const aiMessage: AIMessage = {
        id: `ai_${Date.now()}`,
        role: 'assistant',
        content: data.reply,
        timestamp: new Date().toISOString(),
        citations: data.citations || greenGuideContext,
        metadata: {
          conversationId,
          eventId: context.eventId,
          companyId: context.companyId
        }
      }

      // Save to localStorage
      await this.saveToLocalStorage(conversationId, [aiMessage])

      return aiMessage
    } catch (error) {
      console.error('Error sending AI message:', error)
      return null
    }
  }

  /**
   * Get conversation history from localStorage
   */
  getConversationHistory(conversationId: string): AIMessage[] {
    try {
      if (typeof window === 'undefined') return []
      
      const key = `${this.STORAGE_KEY_PREFIX}${conversationId}`
      const stored = localStorage.getItem(key)
      
      if (!stored) return []
      
      const messages = JSON.parse(stored) as AIMessage[]
      return messages.slice(-this.MAX_HISTORY) // Keep only last 10 messages
    } catch (error) {
      console.error('Error loading conversation history:', error)
      return []
    }
  }

  /**
   * Save messages to localStorage
   */
  async saveToLocalStorage(conversationId: string, messages: AIMessage[]): Promise<void> {
    try {
      if (typeof window === 'undefined') return
      
      const key = `${this.STORAGE_KEY_PREFIX}${conversationId}`
      const existing = this.getConversationHistory(conversationId)
      const updated = [...existing, ...messages].slice(-this.MAX_HISTORY)
      
      localStorage.setItem(key, JSON.stringify(updated))
    } catch (error) {
      console.error('Error saving to localStorage:', error)
    }
  }

  /**
   * Archive conversation to database
   */
  async archiveConversation(
    conversationId: string,
    eventId: string,
    companyId: string,
    userId: string,
    metadata?: Record<string, any>
  ): Promise<boolean> {
    try {
      const messages = this.getConversationHistory(conversationId)
      
      if (messages.length === 0) return false

      // Save to database
      const { error } = await supabase
        .from<any, any>('chat_messages')
        .insert({
          channel_id: `ai_archive_${conversationId}`,
          user_id: userId,
          user_callsign: 'AI Assistant',
          message: JSON.stringify(messages),
          message_type: 'system',
          channel_type: 'ai-archive',
          channel_name: 'AI Archive',
          company_id: companyId,
          event_id: eventId,
          metadata: {
            conversationId,
            messageCount: messages.length,
            archivedAt: new Date().toISOString(),
            ...metadata
          },
          created_at: new Date().toISOString(),
          read_by: [userId]
        })

      if (error) throw error

      // Clear from localStorage after successful archive
      if (typeof window !== 'undefined') {
        const key = `${this.STORAGE_KEY_PREFIX}${conversationId}`
        localStorage.removeItem(key)
      }

      return true
    } catch (error) {
      console.error('Error archiving conversation:', error)
      return false
    }
  }

  /**
   * Search Green Guide for relevant context
   */
  async searchGreenGuide(query: string, eventId: string): Promise<GreenGuideCitation[]> {
    try {
      // Check if query needs Green Guide context
      const needsGreenGuide = /best practice|procedure|how should|what should we do|safety|green guide|barrier|capacity|crowd|ingress|egress/i.test(query)
      
      if (!needsGreenGuide) return []

      const response = await fetch('/api/green-guide-search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          topK: 4
        })
      })

      if (!response.ok) {
        console.warn('Green Guide search failed:', response.status)
        return []
      }

      const data = await response.json()
      
      return (data.results || []).map((result: any) => ({
        page: result.page || 0,
        content: result.content || '',
        heading: result.heading || '',
        similarity: result.similarity || 0
      }))
    } catch (error) {
      console.error('Error searching Green Guide:', error)
      return []
    }
  }

  /**
   * Build AI prompt with context
   */
  private buildAIPrompt(
    message: string,
    history: AIMessage[],
    greenGuideContext: GreenGuideCitation[]
  ): string {
    let prompt = `You are the inCommand AI Assistant, helping with event operations and incident management.

Context: You have access to the Green Guide for crowd management best practices.

User's message: ${message}`

    // Add conversation history
    if (history.length > 0) {
      prompt += '\n\nRecent conversation:\n'
      history.slice(-5).forEach(msg => {
        prompt += `${msg.role}: ${msg.content}\n`
      })
    }

    // Add Green Guide context
    if (greenGuideContext.length > 0) {
      prompt += '\n\nRelevant Green Guide information:\n'
      greenGuideContext.forEach((citation, index) => {
        prompt += `(${index + 1}) Page ${citation.page}: ${citation.content}\n`
      })
      prompt += '\nWhen referencing Green Guide information, cite using [GG p.<page>] format.'
    }

    prompt += '\n\nProvide a helpful, accurate response based on the context above.'

    return prompt
  }

  /**
   * Get archived conversations for user
   */
  async getArchivedConversations(
    eventId: string,
    userId: string
  ): Promise<AIMessage[]> {
    try {
      const { data, error } = await supabase
        .from<any, any>('chat_messages')
        .select('*')
        .eq('event_id', eventId)
        .eq('user_id', userId)
        .eq('channel_type', 'ai-archive')
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) throw error

      // Parse archived messages
      const conversations: AIMessage[] = []
      data?.forEach(row => {
        try {
          const messages = JSON.parse(row.message)
          conversations.push(...messages)
        } catch (parseError) {
          console.warn('Error parsing archived conversation:', parseError)
        }
      })

      return conversations
    } catch (error) {
      console.error('Error fetching archived conversations:', error)
      return []
    }
  }

  /**
   * Clear conversation from localStorage
   */
  clearConversation(conversationId: string): void {
    try {
      if (typeof window === 'undefined') return
      
      const key = `${this.STORAGE_KEY_PREFIX}${conversationId}`
      localStorage.removeItem(key)
    } catch (error) {
      console.error('Error clearing conversation:', error)
    }
  }

  /**
   * Get all conversation IDs from localStorage
   */
  getAllConversationIds(): string[] {
    try {
      if (typeof window === 'undefined') return []
      
      const keys = Object.keys(localStorage)
      return keys
        .filter(key => key.startsWith(this.STORAGE_KEY_PREFIX))
        .map(key => key.replace(this.STORAGE_KEY_PREFIX, ''))
    } catch (error) {
      console.error('Error getting conversation IDs:', error)
      return []
    }
  }

  /**
   * Parse Green Guide citations from AI response
   */
  parseCitations(content: string): GreenGuideCitation[] {
    const citations: GreenGuideCitation[] = []
    const citationRegex = /\[GG p\.(\d+)\]/g
    let match

    while ((match = citationRegex.exec(content)) !== null) {
      citations.push({
        page: parseInt(match[1]),
        content: '', // Will be filled by search results
        heading: ''
      })
    }

    return citations
  }

  /**
   * Generate conversation ID
   */
  generateConversationId(): string {
    return `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}

// Export singleton instance
export const aiChatService = new AIChatService()
