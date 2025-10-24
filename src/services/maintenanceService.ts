import { supabase } from '@/lib/supabase'
import type {
  AssetRecord,
  MaintenanceEventHook,
  MaintenanceSchedule,
  MaintenanceVendor,
  WorkOrder
} from '@/types/maintenance'

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

interface CreateAssetPayload {
  asset_tag: string
  name: string
  description?: string
  location?: string
  status?: string
  service_life_months?: number | null
  commissioned_at?: string | null
}

interface CreateSchedulePayload {
  asset_id: string
  frequency_days: number
  next_due_date?: string | null
  webhook_endpoint?: string | null
  enabled?: boolean
}

interface UpdateAssetPayload {
  name?: string
  description?: string
  location?: string
  status?: string
  service_life_months?: number | null
  commissioned_at?: string | null
}

interface UpdateWorkOrderDetailsPayload {
  assigned_vendor_id?: string | null
  assigned_profile_id?: string | null
  priority?: string
  due_date?: string | null
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
  } else {
    fields.completed_at = null
    if (completionNotes !== undefined) {
      fields.completion_notes = completionNotes
    }
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

export async function createAsset(payload: CreateAssetPayload) {
  const { data, error } = await supabase
    .from('assets')
    .insert([{ ...payload }])
    .select('*')
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data as AssetRecord
}

export async function updateAsset(assetId: string, updates: UpdateAssetPayload) {
  const { error } = await supabase
    .from('assets')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', assetId)

  if (error) {
    throw new Error(error.message)
  }
}

export async function createMaintenanceSchedule(payload: CreateSchedulePayload) {
  const { data, error } = await supabase
    .from('maintenance_schedules')
    .insert([{ ...payload }])
    .select('*')
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data as MaintenanceSchedule
}

export async function toggleMaintenanceSchedule(scheduleId: string, enabled: boolean) {
  const { error } = await supabase
    .from('maintenance_schedules')
    .update({ enabled, updated_at: new Date().toISOString() })
    .eq('id', scheduleId)

  if (error) {
    throw new Error(error.message)
  }
}

export async function updateWorkOrderDetails(workOrderId: string, updates: UpdateWorkOrderDetailsPayload) {
  const { error } = await supabase
    .from('work_orders')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', workOrderId)

  if (error) {
    throw new Error(error.message)
  }
}

export async function fetchMaintenanceVendors(): Promise<MaintenanceVendor[]> {
  const { data, error } = await supabase
    .from('vendors')
    .select('id, business_name, status')
    .order('business_name', { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  return (data || []).map((vendor) => ({
    id: vendor.id,
    business_name: vendor.business_name,
    status: vendor.status ?? null
  }))
}

export type {
  CreateWorkOrderPayload,
  CreateAssetPayload,
  CreateSchedulePayload,
  UpdateWorkOrderDetailsPayload
}
