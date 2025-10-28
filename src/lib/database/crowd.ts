import { getSupabaseClient } from '@/lib/mcp/supabase'

export interface GateData {
  id: string
  company_id: string
  event_id: string
  name: string
  sensor_id?: string
  entry_rate: number
  threshold: number
  status?: string
  current_entry_rate?: number
  created_at: string
  updated_at: string
}

export interface GateStatusData {
  id: string
  company_id: string
  event_id: string
  gate_id: string
  status: string
  entry_rate: number
  recorded_at: string
  recorded_by?: string
}

// Get all gates with current status for a company/event
export async function getGates(companyId: string, eventId: string): Promise<GateData[]> {
  const supabase = getSupabaseClient()
  
  // Get gates
  const { data: gates, error: gatesError } = await supabase
    .from('gates')
    .select('*')
    .eq('company_id', companyId)
    .eq('event_id', eventId)
    .order('name', { ascending: true })
  
  if (gatesError) {
    console.error('Error fetching gates:', gatesError)
    return []
  }
  
  // Get gate status
  const { data: statuses, error: statusesError } = await supabase
    .from('gate_status')
    .select('gate_id, status, entry_rate')
    .eq('company_id', companyId)
    .eq('event_id', eventId)
  
  if (statusesError) {
    console.error('Error fetching gate statuses:', statusesError)
  }
  
  // Merge gates with status data
  const gatesWithStatus = gates?.map(gate => ({
    ...gate,
    status: statuses?.find(status => status.gate_id === gate.id)?.status,
    current_entry_rate: statuses?.find(status => status.gate_id === gate.id)?.entry_rate
  })) || []
  
  return gatesWithStatus
}

// Create a new gate
export async function createGate(
  companyId: string,
  eventId: string,
  data: { name: string; sensor_id?: string; entry_rate: number; threshold: number }
): Promise<GateData> {
  const supabase = getSupabaseClient()
  
  const { data: gate, error } = await supabase
    .from('gates')
    .insert({
      company_id: companyId,
      event_id: eventId,
      name: data.name,
      sensor_id: data.sensor_id,
      entry_rate: data.entry_rate,
      threshold: data.threshold
    })
    .select()
    .single()
  
  if (error) {
    console.error('Error creating gate:', error)
    throw error
  }
  
  return gate
}

// Update a gate
export async function updateGate(
  companyId: string,
  eventId: string,
  gateId: string,
  data: { name?: string; sensor_id?: string; entry_rate?: number; threshold?: number }
): Promise<GateData> {
  const supabase = getSupabaseClient()
  
  const updateData: any = {}
  if (data.name !== undefined) updateData.name = data.name
  if (data.sensor_id !== undefined) updateData.sensor_id = data.sensor_id
  if (data.entry_rate !== undefined) updateData.entry_rate = data.entry_rate
  if (data.threshold !== undefined) updateData.threshold = data.threshold
  
  const { data: gate, error } = await supabase
    .from('gates')
    .update(updateData)
    .eq('company_id', companyId)
    .eq('event_id', eventId)
    .eq('id', gateId)
    .select()
    .single()
  
  if (error) {
    console.error('Error updating gate:', error)
    throw error
  }
  
  return gate
}

// Delete a gate
export async function deleteGate(companyId: string, eventId: string, gateId: string): Promise<void> {
  const supabase = getSupabaseClient()
  
  const { error } = await supabase
    .from('gates')
    .delete()
    .eq('company_id', companyId)
    .eq('event_id', eventId)
    .eq('id', gateId)
  
  if (error) {
    console.error('Error deleting gate:', error)
    throw error
  }
}

// Update gate status
export async function updateGateStatus(
  companyId: string,
  eventId: string,
  gateId: string,
  status: string,
  entryRate: number,
  recordedBy?: string
): Promise<GateStatusData> {
  const supabase = getSupabaseClient()
  
  const { data: gateStatus, error } = await supabase
    .from('gate_status')
    .upsert({
      company_id: companyId,
      event_id: eventId,
      gate_id: gateId,
      status,
      entry_rate: entryRate,
      recorded_by: recordedBy
    })
    .select()
    .single()
  
  if (error) {
    console.error('Error updating gate status:', error)
    throw error
  }
  
  return gateStatus
}

// Get gate status summary
export async function getGateStatusSummary(companyId: string, eventId: string): Promise<{
  total_gates: number
  active_gates: number
  delayed_gates: number
  closed_gates: number
  total_entry_rate: number
}> {
  const supabase = getSupabaseClient()
  
  // Get all gates
  const { data: gates, error: gatesError } = await supabase
    .from('gates')
    .select('id')
    .eq('company_id', companyId)
    .eq('event_id', eventId)
  
  if (gatesError) {
    console.error('Error fetching gates for summary:', gatesError)
    return { total_gates: 0, active_gates: 0, delayed_gates: 0, closed_gates: 0, total_entry_rate: 0 }
  }
  
  // Get gate statuses
  const { data: statuses, error: statusesError } = await supabase
    .from('gate_status')
    .select('status, entry_rate')
    .eq('company_id', companyId)
    .eq('event_id', eventId)
  
  if (statusesError) {
    console.error('Error fetching gate statuses for summary:', statusesError)
  }
  
  const totalGates = gates?.length || 0
  const activeGates = statuses?.filter(s => s.status === 'active').length || 0
  const delayedGates = statuses?.filter(s => s.status === 'delayed').length || 0
  const closedGates = statuses?.filter(s => s.status === 'closed').length || 0
  const totalEntryRate = statuses?.reduce((sum, s) => sum + (s.entry_rate || 0), 0) || 0
  
  return {
    total_gates: totalGates,
    active_gates: activeGates,
    delayed_gates: delayedGates,
    closed_gates: closedGates,
    total_entry_rate: totalEntryRate
  }
}
