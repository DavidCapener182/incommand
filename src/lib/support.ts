// @ts-nocheck
/**
 * Support Ticket Utilities
 * Server-side functions for managing support tickets and messages
 */

import { getServiceSupabaseClient } from '@/lib/supabaseServer'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

export interface SupportTicket {
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

export interface SupportMessage {
  id: string
  ticketId: string
  userId?: string | null
  message: string
  attachments?: any[]
  createdAt: string
}

/**
 * Create a new support ticket
 */
export async function createTicket(params: {
  userId: string
  orgId?: string | null
  subject: string
  category: 'incident' | 'technical' | 'billing' | 'other'
  priority?: 'normal' | 'urgent'
  channelId?: string | null
}): Promise<SupportTicket> {
  const supabase = getServiceSupabaseClient()

  const { data, error } = await supabase
    .from<Database['public']['Tables']['support_tickets']['Row'], Database['public']['Tables']['support_tickets']['Update']>('support_tickets')
    .insert({
      user_id: params.userId,
      org_id: params.orgId,
      channel_id: params.channelId,
      subject: params.subject,
      category: params.category,
      priority: params.priority || 'normal',
      status: 'open',
    })
    .select()
    .single()

  if (error) {
    console.error('Failed to create support ticket:', error)
    throw error
  }

  return {
    id: data.id,
    userId: data.user_id,
    orgId: data.org_id,
    channelId: data.channel_id,
    subject: data.subject,
    category: data.category as SupportTicket['category'],
    status: data.status as SupportTicket['status'],
    priority: data.priority as SupportTicket['priority'],
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  }
}

/**
 * Post a message to a support ticket
 */
export async function postTicketMessage(params: {
  ticketId: string
  userId: string
  message: string
  attachments?: any[]
}): Promise<SupportMessage> {
  const supabase = getServiceSupabaseClient()

  const { data, error } = await supabase
    .from<Database['public']['Tables']['support_messages']['Row'], Database['public']['Tables']['support_messages']['Update']>('support_messages')
    .insert({
      ticket_id: params.ticketId,
      user_id: params.userId,
      message: params.message,
      attachments: params.attachments || [],
    })
    .select()
    .single()

  if (error) {
    console.error('Failed to post ticket message:', error)
    throw error
  }

  // Update ticket's updated_at timestamp
  await supabase
    .from<Database['public']['Tables']['support_tickets']['Row'], Database['public']['Tables']['support_tickets']['Update']>('support_tickets')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', params.ticketId)

  return {
    id: data.id,
    ticketId: data.ticket_id,
    userId: data.user_id,
    message: data.message,
    attachments: data.attachments,
    createdAt: data.created_at,
  }
}

/**
 * Get all tickets for a user
 */
export async function getTicketsForUser(userId: string): Promise<SupportTicket[]> {
  const supabase = getServiceSupabaseClient()

  const { data, error } = await supabase
    .from<Database['public']['Tables']['support_tickets']['Row'], Database['public']['Tables']['support_tickets']['Update']>('support_tickets')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Failed to get tickets for user:', error)
    throw error
  }

  return (
    data?.map((ticket) => ({
      id: ticket.id,
      userId: ticket.user_id,
      orgId: ticket.org_id,
      channelId: ticket.channel_id,
      subject: ticket.subject,
      category: ticket.category as SupportTicket['category'],
      status: ticket.status as SupportTicket['status'],
      priority: ticket.priority as SupportTicket['priority'],
      createdAt: ticket.created_at,
      updatedAt: ticket.updated_at,
    })) || []
  )
}

/**
 * Get ticket thread (all messages for a ticket)
 */
export async function getTicketThread(ticketId: string): Promise<SupportMessage[]> {
  const supabase = getServiceSupabaseClient()

  const { data, error } = await supabase
    .from<Database['public']['Tables']['support_messages']['Row'], Database['public']['Tables']['support_messages']['Update']>('support_messages')
    .select('*')
    .eq('ticket_id', ticketId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Failed to get ticket thread:', error)
    throw error
  }

  return (
    data?.map((msg) => ({
      id: msg.id,
      ticketId: msg.ticket_id,
      userId: msg.user_id,
      message: msg.message,
      attachments: msg.attachments,
      createdAt: msg.created_at,
    })) || []
  )
}

/**
 * Update ticket status
 */
export async function updateTicketStatus(
  ticketId: string,
  status: 'open' | 'in_progress' | 'resolved'
): Promise<void> {
  const supabase = getServiceSupabaseClient()

  const { error } = await supabase
    .from<Database['public']['Tables']['support_tickets']['Row'], Database['public']['Tables']['support_tickets']['Update']>('support_tickets')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', ticketId)

  if (error) {
    console.error('Failed to update ticket status:', error)
    throw error
  }
}

/**
 * Link a chat channel to a ticket
 */
export async function linkTicketToChannel(ticketId: string, channelId: string): Promise<void> {
  const supabase = getServiceSupabaseClient()

  const { error } = await supabase
    .from<Database['public']['Tables']['support_tickets']['Row'], Database['public']['Tables']['support_tickets']['Update']>('support_tickets')
    .update({ channel_id: channelId, updated_at: new Date().toISOString() })
    .eq('id', ticketId)

  if (error) {
    console.error('Failed to link ticket to channel:', error)
    throw error
  }
}

