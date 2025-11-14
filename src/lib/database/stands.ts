import { getSupabaseClient } from '@/lib/mcp/supabase'

export interface StandData {
  id: string
  company_id: string
  event_id: string
  name: string
  capacity: number
  order_index: number
  current_occupancy?: number
  snapshots?: Record<number, number | null>
  created_at: string
  updated_at: string
}

export interface StandOccupancyData {
  id: string
  company_id: string
  event_id: string
  stand_id: string
  current_occupancy: number
  predicted_60m?: number | null
  predicted_50m?: number | null
  predicted_40m?: number | null
  predicted_30m?: number | null
  predicted_20m?: number | null
  predicted_10m?: number | null
  predicted_0m?: number | null
  recorded_at: string
  recorded_by?: string
}

const BUCKET_COLUMN_MAP: Record<number, keyof StandOccupancyData> = {
  60: 'predicted_60m',
  50: 'predicted_50m',
  40: 'predicted_40m',
  30: 'predicted_30m',
  20: 'predicted_20m',
  10: 'predicted_10m',
  0: 'predicted_0m',
}

// Get all stands for a company/event
export async function getStands(companyId: string, eventId: string): Promise<StandData[]> {
  const supabase = getSupabaseClient()

  await ensureDefaultFootballStands(supabase, companyId, eventId)
  
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
    .select(
      'stand_id, current_occupancy, predicted_60m, predicted_50m, predicted_40m, predicted_30m, predicted_20m, predicted_10m, predicted_0m'
    )
    .eq('company_id', companyId)
    .eq('event_id', eventId)
  
  if (occupancyError) {
    console.error('Error fetching occupancy:', occupancyError)
  }
  
  // Merge stands with occupancy data
  const standsWithOccupancy =
    stands?.map((stand) => {
      const occ = occupancy?.find((record) => record.stand_id === stand.id)
      const snapshots: Record<number, number | null> = {
        60: occ?.predicted_60m ?? null,
        50: occ?.predicted_50m ?? null,
        40: occ?.predicted_40m ?? null,
        30: occ?.predicted_30m ?? null,
        20: occ?.predicted_20m ?? null,
        10: occ?.predicted_10m ?? null,
        0: occ?.predicted_0m ?? null,
      }

      return {
        ...stand,
        current_occupancy: occ?.current_occupancy || 0,
        snapshots,
      }
    }) || []
  
  return standsWithOccupancy
}

async function ensureDefaultFootballStands(
  supabase: ReturnType<typeof getSupabaseClient>,
  companyId: string,
  eventId: string
) {
  try {
    const { count } = await supabase
      .from('stands')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', companyId)
      .eq('event_id', eventId)

    if (count && count > 0) {
      return
    }

    const { data: event } = await supabase
      .from('events')
      .select('event_type, event_date, created_at')
      .eq('id', eventId)
      .maybeSingle()

    if (!event?.event_type || !event.event_type.toLowerCase().includes('football')) {
      return
    }

    const { data: previousEvents } = await supabase
      .from('events')
      .select('id')
      .eq('company_id', companyId)
      .ilike('event_type', '%football%')
      .neq('id', eventId)
      .order('event_date', { ascending: false })
      .order('created_at', { ascending: false })

    let defaults:
      | {
          name: string
          capacity: number
          order_index: number
        }[]
      | null = null

    if (previousEvents && previousEvents.length > 0) {
      const eventIds = previousEvents.map((evt) => evt.id)
      const { data: previousStands } = await supabase
        .from('stands')
        .select('name, capacity, order_index, event_id')
        .eq('company_id', companyId)
        .in('event_id', eventIds)
        .order('event_id', { ascending: false })
        .order('order_index', { ascending: true })

      if (previousStands && previousStands.length > 0) {
        const seen = new Set<string>()
        defaults = previousStands
          .filter((stand) => {
            if (seen.has(stand.name)) return false
            seen.add(stand.name)
            return true
          })
          .map((stand, index) => ({
            name: stand.name,
            capacity: stand.capacity ?? 1000,
            order_index: stand.order_index ?? index + 1,
          }))
      }
    }

    if (!defaults || defaults.length === 0) {
      defaults = ['North', 'South', 'East', 'West'].map((name, index) => ({
        name,
        capacity: 1000,
        order_index: index + 1,
      }))
    }

    await supabase.from('stands').insert(
      defaults.map((stand, index) => ({
        company_id: companyId,
        event_id: eventId,
        name: stand.name,
        capacity: stand.capacity ?? 1000,
        order_index: stand.order_index ?? index + 1,
      }))
    )
  } catch (error) {
    console.error('Failed to initialise default stands', error)
  }
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
  recordedBy?: string,
  countdownBucket?: number | null
): Promise<StandOccupancyData> {
  const supabase = getSupabaseClient()
  const columnName = countdownBucket != null ? BUCKET_COLUMN_MAP[countdownBucket] : undefined
  
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
    const updateData: Partial<StandOccupancyData> = {
      current_occupancy: occupancy,
      recorded_by: recordedBy,
      recorded_at: new Date().toISOString(),
    }

    if (columnName) {
      ;(updateData as any)[columnName] = occupancy
    }

    const { data: updated, error } = await supabase
      .from('stand_occupancy')
      .update(updateData)
      .eq('id', existing.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating occupancy:', error)
      throw error
    }

    return updated
  } else {
    const insertData: any = {
      company_id: companyId,
      event_id: eventId,
      stand_id: standId,
      current_occupancy: occupancy,
      recorded_by: recordedBy,
    }

    if (columnName) {
      insertData[columnName] = occupancy
    }

    const { data: newRecord, error } = await supabase
      .from('stand_occupancy')
      .insert(insertData)
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
