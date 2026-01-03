// TypeScript types for Radio Traffic Analysis (Feature 10)

export type RadioMessageCategory = 'incident' | 'routine' | 'emergency' | 'coordination' | 'other'
export type RadioMessagePriority = 'low' | 'medium' | 'high' | 'critical'

export interface RadioMessage {
  id: string
  company_id: string
  event_id: string | null
  channel: string
  from_callsign: string | null
  to_callsign: string | null
  message: string
  transcription: string | null
  audio_url: string | null
  category: RadioMessageCategory | null
  priority: RadioMessagePriority | null
  incident_id: string | null
  task_id: string | null
  metadata: Record<string, any>
  created_at: string
  updated_at: string
}

export interface RadioChannelHealth {
  id: string
  company_id: string
  event_id: string | null
  channel: string
  timestamp: string
  message_count: number
  avg_response_time_seconds: number | null
  overload_indicator: boolean
  health_score: number | null
  metadata: Record<string, any>
  created_at: string
}

export interface RadioChannel {
  channel: string
  message_count: number
  latest_message_at: string | null
  health_score: number | null
  overload_indicator: boolean
}

export interface RadioAnalysisFilters {
  event_id?: string
  channel?: string
  category?: RadioMessageCategory
  priority?: RadioMessagePriority
  from_callsign?: string
  to_callsign?: string
  date_from?: string
  date_to?: string
  search?: string
}

// Fallback types if Supabase types are not yet generated
export interface RadioMessageInsert {
  company_id: string
  event_id?: string | null
  channel: string
  from_callsign?: string | null
  to_callsign?: string | null
  message: string
  transcription?: string | null
  audio_url?: string | null
  category?: RadioMessageCategory | null
  priority?: RadioMessagePriority | null
  incident_id?: string | null
  task_id?: string | null
  metadata?: Record<string, any>
}

export interface RadioChannelHealthInsert {
  company_id: string
  event_id?: string | null
  channel: string
  message_count?: number
  avg_response_time_seconds?: number | null
  overload_indicator?: boolean
  health_score?: number | null
  metadata?: Record<string, any>
}

