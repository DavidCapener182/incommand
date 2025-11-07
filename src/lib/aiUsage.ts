/**
 * AI Usage Tracking Utilities
 * Server-side functions for logging and querying AI usage
 */

import { getServiceSupabaseClient } from '@/lib/supabaseServer'
import type { SupabaseClient } from '@supabase/supabase-js'

export interface AIUsageLogParams {
  userId: string
  orgId?: string | null
  endpoint: string
  model: string
  tokensPrompt: number
  tokensCompletion: number
  tokensTotal: number
  costUsd: number
  metadata?: Record<string, any>
}

export interface UsageSummary {
  apiCalls: number
  tokensUsed: number
  totalCost: number
  avgPerDay: number
}

export interface UsageSeriesPoint {
  date: string
  calls: number
  tokens: number
  cost: number
}

export interface UsageTableRow {
  id: string
  date: string
  endpoint: string
  model: string
  tokens: number
  cost: number
}

/**
 * Log AI usage to the database
 */
export async function logAIUsage(
  params: AIUsageLogParams,
  client?: SupabaseClient
): Promise<void> {
  const supabase = client || getServiceSupabaseClient()

  try {
    const { error } = await supabase.from('ai_usage_logs').insert({
      user_id: params.userId,
      org_id: params.orgId,
      endpoint: params.endpoint,
      model: params.model,
      tokens_prompt: params.tokensPrompt,
      tokens_completion: params.tokensCompletion,
      tokens_total: params.tokensTotal,
      cost_usd: params.costUsd,
      metadata: params.metadata || {},
    })

    if (error) {
      console.error('Failed to log AI usage:', error)
      throw error
    }
  } catch (error) {
    console.error('Error logging AI usage:', error)
    throw error
  }
}

/**
 * Get usage summary for a user within a date range
 */
export async function getUsageSummary(params: {
  userId: string
  from: Date
  to: Date
  endpoint?: string
  model?: string
}): Promise<UsageSummary> {
  const supabase = getServiceSupabaseClient()

  let query = supabase
    .from('ai_usage_logs')
    .select('tokens_total, cost_usd')
    .eq('user_id', params.userId)
    .gte('timestamp', params.from.toISOString())
    .lte('timestamp', params.to.toISOString())

  if (params.endpoint) {
    query = query.eq('endpoint', params.endpoint)
  }

  if (params.model) {
    query = query.eq('model', params.model)
  }

  const { data, error } = await query

  if (error) {
    console.error('Failed to get usage summary:', error)
    throw error
  }

  const apiCalls = data?.length || 0
  const tokensUsed = data?.reduce((sum, log) => sum + (log.tokens_total || 0), 0) || 0
  const totalCost = data?.reduce((sum, log) => sum + parseFloat(String(log.cost_usd || 0)), 0) || 0

  const daysDiff = Math.max(1, Math.ceil((params.to.getTime() - params.from.getTime()) / (1000 * 60 * 60 * 24)))
  const avgPerDay = apiCalls / daysDiff

  return {
    apiCalls,
    tokensUsed,
    totalCost,
    avgPerDay: Math.round(avgPerDay * 100) / 100,
  }
}

/**
 * Get usage time series data for charts
 */
export async function getUsageSeries(params: {
  userId: string
  from: Date
  to: Date
}): Promise<UsageSeriesPoint[]> {
  const supabase = getServiceSupabaseClient()

  const { data, error } = await supabase
    .from('ai_usage_logs')
    .select('timestamp, tokens_total, cost_usd')
    .eq('user_id', params.userId)
    .gte('timestamp', params.from.toISOString())
    .lte('timestamp', params.to.toISOString())
    .order('timestamp', { ascending: true })

  if (error) {
    console.error('Failed to get usage series:', error)
    throw error
  }

  // Group by date
  const byDate = new Map<string, { calls: number; tokens: number; cost: number }>()

  data?.forEach((log) => {
    const date = new Date(log.timestamp).toISOString().split('T')[0]
    const existing = byDate.get(date) || { calls: 0, tokens: 0, cost: 0 }
    byDate.set(date, {
      calls: existing.calls + 1,
      tokens: existing.tokens + (log.tokens_total || 0),
      cost: existing.cost + parseFloat(String(log.cost_usd || 0)),
    })
  })

  // Fill in missing dates with zeros
  const result: UsageSeriesPoint[] = []
  const current = new Date(params.from)
  const end = new Date(params.to)

  while (current <= end) {
    const dateStr = current.toISOString().split('T')[0]
    const dayData = byDate.get(dateStr) || { calls: 0, tokens: 0, cost: 0 }
    result.push({
      date: dateStr,
      ...dayData,
    })
    current.setDate(current.getDate() + 1)
  }

  return result
}

/**
 * Get usage table data with pagination
 */
export async function getUsageTable(params: {
  userId: string
  from: Date
  to: Date
  endpoint?: string
  model?: string
  limit?: number
  offset?: number
}): Promise<{ data: UsageTableRow[]; total: number }> {
  const supabase = getServiceSupabaseClient()

  let query = supabase
    .from('ai_usage_logs')
    .select('id, timestamp, endpoint, model, tokens_total, cost_usd', { count: 'exact' })
    .eq('user_id', params.userId)
    .gte('timestamp', params.from.toISOString())
    .lte('timestamp', params.to.toISOString())
    .order('timestamp', { ascending: false })

  if (params.endpoint) {
    query = query.eq('endpoint', params.endpoint)
  }

  if (params.model) {
    query = query.eq('model', params.model)
  }

  if (params.limit) {
    query = query.limit(params.limit)
  }

  if (params.offset) {
    query = query.range(params.offset, params.offset + (params.limit || 50) - 1)
  }

  const { data, error, count } = await query

  if (error) {
    console.error('Failed to get usage table:', error)
    throw error
  }

  const rows: UsageTableRow[] =
    data?.map((log) => ({
      id: log.id,
      date: new Date(log.timestamp).toISOString(),
      endpoint: log.endpoint,
      model: log.model,
      tokens: log.tokens_total || 0,
      cost: parseFloat(String(log.cost_usd || 0)),
    })) || []

  return {
    data: rows,
    total: count || 0,
  }
}

