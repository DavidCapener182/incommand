export interface AccreditationAccessLevel {
  id: string
  event_id: string
  name: string
  description?: string | null
  created_at?: string
}

export interface WristbandType {
  id: string
  event_id: string
  wristband_name: string
  wristband_color: string
  available_quantity?: number | null
  notes?: string | null
  created_at?: string
  updated_at?: string
  access_levels?: AccreditationAccessLevel[]
}

export interface WristbandAccessLevel {
  id: string
  wristband_type_id: string
  access_level_id: string
}

