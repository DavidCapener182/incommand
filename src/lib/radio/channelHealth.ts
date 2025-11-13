// Channel Health Monitoring Service (Feature 10, Phase 4)

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'
import { RadioMessage, RadioChannelHealthInsert } from '@/types/radio'
import { 
  detectOverloadPattern, 
  calculateChannelHealthScore 
} from '@/lib/ai/radioAnalysis'

export interface ChannelHealthMetrics {
  messageCount: number
  messageRate: number // messages per minute
  avgResponseTime: number | null // seconds
  overloadIndicator: boolean
  overloadReason?: string
  healthScore: number // 0-100
  highPriorityRatio: number // 0-1
  metadata?: Record<string, any>
}

/**
 * Calculate health metrics for a radio channel
 */
export async function calculateChannelHealth(
  supabase: SupabaseClient<Database>,
  channel: string,
  eventId: string | null,
  companyId: string,
  timeWindowMinutes: number = 5
): Promise<ChannelHealthMetrics> {
  try {
    // Fetch recent messages for this channel
    let query = supabase
      .from('radio_messages')
      .select('*')
      .eq('channel', channel)
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .limit(100) // Get enough messages for analysis

    if (eventId) {
      query = query.eq('event_id', eventId)
    }

    const { data: messages, error } = await query

    if (error) {
      console.error('Error fetching messages for health calculation:', error)
      throw error
    }

    const radioMessages = (messages || []) as RadioMessage[]

    // Calculate overload pattern
    const overloadPattern = detectOverloadPattern(radioMessages, timeWindowMinutes)

    // Calculate high priority message ratio
    const highPriorityCount = radioMessages.filter(
      msg => msg.priority === 'high' || msg.priority === 'critical'
    ).length
    const highPriorityRatio = radioMessages.length > 0 
      ? highPriorityCount / radioMessages.length 
      : 0

    // Calculate health score
    const healthScore = calculateChannelHealthScore(
      overloadPattern.messageRate,
      overloadPattern.avgResponseTime,
      overloadPattern.isOverloaded,
      highPriorityRatio
    )

    return {
      messageCount: radioMessages.length,
      messageRate: overloadPattern.messageRate,
      avgResponseTime: overloadPattern.avgResponseTime,
      overloadIndicator: overloadPattern.isOverloaded,
      overloadReason: overloadPattern.overloadReason,
      healthScore,
      highPriorityRatio,
      metadata: {
        timeWindowMinutes,
        totalMessagesAnalyzed: radioMessages.length,
        highPriorityCount,
        criticalCount: radioMessages.filter(m => m.priority === 'critical').length,
      },
    }
  } catch (error: any) {
    console.error('Error calculating channel health:', error)
    // Return default/neutral metrics on error
    return {
      messageCount: 0,
      messageRate: 0,
      avgResponseTime: null,
      overloadIndicator: false,
      healthScore: 100, // Default to healthy
      highPriorityRatio: 0,
      metadata: { error: error.message },
    }
  }
}

/**
 * Store channel health metrics in the database
 */
export async function storeChannelHealth(
  supabase: SupabaseClient<Database>,
  channel: string,
  eventId: string | null,
  companyId: string,
  metrics: ChannelHealthMetrics
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const healthData: RadioChannelHealthInsert = {
      company_id: companyId,
      event_id: eventId,
      channel,
      message_count: metrics.messageCount,
      avg_response_time_seconds: metrics.avgResponseTime,
      overload_indicator: metrics.overloadIndicator,
      health_score: metrics.healthScore,
      metadata: metrics.metadata || {},
    }

    const { data, error } = await supabase
      .from('radio_channel_health')
      .insert(healthData)
      .select()
      .single()

    if (error) {
      console.error('Error storing channel health:', error)
      return {
        success: false,
        error: error.message,
      }
    }

    return {
      success: true,
      data,
    }
  } catch (error: any) {
    console.error('Error in storeChannelHealth:', error)
    return {
      success: false,
      error: error.message || 'Unknown error',
    }
  }
}

/**
 * Calculate and store health metrics for a channel
 */
export async function updateChannelHealth(
  supabase: SupabaseClient<Database>,
  channel: string,
  eventId: string | null,
  companyId: string,
  timeWindowMinutes: number = 5
): Promise<{ success: boolean; metrics?: ChannelHealthMetrics; error?: string }> {
  try {
    // Calculate metrics
    const metrics = await calculateChannelHealth(
      supabase,
      channel,
      eventId,
      companyId,
      timeWindowMinutes
    )

    // Store metrics
    const storeResult = await storeChannelHealth(
      supabase,
      channel,
      eventId,
      companyId,
      metrics
    )

    if (!storeResult.success) {
      return {
        success: false,
        error: storeResult.error,
      }
    }

    return {
      success: true,
      metrics,
    }
  } catch (error: any) {
    console.error('Error updating channel health:', error)
    return {
      success: false,
      error: error.message || 'Unknown error',
    }
  }
}

/**
 * Update health for all channels in an event
 */
export async function updateAllChannelHealth(
  supabase: SupabaseClient<Database>,
  eventId: string | null,
  companyId: string,
  timeWindowMinutes: number = 5
): Promise<{ success: boolean; updated: number; errors: string[] }> {
  try {
    // Get all unique channels for this event/company
    let query = supabase
      .from('radio_messages')
      .select('channel')
      .eq('company_id', companyId)
      .limit(1000)

    if (eventId) {
      query = query.eq('event_id', eventId)
    }

    const { data: messages, error } = await query

    if (error) {
      console.error('Error fetching channels:', error)
      return {
        success: false,
        updated: 0,
        errors: [error.message],
      }
    }

    const channels = new Set((messages || []).map(m => m.channel))
    const errors: string[] = []
    let updated = 0

    // Update health for each channel
    for (const channel of channels) {
      const result = await updateChannelHealth(
        supabase,
        channel,
        eventId,
        companyId,
        timeWindowMinutes
      )

      if (result.success) {
        updated++
      } else {
        errors.push(`Channel ${channel}: ${result.error}`)
      }
    }

    return {
      success: errors.length === 0,
      updated,
      errors,
    }
  } catch (error: any) {
    console.error('Error updating all channel health:', error)
    return {
      success: false,
      updated: 0,
      errors: [error.message || 'Unknown error'],
    }
  }
}

