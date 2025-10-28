import { getSupabaseClient } from '@/lib/mcp/supabase'

export interface TransportConfigData {
  id: string
  company_id: string
  event_id: string
  location: string
  postcode?: string
  latitude?: number
  longitude?: number
  radius: number
  providers: string[]
  created_at: string
  updated_at: string
}

export interface TransportIssueData {
  id: string
  company_id: string
  event_id: string
  config_id: string
  type: string
  description: string
  severity: string
  reported_at: string
  reported_by?: string
  resolved: boolean
  resolved_at?: string
}

// Get transport configuration for a company/event
export async function getTransportConfig(companyId: string, eventId: string): Promise<TransportConfigData | null> {
  const supabase = getSupabaseClient()
  
  const { data: config, error } = await supabase
    .from('transport_configs')
    .select('*')
    .eq('company_id', companyId)
    .eq('event_id', eventId)
    .single()
  
  if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
    console.error('Error fetching transport config:', error)
    return null
  }
  
  return config || null
}

// Create or update transport configuration
export async function upsertTransportConfig(
  companyId: string,
  eventId: string,
  data: {
    location: string
    postcode?: string
    latitude?: number
    longitude?: number
    radius: number
    providers: string[]
  }
): Promise<TransportConfigData> {
  const supabase = getSupabaseClient()
  
  const { data: config, error } = await supabase
    .from('transport_configs')
    .upsert({
      company_id: companyId,
      event_id: eventId,
      location: data.location,
      postcode: data.postcode,
      latitude: data.latitude,
      longitude: data.longitude,
      radius: data.radius,
      providers: data.providers
    })
    .select()
    .single()
  
  if (error) {
    console.error('Error upserting transport config:', error)
    throw error
  }
  
  return config
}

// Get all transport issues for a company/event
export async function getTransportIssues(companyId: string, eventId: string): Promise<TransportIssueData[]> {
  const supabase = getSupabaseClient()
  
  const { data: issues, error } = await supabase
    .from('transport_issues')
    .select('*')
    .eq('company_id', companyId)
    .eq('event_id', eventId)
    .order('reported_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching transport issues:', error)
    return []
  }
  
  return issues || []
}

// Create a new transport issue
export async function createTransportIssue(
  companyId: string,
  eventId: string,
  data: { type: string; description: string; severity: string; reported_by?: string }
): Promise<TransportIssueData> {
  const supabase = getSupabaseClient()
  
  // First get the transport config to get the config_id
  const config = await getTransportConfig(companyId, eventId)
  if (!config) {
    throw new Error('Transport configuration not found for this company/event')
  }
  
  const { data: issue, error } = await supabase
    .from('transport_issues')
    .insert({
      company_id: companyId,
      event_id: eventId,
      config_id: config.id,
      type: data.type,
      description: data.description,
      severity: data.severity,
      reported_by: data.reported_by
    })
    .select()
    .single()
  
  if (error) {
    console.error('Error creating transport issue:', error)
    throw error
  }
  
  return issue
}

// Update transport issue (resolve/unresolve)
export async function updateTransportIssue(
  companyId: string,
  eventId: string,
  issueId: string,
  resolved: boolean
): Promise<TransportIssueData> {
  const supabase = getSupabaseClient()
  
  const updateData: any = { resolved }
  if (resolved) {
    updateData.resolved_at = new Date().toISOString()
  } else {
    updateData.resolved_at = null
  }
  
  const { data: issue, error } = await supabase
    .from('transport_issues')
    .update(updateData)
    .eq('company_id', companyId)
    .eq('event_id', eventId)
    .eq('id', issueId)
    .select()
    .single()
  
  if (error) {
    console.error('Error updating transport issue:', error)
    throw error
  }
  
  return issue
}

// Delete a transport issue
export async function deleteTransportIssue(companyId: string, eventId: string, issueId: string): Promise<void> {
  const supabase = getSupabaseClient()
  
  const { error } = await supabase
    .from('transport_issues')
    .delete()
    .eq('company_id', companyId)
    .eq('event_id', eventId)
    .eq('id', issueId)
  
  if (error) {
    console.error('Error deleting transport issue:', error)
    throw error
  }
}

// Get transport issues summary
export async function getTransportIssuesSummary(companyId: string, eventId: string): Promise<{
  total_issues: number
  high_severity: number
  medium_severity: number
  low_severity: number
  resolved_issues: number
  unresolved_issues: number
}> {
  const supabase = getSupabaseClient()
  
  const { data: issues, error } = await supabase
    .from('transport_issues')
    .select('severity, resolved')
    .eq('company_id', companyId)
    .eq('event_id', eventId)
  
  if (error) {
    console.error('Error fetching transport issues for summary:', error)
    return { total_issues: 0, high_severity: 0, medium_severity: 0, low_severity: 0, resolved_issues: 0, unresolved_issues: 0 }
  }
  
  const totalIssues = issues?.length || 0
  const highSeverity = issues?.filter(i => i.severity === 'high').length || 0
  const mediumSeverity = issues?.filter(i => i.severity === 'medium').length || 0
  const lowSeverity = issues?.filter(i => i.severity === 'low').length || 0
  const resolvedIssues = issues?.filter(i => i.resolved).length || 0
  const unresolvedIssues = totalIssues - resolvedIssues
  
  return {
    total_issues: totalIssues,
    high_severity: highSeverity,
    medium_severity: mediumSeverity,
    low_severity: lowSeverity,
    resolved_issues: resolvedIssues,
    unresolved_issues: unresolvedIssues
  }
}
