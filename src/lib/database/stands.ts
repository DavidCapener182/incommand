import { getSupabaseClient } from '@/lib/mcp/supabase'

export interface StandData {
  id: string
  company_id: string
  event_id: string
  name: string
  capacity: number
  order_index: number
  current_occupancy?: number
  created_at: string
  updated_at: string
}

export interface StandOccupancyData {
  id: string
  company_id: string
  event_id: string
  stand_id: string
  current_occupancy: number
  recorded_at: string
  recorded_by?: string
}

// Get all stands for a company/event
export async function getStands(companyId: string, eventId: string): Promise<StandData[]> {
  const supabase = getSupabaseClient()
  
  // Get stands
  const { data: stands, error: standsError } = await supabase
    .from('stands')
    .select('*')
    .eq('company_id', companyId)
    .eq('event_id', eventId)
    .order('order_index', { ascending: true })
  
  if (standsError) {
    console.error('Error fetching stands:', standsError)
    return []
  }
  
  // Get occupancy data
  const { data: occupancy, error: occupancyError } = await supabase
    .from('stand_occupancy')
    .select('stand_id, current_occupancy')
    .eq('company_id', companyId)
    .eq('event_id', eventId)
  
  if (occupancyError) {
    console.error('Error fetching occupancy:', occupancyError)
  }
  
  // Merge stands with occupancy data
  const standsWithOccupancy = stands?.map(stand => ({
    ...stand,
    current_occupancy: occupancy?.find(occ => occ.stand_id === stand.id)?.current_occupancy || 0
  })) || []
  
  return standsWithOccupancy
}

// Create a new stand
export async function createStand(
  companyId: string, 
  eventId: string, 
  data: { name: string; capacity: number; order_index: number }
): Promise<StandData> {
  const supabase = getSupabaseClient()
  
  const { data: newStand, error } = await supabase
    .from('stands')
    .insert({
      company_id: companyId,
      event_id: eventId,
      name: data.name,
      capacity: data.capacity,
      order_index: data.order_index
    })
    .select()
    .single()
  
  if (error) {
    console.error('Error creating stand:', error)
    throw error
  }
  
  return newStand
}

// Update a stand
export async function updateStand(
  companyId: string,
  eventId: string,
  standId: string,
  data: { name?: string; capacity?: number; order_index?: number }
): Promise<StandData> {
  const supabase = getSupabaseClient()
  
  const updateData: any = {}
  if (data.name !== undefined) updateData.name = data.name
  if (data.capacity !== undefined) updateData.capacity = data.capacity
  if (data.order_index !== undefined) updateData.order_index = data.order_index
  
  const { data: updatedStand, error } = await supabase
    .from('stands')
    .update(updateData)
    .eq('company_id', companyId)
    .eq('event_id', eventId)
    .eq('id', standId)
    .select()
    .single()
  
  if (error) {
    console.error('Error updating stand:', error)
    throw error
  }
  
  return updatedStand
}

// Delete a stand
export async function deleteStand(companyId: string, eventId: string, standId: string): Promise<void> {
  const supabase = getSupabaseClient()
  
  const { error } = await supabase
    .from('stands')
    .delete()
    .eq('company_id', companyId)
    .eq('event_id', eventId)
    .eq('id', standId)
  
  if (error) {
    console.error('Error deleting stand:', error)
    throw error
  }
}

// Update stand occupancy
export async function updateStandOccupancy(
  companyId: string,
  eventId: string,
  standId: string,
  occupancy: number,
  recordedBy?: string
): Promise<StandOccupancyData> {
  const supabase = getSupabaseClient()
  
  // First, try to update existing record
  const { data: existing, error: selectError } = await supabase
    .from('stand_occupancy')
    .select('id')
    .eq('company_id', companyId)
    .eq('event_id', eventId)
    .eq('stand_id', standId)
    .single()
  
  if (selectError && selectError.code !== 'PGRST116') {
    console.error('Error checking existing occupancy:', selectError)
  }
  
  if (existing) {
    // Update existing record
    const { data: updated, error } = await supabase
      .from('stand_occupancy')
      .update({
        current_occupancy: occupancy,
        recorded_by: recordedBy,
        recorded_at: new Date().toISOString()
      })
      .eq('id', existing.id)
      .select()
      .single()
    
    if (error) {
      console.error('Error updating occupancy:', error)
      throw error
    }
    
    return updated
  } else {
    // Create new record
    const { data: newRecord, error } = await supabase
      .from('stand_occupancy')
      .insert({
        company_id: companyId,
        event_id: eventId,
        stand_id: standId,
        current_occupancy: occupancy,
        recorded_by: recordedBy
      })
      .select()
      .single()
    
    if (error) {
      console.error('Error creating occupancy record:', error)
      throw error
    }
    
    return newRecord
  }
}

// Get total capacity for a company/event
export async function getTotalCapacity(companyId: string, eventId: string): Promise<number> {
  const supabase = getSupabaseClient()
  
  const { data, error } = await supabase
    .from('stands')
    .select('capacity')
    .eq('company_id', companyId)
    .eq('event_id', eventId)
  
  if (error) {
    console.error('Error fetching total capacity:', error)
    return 0
  }
  
  return data?.reduce((sum, stand) => sum + stand.capacity, 0) || 0
}
