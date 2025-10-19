import { supabase } from '@/lib/supabase'
import type { AssetRecord, MaintenanceEventHook, MaintenanceSchedule, WorkOrder } from '@/types/maintenance'

interface CreateWorkOrderPayload {
  asset_id?: string | null
  schedule_id?: string | null
  title: string
  description?: string
  priority?: string
  due_date?: string
  assigned_vendor_id?: string | null
  assigned_profile_id?: string | null
}

export async function fetchAssets(): Promise<AssetRecord[]> {
  const { data, error } = await supabase
    .from('assets')
    .select('*')
    .order('asset_tag', { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  return (data || []) as AssetRecord[]
}

export async function fetchMaintenanceSchedules(): Promise<MaintenanceSchedule[]> {
  const { data, error } = await supabase
    .from('maintenance_schedules')
    .select('*')
    .order('next_due_date', { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  return (data || []) as MaintenanceSchedule[]
}

export async function fetchWorkOrders(status?: string): Promise<WorkOrder[]> {
  let query = supabase
    .from('work_orders')
    .select('*')
    .order('created_at', { ascending: false })

  if (status) {
    query = query.eq('status', status)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(error.message)
  }

  return (data || []) as WorkOrder[]
}

export async function fetchMaintenanceEventHooks(): Promise<MaintenanceEventHook[]> {
  const { data, error } = await supabase
    .from('maintenance_event_hooks')
    .select('*')

  if (error) {
    throw new Error(error.message)
  }

  return (data || []) as MaintenanceEventHook[]
}

export async function createWorkOrder(payload: CreateWorkOrderPayload) {
  const { data, error } = await supabase
    .from('work_orders')
    .insert([{ ...payload }])
    .select('*')
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data as WorkOrder
}

export async function updateWorkOrderStatus(workOrderId: string, status: string, completionNotes?: string) {
  const fields: Record<string, any> = { status, updated_at: new Date().toISOString() }
  if (status === 'completed') {
    fields.completed_at = new Date().toISOString()
    fields.completion_notes = completionNotes || null
  }

  const { error } = await supabase
    .from('work_orders')
    .update(fields)
    .eq('id', workOrderId)

  if (error) {
    throw new Error(error.message)
  }
}

export async function scheduleMaintenanceCompletion(scheduleId: string) {
  const { error } = await supabase
    .from('maintenance_schedules')
    .update({
      last_completed_at: new Date().toISOString()
    })
    .eq('id', scheduleId)

  if (error) {
    throw new Error(error.message)
  }
}

export type { CreateWorkOrderPayload }
