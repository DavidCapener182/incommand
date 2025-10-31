import { getSupabaseClient } from '@/lib/mcp/supabase'

export type SupportToolType = 'stand' | 'staffing' | 'crowd' | 'transport' | 'fixture'

export interface SupportToolsSettings {
  id: string
  company_id: string
  event_id: string
  tool_type: SupportToolType
  auto_refresh_enabled: boolean
  auto_refresh_interval: number
  settings_json: Record<string, any>
  created_at: string
  updated_at: string
}

export interface SupportToolsSettingsInput {
  auto_refresh_enabled?: boolean
  auto_refresh_interval?: number
  settings_json?: Record<string, any>
}

// Get settings for a specific tool
export async function getSupportToolsSettings(
  companyId: string,
  eventId: string,
  toolType: SupportToolType
): Promise<SupportToolsSettings | null> {
  const supabase = getSupabaseClient()
  
  const { data, error } = await supabase
    .from('football_support_tools_settings')
    .select('*')
    .eq('company_id', companyId)
    .eq('event_id', eventId)
    .eq('tool_type', toolType)
    .maybeSingle()
  
  if (error) {
    console.error('Error fetching support tools settings:', error)
    return null
  }
  
  return data
}

// Get all settings for a company/event
export async function getAllSupportToolsSettings(
  companyId: string,
  eventId: string
): Promise<SupportToolsSettings[]> {
  const supabase = getSupabaseClient()
  
  const { data, error } = await supabase
    .from('football_support_tools_settings')
    .select('*')
    .eq('company_id', companyId)
    .eq('event_id', eventId)
  
  if (error) {
    console.error('Error fetching all support tools settings:', error)
    return []
  }
  
  return data || []
}

// Upsert settings for a specific tool
export async function upsertSupportToolsSettings(
  companyId: string,
  eventId: string,
  toolType: SupportToolType,
  settings: SupportToolsSettingsInput
): Promise<SupportToolsSettings> {
  const supabase = getSupabaseClient()
  
  // Get existing settings to merge with new ones
  const existing = await getSupportToolsSettings(companyId, eventId, toolType)
  
  const { data, error } = await supabase
    .from('football_support_tools_settings')
    .upsert({
      company_id: companyId,
      event_id: eventId,
      tool_type: toolType,
      auto_refresh_enabled: settings.auto_refresh_enabled ?? existing?.auto_refresh_enabled ?? true,
      auto_refresh_interval: settings.auto_refresh_interval ?? existing?.auto_refresh_interval ?? 30,
      settings_json: {
        ...(existing?.settings_json || {}),
        ...(settings.settings_json || {})
      },
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'company_id,event_id,tool_type'
    })
    .select()
    .single()
  
  if (error) {
    console.error('Error upserting support tools settings:', error)
    throw error
  }
  
  return data
}

