import { supabase } from '@/lib/supabase'
import type { FoundItem, LostFoundMatch, LostItem } from '@/types/lostAndFound'

const supabaseClient = supabase as any

interface CreateLostReportPayload {
  reporter_name?: string
  contact_email?: string
  contact_phone?: string
  description: string
  keywords?: string[]
  location?: string
  photo_url?: string
}

interface CreateFoundItemPayload {
  description: string
  keywords?: string[]
  location?: string
  storage_location?: string
  photo_url?: string
}

export async function fetchLostItems(status?: string): Promise<LostItem[]> {
  let query = supabaseClient
    .from('lost_items')
    .select('*')
    .order('reported_at', { ascending: false })

  if (status) {
    query = query.eq('status', status)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(error.message)
  }

  return (data || []) as LostItem[]
}

export async function fetchFoundItems(status?: string): Promise<FoundItem[]> {
  let query = supabaseClient
    .from('found_items')
    .select('*')
    .order('found_at', { ascending: false })

  if (status) {
    query = query.eq('status', status)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(error.message)
  }

  return (data || []) as FoundItem[]
}

export async function fetchLostFoundMatches(): Promise<LostFoundMatch[]> {
  const { data, error } = await supabaseClient
    .from('lost_found_matches')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  return (data || []) as LostFoundMatch[]
}

export async function createLostReport(payload: CreateLostReportPayload) {
  const { data, error } = await supabaseClient
    .from('lost_items')
    .insert([{ ...payload }])
    .select('*')
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data as LostItem
}

export async function createFoundItem(payload: CreateFoundItemPayload) {
  const { data, error } = await supabaseClient
    .from('found_items')
    .insert([{ ...payload }])
    .select('*')
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data as FoundItem
}

export async function confirmMatch(matchId: string, status: string, notes?: string) {
  const { error } = await supabaseClient
    .from('lost_found_matches')
    .update({ status, notes: notes || null, updated_at: new Date().toISOString() })
    .eq('id', matchId)

  if (error) {
    throw new Error(error.message)
  }
}

export async function logMatch(lostItemId: string, foundItemId: string, score?: number) {
  const { data, error } = await supabaseClient
    .from('lost_found_matches')
    .insert([{ lost_item_id: lostItemId, found_item_id: foundItemId, match_score: score || null }])
    .select('*')
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data as LostFoundMatch
}

export async function updateLostItemStatus(lostItemId: string, status: string) {
  const { error } = await supabaseClient
    .from('lost_items')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', lostItemId)

  if (error) {
    throw new Error(error.message)
  }
}

export async function updateFoundItemStatus(foundItemId: string, status: string) {
  const { error } = await supabaseClient
    .from('found_items')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', foundItemId)

  if (error) {
    throw new Error(error.message)
  }
}

export type { CreateLostReportPayload, CreateFoundItemPayload }
