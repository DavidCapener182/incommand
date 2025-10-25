/**
 * Type definitions for Auditable Event Logging System
 * Based on emergency services best practices (JESIP, JDM)
 */

// Entry type classification
export type EntryType = 'contemporaneous' | 'retrospective'

// Change/revision type classification
export type ChangeType = 
  | 'amendment'        // General amendment to log content
  | 'status_change'    // Incident status changed
  | 'escalation'       // Escalation level changed
  | 'correction'       // Factual error corrected
  | 'clarification'    // Additional context added

/**
 * Extended incident log interface with audit trail fields
 */
export interface AuditableIncidentLog {
  // Existing fields
  id: number
  log_number: string
  timestamp: string                    // Legacy field, kept for compatibility
  callsign_from: string
  callsign_to: string
  occurrence: string
  incident_type: string
  action_taken: string
  is_closed: boolean
  event_id: string
  status: string
  priority?: string
  created_at: string
  updated_at: string
  photo_url?: string
  escalation_level?: number
  escalate_at?: string
  escalated?: boolean
  assigned_staff_ids?: string[]
  auto_assigned?: boolean
  dependencies?: string[]
  location?: string
  
  // New auditable logging fields
  time_of_occurrence: string           // When the incident actually happened
  time_logged: string                  // When it was entered into the system
  entry_type: EntryType                // Contemporaneous or retrospective
  retrospective_justification?: string // Required if retrospective
  logged_by_user_id?: string          // User who created the log
  logged_by_callsign?: string         // Their callsign at time of logging
  is_amended: boolean | null           // Has this log been amended?
  original_entry_id?: string          // Reference to original if this is revision
}

/**
 * Log revision/amendment record
 */
export interface LogRevision {
  id: string
  incident_log_id: string
  revision_number: number              // Sequential revision number
  field_changed: string                // Name of field that was amended
  old_value: any                       // Previous value (JSONB)
  new_value: any                       // New value (JSONB)
  changed_by_user_id?: string         // User who made the amendment
  changed_by_callsign?: string        // Their callsign at time of change
  change_reason: string                // Required justification
  changed_at: string                   // Timestamp of amendment
  change_type: ChangeType              // Type of change
}

/**
 * Enriched revision with user details (from view/join)
 */
export interface LogRevisionWithDetails extends LogRevision {
  changed_by_name?: string            // User's full name
  changed_by_email?: string           // User's email
  log_number?: string                 // Associated log number
  incident_type?: string              // Associated incident type
  entry_type?: EntryType              // Original entry type
  time_of_occurrence?: string         // Original occurrence time
  time_logged?: string                // Original logged time
}

/**
 * Request payload for creating a new auditable log
 */
export interface CreateAuditableLogRequest {
  occurrence: string
  action_taken: string
  incident_type: string
  callsign_from: string
  callsign_to: string
  time_of_occurrence: string          // ISO 8601 timestamp
  time_logged?: string                // Defaults to NOW() if not provided
  entry_type: EntryType
  retrospective_justification?: string // Required if retrospective
  priority?: string
  location_name?: string              // Location name (replaces what3words)
  photo_url?: string
  event_id: string
  status?: string
}

/**
 * Request payload for amending an existing log
 */
export interface AmendLogRequest {
  field_changed: string
  new_value: any
  change_reason: string               // Required justification
  change_type: ChangeType
}

/**
 * Response from create log API
 */
export interface CreateLogResponse {
  success: boolean
  log?: AuditableIncidentLog
  warnings?: string[]                 // e.g., time delta warnings
  error?: string
}

/**
 * Response from amend log API
 */
export interface AmendLogResponse {
  success: boolean
  revision?: LogRevision
  incident?: AuditableIncidentLog | undefined    // Updated to show is_amended=true
  error?: string
}

/**
 * Response from get revisions API
 */
export interface GetRevisionsResponse {
  success: boolean
  revisions?: LogRevisionWithDetails[]
  incident?: AuditableIncidentLog
  error?: string
}

/**
 * Validation result for entry type
 */
export interface EntryTypeValidation {
  isValid: boolean
  warnings: string[]
  suggestedEntryType?: EntryType
  timeDeltaMinutes: number
}

/**
 * Dual timestamp display format
 */
export interface DualTimestamp {
  occurred: string                    // Formatted occurrence time
  logged: string                      // Formatted logged time
  deltaMinutes: number                // Time delta in minutes
  isRetrospective: boolean
  entryType: EntryType
}

/**
 * Amendment diff for display
 */
export interface AmendmentDiff {
  field: string
  oldValue: string                    // Formatted for display
  newValue: string                    // Formatted for display
  changedBy: string
  changedAt: string
  reason: string
  changeType: ChangeType
}

/**
 * Revision history summary
 */
export interface RevisionHistorySummary {
  totalRevisions: number
  lastAmendedAt?: string
  lastAmendedBy?: string
  changeTypes: ChangeType[]
  hasCorrections: boolean
  hasClarifications: boolean
}

/**
 * PDF export metadata
 */
export interface LogExportMetadata {
  exportedAt: string
  exportedBy: string
  includedRevisions: boolean
  revisionCount: number
  documentType: 'official' | 'draft'
  watermark?: string
}

/**
 * Helper type for amendment form state
 */
export interface AmendmentFormState {
  fieldToAmend: string
  currentValue: any
  newValue: string
  changeType: ChangeType
  changeReason: string
  isValid: boolean
  validationErrors: Record<string, string>
}

/**
 * Constants for entry type validation
 */
export const ENTRY_TYPE_THRESHOLDS = {
  WARNING_MINUTES: 15,               // Warn if >15 min without retrospective
  CRITICAL_MINUTES: 60,              // Flag if >60 min
  MAX_RETROSPECTIVE_HOURS: 24        // Max time for retrospective entry
} as const

/**
 * Field names that can be amended
 */
export const AMENDABLE_FIELDS = [
  'occurrence',
  'action_taken',
  'callsign_from',
  'callsign_to',
  'incident_type',
  'priority',
  'location',
  'time_of_occurrence',
  'status'
] as const

export type AmendableField = typeof AMENDABLE_FIELDS[number]

/**
 * Field labels for display
 */
export const FIELD_LABELS: Record<AmendableField, string> = {
  occurrence: 'Occurrence Description',
  action_taken: 'Action Taken',
  callsign_from: 'Callsign From',
  callsign_to: 'Callsign To',
  incident_type: 'Incident Type',
  priority: 'Priority',
  location: 'Location',
  time_of_occurrence: 'Time of Occurrence',
  status: 'Status'
} as const

/**
 * Change type labels and descriptions
 */
export const CHANGE_TYPE_CONFIG: Record<ChangeType, { label: string; description: string; color: string }> = {
  amendment: {
    label: 'Amendment',
    description: 'General change to log content',
    color: 'amber'
  },
  correction: {
    label: 'Correction',
    description: 'Factual error corrected',
    color: 'red'
  },
  clarification: {
    label: 'Clarification',
    description: 'Additional context added',
    color: 'blue'
  },
  status_change: {
    label: 'Status Change',
    description: 'Incident status updated',
    color: 'green'
  },
  escalation: {
    label: 'Escalation',
    description: 'Escalation level changed',
    color: 'orange'
  }
} as const

