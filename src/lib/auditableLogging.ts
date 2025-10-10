/**
 * Utility functions for Auditable Event Logging
 * Provides helpers for immutable log creation, amendments, and validation
 */

import { supabase } from './supabase'
import {
  AuditableIncidentLog,
  LogRevision,
  LogRevisionWithDetails,
  EntryType,
  ChangeType,
  EntryTypeValidation,
  DualTimestamp,
  AmendmentDiff,
  RevisionHistorySummary,
  ENTRY_TYPE_THRESHOLDS,
  FIELD_LABELS,
  CHANGE_TYPE_CONFIG,
  AmendableField
} from '../types/auditableLog'

/**
 * Validate entry type based on time delta between occurrence and logging
 */
export function validateEntryType(
  timeOfOccurrence: Date,
  timeLogged: Date,
  declaredEntryType: EntryType
): EntryTypeValidation {
  const deltaMs = timeLogged.getTime() - timeOfOccurrence.getTime()
  const deltaMinutes = Math.floor(deltaMs / (1000 * 60))

  const warnings: string[] = []
  let suggestedEntryType: EntryType | undefined

  // Check if time delta suggests retrospective entry
  if (deltaMinutes > ENTRY_TYPE_THRESHOLDS.WARNING_MINUTES) {
    if (declaredEntryType === 'contemporaneous') {
      warnings.push(
        `Entry logged ${deltaMinutes} minutes after occurrence. Consider marking as 'retrospective' with justification.`
      )
      suggestedEntryType = 'retrospective'
    }
  }

  // Check if time delta is critical (>60 min)
  if (deltaMinutes > ENTRY_TYPE_THRESHOLDS.CRITICAL_MINUTES) {
    warnings.push(
      `Critical time delta: ${deltaMinutes} minutes. Retrospective justification is required.`
    )
  }

  // Check if retrospective is within acceptable window
  const maxRetrospectiveMs = ENTRY_TYPE_THRESHOLDS.MAX_RETROSPECTIVE_HOURS * 60 * 60 * 1000
  if (deltaMinutes * 60 * 1000 > maxRetrospectiveMs && declaredEntryType === 'retrospective') {
    warnings.push(
      `Entry is more than ${ENTRY_TYPE_THRESHOLDS.MAX_RETROSPECTIVE_HOURS} hours old. Please justify the significant delay.`
    )
  }

  // Warn if future occurrence time
  if (deltaMs < 0) {
    warnings.push('Warning: Occurrence time is in the future. Please verify the timestamp.')
  }

  return {
    isValid: true, // Always valid, but may have warnings
    warnings,
    suggestedEntryType,
    timeDeltaMinutes: deltaMinutes
  }
}

/**
 * Create an immutable incident log entry
 */
export async function createImmutableLog(
  logData: Omit<AuditableIncidentLog, 'id' | 'created_at' | 'updated_at' | 'is_amended'>,
  userId: string
): Promise<{ success: boolean; log?: AuditableIncidentLog; error?: string; warnings?: string[] }> {
  try {
    // Validate entry type
    const timeOccurred = new Date(logData.time_of_occurrence)
    const timeLogged = new Date(logData.time_logged)
    const validation = validateEntryType(timeOccurred, timeLogged, logData.entry_type)

    // Check retrospective justification
    if (
      logData.entry_type === 'retrospective' &&
      (!logData.retrospective_justification || logData.retrospective_justification.trim().length === 0)
    ) {
      return {
        success: false,
        error: 'Retrospective entries require a justification explaining the delay in logging.'
      }
    }

    // Insert immutable log record
    const { data, error } = await supabase
      .from('incident_logs')
      .insert({
        ...logData,
        logged_by_user_id: userId,
        is_amended: false,
        timestamp: logData.time_of_occurrence // Keep for backward compatibility
      })
      .select()
      .single()

    if (error) throw error

    return {
      success: true,
      log: data as AuditableIncidentLog,
      warnings: validation.warnings
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to create log entry'
    }
  }
}

/**
 * Create a revision/amendment for an existing log
 */
export async function createRevision(
  incidentLogId: string,
  fieldChanged: AmendableField,
  oldValue: any,
  newValue: any,
  changeReason: string,
  changeType: ChangeType,
  userId: string,
  userCallsign?: string,
  supabaseClient?: any
): Promise<{ success: boolean; revision?: LogRevision; error?: string }> {
  try {
    const client = supabaseClient || supabase

    // Get next revision number
    const { data: revisionData } = await client.rpc('get_next_revision_number', {
      incident_id: parseInt(incidentLogId)
    })

    const revisionNumber = revisionData || 1

    // Create revision record
    const { data, error } = await client
      .from('incident_log_revisions')
      .insert({
        incident_log_id: parseInt(incidentLogId),
        revision_number: revisionNumber,
        field_changed: fieldChanged,
        old_value: oldValue,
        new_value: newValue,
        change_reason: changeReason,
        change_type: changeType,
        changed_by_user_id: userId,
        changed_by_callsign: userCallsign
      })
      .select()
      .single()

    if (error) throw error

    // The trigger will automatically set is_amended=true on the incident log

    return {
      success: true,
      revision: data as LogRevision
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to create revision'
    }
  }
}

/**
 * Get complete revision history for a log
 */
export async function getRevisionHistory(
  incidentLogId: string
): Promise<{ success: boolean; revisions?: LogRevisionWithDetails[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('incident_log_revision_history')
      .select('*')
      .eq('incident_log_id', incidentLogId)
      .order('revision_number', { ascending: true })

    if (error) throw error

    return {
      success: true,
      revisions: data as LogRevisionWithDetails[]
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to fetch revision history'
    }
  }
}

/**
 * Format dual timestamps for display
 */
export function formatDualTimestamp(
  timeOfOccurrence: string,
  timeLogged: string,
  entryType: EntryType
): DualTimestamp {
  const occurred = new Date(timeOfOccurrence)
  const logged = new Date(timeLogged)

  const deltaMs = logged.getTime() - occurred.getTime()
  const deltaMinutes = Math.floor(deltaMs / (1000 * 60))

  const formatOptions: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }

  return {
    occurred: occurred.toLocaleString('en-GB', formatOptions),
    logged: logged.toLocaleString('en-GB', formatOptions),
    deltaMinutes,
    isRetrospective: entryType === 'retrospective',
    entryType
  }
}

/**
 * Format amendment diff for display
 */
export function formatAmendmentDiff(revision: LogRevisionWithDetails): AmendmentDiff {
  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return '(empty)'
    if (typeof value === 'object') return JSON.stringify(value, null, 2)
    return String(value)
  }

  return {
    field: FIELD_LABELS[revision.field_changed as AmendableField] || revision.field_changed,
    oldValue: formatValue(revision.old_value),
    newValue: formatValue(revision.new_value),
    changedBy: revision.changed_by_name || revision.changed_by_email || 'Unknown',
    changedAt: new Date(revision.changed_at).toLocaleString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }),
    reason: revision.change_reason,
    changeType: revision.change_type
  }
}

/**
 * Get revision history summary
 */
export function getRevisionSummary(revisions: LogRevisionWithDetails[]): RevisionHistorySummary {
  if (revisions.length === 0) {
    return {
      totalRevisions: 0,
      changeTypes: [],
      hasCorrections: false,
      hasClarifications: false
    }
  }

  const lastRevision = revisions[revisions.length - 1]
  const changeTypes = Array.from(new Set(revisions.map((r) => r.change_type)))

  return {
    totalRevisions: revisions.length,
    lastAmendedAt: lastRevision.changed_at,
    lastAmendedBy: lastRevision.changed_by_name || lastRevision.changed_by_email,
    changeTypes,
    hasCorrections: changeTypes.includes('correction'),
    hasClarifications: changeTypes.includes('clarification')
  }
}

/**
 * Check if user can amend a log
 */
export async function canUserAmendLog(
  incidentLogId: string,
  userId: string,
  supabaseClient?: any
): Promise<{ canAmend: boolean; reason?: string }> {
  try {
    const client = supabaseClient || supabase

    console.log('canUserAmendLog: Checking incident:', incidentLogId, 'for user:', userId)

    // Get the incident log
    const { data: log, error } = await client
      .from('incident_logs')
      .select('logged_by_user_id, created_at')
      .eq('id', incidentLogId)
      .single()

    if (error) {
      console.error('Error fetching incident log:', error)
      throw error
    }

    console.log('Found incident log:', log)

    // Get user profile
    const { data: profile } = await client
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single()

    console.log('Found user profile:', profile)

    // Admin can always amend
    if (profile?.role === 'admin') {
      console.log('User is admin, allowing amendment')
      return { canAmend: true }
    }

    // Original creator can amend within 24 hours
    if (log.logged_by_user_id === userId) {
      console.log('User created this log, checking time limit')
      const createdAt = new Date(log.created_at)
      const now = new Date()
      const hoursSinceCreation = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60)

      console.log('Hours since creation:', hoursSinceCreation)

      if (hoursSinceCreation <= 24) {
        console.log('Within 24 hours, allowing amendment')
        return { canAmend: true }
      } else {
        console.log('Beyond 24 hours, denying amendment')
        return {
          canAmend: false,
          reason: 'You can only amend logs you created within 24 hours. Please contact an admin for amendments.'
        }
      }
    }

    console.log('User did not create this log, denying amendment')
    return {
      canAmend: false,
      reason: 'You can only amend logs you created. Please contact an admin for amendments.'
    }
  } catch (error: any) {
    console.error('Error in canUserAmendLog:', error)
    return {
      canAmend: false,
      reason: error.message || 'Unable to verify amendment permissions'
    }
  }
}

/**
 * Export revision history as formatted text for PDF
 */
export function exportRevisionHistoryAsText(
  incident: AuditableIncidentLog,
  revisions: LogRevisionWithDetails[]
): string {
  const lines: string[] = []

  // Header
  lines.push('='.repeat(80))
  lines.push('INCIDENT LOG REVISION HISTORY')
  lines.push('='.repeat(80))
  lines.push('')

  // Incident details
  lines.push(`Log Number: ${incident.log_number}`)
  lines.push(`Incident Type: ${incident.incident_type}`)
  lines.push(`Entry Type: ${incident.entry_type.toUpperCase()}`)

  const timestamps = formatDualTimestamp(
    incident.time_of_occurrence,
    incident.time_logged,
    incident.entry_type
  )
  lines.push(`Time of Occurrence: ${timestamps.occurred}`)
  lines.push(`Time Logged: ${timestamps.logged}`)

  if (incident.entry_type === 'retrospective' && incident.retrospective_justification) {
    lines.push(`Retrospective Justification: ${incident.retrospective_justification}`)
  }

  lines.push('')
  lines.push('-'.repeat(80))
  lines.push('')

  // Revisions
  if (revisions.length === 0) {
    lines.push('No amendments have been made to this log.')
  } else {
    lines.push(`Total Revisions: ${revisions.length}`)
    lines.push('')

    revisions.forEach((revision, index) => {
      const diff = formatAmendmentDiff(revision)
      const config = CHANGE_TYPE_CONFIG[revision.change_type]

      lines.push(`Revision #${revision.revision_number} - ${config.label}`)
      lines.push(`Changed At: ${diff.changedAt}`)
      lines.push(`Changed By: ${diff.changedBy}`)
      lines.push(`Field: ${diff.field}`)
      lines.push(`Old Value: ${diff.oldValue}`)
      lines.push(`New Value: ${diff.newValue}`)
      lines.push(`Reason: ${diff.reason}`)

      if (index < revisions.length - 1) {
        lines.push('')
        lines.push('-'.repeat(80))
        lines.push('')
      }
    })
  }

  lines.push('')
  lines.push('='.repeat(80))
  lines.push(`Generated from inCommand - ${new Date().toISOString()}`)
  lines.push('Log entries are immutable and auditable')
  lines.push('='.repeat(80))

  return lines.join('\n')
}

/**
 * Validate amendment request
 */
export function validateAmendmentRequest(
  fieldChanged: string,
  newValue: any,
  changeReason: string
): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  // Check field is amendable
  if (!FIELD_LABELS[fieldChanged as AmendableField]) {
    errors.push(`Field "${fieldChanged}" cannot be amended.`)
  }

  // Check new value is provided
  if (newValue === null || newValue === undefined || (typeof newValue === 'string' && newValue.trim() === '')) {
    errors.push('New value cannot be empty.')
  }

  // Check change reason is provided
  if (!changeReason || changeReason.trim().length === 0) {
    errors.push('Change reason is required for all amendments.')
  }

  // Check change reason has substance (at least 10 characters)
  if (changeReason && changeReason.trim().length < 10) {
    errors.push('Change reason must be substantive (at least 10 characters).')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Format time delta for human-readable display
 */
export function formatTimeDelta(minutes: number): string {
  if (minutes < 1) return 'less than 1 minute'
  if (minutes === 1) return '1 minute'
  if (minutes < 60) return `${minutes} minutes`

  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60

  if (hours === 1 && remainingMinutes === 0) return '1 hour'
  if (hours === 1) return `1 hour ${remainingMinutes} minutes`
  if (remainingMinutes === 0) return `${hours} hours`

  return `${hours} hours ${remainingMinutes} minutes`
}

/**
 * Get entry type badge configuration
 */
export function getEntryTypeBadgeConfig(entryType: EntryType): {
  label: string
  icon: string
  className: string
  tooltip: string
} {
  if (entryType === 'retrospective') {
    return {
      label: 'Retrospective',
      icon: '🕓',
      className: 'bg-amber-100 text-amber-800 border-amber-300',
      tooltip: 'This entry was logged after the incident occurred'
    }
  }

  return {
    label: 'Contemporaneous',
    icon: '⏱️',
    className: 'bg-blue-100 text-blue-800 border-blue-300',
    tooltip: 'This entry was logged in real-time'
  }
}

/**
 * Get amendment badge configuration
 */
export function getAmendmentBadgeConfig(
  isAmended: boolean,
  revisionCount: number
): {
  show: boolean
  label: string
  className: string
  tooltip: string
} {
  if (!isAmended || revisionCount === 0) {
    return {
      show: false,
      label: '',
      className: '',
      tooltip: ''
    }
  }

  return {
    show: true,
    label: 'AMENDED',
    className: 'bg-amber-500 text-white text-xs font-bold px-2 py-1 rounded',
    tooltip: `This log has been amended ${revisionCount} time${revisionCount === 1 ? '' : 's'}`
  }
}

