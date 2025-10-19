export interface LostItem {
  id: string
  reported_by_profile_id?: string | null
  reporter_name?: string | null
  contact_email?: string | null
  contact_phone?: string | null
  description: string
  keywords?: string[] | null
  location?: string | null
  reported_at?: string
  photo_url?: string | null
  status: string
  retention_expires_at?: string | null
  deleted_at?: string | null
  created_at?: string
  updated_at?: string
}

export interface FoundItem {
  id: string
  logged_by_profile_id?: string | null
  description: string
  keywords?: string[] | null
  location?: string | null
  found_at?: string
  photo_url?: string | null
  storage_location?: string | null
  status: string
  retention_expires_at?: string | null
  deleted_at?: string | null
  created_at?: string
  updated_at?: string
}

export interface LostFoundMatch {
  id: string
  lost_item_id: string
  found_item_id: string
  match_score?: number | null
  photo_similarity_score?: number | null
  status: string
  matched_by_profile_id?: string | null
  notes?: string | null
  created_at?: string
  updated_at?: string
}
