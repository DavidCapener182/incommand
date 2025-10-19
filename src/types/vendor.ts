export interface VendorProfile {
  id: string
  business_name: string
  service_type?: string | null
  contact_name?: string | null
  contact_email?: string | null
  contact_phone?: string | null
  insurance_document_url?: string | null
  insurance_expires_on?: string | null
  contract_expires_on?: string | null
  status: string
  notes?: string | null
  created_at?: string
  updated_at?: string
}

export interface VendorAccessLevel {
  id: string
  name: string
  description?: string | null
  is_temporary: boolean
  created_at?: string
}

export interface VendorAccreditation {
  id: string
  vendor_id: string
  status: string
  submitted_at?: string
  reviewed_at?: string | null
  reviewed_by?: string | null
  feedback?: string | null
  digital_pass_url?: string | null
  qr_code_token?: string | null
  expires_at?: string | null
  induction_completed: boolean
  induction_completed_at?: string | null
  induction_completed_by?: string | null
  created_at?: string
  updated_at?: string
  access_levels?: VendorAccessLevel[]
}

export interface VendorInduction {
  id: string
  vendor_id: string
  title: string
  resource_url?: string | null
  is_required: boolean
  completed_at?: string | null
  completed_by?: string | null
  created_at?: string
  updated_at?: string
}

export interface VendorAccreditationAuditLog {
  id: string
  accreditation_id: string
  action: string
  notes?: string | null
  actor_profile_id?: string | null
  created_at: string
}

export interface VendorApplicationPayload {
  business_name: string
  service_type?: string
  contact_name?: string
  contact_email?: string
  contact_phone?: string
  access_level_ids: string[]
  notes?: string
}
