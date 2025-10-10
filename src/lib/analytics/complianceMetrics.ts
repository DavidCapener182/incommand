/**
 * Compliance Metrics Engine
 * JESIP/JDM compliance tracking and legal readiness scoring
 */

import { supabase } from '../supabase'

export interface ComplianceMetrics {
  overallCompliance: number // 0-100
  auditTrailCompleteness: number
  immutabilityScore: number
  timestampAccuracy: number
  amendmentJustificationRate: number
  legalReadinessScore: 'A' | 'B' | 'C' | 'D' | 'F'
  recommendations: string[]
  totalIncidents: number
  periodStart: string
  periodEnd: string
  details: {
    missingTimestamps: number
    unamendedDeletes: number
    unjustifiedRetrospectives: number
    missingAmendmentReasons: number
  }
}

export interface ComplianceTrend {
  date: string
  score: number
  grade: string
}

interface IncidentLog {
  id: string
  time_of_occurrence?: string
  time_logged?: string
  entry_type?: 'contemporaneous' | 'retrospective'
  retrospective_justification?: string
  is_amended?: boolean
  logged_by_user_id?: string
  logged_by_callsign?: string
  created_at: string
  updated_at?: string
}

interface LogRevision {
  id: string
  incident_log_id: string
  change_reason: string
  changed_by_user_id: string
  created_at: string
}

/**
 * Check audit trail completeness
 * All incidents should have complete metadata
 */
async function checkAuditTrailCompleteness(
  logs: IncidentLog[]
): Promise<{ score: number; issues: number }> {
  let completeCount = 0
  let issueCount = 0

  logs.forEach(log => {
    const hasAllFields = 
      log.time_of_occurrence &&
      log.time_logged &&
      log.entry_type &&
      log.logged_by_user_id &&
      (log.entry_type !== 'retrospective' || log.retrospective_justification)

    if (hasAllFields) {
      completeCount++
    } else {
      issueCount++
    }
  })

  const score = logs.length > 0 ? (completeCount / logs.length) * 100 : 100
  return { score, issues: issueCount }
}

/**
 * Check immutability compliance
 * Original entries should never be deleted, only amended
 */
async function checkImmutability(
  logs: IncidentLog[]
): Promise<{ score: number; violations: number }> {
  // In a proper implementation, we would check for deleted records
  // For now, we assume all present logs are not deleted
  // and check if amendments are properly recorded

  let violations = 0

  logs.forEach(log => {
    // If marked as amended, there should be revisions
    if (log.is_amended) {
      // This would require checking the revisions table
      // For now, we assume it's compliant if the flag is set
    }
  })

  // Check for suspicious patterns (e.g., very short time between created and updated with no amendment flag)
  logs.forEach(log => {
    if (log.updated_at && !log.is_amended) {
      const created = new Date(log.created_at)
      const updated = new Date(log.updated_at)
      const diff = updated.getTime() - created.getTime()
      
      // If updated more than 5 minutes after creation without amendment flag, suspicious
      if (diff > 5 * 60 * 1000) {
        violations++
      }
    }
  })

  const score = logs.length > 0 ? ((logs.length - violations) / logs.length) * 100 : 100
  return { score, violations }
}

/**
 * Check timestamp accuracy
 * Both occurrence and logged times should be present and reasonable
 */
function checkTimestampAccuracy(
  logs: IncidentLog[]
): { score: number; issues: number } {
  let accurateCount = 0
  let issueCount = 0

  logs.forEach(log => {
    let hasIssues = false

    // Missing timestamps
    if (!log.time_of_occurrence || !log.time_logged) {
      hasIssues = true
      issueCount++
    }

    // Timestamp logic errors (logged before occurred)
    if (log.time_of_occurrence && log.time_logged) {
      const occurred = new Date(log.time_of_occurrence)
      const logged = new Date(log.time_logged)
      
      if (logged < occurred) {
        hasIssues = true
        issueCount++
      }
    }

    // Future timestamps
    if (log.time_of_occurrence) {
      const occurred = new Date(log.time_of_occurrence)
      const now = new Date()
      
      if (occurred > now) {
        hasIssues = true
        issueCount++
      }
    }

    if (!hasIssues) {
      accurateCount++
    }
  })

  const score = logs.length > 0 ? (accurateCount / logs.length) * 100 : 100
  return { score, issues: issueCount }
}

/**
 * Check amendment justification rate
 * All retrospective entries and amendments should have justifications
 */
async function checkAmendmentJustification(
  logs: IncidentLog[]
): Promise<{ rate: number; missing: number }> {
  let totalRequiringJustification = 0
  let totalWithJustification = 0
  let missing = 0

  logs.forEach(log => {
    // Retrospective entries need justification
    if (log.entry_type === 'retrospective') {
      totalRequiringJustification++
      if (log.retrospective_justification?.trim()) {
        totalWithJustification++
      } else {
        missing++
      }
    }
  })

  // Check amendments (would need to query revisions table)
  const amendedLogs = logs.filter(log => log.is_amended)
  
  try {
    if (amendedLogs.length > 0) {
      const { data: revisions, error } = await supabase
        .from('incident_log_revisions')
        .select('incident_log_id, change_reason')
        .in('incident_log_id', amendedLogs.map(l => l.id))

      if (!error && revisions) {
        amendedLogs.forEach(log => {
          totalRequiringJustification++
          const hasReason = revisions.some(
            r => r.incident_log_id === log.id && r.change_reason?.trim()
          )
          if (hasReason) {
            totalWithJustification++
          } else {
            missing++
          }
        })
      }
    }
  } catch (error) {
    console.error('Error checking revision justifications:', error)
  }

  const rate = totalRequiringJustification > 0 
    ? (totalWithJustification / totalRequiringJustification) * 100 
    : 100

  return { rate, missing }
}

/**
 * Calculate legal readiness grade
 */
function calculateLegalReadinessGrade(
  overallCompliance: number
): 'A' | 'B' | 'C' | 'D' | 'F' {
  if (overallCompliance >= 95) return 'A'
  if (overallCompliance >= 85) return 'B'
  if (overallCompliance >= 75) return 'C'
  if (overallCompliance >= 65) return 'D'
  return 'F'
}

/**
 * Generate compliance recommendations
 */
function generateRecommendations(
  metrics: Partial<ComplianceMetrics>,
  details: ComplianceMetrics['details']
): string[] {
  const recommendations: string[] = []

  if (metrics.auditTrailCompleteness && metrics.auditTrailCompleteness < 100) {
    recommendations.push(
      `${details.missingTimestamps} incidents have incomplete audit trails. Ensure all required fields are completed.`
    )
  }

  if (metrics.immutabilityScore && metrics.immutabilityScore < 100) {
    recommendations.push(
      `${details.unamendedDeletes} potential immutability violations detected. Use amendment system instead of direct edits.`
    )
  }

  if (metrics.timestampAccuracy && metrics.timestampAccuracy < 95) {
    recommendations.push(
      'Timestamp accuracy issues detected. Verify time_of_occurrence and time_logged are correct.'
    )
  }

  if (metrics.amendmentJustificationRate && metrics.amendmentJustificationRate < 100) {
    recommendations.push(
      `${details.unjustifiedRetrospectives + details.missingAmendmentReasons} entries lack proper justification. All retrospective entries and amendments must explain why.`
    )
  }

  if (metrics.overallCompliance && metrics.overallCompliance >= 95) {
    recommendations.push(
      'Excellent compliance! Maintain current logging standards.'
    )
  } else if (metrics.overallCompliance && metrics.overallCompliance >= 85) {
    recommendations.push(
      'Good compliance. Focus on minor improvements to reach full compliance.'
    )
  } else if (metrics.overallCompliance && metrics.overallCompliance < 75) {
    recommendations.push(
      'Compliance needs improvement. Review JESIP/JDM standards and provide additional training.'
    )
  }

  return recommendations
}

/**
 * Calculate comprehensive compliance metrics
 */
export async function calculateComplianceMetrics(
  startDate: Date,
  endDate: Date,
  eventId?: string
): Promise<ComplianceMetrics> {
  try {
    let query = supabase
      .from('incident_logs')
      .select('*')
      .gte('time_logged', startDate.toISOString())
      .lte('time_logged', endDate.toISOString())

    if (eventId) {
      query = query.eq('event_id', eventId)
    }

    const { data: logs, error } = await query

    if (error) throw error
    if (!logs || logs.length === 0) {
      return {
        overallCompliance: 100,
        auditTrailCompleteness: 100,
        immutabilityScore: 100,
        timestampAccuracy: 100,
        amendmentJustificationRate: 100,
        legalReadinessScore: 'A',
        recommendations: ['No incidents in this period'],
        totalIncidents: 0,
        periodStart: startDate.toISOString(),
        periodEnd: endDate.toISOString(),
        details: {
          missingTimestamps: 0,
          unamendedDeletes: 0,
          unjustifiedRetrospectives: 0,
          missingAmendmentReasons: 0
        }
      }
    }

    // Calculate individual metrics
    const auditTrail = await checkAuditTrailCompleteness(logs)
    const immutability = await checkImmutability(logs)
    const timestamps = checkTimestampAccuracy(logs)
    const justification = await checkAmendmentJustification(logs)

    // Calculate overall compliance (weighted average)
    const overallCompliance = (
      auditTrail.score * 0.30 +      // Audit trail is critical
      immutability.score * 0.25 +    // Immutability is essential
      timestamps.score * 0.25 +      // Timestamp accuracy is important
      justification.rate * 0.20      // Justifications are important
    )

    const legalReadinessScore = calculateLegalReadinessGrade(overallCompliance)

    const details = {
      missingTimestamps: auditTrail.issues,
      unamendedDeletes: immutability.violations,
      unjustifiedRetrospectives: justification.missing,
      missingAmendmentReasons: justification.missing
    }

    const recommendations = generateRecommendations(
      {
        overallCompliance,
        auditTrailCompleteness: auditTrail.score,
        immutabilityScore: immutability.score,
        timestampAccuracy: timestamps.score,
        amendmentJustificationRate: justification.rate
      },
      details
    )

    return {
      overallCompliance: Math.round(overallCompliance * 10) / 10,
      auditTrailCompleteness: Math.round(auditTrail.score * 10) / 10,
      immutabilityScore: Math.round(immutability.score * 10) / 10,
      timestampAccuracy: Math.round(timestamps.score * 10) / 10,
      amendmentJustificationRate: Math.round(justification.rate * 10) / 10,
      legalReadinessScore,
      recommendations,
      totalIncidents: logs.length,
      periodStart: startDate.toISOString(),
      periodEnd: endDate.toISOString(),
      details
    }
  } catch (error) {
    console.error('Error calculating compliance metrics:', error)
    throw error
  }
}

/**
 * Get compliance trend over time
 */
export async function getComplianceTrend(
  startDate: Date,
  endDate: Date,
  eventId?: string,
  granularity: 'day' | 'week' = 'day'
): Promise<ComplianceTrend[]> {
  try {
    const trends: ComplianceTrend[] = []
    const current = new Date(startDate)
    
    while (current <= endDate) {
      const periodEnd = new Date(current)
      
      if (granularity === 'day') {
        periodEnd.setDate(periodEnd.getDate() + 1)
      } else {
        periodEnd.setDate(periodEnd.getDate() + 7)
      }

      const metrics = await calculateComplianceMetrics(current, periodEnd, eventId)
      
      trends.push({
        date: current.toISOString(),
        score: metrics.overallCompliance,
        grade: metrics.legalReadinessScore
      })

      current.setTime(periodEnd.getTime())
    }

    return trends
  } catch (error) {
    console.error('Error getting compliance trend:', error)
    throw error
  }
}

/**
 * Get compliance summary for quick dashboard display
 */
export async function getComplianceSummary(
  eventId?: string
): Promise<{
  grade: string
  score: number
  status: 'excellent' | 'good' | 'fair' | 'poor'
  urgentIssues: number
}> {
  // Get last 24 hours compliance
  const endDate = new Date()
  const startDate = new Date(endDate.getTime() - 24 * 60 * 60 * 1000)

  const metrics = await calculateComplianceMetrics(startDate, endDate, eventId)

  let status: 'excellent' | 'good' | 'fair' | 'poor'
  if (metrics.overallCompliance >= 95) status = 'excellent'
  else if (metrics.overallCompliance >= 85) status = 'good'
  else if (metrics.overallCompliance >= 75) status = 'fair'
  else status = 'poor'

  const urgentIssues = 
    (metrics.details.missingTimestamps > 5 ? 1 : 0) +
    (metrics.details.unamendedDeletes > 0 ? 1 : 0) +
    (metrics.details.unjustifiedRetrospectives > 3 ? 1 : 0)

  return {
    grade: metrics.legalReadinessScore,
    score: metrics.overallCompliance,
    status,
    urgentIssues
  }
}

