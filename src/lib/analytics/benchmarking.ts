/**
 * Venue Type Benchmarking System
 * Compare event performance against similar venue types
 */

import { generateText } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import { createAnthropic } from '@ai-sdk/anthropic'

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY || ''
})

const anthropic = createAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || ''
})

export interface BenchmarkingMetrics {
  incidentsPerHour: number
  averageResponseTime: number // in minutes
  resolutionRate: number
  staffEfficiency: number
  crowdDensityScore: number
  severityDistribution: {
    low: number
    medium: number
    high: number
    critical: number
  }
}

export interface VenueBenchmark {
  venueType: string
  totalEvents: number
  averageMetrics: BenchmarkingMetrics
  percentileRankings: {
    incidentsPerHour: number
    responseTime: number
    resolutionRate: number
    staffEfficiency: number
  }
}

export interface EventBenchmarkingResult {
  currentEvent: {
    venueType: string
    metrics: BenchmarkingMetrics
  }
  benchmark: VenueBenchmark
  percentileRanking: number
  comparison: string
  strengths: string[]
  improvements: string[]
  recommendations: string[]
}

export interface VenueTypeData {
  venueType: string
  events: Array<{
    id: string
    date: string
    name: string
    attendance: number
    duration: number // in hours
    metrics: BenchmarkingMetrics
  }>
}

const BENCHMARKING_SYSTEM = `You are an expert event security analyst specializing in venue type benchmarking and performance analysis.

Analyze event security metrics and provide:
1. Percentile rankings compared to similar venue types
2. Performance strengths and areas for improvement
3. Specific, actionable recommendations
4. Industry context and best practices

Focus on:
- Response time efficiency
- Incident management effectiveness
- Staff utilization
- Crowd control performance
- Overall security posture

Provide professional, data-driven insights suitable for security management reports.`

const generateBenchmarkingPrompt = (
  currentEvent: any,
  venueBenchmark: VenueBenchmark
): string => {
  const current = currentEvent.metrics
  const benchmark = venueBenchmark.averageMetrics
  const percentiles = venueBenchmark.percentileRankings

  return `Analyze this event's performance against ${currentEvent.venueType} venue benchmarks:

CURRENT EVENT METRICS:
- Incidents per Hour: ${current.incidentsPerHour.toFixed(2)}
- Average Response Time: ${current.averageResponseTime.toFixed(1)} minutes
- Resolution Rate: ${current.resolutionRate.toFixed(1)}%
- Staff Efficiency: ${current.staffEfficiency.toFixed(1)}/100
- Crowd Density Score: ${current.crowdDensityScore.toFixed(1)}/10

BENCHMARK AVERAGES (${venueBenchmark.totalEvents} similar events):
- Incidents per Hour: ${benchmark.incidentsPerHour.toFixed(2)}
- Average Response Time: ${benchmark.averageResponseTime.toFixed(1)} minutes
- Resolution Rate: ${benchmark.resolutionRate.toFixed(1)}%
- Staff Efficiency: ${benchmark.staffEfficiency.toFixed(1)}/100
- Crowd Density Score: ${benchmark.crowdDensityScore.toFixed(1)}/10

PERCENTILE RANKINGS:
- Incidents per Hour: ${percentiles.incidentsPerHour}th percentile
- Response Time: ${percentiles.responseTime}th percentile
- Resolution Rate: ${percentiles.resolutionRate}th percentile
- Staff Efficiency: ${percentiles.staffEfficiency}th percentile

Provide analysis as JSON:
{
  "percentileRanking": 75,
  "comparison": "This event performed better than 75% of similar venue types",
  "strengths": ["strength1", "strength2"],
  "improvements": ["improvement1", "improvement2"],
  "recommendations": ["rec1", "rec2", "rec3"]
}`
}

/**
 * Calculate benchmarking metrics for an event
 */
export function calculateEventMetrics(
  incidents: any[],
  staff: any[],
  eventStart: Date,
  eventEnd: Date,
  attendance: number
): BenchmarkingMetrics {
  const duration = (eventEnd.getTime() - eventStart.getTime()) / 3600000 // hours
  const incidentsPerHour = incidents.length / duration

  // Calculate average response time
  const responseTimes = incidents
    .filter(i => i.responded_at && i.timestamp)
    .map(i => new Date(i.responded_at).getTime() - new Date(i.timestamp).getTime())
  
  const averageResponseTime = responseTimes.length > 0 
    ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length / 60000
    : 0

  // Calculate resolution rate
  const resolvedIncidents = incidents.filter(i => i.is_closed).length
  const resolutionRate = incidents.length > 0 ? (resolvedIncidents / incidents.length) * 100 : 100

  // Calculate staff efficiency
  const staffEfficiency = calculateStaffEfficiency(incidents, staff)

  // Calculate crowd density score (incidents per 1000 attendees)
  const crowdDensityScore = attendance > 0 ? (incidents.length / attendance) * 1000 : 0

  // Calculate severity distribution
  const severityCounts = incidents.reduce((acc, incident) => {
    const severity = incident.priority || 'medium'
    acc[severity] = (acc[severity] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const totalIncidents = incidents.length
  const severityDistribution = {
    low: totalIncidents > 0 ? (severityCounts.low || 0) / totalIncidents * 100 : 0,
    medium: totalIncidents > 0 ? (severityCounts.medium || 0) / totalIncidents * 100 : 0,
    high: totalIncidents > 0 ? (severityCounts.high || 0) / totalIncidents * 100 : 0,
    critical: totalIncidents > 0 ? (severityCounts.critical || 0) / totalIncidents * 100 : 0
  }

  return {
    incidentsPerHour,
    averageResponseTime,
    resolutionRate,
    staffEfficiency,
    crowdDensityScore,
    severityDistribution
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
 * Calculate percentile rankings
 */
export function calculatePercentileRankings(
  currentMetrics: BenchmarkingMetrics,
  venueData: VenueTypeData
): { [key: string]: number } {
  const metrics = ['incidentsPerHour', 'averageResponseTime', 'resolutionRate', 'staffEfficiency']
  const percentiles: { [key: string]: number } = {}

  metrics.forEach(metric => {
    const currentValue = currentMetrics[metric as keyof BenchmarkingMetrics] as number
    const values = venueData.events.map(event => event.metrics[metric as keyof BenchmarkingMetrics] as number)
    
    // Sort values to find percentile
    values.sort((a, b) => a - b)
    const rank = values.filter(v => v <= currentValue).length
    const percentile = (rank / values.length) * 100
    
    percentiles[metric] = Math.round(percentile)
  })

  return percentiles
}

/**
 * Generate venue benchmark data
 */
export function generateVenueBenchmark(venueData: VenueTypeData): VenueBenchmark {
  const events = venueData.events
  
  if (events.length === 0) {
    return {
      venueType: venueData.venueType,
      totalEvents: 0,
      averageMetrics: {
        incidentsPerHour: 0,
        averageResponseTime: 0,
        resolutionRate: 0,
        staffEfficiency: 0,
        crowdDensityScore: 0,
        severityDistribution: { low: 0, medium: 0, high: 0, critical: 0 }
      },
      percentileRankings: {
        incidentsPerHour: 50,
        responseTime: 50,
        resolutionRate: 50,
        staffEfficiency: 50
      }
    }
  }

  // Calculate averages
  const averageMetrics: BenchmarkingMetrics = {
    incidentsPerHour: events.reduce((sum, e) => sum + e.metrics.incidentsPerHour, 0) / events.length,
    averageResponseTime: events.reduce((sum, e) => sum + e.metrics.averageResponseTime, 0) / events.length,
    resolutionRate: events.reduce((sum, e) => sum + e.metrics.resolutionRate, 0) / events.length,
    staffEfficiency: events.reduce((sum, e) => sum + e.metrics.staffEfficiency, 0) / events.length,
    crowdDensityScore: events.reduce((sum, e) => sum + e.metrics.crowdDensityScore, 0) / events.length,
    severityDistribution: {
      low: events.reduce((sum, e) => sum + e.metrics.severityDistribution.low, 0) / events.length,
      medium: events.reduce((sum, e) => sum + e.metrics.severityDistribution.medium, 0) / events.length,
      high: events.reduce((sum, e) => sum + e.metrics.severityDistribution.high, 0) / events.length,
      critical: events.reduce((sum, e) => sum + e.metrics.severityDistribution.critical, 0) / events.length
    }
  }

  return {
    venueType: venueData.venueType,
    totalEvents: events.length,
    averageMetrics,
    percentileRankings: {
      incidentsPerHour: 50,
      responseTime: 50,
      resolutionRate: 50,
      staffEfficiency: 50
    }
  }
}

/**
 * Generate AI-powered benchmarking analysis
 */
export async function generateBenchmarkingAnalysis(
  currentEvent: { venueType: string; metrics: BenchmarkingMetrics },
  venueBenchmark: VenueBenchmark,
  provider: 'openai' | 'anthropic' = 'openai'
): Promise<EventBenchmarkingResult> {
  try {
    const model = provider === 'openai' 
      ? openai('gpt-4o-mini')
      : anthropic('claude-3-5-sonnet-20241022')

    const { text } = await generateText({
      model,
      system: BENCHMARKING_SYSTEM,
      prompt: generateBenchmarkingPrompt(currentEvent, venueBenchmark),
      temperature: 0.3,
      maxOutputTokens: 1000
    })

    const cleaned = text.trim().replace(/```json\n?/g, '').replace(/```\n?/g, '')
    const analysis = JSON.parse(cleaned)

    return {
      currentEvent,
      benchmark: venueBenchmark,
      percentileRanking: analysis.percentileRanking || 50,
      comparison: analysis.comparison || 'Performance analysis completed',
      strengths: analysis.strengths || [],
      improvements: analysis.improvements || [],
      recommendations: analysis.recommendations || []
    }
  } catch (error) {
    console.error('Benchmarking analysis error:', error)
    
    // Fallback analysis
    const avgPercentile = Object.values(venueBenchmark.percentileRankings)
      .reduce((sum, p) => sum + p, 0) / Object.keys(venueBenchmark.percentileRankings).length

    return {
      currentEvent,
      benchmark: venueBenchmark,
      percentileRanking: Math.round(avgPercentile),
      comparison: `Performance compared to ${venueBenchmark.totalEvents} similar ${currentEvent.venueType} events`,
      strengths: ['Event completed successfully'],
      improvements: ['Review incident response procedures'],
      recommendations: ['Continue monitoring performance metrics']
    }
  }
}

/**
 * Get performance color based on percentile
 */
export function getPerformanceColor(percentile: number): string {
  if (percentile >= 80) return 'text-green-600'
  if (percentile >= 60) return 'text-blue-600'
  if (percentile >= 40) return 'text-yellow-600'
  return 'text-red-600'
}

/**
 * Get performance label
 */
export function getPerformanceLabel(percentile: number): string {
  if (percentile >= 90) return 'Excellent'
  if (percentile >= 80) return 'Very Good'
  if (percentile >= 70) return 'Good'
  if (percentile >= 60) return 'Above Average'
  if (percentile >= 40) return 'Average'
  if (percentile >= 30) return 'Below Average'
  if (percentile >= 20) return 'Poor'
  return 'Very Poor'
}
