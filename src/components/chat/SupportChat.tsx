'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { PaperAirplaneIcon, PlusIcon } from '@heroicons/react/24/outline'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface SupportTicket {
  id: string
  userId: string
  orgId?: string | null
  channelId?: string | null
  subject: string
  category: 'incident' | 'technical' | 'billing' | 'other'
  status: 'open' | 'in_progress' | 'resolved'
  priority: 'normal' | 'urgent'
  createdAt: string
  updatedAt: string
}

interface SupportMessage {
  id: string
  ticketId: string
  userId?: string | null
  message: string
  attachments?: any[]
  createdAt: string
}

interface SupportChatProps {
  isVisible?: boolean
}

export default function SupportChat({ isVisible = true }: SupportChatProps) {
  const { user } = useAuth()
  const supabaseClient = supabase as any
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null)
  const [messages, setMessages] = useState<SupportMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isCreatingTicket, setIsCreatingTicket] = useState(false)
  const [newTicket, setNewTicket] = useState({
    subject: '',
    category: 'technical' as const,
    priority: 'normal' as const,
    message: ''
  })
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (user && isVisible) {
      loadTickets()
    }
  }, [user, isVisible])

  useEffect(() => {
    if (selectedTicket) {
      loadMessages(selectedTicket.id)
    }
  }, [selectedTicket])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const loadTickets = async () => {
    if (!user) return
    
    setLoading(true)
    try {
      const { data, error } = await supabaseClient
        .from('support_tickets')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      const formattedTickets: SupportTicket[] = (data || []).map((ticket: any) => {
        const allowedCategories = ['incident', 'technical', 'billing', 'other'] as const
        const allowedPriorities = ['normal', 'urgent'] as const

        const category = allowedCategories.includes(ticket.category)
          ? (ticket.category as SupportTicket['category'])
          : 'other'

        const priority = allowedPriorities.includes(ticket.priority)
          ? (ticket.priority as SupportTicket['priority'])
          : 'normal'

        return {
          id: ticket.id ?? '',
          userId: ticket.user_id ?? '',
          orgId: ticket.org_id || ticket.organization_id || ticket.company_id || null,
          channelId: ticket.channel_id ?? null,
          subject: ticket.subject ?? '',
          category,
          status:
            ticket.status === 'in_progress'
              ? 'in_progress'
              : ticket.status === 'resolved'
              ? 'resolved'
              : 'open',
          priority,
          createdAt: ticket.created_at ?? new Date().toISOString(),
          updatedAt: ticket.updated_at ?? ticket.created_at ?? new Date().toISOString(),
        }
      })

      setTickets(formattedTickets)
      if (formattedTickets.length > 0 && !selectedTicket) {
        setSelectedTicket(formattedTickets[0])
      }
    } catch (error) {
      console.error('Failed to load tickets:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadMessages = async (ticketId: string) => {
    try {
      const { data, error } = await supabaseClient
        .from('support_messages')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true })

      if (error) throw error

      const formattedMessages: SupportMessage[] = (data || []).map((msg: any) => ({
        id: msg.id ?? crypto.randomUUID(),
        ticketId: msg.ticket_id ?? ticketId,
        userId: msg.sender_id ?? null,
        message: msg.message ?? '',
        attachments: [],
        createdAt: msg.created_at ?? new Date().toISOString(),
      }))

      setMessages(formattedMessages)
    } catch (error) {
      console.error('Failed to load messages:', error)
    }
  }

  const handleSendMessage = async () => {
    if (!selectedTicket || !newMessage.trim() || !user) return

    setSending(true)
    try {
      // Insert message - use user_id if available, otherwise sender_id
      const messagePayload: any = {
        ticket_id: selectedTicket.id,
        message: newMessage.trim(),
      };
      
      // Use user_id if column exists, otherwise use sender_id
      if (user) {
        messagePayload.user_id = user.id;
        messagePayload.sender_id = user.id;
        messagePayload.sender_type = 'user';
      }

      const { data: messageData, error: messageError } = await supabaseClient
        .from('support_messages')
        .insert(messagePayload)
        .select()
        .single()

      if (messageError) throw messageError

      // Update ticket's updated_at timestamp
      await supabaseClient
        .from('support_tickets')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', selectedTicket.id)

      const newMsg: SupportMessage = {
        id: messageData.id,
        ticketId: messageData.ticket_id,
        userId: messageData.sender_id ?? null,
        message: messageData.message,
        attachments: [],
        createdAt: messageData.created_at,
      }

      setMessages(prev => [...prev, newMsg])
      setNewMessage('')
      // Refresh tickets to update updatedAt
      await loadTickets()
    } catch (error) {
      console.error('Failed to send message:', error)
    } finally {
      setSending(false)
    }
  }

  const handleCreateTicket = async () => {
    if (!user || !newTicket.subject.trim() || !newTicket.message.trim()) return

    setSending(true)
    try {
      // Create ticket - handle both org_id and organization_id/company_id
      const ticketPayload: any = {
        user_id: user.id,
        subject: newTicket.subject.trim(),
        category: newTicket.category,
        priority: newTicket.priority,
        status: 'open',
      };

      const { data: ticketData, error: ticketError } = await supabaseClient
        .from('support_tickets')
        .insert(ticketPayload)
        .select()
        .single()

      if (ticketError) throw ticketError

      // Create initial message - use both user_id and sender_id for compatibility
      const messagePayload: any = {
        ticket_id: ticketData.id,
        message: newTicket.message.trim(),
      };
      
      if (user) {
        messagePayload.user_id = user.id;
        messagePayload.sender_id = user.id;
        messagePayload.sender_type = 'user';
      }

      const { error: messageError } = await supabaseClient
        .from('support_messages')
        .insert(messagePayload)

      if (messageError) throw messageError

      const formattedTicket: SupportTicket = {
        id: ticketData.id,
        userId: ticketData.user_id,
        orgId: ticketData.org_id || ticketData.organization_id || ticketData.company_id || null,
        channelId: ticketData.channel_id ?? null,
        subject: ticketData.subject ?? '',
        category:
          (['incident', 'technical', 'billing', 'other'] as const).includes(ticketData.category)
            ? ticketData.category
            : 'other',
        status:
          ticketData.status === 'in_progress'
            ? 'in_progress'
            : ticketData.status === 'resolved'
            ? 'resolved'
            : 'open',
        priority:
          ticketData.priority === 'urgent'
            ? 'urgent'
            : 'normal',
        createdAt: ticketData.created_at ?? new Date().toISOString(),
        updatedAt: ticketData.updated_at ?? ticketData.created_at ?? new Date().toISOString(),
      }

      setTickets(prev => [formattedTicket, ...prev])
      setSelectedTicket(formattedTicket)
      setNewTicket({ subject: '', category: 'technical', priority: 'normal', message: '' })
      setIsCreatingTicket(false)
      await loadMessages(formattedTicket.id)
    } catch (error) {
      console.error('Failed to create ticket:', error)
    } finally {
      setSending(false)
    }
  }

  if (!isVisible) return null

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#23408e]">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-[#2d437a]">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Support Tickets</h2>
        <Button
          onClick={() => setIsCreatingTicket(true)}
          size="sm"
          className="flex items-center gap-2"
        >
          <PlusIcon className="h-4 w-4" />
          New Ticket
        </Button>
      </div>

      {isCreatingTicket ? (
        /* Create Ticket Form */
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Subject
            </label>
            <Input
              value={newTicket.subject}
              onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
              placeholder="What can we help you with?"
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Category
            </label>
            <Select
              value={newTicket.category}
              onValueChange={(value: any) => setNewTicket({ ...newTicket, category: value })}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="technical">Technical</SelectItem>
                <SelectItem value="incident">Incident</SelectItem>
                <SelectItem value="billing">Billing</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Priority
            </label>
            <Select
              value={newTicket.priority}
              onValueChange={(value: any) => setNewTicket({ ...newTicket, priority: value })}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Message
            </label>
            <Textarea
              value={newTicket.message}
              onChange={(e) => setNewTicket({ ...newTicket, message: e.target.value })}
              placeholder="Describe your issue..."
              rows={6}
              className="w-full"
            />
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleCreateTicket}
              disabled={sending || !newTicket.subject.trim() || !newTicket.message.trim()}
              className="flex-1"
            >
              {sending ? 'Creating...' : 'Create Ticket'}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreatingTicket(false)
                setNewTicket({ subject: '', category: 'technical', priority: 'normal', message: '' })
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-1 min-h-0">
          {/* Tickets List */}
          <div className="w-1/3 border-r border-gray-200 dark:border-[#2d437a] overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                Loading tickets...
              </div>
            ) : tickets.length === 0 ? (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                <p className="mb-2">No tickets yet</p>
                <Button
                  onClick={() => setIsCreatingTicket(true)}
                  size="sm"
                  variant="outline"
                >
                  Create your first ticket
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-[#2d437a]">
                {tickets.map((ticket) => (
                  <button
                    key={ticket.id}
                    onClick={() => setSelectedTicket(ticket)}
                    className={`w-full p-4 text-left hover:bg-gray-50 dark:hover:bg-[#1a2a57] transition-colors ${
                      selectedTicket?.id === ticket.id
                        ? 'bg-blue-50 dark:bg-[#1a2a57] border-l-4 border-blue-500'
                        : ''
                    }`}
                  >
                    <div className="flex items-start justify-between mb-1">
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {ticket.subject}
                      </h3>
                      <span
                        className={`ml-2 px-2 py-0.5 text-xs rounded ${
                          ticket.status === 'resolved'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : ticket.status === 'in_progress'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                        }`}
                      >
                        {ticket.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                      {ticket.category} • {ticket.priority}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      {new Date(ticket.updatedAt).toLocaleDateString()}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Messages */}
          <div className="flex-1 flex flex-col min-h-0">
            {selectedTicket ? (
              <>
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.map((msg) => {
                    const isUser = msg.userId === user?.id
                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-lg p-3 ${
                            isUser
                              ? 'bg-blue-500 text-white'
                              : 'bg-gray-100 dark:bg-[#1a2a57] text-gray-900 dark:text-white'
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                          <p
                            className={`text-xs mt-1 ${
                              isUser ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'
                            }`}
                          >
                            {new Date(msg.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                  <div ref={messagesEndRef} />
                </div>
                <div className="border-t border-gray-200 dark:border-[#2d437a] p-4">
                  <div className="flex gap-2">
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault()
                          handleSendMessage()
                        }
                      }}
                      placeholder="Type your message..."
                      className="flex-1"
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim() || sending}
                    >
                      <PaperAirplaneIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400">
                Select a ticket to view messages
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

