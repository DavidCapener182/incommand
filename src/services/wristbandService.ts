import { supabase } from '@/lib/supabase'
import type { WristbandType, AccreditationAccessLevel } from '@/types/wristband'

export async function fetchWristbandTypes(eventId: string): Promise<WristbandType[]> {
  const { data, error } = await supabase
    .from('wristband_types')
    .select(`
      *,
      wristband_access_levels(
        access_level_id,
        accreditation_access_levels(*)
      )
    `)
    .eq('event_id', eventId)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  // Transform the data to include access_levels directly
  return (data || []).map(wristband => ({
    ...wristband,
    access_levels: wristband.wristband_access_levels?.map((link: any) => link.accreditation_access_levels).filter(Boolean) || []
  })) as WristbandType[]
}

export async function fetchAccreditationAccessLevels(eventId: string): Promise<AccreditationAccessLevel[]> {
  const { data, error } = await supabase
    .from('accreditation_access_levels')
    .select('*')
    .eq('event_id', eventId)
    .order('name', { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  return (data || []) as AccreditationAccessLevel[]
}

export async function createWristbandType(data: {
  event_id: string
  wristband_name: string
  wristband_color: string
  available_quantity?: number | null
  notes?: string | null
  access_level_ids: string[]
}): Promise<void> {
  const { data: wristband, error: wristbandError } = await supabase
    .from('wristband_types')
    .insert({
      event_id: data.event_id,
      wristband_name: data.wristband_name,
      wristband_color: data.wristband_color,
      available_quantity: data.available_quantity,
      notes: data.notes
    })
    .select()
    .single()

  if (wristbandError) {
    throw new Error(wristbandError.message)
  }

  // Create access level associations
  if (data.access_level_ids.length > 0) {
    const accessLevelLinks = data.access_level_ids.map(accessLevelId => ({
      wristband_type_id: wristband.id,
      access_level_id: accessLevelId
    }))

    const { error: linksError } = await supabase
      .from('wristband_access_levels')
      .insert(accessLevelLinks)

    if (linksError) {
      throw new Error(linksError.message)
    }
  }
}

export async function updateWristbandType(
  id: string,
  data: Partial<WristbandType> & { access_level_ids?: string[] }
): Promise<void> {
  const { access_level_ids, ...wristbandData } = data

  // Update wristband type
  const { error: wristbandError } = await supabase
    .from('wristband_types')
    .update({
      ...wristbandData,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)

  if (wristbandError) {
    throw new Error(wristbandError.message)
  }

  // Update access level associations if provided
  if (access_level_ids !== undefined) {
    // Delete existing associations
    const { error: deleteError } = await supabase
      .from('wristband_access_levels')
      .delete()
      .eq('wristband_type_id', id)

    if (deleteError) {
      throw new Error(deleteError.message)
    }

    // Create new associations
    if (access_level_ids.length > 0) {
      const accessLevelLinks = access_level_ids.map(accessLevelId => ({
        wristband_type_id: id,
        access_level_id: accessLevelId
      }))

      const { error: linksError } = await supabase
        .from('wristband_access_levels')
        .insert(accessLevelLinks)

      if (linksError) {
        throw new Error(linksError.message)
      }
    }
  }
}

export async function deleteWristbandType(id: string): Promise<void> {
  const { error } = await supabase
    .from('wristband_types')
    .delete()
    .eq('id', id)

  if (error) {
    throw new Error(error.message)
  }
}

export async function createAccreditationAccessLevel(data: {
  event_id: string
  name: string
  description?: string | null
}): Promise<AccreditationAccessLevel> {
  const { data: accessLevel, error } = await supabase
    .from('accreditation_access_levels')
    .insert({
      event_id: data.event_id,
      name: data.name,
      description: data.description
    })
    .select()
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return accessLevel as AccreditationAccessLevel
}

export async function updateAccreditationAccessLevel(
  id: string,
  data: Partial<AccreditationAccessLevel>
): Promise<void> {
  const { error } = await supabase
    .from('accreditation_access_levels')
    .update(data)
    .eq('id', id)

  if (error) {
    throw new Error(error.message)
  }
}

export async function deleteAccreditationAccessLevel(id: string): Promise<void> {
  const { error } = await supabase
    .from('accreditation_access_levels')
    .delete()
    .eq('id', id)

  if (error) {
    throw new Error(error.message)
  }
}
