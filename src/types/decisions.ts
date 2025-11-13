/**
 * TypeScript types for Decision Logging feature
 * Feature 3: Golden Thread Decision Logging & Inquiry Pack
 */

import type { Database } from './supabase'

// Check if tables exist in Database type
type Tables = Database['public']['Tables']
type HasDecisionsTable = 'decisions' extends keyof Tables ? true : false
type HasEvidenceTable = 'decision_evidence' extends keyof Tables ? true : false
type HasAnnotationsTable = 'decision_annotations' extends keyof Tables ? true : false

// Safely access table types with fallbacks
type DecisionsTable = HasDecisionsTable extends true ? Tables['decisions'] : never
type EvidenceTable = HasEvidenceTable extends true ? Tables['decision_evidence'] : never
type AnnotationsTable = HasAnnotationsTable extends true ? Tables['decision_annotations'] : never

// Fallback types if tables don't exist in generated types yet
export type Decision = DecisionsTable extends never ? {
  id: string
  company_id: string
  event_id: string
  trigger_issue: string
  options_considered: any
  information_available: any
  decision_taken: string
  rationale: string
  decision_owner_id?: string | null
  decision_owner_callsign?: string | null
  role_level: string
  location?: string | null
  timestamp: string
  is_locked: boolean
  locked_at?: string | null
  locked_by?: string | null
  follow_up_review_time?: string | null
  created_at: string
  updated_at: string
} : DecisionsTable['Row']

export type DecisionInsert = DecisionsTable extends never ? Partial<Decision> : DecisionsTable['Insert']
export type DecisionUpdate = DecisionsTable extends never ? Partial<Decision> : DecisionsTable['Update']

export type DecisionEvidence = EvidenceTable extends never ? {
  id: string
  decision_id: string
  evidence_type: string
  title: string
  description?: string | null
  file_url?: string | null
  external_reference?: string | null
  captured_at?: string | null
  created_at: string
} : EvidenceTable['Row']

export type DecisionEvidenceInsert = EvidenceTable extends never ? Partial<DecisionEvidence> : EvidenceTable['Insert']
export type DecisionEvidenceUpdate = EvidenceTable extends never ? Partial<DecisionEvidence> : EvidenceTable['Update']

export type DecisionAnnotation = AnnotationsTable extends never ? {
  id: string
  decision_id: string
  annotation_text: string
  annotation_type: string
  created_by?: string | null
  created_at: string
} : AnnotationsTable['Row']

export type DecisionAnnotationInsert = AnnotationsTable extends never ? Partial<DecisionAnnotation> : AnnotationsTable['Insert']

// Extended types with relationships
export interface DecisionWithRelations extends Decision {
  evidence?: DecisionEvidence[]
  annotations?: DecisionAnnotation[]
  linked_incidents?: any[] // Incident type from incident_logs
  linked_staff_assignments?: any[] // StaffAssignment type
}

// Option structure for options_considered JSONB field
export interface DecisionOption {
  option: string
  pros: string[]
  cons: string[]
}

// Information available structure
export interface DecisionInformation {
  density?: number
  weather?: string
  comms_status?: string
  police_advice?: string
  crowd_behavior?: string
  staff_availability?: string
  [key: string]: any
}

// API request/response types
export interface DecisionCreateInput {
  event_id: string
  trigger_issue: string
  options_considered: DecisionOption[]
  information_available: DecisionInformation
  decision_taken: string
  rationale: string
  decision_owner_id?: string
  decision_owner_callsign?: string
  role_level: 'bronze' | 'silver' | 'gold' | 'platinum' | 'other'
  location?: string
  follow_up_review_time?: string
  linked_incident_ids?: number[]
  linked_staff_assignment_ids?: string[]
}

export interface DecisionUpdateInput {
  trigger_issue?: string
  options_considered?: DecisionOption[]
  information_available?: DecisionInformation
  decision_taken?: string
  rationale?: string
  decision_owner_id?: string
  decision_owner_callsign?: string
  role_level?: 'bronze' | 'silver' | 'gold' | 'platinum' | 'other'
  location?: string
  follow_up_review_time?: string
  linked_incident_ids?: number[]
  linked_staff_assignment_ids?: string[]
}

export interface DecisionListQuery {
  event_id?: string
  locked_only?: boolean
  role_level?: string
  from?: string
  to?: string
  page?: number
  limit?: number
}

export interface DecisionListResponse {
  success: boolean
  decisions: Decision[]
  total: number
  page: number
  limit: number
}

export interface DecisionResponse {
  success: boolean
  decision: DecisionWithRelations
}

export interface DecisionCreateResponse {
  success: boolean
  decision: Decision
}

export interface DecisionLockResponse {
  success: boolean
  decision: Decision
  message: string
}

export interface EvidenceUploadInput {
  evidence_type: 'screenshot' | 'cctv_still' | 'radio_transcript' | 'email' | 'message' | 'document' | 'audio_recording' | 'video' | 'other'
  title: string
  description?: string
  external_reference?: string
  captured_at?: string
}

export interface EvidenceUploadResponse {
  success: boolean
  evidence: DecisionEvidence
}

export interface AnnotationCreateInput {
  annotation_text: string
  annotation_type?: 'note' | 'clarification' | 'correction' | 'follow_up' | 'inquiry_response'
}

export interface AnnotationCreateResponse {
  success: boolean
  annotation: DecisionAnnotation
}

export interface InquiryPackOptions {
  format: 'pdf' | 'json' | 'html'
  include_evidence?: boolean
  include_annotations?: boolean
  event_id?: string
}

// Role level type
export type RoleLevel = 'bronze' | 'silver' | 'gold' | 'platinum' | 'other'

// Evidence type
export type EvidenceType = 
  | 'screenshot' 
  | 'cctv_still' 
  | 'radio_transcript' 
  | 'email' 
  | 'message' 
  | 'document' 
  | 'audio_recording' 
  | 'video' 
  | 'other'

// Annotation type
export type AnnotationType = 
  | 'note' 
  | 'clarification' 
  | 'correction' 
  | 'follow_up' 
  | 'inquiry_response'

