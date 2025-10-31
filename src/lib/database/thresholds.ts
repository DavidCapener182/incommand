import { getSupabaseClient } from '@/lib/mcp/supabase'

export interface StandThresholds {
  id: string
  company_id: string
  event_id: string
  default_green_threshold: number
  default_amber_threshold: number
  default_red_threshold: number
  stand_overrides: Record<string, {
    amber?: number
    red?: number
  }>
  created_at: string
  updated_at: string
}

export interface StandThresholdsInput {
  default_green_threshold?: number
  default_amber_threshold?: number
  default_red_threshold?: number
  stand_overrides?: Record<string, {
    amber?: number
    red?: number
  }>
}

// Get thresholds for a company/event
export async function getStandThresholds(
  companyId: string,
  eventId: string
): Promise<StandThresholds | null> {
  const supabase = getSupabaseClient()
  
  const { data, error } = await supabase
    .from('football_stand_thresholds')
    .select('*')
    .eq('company_id', companyId)
    .eq('event_id', eventId)
    .maybeSingle()
  
  if (error) {
    console.error('Error fetching stand thresholds:', error)
    return null
  }
  
  return data
}

// Upsert thresholds for a company/event
export async function upsertStandThresholds(
  companyId: string,
  eventId: string,
  thresholds: StandThresholdsInput
): Promise<StandThresholds> {
  const supabase = getSupabaseClient()
  
  const { data, error } = await supabase
    .from('football_stand_thresholds')
    .upsert({
      company_id: companyId,
      event_id: eventId,
      default_green_threshold: thresholds.default_green_threshold ?? 90,
      default_amber_threshold: thresholds.default_amber_threshold ?? 97,
      default_red_threshold: thresholds.default_red_threshold ?? 100,
      stand_overrides: thresholds.stand_overrides ?? {},
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'company_id,event_id'
    })
    .select()
    .single()
  
  if (error) {
    console.error('Error upserting stand thresholds:', error)
    throw error
  }
  
  return data
}

