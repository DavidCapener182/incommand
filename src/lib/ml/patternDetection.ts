/**
 * AI Pattern Detection Engine
 * Advanced pattern recognition for incident analysis and predictions
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

export interface IncidentPattern {
  type: 'delayed_response' | 'crowd_density' | 'repeat_zone' | 'staff_overload' | 'weather_impact'
  severity: 'low' | 'medium' | 'high' | 'critical'
  confidence: number
  description: string
  affectedIncidents: string[]
  timeframe: string
  recommendation: string
  metrics: {
    count: number
    percentage: number
    trend: 'increasing' | 'decreasing' | 'stable'
  }
}

export interface PatternAnalysis {
  patterns: IncidentPattern[]
  overallRisk: 'low' | 'medium' | 'high' | 'critical'
  summary: string
  recommendations: string[]
  confidence: number
}

export interface IncidentData {
  id: string
  timestamp: string
  incident_type: string
  location: string
  priority: string
  callsign_from: string
  callsign_to: string
  assigned_to?: string
  responded_at?: string
  resolved_at?: string
  is_closed: boolean
  occurrence: string
  action_taken: string
  weather_conditions?: string
  crowd_density?: string
}

const PATTERN_DETECTION_SYSTEM = `You are an expert security analyst with advanced pattern recognition capabilities. Analyze incident data to identify concerning patterns, trends, and anomalies.

Focus on:
1. Delayed response patterns (response times > 5 minutes)
2. Crowd density issues (high incident concentration)
3. Repeat problem zones (same locations with multiple incidents)
4. Staff overload situations (too many incidents per staff member)
5. Weather impact patterns (weather-related incident spikes)

Provide specific, actionable insights with confidence levels and clear recommendations.`

const generatePatternAnalysisPrompt = (incidents: IncidentData[]): string => {
  const totalIncidents = incidents.length
  const incidentTypes = incidents.reduce((acc, i) => {
    acc[i.incident_type] = (acc[i.incident_type] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const locations = incidents.reduce((acc, i) => {
    acc[i.location] = (acc[i.location] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const responseTimes = incidents
    .filter(i => i.responded_at && i.timestamp)
    .map(i => new Date(i.responded_at!).getTime() - new Date(i.timestamp).getTime())

  const avgResponseTime = responseTimes.length > 0 
    ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length / 60000
    : 0

  return `Analyze this incident data for concerning patterns:

Total Incidents: ${totalIncidents}
Average Response Time: ${avgResponseTime.toFixed(1)} minutes

Incident Types:
${Object.entries(incidentTypes).map(([type, count]) => `- ${type}: ${count}`).join('\n')}

Top Locations:
${Object.entries(locations)
  .sort(([,a], [,b]) => b - a)
  .slice(0, 10)
  .map(([location, count]) => `- ${location}: ${count} incidents`)
  .join('\n')}

Response Time Analysis:
- Incidents with response > 5min: ${responseTimes.filter(rt => rt > 300000).length}
- Incidents with response > 10min: ${responseTimes.filter(rt => rt > 600000).length}
- Incidents with no response time: ${incidents.filter(i => !i.responded_at).length}

Staff Assignment:
- Incidents with assigned staff: ${incidents.filter(i => i.assigned_to).length}
- Incidents without assignment: ${incidents.filter(i => !i.assigned_to).length}

Weather Conditions:
${incidents.filter(i => i.weather_conditions).length > 0 ? 
  incidents.filter(i => i.weather_conditions).map(i => `- ${i.weather_conditions}`).join('\n') :
  'No weather data available'}

Identify patterns and return as JSON:
{
  "patterns": [
    {
      "type": "delayed_response|crowd_density|repeat_zone|staff_overload|weather_impact",
      "severity": "low|medium|high|critical",
      "confidence": 0-100,
      "description": "Clear description of the pattern",
      "affectedIncidents": ["incident_id1", "incident_id2"],
      "timeframe": "Time period when pattern occurred",
      "recommendation": "Specific action to address this pattern",
      "metrics": {
        "count": 5,
        "percentage": 25,
        "trend": "increasing|decreasing|stable"
      }
    }
  ],
  "overallRisk": "low|medium|high|critical",
  "summary": "Overall assessment of event security patterns",
  "recommendations": ["rec1", "rec2", "rec3"],
  "confidence": 85
}`
}

/**
 * Detect delayed response patterns
 */
export function detectDelayedResponsePatterns(incidents: IncidentData[]): IncidentPattern[] {
  const delayedIncidents = incidents.filter(incident => {
    if (!incident.responded_at || !incident.timestamp) return false
    const responseTime = new Date(incident.responded_at).getTime() - new Date(incident.timestamp).getTime()
    return responseTime > 300000 // 5 minutes
  })

  if (delayedIncidents.length === 0) return []

  const severity = delayedIncidents.length > 10 ? 'critical' : 
                  delayedIncidents.length > 5 ? 'high' : 
                  delayedIncidents.length > 2 ? 'medium' : 'low'

  const avgDelay = delayedIncidents.reduce((sum, incident) => {
    const responseTime = new Date(incident.responded_at!).getTime() - new Date(incident.timestamp).getTime()
    return sum + responseTime
  }, 0) / delayedIncidents.length / 60000

  return [{
    type: 'delayed_response',
    severity,
    confidence: Math.min(95, 60 + (delayedIncidents.length * 3)),
    description: `${delayedIncidents.length} incidents had response times > 5 minutes (avg: ${avgDelay.toFixed(1)}min)`,
    affectedIncidents: delayedIncidents.map(i => i.id),
    timeframe: 'Throughout event',
    recommendation: 'Review staff deployment and communication protocols. Consider additional training on response procedures.',
    metrics: {
      count: delayedIncidents.length,
      percentage: Math.round((delayedIncidents.length / incidents.length) * 100),
      trend: delayedIncidents.length > incidents.length * 0.2 ? 'increasing' : 'stable'
    }
  }]
}

/**
 * Detect crowd density patterns
 */
export function detectCrowdDensityPatterns(incidents: IncidentData[]): IncidentPattern[] {
  const locationCounts = incidents.reduce((acc, incident) => {
    const location = incident.location || 'Unknown'
    acc[location] = (acc[location] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const highDensityLocations = Object.entries(locationCounts)
    .filter(([, count]) => count >= 3)
    .sort(([,a], [,b]) => b - a)

  if (highDensityLocations.length === 0) return []

  return highDensityLocations.map(([location, count]) => {
    const affectedIncidents = incidents.filter(i => (i.location || 'Unknown') === location)
    const severity = count >= 10 ? 'critical' : count >= 5 ? 'high' : 'medium'

    return {
      type: 'crowd_density',
      severity,
      confidence: Math.min(90, 50 + (count * 4)),
      description: `High incident concentration at ${location} (${count} incidents)`,
      affectedIncidents: affectedIncidents.map(i => i.id),
      timeframe: 'Peak incident hours',
      recommendation: `Increase security presence at ${location}. Consider crowd control measures and additional staff deployment.`,
      metrics: {
        count,
        percentage: Math.round((count / incidents.length) * 100),
        trend: 'increasing'
      }
    }
  })
}

/**
 * Detect repeat zone patterns
 */
export function detectRepeatZonePatterns(incidents: IncidentData[]): IncidentPattern[] {
  const zoneCounts = incidents.reduce((acc, incident) => {
    const location = incident.location || 'Unknown'
    acc[location] = (acc[location] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const repeatZones = Object.entries(zoneCounts)
    .filter(([, count]) => count >= 2)
    .sort(([,a], [,b]) => b - a)

  if (repeatZones.length === 0) return []

  return repeatZones.slice(0, 3).map(([location, count]) => {
    const affectedIncidents = incidents.filter(i => (i.location || 'Unknown') === location)
    const incidentTypes = [...new Set(affectedIncidents.map(i => i.incident_type))]
    
    const severity = count >= 5 ? 'high' : count >= 3 ? 'medium' : 'low'

    return {
      type: 'repeat_zone',
      severity,
      confidence: Math.min(85, 40 + (count * 6)),
      description: `Recurring issues at ${location} (${count} incidents, types: ${incidentTypes.join(', ')})`,
      affectedIncidents: affectedIncidents.map(i => i.id),
      timeframe: 'Multiple time periods',
      recommendation: `Conduct security assessment of ${location}. Review layout, lighting, and crowd flow. Consider structural improvements.`,
      metrics: {
        count,
        percentage: Math.round((count / incidents.length) * 100),
        trend: 'stable'
      }
    }
  })
}

/**
 * Detect staff overload patterns
 */
export function detectStaffOverloadPatterns(incidents: IncidentData[]): IncidentPattern[] {
  const staffCounts = incidents.reduce((acc, incident) => {
    const staff = incident.assigned_to || incident.callsign_from || 'Unassigned'
    acc[staff] = (acc[staff] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const overloadedStaff = Object.entries(staffCounts)
    .filter(([, count]) => count >= 5)
    .sort(([,a], [,b]) => b - a)

  if (overloadedStaff.length === 0) return []

  return overloadedStaff.slice(0, 2).map(([staff, count]) => {
    const affectedIncidents = incidents.filter(i => 
      (i.assigned_to || i.callsign_from || 'Unassigned') === staff
    )
    const severity = count >= 15 ? 'critical' : count >= 10 ? 'high' : 'medium'

    return {
      type: 'staff_overload',
      severity,
      confidence: Math.min(90, 50 + (count * 3)),
      description: `${staff} handled ${count} incidents (potential overload)`,
      affectedIncidents: affectedIncidents.map(i => i.id),
      timeframe: 'Throughout event',
      recommendation: `Redistribute workload for ${staff}. Consider additional staff support or shift rotation.`,
      metrics: {
        count,
        percentage: Math.round((count / incidents.length) * 100),
        trend: 'increasing'
      }
    }
  })
}

/**
 * Detect weather impact patterns
 */
export function detectWeatherImpactPatterns(incidents: IncidentData[]): IncidentPattern[] {
  const weatherIncidents = incidents.filter(i => i.weather_conditions)
  
  if (weatherIncidents.length === 0) return []

  const weatherTypes = weatherIncidents.reduce((acc, incident) => {
    const weather = incident.weather_conditions || 'Unknown'
    acc[weather] = (acc[weather] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const significantWeather = Object.entries(weatherTypes)
    .filter(([, count]) => count >= 2)
    .sort(([,a], [,b]) => b - a)

  return significantWeather.map(([weather, count]) => {
    const affectedIncidents = incidents.filter(i => i.weather_conditions === weather)
    const severity = count >= 5 ? 'high' : count >= 3 ? 'medium' : 'low'

    return {
      type: 'weather_impact',
      severity,
      confidence: Math.min(80, 40 + (count * 5)),
      description: `${count} incidents occurred during ${weather} conditions`,
      affectedIncidents: affectedIncidents.map(i => i.id),
      timeframe: 'Weather-affected periods',
      recommendation: `Develop weather-specific protocols for ${weather} conditions. Prepare contingency plans and additional resources.`,
      metrics: {
        count,
        percentage: Math.round((count / incidents.length) * 100),
        trend: 'stable'
      }
    }
  })
}

/**
 * Generate comprehensive pattern analysis using AI
 */
export async function generatePatternAnalysis(
  incidents: IncidentData[],
  provider: 'openai' | 'anthropic' = 'openai'
): Promise<PatternAnalysis> {
  try {
    const model = provider === 'openai' 
      ? openai('gpt-4o-mini')
      : anthropic('claude-3-5-sonnet-20241022')

    const { text } = await generateText({
      model,
      system: PATTERN_DETECTION_SYSTEM,
      prompt: generatePatternAnalysisPrompt(incidents),
      temperature: 0.2,
      maxTokens: 1500
    })

    const cleaned = text.trim().replace(/```json\n?/g, '').replace(/```\n?/g, '')
    const analysis = JSON.parse(cleaned) as PatternAnalysis

    return {
      patterns: analysis.patterns || [],
      overallRisk: analysis.overallRisk || 'low',
      summary: analysis.summary || 'No significant patterns detected',
      recommendations: analysis.recommendations || [],
      confidence: Math.max(0, Math.min(100, analysis.confidence || 50))
    }
  } catch (error) {
    console.error('Pattern analysis error:', error)
    
    // Fallback to rule-based detection
    const ruleBasedPatterns = [
      ...detectDelayedResponsePatterns(incidents),
      ...detectCrowdDensityPatterns(incidents),
      ...detectRepeatZonePatterns(incidents),
      ...detectStaffOverloadPatterns(incidents),
      ...detectWeatherImpactPatterns(incidents)
    ]

    const overallRisk = ruleBasedPatterns.some(p => p.severity === 'critical') ? 'critical' :
                       ruleBasedPatterns.some(p => p.severity === 'high') ? 'high' :
                       ruleBasedPatterns.some(p => p.severity === 'medium') ? 'medium' : 'low'

    return {
      patterns: ruleBasedPatterns,
      overallRisk,
      summary: `Detected ${ruleBasedPatterns.length} patterns using rule-based analysis`,
      recommendations: ruleBasedPatterns.map(p => p.recommendation),
      confidence: 60
    }
  }
}

/**
 * Get pattern confidence color
 */
export function getPatternConfidenceColor(confidence: number): string {
  if (confidence >= 80) return 'text-green-600'
  if (confidence >= 60) return 'text-yellow-600'
  return 'text-red-600'
}

/**
 * Get severity color
 */
export function getSeverityColor(severity: string): string {
  switch (severity) {
    case 'critical': return 'text-red-700 bg-red-100'
    case 'high': return 'text-orange-700 bg-orange-100'
    case 'medium': return 'text-yellow-700 bg-yellow-100'
    case 'low': return 'text-blue-700 bg-blue-100'
    default: return 'text-gray-700 bg-gray-100'
  }
}
