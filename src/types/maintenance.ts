export interface AssetRecord {
  id: string
  asset_tag: string
  name: string
  description?: string | null
  location?: string | null
  status: string
  service_life_months?: number | null
  commissioned_at?: string | null
  created_at?: string
  updated_at?: string
}

export interface MaintenanceSchedule {
  id: string
  asset_id: string
  frequency_days: number
  next_due_date?: string | null
  last_completed_at?: string | null
  webhook_endpoint?: string | null
  enabled: boolean
  created_at?: string
  updated_at?: string
}

export interface WorkOrder {
  id: string
  asset_id?: string | null
  schedule_id?: string | null
  title: string
  description?: string | null
  status: string
  priority: string
  assigned_vendor_id?: string | null
  assigned_profile_id?: string | null
  due_date?: string | null
  completed_at?: string | null
  completion_notes?: string | null
  attachments?: any
  created_at?: string
  updated_at?: string
}

export interface MaintenanceVendor {
  id: string
  business_name: string
  status?: string | null
}

export interface MaintenanceEventHook {
  id: string
  asset_id?: string | null
  event_type: string
  target_url: string
  secret?: string | null
  is_active: boolean
  created_at?: string
}
