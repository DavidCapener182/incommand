/**
 * AI Event Summary Generator
 * Generates comprehensive end-of-event summaries with metrics and insights
 */

import { generateText } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import { createAnthropic } from '@ai-sdk/anthropic'

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
  compatibility: 'strict'
})

const anthropic = createAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || ''
})

export interface EventMetrics {
  totalIncidents: number
  averageResponseTime: string
  resolutionRate: number
  staffEfficiency: number
  crowdDensity: string
  peakIncidentHour: string
  incidentTypes: Array<{
    type: string
    count: number
    percentage: number
  }>
}

export interface AIInsights {
  anomalies: string[]
  recommendations: string[]
  confidence: number
  patterns: string[]
}

export interface LessonsLearned {
  positive: string[]
  areasForImprovement: string[]
  criticalIssues: string[]
}

export interface StaffPerformance {
  totalStaff: number
  averageResponseTime: string
  incidentsPerStaff: number
  efficiencyScore: number
  topPerformers: Array<{
    callsign: string
    incidentsHandled: number
    responseTime: string
  }>
}

export interface EventSummaryData {
  eventName: string
  eventDate: string
  venueType: string
  attendance: number
  duration: string
  incidents: any[]
  staff: any[]
  weather: any
  metrics: EventMetrics
  insights: AIInsights
  lessons: LessonsLearned
  staffPerformance: StaffPerformance
}

const SUMMARY_GENERATION_SYSTEM = `You are an expert event security analyst. Generate comprehensive, professional event summaries with actionable insights.

Key requirements:
1. Focus on security performance, response times, and incident patterns
2. Identify anomalies and areas for improvement
3. Provide specific, actionable recommendations
4. Use professional language suitable for security reports
5. Highlight both successes and areas needing attention
6. Consider venue type, crowd size, and event duration in analysis`

const generateLessonsLearnedPrompt = (data: EventSummaryData): string => {
  return `Analyze this event security data and generate lessons learned:

Event: ${data.eventName} (${data.venueType})
Date: ${data.eventDate}
Duration: ${data.duration}
Attendance: ${data.attendance.toLocaleString()}
Total Incidents: ${data.metrics.totalIncidents}
Avg Response Time: ${data.metrics.averageResponseTime}

Incident Types:
${data.metrics.incidentTypes.map(t => `- ${t.type}: ${t.count} (${t.percentage}%)`).join('\n')}

Staff Performance:
- Total Staff: ${data.staffPerformance.totalStaff}
- Efficiency Score: ${data.staffPerformance.efficiencyScore}/100
- Incidents per Staff: ${data.staffPerformance.incidentsPerStaff}

Generate three categories:
1. POSITIVE: What went well, best practices observed
2. AREAS FOR IMPROVEMENT: Specific areas that need attention
3. CRITICAL ISSUES: Serious concerns requiring immediate action

Return as JSON:
{
  "positive": ["lesson1", "lesson2", "lesson3"],
  "areasForImprovement": ["area1", "area2", "area3"],
  "criticalIssues": ["issue1", "issue2"]
}`
}

const generateAIInsightsPrompt = (data: EventSummaryData): string => {
  return `Analyze this event security data for anomalies and patterns:

Event Metrics:
- Total Incidents: ${data.metrics.totalIncidents}
- Average Response Time: ${data.metrics.averageResponseTime}
- Resolution Rate: ${data.metrics.resolutionRate}%
- Peak Incident Hour: ${data.metrics.peakIncidentHour}

Incident Distribution:
${data.metrics.incidentTypes.map(t => `- ${t.type}: ${t.count} (${t.percentage}%)`).join('\n')}

Staff Performance:
- Efficiency Score: ${data.staffPerformance.efficiencyScore}/100
- Incidents per Staff: ${data.staffPerformance.incidentsPerStaff}

Identify:
1. ANOMALIES: Unusual patterns, delays, or concerning trends
2. RECOMMENDATIONS: Specific actions to improve performance
3. PATTERNS: Recurring issues or successful strategies
4. CONFIDENCE: Your confidence level (0-100) in these insights

Return as JSON:
{
  "anomalies": ["anomaly1", "anomaly2"],
  "recommendations": ["rec1", "rec2", "rec3"],
  "patterns": ["pattern1", "pattern2"],
  "confidence": 85
}`
}

/**
 * Generate comprehensive event metrics
 */
export async function calculateEventMetrics(
  incidents: any[],
  staff: any[],
  eventStart: Date,
  eventEnd: Date
): Promise<EventMetrics> {
  const totalIncidents = incidents.length
  
  // Calculate average response time
  const responseTimes = incidents
    .filter(i => i.responded_at && i.timestamp)
    .map(i => new Date(i.responded_at).getTime() - new Date(i.timestamp).getTime())
  
  const avgResponseMs = responseTimes.length > 0 
    ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length 
    : 0
  
  const avgResponseTime = avgResponseMs > 0 
    ? `${Math.round(avgResponseMs / 60000)}m ${Math.round((avgResponseMs % 60000) / 1000)}s`
    : 'N/A'

  // Calculate resolution rate
  const resolvedIncidents = incidents.filter(i => i.is_closed).length
  const resolutionRate = totalIncidents > 0 ? Math.round((resolvedIncidents / totalIncidents) * 100) : 100

  // Calculate staff efficiency (based on response times and incident handling)
  const staffEfficiency = calculateStaffEfficiency(incidents, staff)

  // Calculate crowd density (simplified)
  const eventDuration = eventEnd.getTime() - eventStart.getTime()
  const incidentsPerHour = totalIncidents / (eventDuration / 3600000)
  const crowdDensity = incidentsPerHour < 2 ? 'Low' : incidentsPerHour < 5 ? 'Medium' : 'High'

  // Find peak incident hour
  const hourCounts = incidents.reduce((acc, incident) => {
    const hour = new Date(incident.timestamp).getHours()
    acc[hour] = (acc[hour] || 0) + 1
    return acc
  }, {} as Record<number, number>)
  
  const peakHour = Object.entries(hourCounts)
    .sort(([,a], [,b]) => b - a)[0]
  const peakIncidentHour = peakHour ? `${peakHour[0]}:00 (${peakHour[1]} incidents)` : 'N/A'

  // Group incidents by type
  const typeCounts = incidents.reduce((acc, incident) => {
    const type = incident.incident_type || 'Unknown'
    acc[type] = (acc[type] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const incidentTypes = Object.entries(typeCounts)
    .map(([type, count]) => ({
      type,
      count,
      percentage: Math.round((count / totalIncidents) * 100)
    }))
    .sort((a, b) => b.count - a.count)

  return {
    totalIncidents,
    averageResponseTime: avgResponseTime,
    resolutionRate,
    staffEfficiency,
    crowdDensity,
    peakIncidentHour,
    incidentTypes
  }
}

/**
 * Calculate staff efficiency score
 */
function calculateStaffEfficiency(incidents: any[], staff: any[]): number {
  if (incidents.length === 0 || staff.length === 0) return 100

  const avgResponseTime = incidents
    .filter(i => i.responded_at && i.timestamp)
    .map(i => new Date(i.responded_at).getTime() - new Date(i.timestamp).getTime())
    .reduce((a, b) => a + b, 0) / incidents.length

  const avgResponseMinutes = avgResponseTime / 60000
  
  // Efficiency based on response time (lower is better)
  let efficiency = 100
  if (avgResponseMinutes > 10) efficiency -= 30
  else if (avgResponseMinutes > 5) efficiency -= 15
  else if (avgResponseMinutes > 2) efficiency -= 5

  // Penalty for unresolved incidents
  const unresolvedRate = incidents.filter(i => !i.is_closed).length / incidents.length
  efficiency -= unresolvedRate * 20

  return Math.max(0, Math.min(100, Math.round(efficiency)))
}

/**
 * Generate AI insights using LLM
 */
export async function generateAIInsights(
  data: EventSummaryData,
  provider: 'openai' | 'anthropic' = 'openai'
): Promise<AIInsights> {
  try {
    const model = provider === 'openai' 
      ? openai('gpt-4o-mini')
      : anthropic('claude-3-5-sonnet-20241022')

    const { text } = await generateText({
      model,
      system: SUMMARY_GENERATION_SYSTEM,
      prompt: generateAIInsightsPrompt(data),
      temperature: 0.3,
      maxTokens: 1000
    })

    const cleaned = text.trim().replace(/```json\n?/g, '').replace(/```\n?/g, '')
    const insights = JSON.parse(cleaned) as AIInsights

    return {
      anomalies: insights.anomalies || [],
      recommendations: insights.recommendations || [],
      patterns: insights.patterns || [],
      confidence: Math.max(0, Math.min(100, insights.confidence || 50))
    }
  } catch (error) {
    console.error('Error generating AI insights:', error)
    return {
      anomalies: [],
      recommendations: ['Review incident logs manually for patterns'],
      patterns: [],
      confidence: 0
    }
  }
}

/**
 * Generate lessons learned using LLM
 */
export async function generateLessonsLearned(
  data: EventSummaryData,
  provider: 'openai' | 'anthropic' = 'openai'
): Promise<LessonsLearned> {
  try {
    const model = provider === 'openai' 
      ? openai('gpt-4o-mini')
      : anthropic('claude-3-5-sonnet-20241022')

    const { text } = await generateText({
      model,
      system: SUMMARY_GENERATION_SYSTEM,
      prompt: generateLessonsLearnedPrompt(data),
      temperature: 0.3,
      maxTokens: 800
    })

    const cleaned = text.trim().replace(/```json\n?/g, '').replace(/```\n?/g, '')
    const lessons = JSON.parse(cleaned) as LessonsLearned

    return {
      positive: lessons.positive || [],
      areasForImprovement: lessons.areasForImprovement || [],
      criticalIssues: lessons.criticalIssues || []
    }
  } catch (error) {
    console.error('Error generating lessons learned:', error)
    return {
      positive: [],
      areasForImprovement: ['Review incident response procedures'],
      criticalIssues: []
    }
  }
}

/**
 * Calculate staff performance metrics
 */
export function calculateStaffPerformance(incidents: any[], staff: any[]): StaffPerformance {
  const totalStaff = staff.length
  
  // Calculate average response time
  const responseTimes = incidents
    .filter(i => i.responded_at && i.timestamp)
    .map(i => new Date(i.responded_at).getTime() - new Date(i.timestamp).getTime())
  
  const avgResponseMs = responseTimes.length > 0 
    ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length 
    : 0
  
  const avgResponseTime = avgResponseMs > 0 
    ? `${Math.round(avgResponseMs / 60000)}m ${Math.round((avgResponseMs % 60000) / 1000)}s`
    : 'N/A'

  const incidentsPerStaff = totalStaff > 0 ? Math.round(incidents.length / totalStaff * 10) / 10 : 0
  const efficiencyScore = calculateStaffEfficiency(incidents, staff)

  // Get top performers
  const staffIncidents = incidents.reduce((acc, incident) => {
    const callsign = incident.assigned_to || incident.callsign_from || 'Unknown'
    if (!acc[callsign]) {
      acc[callsign] = { count: 0, totalResponseTime: 0 }
    }
    acc[callsign].count++
    if (incident.responded_at && incident.timestamp) {
      acc[callsign].totalResponseTime += new Date(incident.responded_at).getTime() - new Date(incident.timestamp).getTime()
    }
    return acc
  }, {} as Record<string, { count: number; totalResponseTime: number }>)

  const topPerformers = Object.entries(staffIncidents)
    .map(([callsign, stats]) => ({
      callsign,
      incidentsHandled: stats.count,
      responseTime: stats.totalResponseTime > 0 
        ? `${Math.round(stats.totalResponseTime / stats.count / 60000)}m`
        : 'N/A'
    }))
    .sort((a, b) => b.incidentsHandled - a.incidentsHandled)
    .slice(0, 3)

  return {
    totalStaff,
    averageResponseTime: avgResponseTime,
    incidentsPerStaff,
    efficiencyScore,
    topPerformers
  }
}

/**
 * Generate complete event summary
 */
export async function generateEventSummary(
  eventData: any,
  incidents: any[],
  staff: any[],
  weather?: any
): Promise<EventSummaryData> {
  const eventStart = new Date(eventData.doors_open_time || eventData.start_time)
  const eventEnd = new Date(eventData.venue_clear_time || eventData.end_time)
  
  const metrics = await calculateEventMetrics(incidents, staff, eventStart, eventEnd)
  const staffPerformance = calculateStaffPerformance(incidents, staff)

  const data: EventSummaryData = {
    eventName: eventData.name || 'Unknown Event',
    eventDate: eventData.date || new Date().toISOString().split('T')[0],
    venueType: eventData.venue_type || 'Unknown',
    attendance: eventData.expected_attendance || 0,
    duration: `${Math.round((eventEnd.getTime() - eventStart.getTime()) / 3600000)}h`,
    incidents,
    staff,
    weather,
    metrics,
    insights: { anomalies: [], recommendations: [], confidence: 0, patterns: [] },
    lessons: { positive: [], areasForImprovement: [], criticalIssues: [] },
    staffPerformance
  }

  // Generate AI insights and lessons learned
  const [insights, lessons] = await Promise.all([
    generateAIInsights(data),
    generateLessonsLearned(data)
  ])

  return {
    ...data,
    insights,
    lessons
  }
}
