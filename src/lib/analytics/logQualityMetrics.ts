/**
 * Log Quality Metrics System
 * Calculates comprehensive quality scores for incident logs
 */

import { supabase } from '../supabase'

export interface LogQualityMetrics {
  overallScore: number
  completeness: number
  timeliness: number
  factualLanguage: number
  amendmentRate: number
  retrospectiveRate: number
  breakdown: {
    field: string
    score: number
    issues: string[]
  }[]
  totalLogs: number
  periodStart: string
  periodEnd: string
}

export interface LogQualityTrend {
  date: string
  score: number
  logCount: number
}

import { IncidentLog } from '../../types/shared'

/**
 * Calculate completeness score for a log entry
 * Checks if all critical fields are filled
 */
function calculateCompletenessScore(log: IncidentLog): number {
  const requiredFields = [
    'occurrence',
    'action_taken',
    'incident_type',
    'time_of_occurrence',
    'time_logged',
    'entry_type'
  ]

  // If using structured template
  const structuredFields = [
    'headline',
    'source',
    'facts_observed',
    'action_taken'
  ]

  // Check if structured template is used
  const usesStructuredTemplate = log.headline || log.source || log.facts_observed

  if (usesStructuredTemplate) {
    let filledCount = 0
    const totalFields = structuredFields.length

    if (log.headline?.trim()) filledCount++
    if (log.source?.trim()) filledCount++
    if (log.facts_observed?.trim()) filledCount++
    if (log.action_taken?.trim()) filledCount++ // Use action_taken instead of actions_taken
    // Note: outcome field doesn't exist in database schema, removing from scoring

    return (filledCount / totalFields) * 100
  }

  // Legacy format
  let filledCount = 0
  const totalFields = requiredFields.length

  if (log.occurrence?.trim()) filledCount++
  if (log.action_taken?.trim()) filledCount++
  if (log.incident_type?.trim()) filledCount++
  if (log.time_of_occurrence) filledCount++
  if (log.time_logged) filledCount++
  if (log.entry_type) filledCount++

  return (filledCount / totalFields) * 100
}

/**
 * Calculate timeliness score
 * Measures time between occurrence and logging
 */
function calculateTimelinessScore(log: IncidentLog): number {
  if (!log.time_of_occurrence || !log.time_logged) {
    return 50 // Neutral score if timestamps missing
  }

  const occurred = new Date(log.time_of_occurrence)
  const logged = new Date(log.time_logged)
  const delayMinutes = (logged.getTime() - occurred.getTime()) / (1000 * 60)

  // Perfect score for immediate logging (< 5 minutes)
  if (delayMinutes <= 5) return 100

  // Degraded score based on delay
  if (delayMinutes <= 15) return 90
  if (delayMinutes <= 30) return 80
  if (delayMinutes <= 60) return 70
  if (delayMinutes <= 120) return 60
  if (delayMinutes <= 240) return 50

  // Retrospective entries get lower score
  if (log.entry_type === 'retrospective') {
    // If properly justified, give some credit
    if (log.retrospective_justification?.trim()) {
      return 40
    }
    return 30
  }

  return 20 // Very delayed entries
}

/**
 * Calculate factual language score
 * Basic pattern matching for emotional/opinion-based language
 */
function calculateFactualLanguageScore(log: IncidentLog): number {
  const textToAnalyze = [
    log.occurrence || '',
    log.action_taken || '',
    log.facts_observed || '',
    log.headline || ''
  ].join(' ').toLowerCase()

  if (!textToAnalyze.trim()) return 50 // Neutral if no text

  let score = 100
  const issues: string[] = []

  // Emotional language patterns
  const emotionalWords = [
    'terrible', 'awful', 'scary', 'chaotic', 'horrible', 'nightmare',
    'amazing', 'great', 'fantastic', 'disaster'
  ]
  emotionalWords.forEach(word => {
    if (textToAnalyze.includes(word)) {
      score -= 10
      issues.push(`Emotional language: "${word}"`)
    }
  })

  // Opinion indicators
  const opinionWords = [
    'i think', 'i believe', 'i feel', 'probably', 'maybe', 
    'seems', 'appears to be', 'looks like'
  ]
  opinionWords.forEach(phrase => {
    if (textToAnalyze.includes(phrase)) {
      score -= 8
      issues.push(`Opinion-based: "${phrase}"`)
    }
  })

  // Vague descriptors
  const vagueWords = ['very', 'huge', 'massive', 'tiny', 'lots']
  vagueWords.forEach(word => {
    if (textToAnalyze.includes(word)) {
      score -= 5
      issues.push(`Vague descriptor: "${word}"`)
    }
  })

  return Math.max(score, 0)
}

/**
 * Get detailed field breakdown for a set of logs
 */
function getFieldBreakdown(logs: IncidentLog[]): LogQualityMetrics['breakdown'] {
  const fields = [
    { name: 'Occurrence/Facts', key: ['occurrence', 'facts_observed'] },
    { name: 'Actions Taken', key: ['action_taken', 'actions_taken'] },
    { name: 'Headline', key: ['headline'] },
    { name: 'Source', key: ['source'] },
    { name: 'Outcome', key: ['outcome'] },
    { name: 'Timestamps', key: ['time_of_occurrence', 'time_logged'] }
  ]

  return fields.map(field => {
    let totalScore = 0
    const issues: string[] = []

    logs.forEach(log => {
      const hasValue = field.key.some(k => (log as any)[k]?.trim())
      if (hasValue) {
        totalScore += 100
      } else {
        issues.push(`Missing in log ${String(log.id).substring(0, 8)}`)
      }
    })

    const avgScore = logs.length > 0 ? totalScore / logs.length : 0

    return {
      field: field.name,
      score: Math.round(avgScore),
      issues: issues.slice(0, 5) // Top 5 issues
    }
  })
}

/**
 * Calculate overall log quality metrics for a time period
 */
export async function calculateLogQualityMetrics(
  startDate: Date,
  endDate: Date,
  eventId?: string
): Promise<LogQualityMetrics> {
  try {
    let query = supabase
      .from('incident_logs')
      .select('*')

    // If eventId is provided, get ALL logs for that event (ignore date range)
    // If no eventId, filter by date range
    if (eventId) {
      query = query.eq('event_id', eventId)
      // Don't apply date filters - we want all logs for the event
    } else {
      // Filter by date range when no eventId is provided
      query = query.gte('time_logged', startDate.toISOString())
        .lte('time_logged', endDate.toISOString())
    }

    const { data: logs, error } = await query

    if (error) throw error
    const logList = (logs ?? []) as IncidentLog[]

    if (logList.length === 0) {
      return {
        overallScore: 0,
        completeness: 0,
        timeliness: 0,
        factualLanguage: 0,
        amendmentRate: 0,
        retrospectiveRate: 0,
        breakdown: [],
        totalLogs: 0,
        periodStart: startDate.toISOString(),
        periodEnd: endDate.toISOString()
      }
    }

    // Convert logs to match IncidentLog interface
    const convertedLogs = logList.map(log => ({
      ...(log as Record<string, any>),
      id: (log as any).id?.toString?.() ?? '',
      entry_type: log.entry_type as 'contemporaneous' | 'retrospective' | undefined
    })) as IncidentLog[]

    // Calculate individual scores
    const completenessScores = convertedLogs.map(log => calculateCompletenessScore(log as any))
    const timelinessScores = convertedLogs.map(log => calculateTimelinessScore(log as any))
    const factualScores = convertedLogs.map(log => calculateFactualLanguageScore(log as any))

    const avgCompleteness = completenessScores.reduce((a, b) => a + b, 0) / convertedLogs.length
    const avgTimeliness = timelinessScores.reduce((a, b) => a + b, 0) / convertedLogs.length
    const avgFactual = factualScores.reduce((a, b) => a + b, 0) / convertedLogs.length

    // Calculate rates
    const amendmentRate = (convertedLogs.filter(log => log.is_amended).length / convertedLogs.length) * 100
    const retrospectiveRate = (convertedLogs.filter(log => log.entry_type === 'retrospective').length / convertedLogs.length) * 100

    // Overall score (weighted average)
    const overallScore = (
      avgCompleteness * 0.35 +  // Completeness is most important
      avgTimeliness * 0.30 +     // Timeliness is very important
      avgFactual * 0.25 +        // Factual language is important
      (100 - amendmentRate) * 0.05 +  // Fewer amendments is better
      (100 - retrospectiveRate) * 0.05 // Fewer retrospective is better
    )

    const breakdown = getFieldBreakdown(convertedLogs)

    return {
      overallScore: Math.round(overallScore),
      completeness: Math.round(avgCompleteness),
      timeliness: Math.round(avgTimeliness),
      factualLanguage: Math.round(avgFactual),
      amendmentRate: Math.round(amendmentRate * 10) / 10,
      retrospectiveRate: Math.round(retrospectiveRate * 10) / 10,
      breakdown,
      totalLogs: convertedLogs.length,
      periodStart: startDate.toISOString(),
      periodEnd: endDate.toISOString()
    }
  } catch (error) {
    console.error('Error calculating log quality metrics:', error)
    throw error
  }
}

/**
 * Get log quality trend over time
 */
export async function getLogQualityTrend(
  startDate: Date,
  endDate: Date,
  eventId?: string,
  granularity: 'hour' | 'day' | 'week' = 'day'
): Promise<LogQualityTrend[]> {
  try {
    const trends: LogQualityTrend[] = []
    const current = new Date(startDate)
    
    while (current <= endDate) {
      const periodEnd = new Date(current)
      
      // Adjust period based on granularity
      if (granularity === 'hour') {
        periodEnd.setHours(periodEnd.getHours() + 1)
      } else if (granularity === 'day') {
        periodEnd.setDate(periodEnd.getDate() + 1)
      } else {
        periodEnd.setDate(periodEnd.getDate() + 7)
      }

      const metrics = await calculateLogQualityMetrics(current, periodEnd, eventId)
      
      trends.push({
        date: current.toISOString(),
        score: metrics.overallScore,
        logCount: metrics.totalLogs
      })

      current.setTime(periodEnd.getTime())
    }

    return trends
  } catch (error) {
    console.error('Error getting log quality trend:', error)
    throw error
  }
}

/**
 * Get quality score for a single log
 */
export function calculateSingleLogQuality(log: IncidentLog): {
  score: number
  completeness: number
  timeliness: number
  factualLanguage: number
} {
  const completeness = calculateCompletenessScore(log as any)
  const timeliness = calculateTimelinessScore(log as any)
  const factualLanguage = calculateFactualLanguageScore(log as any)

  const score = (
    completeness * 0.35 +
    timeliness * 0.30 +
    factualLanguage * 0.35
  )

  return {
    score: Math.round(score),
    completeness: Math.round(completeness),
    timeliness: Math.round(timeliness),
    factualLanguage: Math.round(factualLanguage)
  }
}

/**
 * Get top performing operators by quality score
 */
export async function getTopPerformingOperators(
  startDate: Date,
  endDate: Date,
  eventId?: string,
  limit: number = 10
): Promise<Array<{
  userId: string
  userName?: string
  callsign?: string
  averageQuality: number
  logCount: number
}>> {
  try {
    let query = supabase
      .from('incident_logs')
      .select('logged_by_user_id, logged_by_callsign, *')
      .gte('time_logged', startDate.toISOString())
      .lte('time_logged', endDate.toISOString())
      .not('logged_by_user_id', 'is', null)

    if (eventId) {
      query = query.eq('event_id', eventId)
    }

    const { data: logs, error } = await query

    if (error) throw error
    const logList = (logs ?? []) as IncidentLog[]
    if (logList.length === 0) return []

    // Group by user
    const userMap = new Map<string, { logs: IncidentLog[], callsign?: string }>()
    
    logList.forEach(log => {
      if (!log.logged_by_user_id) return
      
      if (!userMap.has(log.logged_by_user_id)) {
        userMap.set(log.logged_by_user_id, { 
          logs: [], 
          callsign: log.logged_by_callsign ?? undefined 
        })
      }
      userMap.get(log.logged_by_user_id)!.logs.push(log)
    })

    // Calculate average quality per user
    const operators = Array.from(userMap.entries()).map(([userId, data]) => {
      const qualityScores = data.logs.map(log => calculateSingleLogQuality(log).score)
      const averageQuality = qualityScores.reduce((a, b) => a + b, 0) / qualityScores.length

      return {
        userId,
        callsign: data.callsign,
        averageQuality: Math.round(averageQuality),
        logCount: data.logs.length
      }
    })

    // Sort by quality and limit
    return operators
      .sort((a, b) => b.averageQuality - a.averageQuality)
      .slice(0, limit)
  } catch (error) {
    console.error('Error getting top performing operators:', error)
    throw error
  }
}
