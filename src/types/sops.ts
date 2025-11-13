/**
 * SOP System TypeScript Types
 * Feature 2: Live Doctrine Assistant & Dynamic SOP Adjustment Engine
 */

import type { Database } from './supabase'

// Check if tables exist in Database type
type Tables = Database['public']['Tables']
type SopsTable = Tables extends { sops: infer T } ? T : never
type AdjustmentsTable = Tables extends { sop_adjustments: infer T } ? T : never

// Fallback types if tables don't exist in generated types yet
export type SOP = SopsTable extends never
  ? {
      id: string
      company_id: string
      event_id: string | null
      template_id: string | null
      sop_type: string
      title: string
      description: string | null
      conditions: Record<string, any>
      actions: any[]
      procedures: string | null
      status: 'draft' | 'active' | 'suspended' | 'archived'
      priority: 'low' | 'normal' | 'high' | 'critical'
      linked_knowledge_ids: string[]
      applicable_event_types: string[] | null
      created_by_user_id: string | null
      approved_by_user_id: string | null
      approved_at: string | null
      version: number
      notes: string | null
      created_at: string
      updated_at: string
    }
  : SopsTable['Row']

export type SOPInsert = SopsTable extends never ? Partial<SOP> : SopsTable['Insert']
export type SOPUpdate = SopsTable extends never ? Partial<SOP> : SopsTable['Update']

export type SOPAdjustment = AdjustmentsTable extends never
  ? {
      id: string
      sop_id: string
      adjustment_type: 'suggested' | 'manual' | 'auto' | 'revert'
      reason: string
      suggested_by: string | null
      changes: Record<string, any>
      original_state: Record<string, any> | null
      proposed_state: Record<string, any> | null
      status: 'pending' | 'accepted' | 'modified' | 'rejected' | 'applied'
      reviewed_by_user_id: string | null
      reviewed_at: string | null
      review_notes: string | null
      modifications: Record<string, any> | null
      created_by_user_id: string | null
      applied_at: string | null
      applied_by_user_id: string | null
      created_at: string
      updated_at: string
    }
  : AdjustmentsTable['Row']

export type SOPAdjustmentInsert = AdjustmentsTable extends never
  ? Partial<SOPAdjustment>
  : AdjustmentsTable['Insert']
export type SOPAdjustmentUpdate = AdjustmentsTable extends never
  ? Partial<SOPAdjustment>
  : AdjustmentsTable['Update']

// Extended types with relationships
export interface SOPWithAdjustments extends SOP {
  adjustments?: SOPAdjustment[]
  template?: SOP | null
}

// Condition structure for SOP triggers
export interface SOPCondition {
  type: 'weather' | 'incident' | 'crowd_density' | 'time' | 'staffing' | 'custom'
  operator: 'equals' | 'greater_than' | 'less_than' | 'contains' | 'matches'
  value: any
  field?: string
}

// Action structure for SOP steps
export interface SOPAction {
  step: number
  action: string
  description: string
  responsible_role?: string
  estimated_time?: number
  dependencies?: number[] // Step numbers this depends on
}

// API request/response types
export interface SOPCreateInput {
  event_id?: string | null
  template_id?: string | null
  sop_type: string
  title: string
  description?: string
  conditions: Record<string, any>
  actions: SOPAction[]
  procedures?: string
  status?: 'draft' | 'active' | 'suspended' | 'archived'
  priority?: 'low' | 'normal' | 'high' | 'critical'
  linked_knowledge_ids?: string[]
  applicable_event_types?: string[]
  notes?: string
}

export interface SOPUpdateInput {
  title?: string
  description?: string
  conditions?: Record<string, any>
  actions?: SOPAction[]
  procedures?: string
  status?: 'draft' | 'active' | 'suspended' | 'archived'
  priority?: 'low' | 'normal' | 'high' | 'critical'
  notes?: string
}

export interface SOPAdjustmentCreateInput {
  sop_id: string
  adjustment_type: 'suggested' | 'manual' | 'auto' | 'revert'
  reason: string
  suggested_by?: string
  changes: Record<string, any>
  original_state?: Record<string, any>
  proposed_state?: Record<string, any>
}

export interface SOPAdjustmentReviewInput {
  status: 'accepted' | 'modified' | 'rejected'
  review_notes?: string
  modifications?: Record<string, any>
}

export interface SOPListQuery {
  event_id?: string
  template_only?: boolean
  status?: string
  sop_type?: string
  page?: number
  limit?: number
}

export interface SOPListResponse {
  success: boolean
  sops: SOP[]
  total: number
  page: number
  limit: number
}

export interface SOPResponse {
  success: boolean
  sop: SOPWithAdjustments
}

export interface SOPAdjustmentResponse {
  success: boolean
  adjustment: SOPAdjustment
}

export interface SOPAdjustmentListResponse {
  success: boolean
  adjustments: SOPAdjustment[]
  total: number
}

// Doctrine Assistant types
export interface ConditionMonitor {
  type: string
  current_value: any
  threshold: any
  status: 'normal' | 'warning' | 'critical'
  last_checked: string
}

export interface SOPSuggestion {
  sop_id: string
  sop_title: string
  reason: string
  urgency: 'low' | 'medium' | 'high'
  triggered_conditions: string[]
  suggested_adjustment?: SOPAdjustmentCreateInput
}

export interface DoctrineAssistantState {
  active_sops: SOP[]
  pending_adjustments: SOPAdjustment[]
  suggestions: SOPSuggestion[]
  monitored_conditions: ConditionMonitor[]
  last_updated: string
}

