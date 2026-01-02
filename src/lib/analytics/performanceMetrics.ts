/**
 * Performance Metrics System
 * Operational efficiency and response time tracking
 */

import { supabase } from '../supabase'

export interface PerformanceMetrics {
  averageResponseTime: number // minutes
  averageResolutionTime: number // minutes
  medianResponseTime: number // minutes
  medianResolutionTime: number // minutes
  peakIncidentHours: { hour: number; count: number }[]
  staffUtilization: {
    userId: string
    callsign?: string
    incidentCount: number
    averageHandlingTime: number
    activeHours: number
  }[]
  responseQuality: number // 0-100 (% closed without reopening)
  incidentVolumeByType: { type: string; count: number; avgTime: number }[]
  incidentVolumeByPriority: { priority: string; count: number; avgTime: number }[]
  totalIncidents: number
  closedIncidents: number
  averageIncidentsPerHour: number
  periodStart: string
  periodEnd: string
}

export interface ResponseTimeDistribution {
  bucket: string
  count: number
  percentage: number
}

import { IncidentLog } from '../../types/shared'

/**
 * Calculate response time (from creation to first response)
 */
function calculateResponseTime(log: IncidentLog): number | null {
  if (!log.responded_at) return null
  
  const created = new Date(log.created_at)
  const responded = new Date(log.responded_at)
  
  return (responded.getTime() - created.getTime()) / (1000 * 60) // minutes
}

/**
 * Calculate resolution time (from creation to closure)
 */
function calculateResolutionTime(log: IncidentLog): number | null {
  if (!log.is_closed || !log.resolved_at) return null
  
  const created = new Date(log.created_at)
  const resolved = new Date(log.resolved_at)
  
  return (resolved.getTime() - created.getTime()) / (1000 * 60) // minutes
}

/**
 * Calculate median from array of numbers
 */
function calculateMedian(numbers: number[]): number {
  if (numbers.length === 0) return 0
  
  const sorted = numbers.slice().sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2
  }
  return sorted[mid]
}

/**
 * Get peak incident hours
 */
function getPeakIncidentHours(logs: IncidentLog[]): { hour: number; count: number }[] {
  const hourCounts: Record<number, number> = {}
  
  logs.forEach(log => {
    const hour = new Date(log.created_at).getHours()
    hourCounts[hour] = (hourCounts[hour] || 0) + 1
  })
  
  return Object.entries(hourCounts)
    .map(([hour, count]) => ({ hour: parseInt(hour), count }))
    .sort((a, b) => b.count - a.count)
}

/**
 * Calculate staff utilization metrics
 */
function calculateStaffUtilization(
  logs: IncidentLog[],
  periodHours: number
): PerformanceMetrics['staffUtilization'] {
  const staffMap = new Map<string, {
    callsign?: string
    logs: IncidentLog[]
    totalHandlingTime: number
  }>()
  
  logs.forEach(log => {
    if (!log.logged_by_user_id) return
    
    if (!staffMap.has(log.logged_by_user_id)) {
      staffMap.set(log.logged_by_user_id, {
        callsign: log.logged_by_callsign || 'Unknown',
        logs: [],
        totalHandlingTime: 0
      })
    }
    
    const staff = staffMap.get(log.logged_by_user_id)!
    staff.logs.push(log)
    
    // Calculate handling time for this incident
    const resolutionTime = calculateResolutionTime(log)
    if (resolutionTime !== null) {
      staff.totalHandlingTime += resolutionTime
    }
  })
  
  return Array.from(staffMap.entries()).map(([userId, data]) => ({
    userId,
    callsign: data.callsign,
    incidentCount: data.logs.length,
    averageHandlingTime: Math.round(
      data.totalHandlingTime / Math.max(data.logs.length, 1)
    ),
    activeHours: Math.min(periodHours, 24) // Estimate based on incident count
  }))
}

/**
 * Calculate response quality (incidents closed without reopening)
 */
function calculateResponseQuality(logs: IncidentLog[]): number {
  const closedLogs = logs.filter(log => log.is_closed)
  if (closedLogs.length === 0) return 100
  
  // Check for logs that were updated after being closed (potential reopening)
  const reopenedCount = closedLogs.filter(log => {
    if (!log.resolved_at || !log.updated_at) return false
    
    const resolved = new Date(log.resolved_at)
    const updated = new Date(log.updated_at)
    
    // If updated significantly after resolution, likely reopened
    return updated.getTime() - resolved.getTime() > 5 * 60 * 1000 // 5 minutes
  }).length
  
  return ((closedLogs.length - reopenedCount) / closedLogs.length) * 100
}

/**
 * Get incident volume breakdown by type
 */
function getIncidentVolumeByType(logs: IncidentLog[]): PerformanceMetrics['incidentVolumeByType'] {
  const typeMap: Record<string, { count: number; totalTime: number; times: number[] }> = {}
  
  logs.forEach(log => {
    const type = log.incident_type || 'Unknown'
    
    if (!typeMap[type]) {
      typeMap[type] = { count: 0, totalTime: 0, times: [] }
    }
    
    typeMap[type].count++
    
    const resolutionTime = calculateResolutionTime(log)
    if (resolutionTime !== null) {
      typeMap[type].totalTime += resolutionTime
      typeMap[type].times.push(resolutionTime)
    }
  })
  
  return Object.entries(typeMap)
    .map(([type, data]) => ({
      type,
      count: data.count,
      avgTime: Math.round(data.totalTime / Math.max(data.times.length, 1))
    }))
    .sort((a, b) => b.count - a.count)
}

/**
 * Get incident volume breakdown by priority
 */
function getIncidentVolumeByPriority(logs: IncidentLog[]): PerformanceMetrics['incidentVolumeByPriority'] {
  const priorityMap: Record<string, { count: number; totalTime: number; times: number[] }> = {}
  
  logs.forEach(log => {
    const priority = log.priority || 'medium'
    
    if (!priorityMap[priority]) {
      priorityMap[priority] = { count: 0, totalTime: 0, times: [] }
    }
    
    priorityMap[priority].count++
    
    const resolutionTime = calculateResolutionTime(log)
    if (resolutionTime !== null) {
      priorityMap[priority].totalTime += resolutionTime
      priorityMap[priority].times.push(resolutionTime)
    }
  })
  
  return Object.entries(priorityMap)
    .map(([priority, data]) => ({
      priority,
      count: data.count,
      avgTime: Math.round(data.totalTime / Math.max(data.times.length, 1))
    }))
    .sort((a, b) => {
      const order: Record<string, number> = { high: 0, medium: 1, low: 2 }
      return (order[a.priority] || 3) - (order[b.priority] || 3)
    })
}

/**
 * Calculate comprehensive performance metrics
 */
export async function calculatePerformanceMetrics(
  startDate: Date,
  endDate: Date,
  eventId?: string
): Promise<PerformanceMetrics> {
  try {
    let query = supabase
      .from('incident_logs')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())

    if (eventId) {
      query = query.eq('event_id', eventId)
    }

    const { data: logs, error } = await query

    if (error) throw error
    const logList = (logs ?? []) as IncidentLog[]

    if (logList.length === 0) {
      return {
        averageResponseTime: 0,
        averageResolutionTime: 0,
        medianResponseTime: 0,
        medianResolutionTime: 0,
        peakIncidentHours: [],
        staffUtilization: [],
        responseQuality: 100,
        incidentVolumeByType: [],
        incidentVolumeByPriority: [],
        totalIncidents: 0,
        closedIncidents: 0,
        averageIncidentsPerHour: 0,
        periodStart: startDate.toISOString(),
        periodEnd: endDate.toISOString()
      }
    }

    // Filter out Attendance incidents from operational metrics
    const operationalLogs = logList.filter(log => log.incident_type !== 'Attendance') as IncidentLog[]

    // Convert logs to match IncidentLog interface
    const convertedLogs = operationalLogs.map(log => ({
      ...(log as Record<string, any>),
      id: (log as any).id?.toString?.() ?? '',
      responded_at: log.responded_at ?? undefined
    })) as IncidentLog[]

    // Calculate response times (excluding Attendance incidents)
    const responseTimes = convertedLogs
      .map(log => calculateResponseTime(log as any))
      .filter((time): time is number => time !== null)
    
    const resolutionTimes = convertedLogs
      .map(log => calculateResolutionTime(log as any))
      .filter((time): time is number => time !== null)

    const averageResponseTime = responseTimes.length > 0
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
      : 0

    const averageResolutionTime = resolutionTimes.length > 0
      ? resolutionTimes.reduce((a, b) => a + b, 0) / resolutionTimes.length
      : 0

    const medianResponseTime = calculateMedian(responseTimes)
    const medianResolutionTime = calculateMedian(resolutionTimes)

    // Calculate other metrics (using operational logs for operational metrics)
    const peakIncidentHours = getPeakIncidentHours(operationalLogs)
    
    const periodHours = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60)
    const staffUtilization = calculateStaffUtilization(operationalLogs, periodHours)
    
    const responseQuality = calculateResponseQuality(operationalLogs)
    const incidentVolumeByType = getIncidentVolumeByType(operationalLogs)
    const incidentVolumeByPriority = getIncidentVolumeByPriority(operationalLogs)
    
    const closedIncidents = operationalLogs.filter(log => log.is_closed).length
    const averageIncidentsPerHour = operationalLogs.length / Math.max(periodHours, 1)

    return {
      averageResponseTime: Math.round(averageResponseTime),
      averageResolutionTime: Math.round(averageResolutionTime),
      medianResponseTime: Math.round(medianResponseTime),
      medianResolutionTime: Math.round(medianResolutionTime),
      peakIncidentHours,
      staffUtilization,
      responseQuality: Math.round(responseQuality),
      incidentVolumeByType,
      incidentVolumeByPriority,
      totalIncidents: operationalLogs.length,
      closedIncidents,
      averageIncidentsPerHour: Math.round(averageIncidentsPerHour * 10) / 10,
      periodStart: startDate.toISOString(),
      periodEnd: endDate.toISOString()
    }
  } catch (error) {
    console.error('Error calculating performance metrics:', error)
    throw error
  }
}

/**
 * Get response time distribution for visualization
 */
export async function getResponseTimeDistribution(
  startDate: Date,
  endDate: Date,
  eventId?: string
): Promise<ResponseTimeDistribution[]> {
  try {
    let query = supabase
      .from('incident_logs')
      .select('created_at, responded_at')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .not('responded_at', 'is', null)

    if (eventId) {
      query = query.eq('event_id', eventId)
    }

    const { data: logs, error } = await query

    if (error) throw error
    const logList = (logs ?? []) as Array<{ created_at: string; responded_at: string | null }>
    if (logList.length === 0) return []

    // Calculate response times
    const responseTimes = logList.map(log => {
      const created = new Date(log.created_at)
      const responded = new Date(log.responded_at!)
      return (responded.getTime() - created.getTime()) / (1000 * 60) // minutes
    })

    // Create buckets
    const buckets: Record<string, number> = {
      '0-5m': 0,
      '5-15m': 0,
      '15-30m': 0,
      '30-60m': 0,
      '60m+': 0
    }

    responseTimes.forEach(time => {
      if (time <= 5) buckets['0-5m']++
      else if (time <= 15) buckets['5-15m']++
      else if (time <= 30) buckets['15-30m']++
      else if (time <= 60) buckets['30-60m']++
      else buckets['60m+']++
    })

    const total = responseTimes.length

    return Object.entries(buckets).map(([bucket, count]) => ({
      bucket,
      count,
      percentage: Math.round((count / total) * 100 * 10) / 10
    }))
  } catch (error) {
    console.error('Error getting response time distribution:', error)
    throw error
  }
}

/**
 * Get performance summary for quick dashboard display
 */
export async function getPerformanceSummary(
  eventId?: string
): Promise<{
  avgResponseTime: number
  avgResolutionTime: number
  activeIncidents: number
  closureRate: number
}> {
  // Get last 24 hours performance
  const endDate = new Date()
  const startDate = new Date(endDate.getTime() - 24 * 60 * 60 * 1000)

  const metrics = await calculatePerformanceMetrics(startDate, endDate, eventId)

  const closureRate = metrics.totalIncidents > 0
    ? (metrics.closedIncidents / metrics.totalIncidents) * 100
    : 0

  const activeIncidents = metrics.totalIncidents - metrics.closedIncidents

  return {
    avgResponseTime: metrics.averageResponseTime,
    avgResolutionTime: metrics.averageResolutionTime,
    activeIncidents,
    closureRate: Math.round(closureRate)
  }
}
