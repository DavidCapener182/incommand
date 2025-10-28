import { getSupabaseClient } from '@/lib/mcp/supabase'

export interface StaffingRoleData {
  id: string
  company_id: string
  event_id: string
  name: string
  planned_count: number
  icon?: string
  color?: string
  actual_count?: number
  created_at: string
  updated_at: string
}

export interface StaffingActualData {
  id: string
  company_id: string
  event_id: string
  role_id: string
  actual_count: number
  recorded_at: string
  recorded_by?: string
}

// Get all staffing roles with actual counts for a company/event
export async function getStaffingRoles(companyId: string, eventId: string): Promise<StaffingRoleData[]> {
  const supabase = getSupabaseClient()
  
  // Get staffing roles
  const { data: roles, error: rolesError } = await supabase
    .from('staffing_roles')
    .select('*')
    .eq('company_id', companyId)
    .eq('event_id', eventId)
    .order('name', { ascending: true })
  
  if (rolesError) {
    console.error('Error fetching staffing roles:', rolesError)
    return []
  }
  
  // Get actual counts
  const { data: actuals, error: actualsError } = await supabase
    .from('staffing_actuals')
    .select('role_id, actual_count')
    .eq('company_id', companyId)
    .eq('event_id', eventId)
  
  if (actualsError) {
    console.error('Error fetching staffing actuals:', actualsError)
  }
  
  // Merge roles with actual counts
  const rolesWithActuals = roles?.map(role => ({
    ...role,
    actual_count: actuals?.find(actual => actual.role_id === role.id)?.actual_count || 0
  })) || []
  
  return rolesWithActuals
}

// Create a new staffing role
export async function createStaffingRole(
  companyId: string,
  eventId: string,
  data: { name: string; planned_count: number; icon?: string; color?: string }
): Promise<StaffingRoleData> {
  const supabase = getSupabaseClient()
  
  const { data: newRole, error } = await supabase
    .from('staffing_roles')
    .insert({
      company_id: companyId,
      event_id: eventId,
      name: data.name,
      planned_count: data.planned_count,
      icon: data.icon,
      color: data.color
    })
    .select()
    .single()
  
  if (error) {
    console.error('Error creating staffing role:', error)
    throw error
  }
  
  return newRole
}

// Update a staffing role
export async function updateStaffingRole(
  companyId: string,
  eventId: string,
  roleId: string,
  data: { name?: string; planned_count?: number; icon?: string; color?: string }
): Promise<StaffingRoleData> {
  const supabase = getSupabaseClient()
  
  const updateData: any = {}
  if (data.name !== undefined) updateData.name = data.name
  if (data.planned_count !== undefined) updateData.planned_count = data.planned_count
  if (data.icon !== undefined) updateData.icon = data.icon
  if (data.color !== undefined) updateData.color = data.color
  
  const { data: updatedRole, error } = await supabase
    .from('staffing_roles')
    .update(updateData)
    .eq('company_id', companyId)
    .eq('event_id', eventId)
    .eq('id', roleId)
    .select()
    .single()
  
  if (error) {
    console.error('Error updating staffing role:', error)
    throw error
  }
  
  return updatedRole
}

// Delete a staffing role
export async function deleteStaffingRole(companyId: string, eventId: string, roleId: string): Promise<void> {
  const supabase = getSupabaseClient()
  
  const { error } = await supabase
    .from('staffing_roles')
    .delete()
    .eq('company_id', companyId)
    .eq('event_id', eventId)
    .eq('id', roleId)
  
  if (error) {
    console.error('Error deleting staffing role:', error)
    throw error
  }
}

// Update actual staffing count
export async function updateStaffingActual(
  companyId: string,
  eventId: string,
  roleId: string,
  actualCount: number,
  recordedBy?: string
): Promise<StaffingActualData> {
  const supabase = getSupabaseClient()
  
  // First, try to update existing record
  const { data: existing, error: selectError } = await supabase
    .from('staffing_actuals')
    .select('id')
    .eq('company_id', companyId)
    .eq('event_id', eventId)
    .eq('role_id', roleId)
    .single()
  
  if (selectError && selectError.code !== 'PGRST116') {
    console.error('Error checking existing actual:', selectError)
  }
  
  if (existing) {
    // Update existing record
    const { data: updated, error } = await supabase
      .from('staffing_actuals')
      .update({
        actual_count: actualCount,
        recorded_by: recordedBy,
        recorded_at: new Date().toISOString()
      })
      .eq('id', existing.id)
      .select()
      .single()
    
    if (error) {
      console.error('Error updating actual:', error)
      throw error
    }
    
    return updated
  } else {
    // Create new record
    const { data: newRecord, error } = await supabase
      .from('staffing_actuals')
      .insert({
        company_id: companyId,
        event_id: eventId,
        role_id: roleId,
        actual_count: actualCount,
        recorded_by: recordedBy
      })
      .select()
      .single()
    
    if (error) {
      console.error('Error creating actual record:', error)
      throw error
    }
    
    return newRecord
  }
}

// Get staffing summary
export async function getStaffingSummary(companyId: string, eventId: string): Promise<{
  total_planned: number
  total_actual: number
  variance: number
}> {
  const roles = await getStaffingRoles(companyId, eventId)
  
  const total_planned = roles.reduce((sum, role) => sum + role.planned_count, 0)
  const total_actual = roles.reduce((sum, role) => sum + (role.actual_count || 0), 0)
  const variance = total_actual - total_planned
  
  return {
    total_planned,
    total_actual,
    variance
  }
}
