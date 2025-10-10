/**
 * Enhanced AI Summary Generator
 * Provides intelligent insights and executive summaries
 */

export interface EventSummary {
  overview: string
  keyMetrics: {
    totalIncidents: number
    averageResponseTime: number
    qualityScore: number
    complianceRate: number
  }
  trends: {
    incidentVolume: 'increasing' | 'decreasing' | 'stable'
    responseTime: 'improving' | 'declining' | 'stable'
    quality: 'improving' | 'declining' | 'stable'
  }
  highlights: string[]
  concerns: string[]
  recommendations: string[]
  aiInsights: string[]
}

export interface IncidentAnalysis {
  type: string
  count: number
  percentage: number
  averageResponseTime: number
  qualityScore: number
  trend: 'increasing' | 'decreasing' | 'stable'
}

export interface StaffPerformance {
  operatorName: string
  incidentsLogged: number
  averageQuality: number
  responseTime: number
  retrospectiveRate: number
  performance: 'excellent' | 'good' | 'average' | 'needs_improvement'
}

/**
 * Generate comprehensive event summary with AI insights
 */
export function generateEventSummary(
  incidents: any[],
  eventData: any,
  analytics: {
    quality: any
    compliance: any
    performance: any
  }
): EventSummary {
  const totalIncidents = incidents.length
  const averageResponseTime = calculateAverageResponseTime(incidents)
  const qualityScore = analytics.quality?.overallScore || 0
  const complianceRate = analytics.compliance?.overallCompliance || 0

  // Analyze trends
  const trends = analyzeTrends(incidents)
  
  // Generate highlights
  const highlights = generateHighlights(incidents, analytics)
  
  // Identify concerns
  const concerns = identifyConcerns(incidents, analytics)
  
  // Generate recommendations
  const recommendations = generateRecommendations(incidents, analytics, trends)
  
  // AI insights
  const aiInsights = generateAIInsights(incidents, analytics, trends)

  // Generate overview
  const overview = generateOverview(totalIncidents, averageResponseTime, qualityScore, complianceRate, trends)

  return {
    overview,
    keyMetrics: {
      totalIncidents,
      averageResponseTime,
      qualityScore,
      complianceRate
    },
    trends,
    highlights,
    concerns,
    recommendations,
    aiInsights
  }
}

/**
 * Analyze incident patterns and generate insights
 */
export function analyzeIncidentPatterns(incidents: any[]): {
  peakHours: number[]
  commonTypes: IncidentAnalysis[]
  staffPerformance: StaffPerformance[]
  qualityTrends: any[]
} {
  // Analyze peak hours
  const hourlyCounts = new Array(24).fill(0)
  incidents.forEach(incident => {
    const hour = new Date(incident.timestamp).getHours()
    hourlyCounts[hour]++
  })
  const peakHours = hourlyCounts
    .map((count, hour) => ({ hour, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3)
    .map(item => item.hour)

  // Analyze incident types
  const typeAnalysis = analyzeIncidentTypes(incidents)

  // Analyze staff performance
  const staffPerformance = analyzeStaffPerformance(incidents)

  // Analyze quality trends
  const qualityTrends = analyzeQualityTrends(incidents)

  return {
    peakHours,
    commonTypes: typeAnalysis,
    staffPerformance,
    qualityTrends
  }
}

/**
 * Generate predictive insights
 */
export function generatePredictiveInsights(
  incidents: any[],
  currentTime: Date,
  eventEndTime: Date
): {
  projectedTotal: number
  resourceNeeds: string[]
  riskFactors: string[]
  opportunities: string[]
} {
  const timeRemaining = (eventEndTime.getTime() - currentTime.getTime()) / (1000 * 60 * 60) // hours
  const currentRate = incidents.length / ((currentTime.getTime() - new Date(incidents[0]?.timestamp).getTime()) / (1000 * 60 * 60))
  const projectedTotal = Math.round(incidents.length + (currentRate * timeRemaining))

  // Analyze resource needs
  const resourceNeeds = analyzeResourceNeeds(incidents, projectedTotal)
  
  // Identify risk factors
  const riskFactors = identifyRiskFactors(incidents, timeRemaining)
  
  // Find opportunities
  const opportunities = identifyOpportunities(incidents, timeRemaining)

  return {
    projectedTotal,
    resourceNeeds,
    riskFactors,
    opportunities
  }
}

// Helper functions

function calculateAverageResponseTime(incidents: any[]): number {
  const responseTimes = incidents
    .filter(incident => incident.responded_at && incident.timestamp)
    .map(incident => {
      const created = new Date(incident.timestamp).getTime()
      const responded = new Date(incident.responded_at).getTime()
      return (responded - created) / (1000 * 60) // minutes
    })
  
  return responseTimes.length > 0 
    ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length
    : 0
}

function analyzeTrends(incidents: any[]): EventSummary['trends'] {
  if (incidents.length < 10) {
    return {
      incidentVolume: 'stable',
      responseTime: 'stable',
      quality: 'stable'
    }
  }

  // Simple trend analysis - compare first half vs second half
  const midpoint = Math.floor(incidents.length / 2)
  const firstHalf = incidents.slice(0, midpoint)
  const secondHalf = incidents.slice(midpoint)

  // Incident volume trend
  const firstHalfCount = firstHalf.length
  const secondHalfCount = secondHalf.length
  const volumeChange = (secondHalfCount - firstHalfCount) / firstHalfCount
  
  // Response time trend
  const firstHalfResponseTime = calculateAverageResponseTime(firstHalf)
  const secondHalfResponseTime = calculateAverageResponseTime(secondHalf)
  const responseTimeChange = (secondHalfResponseTime - firstHalfResponseTime) / firstHalfResponseTime

  // Quality trend (simplified - would need quality scores)
  const qualityChange = 0 // Placeholder

  return {
    incidentVolume: volumeChange > 0.1 ? 'increasing' : volumeChange < -0.1 ? 'decreasing' : 'stable',
    responseTime: responseTimeChange > 0.1 ? 'declining' : responseTimeChange < -0.1 ? 'improving' : 'stable',
    quality: qualityChange > 0.1 ? 'improving' : qualityChange < -0.1 ? 'declining' : 'stable'
  }
}

function generateHighlights(incidents: any[], analytics: any): string[] {
  const highlights: string[] = []
  
  if (incidents.length > 0) {
    highlights.push(`Successfully managed ${incidents.length} incidents during the event`)
  }
  
  if (analytics.quality?.overallScore > 85) {
    highlights.push(`Excellent log quality score of ${analytics.quality.overallScore.toFixed(1)}/100`)
  }
  
  if (analytics.compliance?.overallCompliance > 95) {
    highlights.push(`Outstanding compliance rate of ${analytics.compliance.overallCompliance.toFixed(1)}%`)
  }
  
  const closedIncidents = incidents.filter(incident => incident.is_closed).length
  if (closedIncidents / incidents.length > 0.9) {
    highlights.push(`${closedIncidents}/${incidents.length} incidents successfully resolved`)
  }
  
  return highlights
}

function identifyConcerns(incidents: any[], analytics: any): string[] {
  const concerns: string[] = []
  
  if (analytics.quality?.overallScore < 70) {
    concerns.push(`Log quality score of ${analytics.quality.overallScore.toFixed(1)}/100 indicates room for improvement`)
  }
  
  if (analytics.compliance?.overallCompliance < 90) {
    concerns.push(`Compliance rate of ${analytics.compliance.overallCompliance.toFixed(1)}% needs attention`)
  }
  
  const highPriorityIncidents = incidents.filter(incident => incident.priority === 'high' || incident.priority === 'critical').length
  if (highPriorityIncidents / incidents.length > 0.3) {
    concerns.push(`High proportion of high-priority incidents (${highPriorityIncidents}/${incidents.length})`)
  }
  
  const retrospectiveEntries = incidents.filter(incident => incident.entry_type === 'retrospective').length
  if (retrospectiveEntries / incidents.length > 0.2) {
    concerns.push(`${retrospectiveEntries} retrospective entries suggest timing issues`)
  }
  
  return concerns
}

function generateRecommendations(incidents: any[], analytics: any, trends: any): string[] {
  const recommendations: string[] = []
  
  if (analytics.quality?.overallScore < 80) {
    recommendations.push('Implement additional training on structured logging templates')
  }
  
  if (trends.responseTime === 'declining') {
    recommendations.push('Review staff allocation and response procedures to improve response times')
  }
  
  if (trends.incidentVolume === 'increasing') {
    recommendations.push('Consider deploying additional staff for future events of similar scale')
  }
  
  const medicalIncidents = incidents.filter(incident => 
    incident.incident_type?.toLowerCase().includes('medical') ||
    incident.incident_type?.toLowerCase().includes('injury')
  ).length
  
  if (medicalIncidents > incidents.length * 0.2) {
    recommendations.push('Consider increasing medical staff presence for future events')
  }
  
  return recommendations
}

function generateAIInsights(incidents: any[], analytics: any, trends: any): string[] {
  const insights: string[] = []
  
  // Pattern analysis
  const hourlyPattern = analyzeHourlyPattern(incidents)
  if (hourlyPattern.peakHour) {
    insights.push(`Peak incident activity occurred at ${hourlyPattern.peakHour}:00, suggesting optimal resource deployment timing`)
  }
  
  // Quality correlation
  if (analytics.quality?.overallScore > 85 && analytics.compliance?.overallCompliance > 95) {
    insights.push('Strong correlation between log quality and compliance suggests effective training and procedures')
  }
  
  // Trend insights
  if (trends.incidentVolume === 'decreasing' && trends.responseTime === 'improving') {
    insights.push('Improving trends in both incident volume and response time indicate effective operational management')
  }
  
  // Staff insights
  const staffCount = new Set(incidents.map(incident => incident.logged_by_callsign)).size
  const avgIncidentsPerStaff = incidents.length / staffCount
  if (avgIncidentsPerStaff > 10) {
    insights.push(`High workload per operator (${avgIncidentsPerStaff.toFixed(1)} incidents) suggests potential for additional staffing`)
  }
  
  return insights
}

function generateOverview(
  totalIncidents: number,
  averageResponseTime: number,
  qualityScore: number,
  complianceRate: number,
  trends: any
): string {
  let overview = `Event management summary: ${totalIncidents} incidents handled with ${averageResponseTime.toFixed(1)} minute average response time. `
  
  if (qualityScore > 85) {
    overview += `Excellent log quality (${qualityScore.toFixed(1)}/100) and compliance (${complianceRate.toFixed(1)}%) demonstrate professional standards. `
  } else if (qualityScore > 70) {
    overview += `Good log quality (${qualityScore.toFixed(1)}/100) and compliance (${complianceRate.toFixed(1)}%) with room for improvement. `
  } else {
    overview += `Log quality (${qualityScore.toFixed(1)}/100) and compliance (${complianceRate.toFixed(1)}%) require attention. `
  }
  
  if (trends.incidentVolume === 'decreasing') {
    overview += 'Incident volume decreased over time, indicating effective crowd management.'
  } else if (trends.incidentVolume === 'increasing') {
    overview += 'Incident volume increased over time, suggesting escalating operational demands.'
  }
  
  return overview
}

function analyzeIncidentTypes(incidents: any[]): IncidentAnalysis[] {
  const typeCounts: Record<string, number> = {}
  
  incidents.forEach(incident => {
    const type = incident.incident_type || 'Unknown'
    typeCounts[type] = (typeCounts[type] || 0) + 1
  })
  
  return Object.entries(typeCounts)
    .map(([type, count]) => ({
      type,
      count,
      percentage: (count / incidents.length) * 100,
      averageResponseTime: calculateAverageResponseTime(incidents.filter(i => i.incident_type === type)),
      qualityScore: 75 + Math.random() * 20, // Placeholder
      trend: 'stable' as const // Placeholder
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
}

function analyzeStaffPerformance(incidents: any[]): StaffPerformance[] {
  const staffStats: Record<string, any> = {}
  
  incidents.forEach(incident => {
    const staff = incident.logged_by_callsign || 'Unknown'
    if (!staffStats[staff]) {
      staffStats[staff] = {
        incidents: 0,
        responseTimes: [],
        retrospectiveEntries: 0
      }
    }
    
    staffStats[staff].incidents++
    if (incident.entry_type === 'retrospective') {
      staffStats[staff].retrospectiveEntries++
    }
  })
  
  return Object.entries(staffStats).map(([operatorName, stats]) => {
    const retrospectiveRate = (stats.retrospectiveEntries / stats.incidents) * 100
    const averageQuality = 75 + Math.random() * 20 // Placeholder
    const responseTime = 5 + Math.random() * 15 // Placeholder
    
    let performance: StaffPerformance['performance'] = 'average'
    if (averageQuality > 90 && retrospectiveRate < 10) performance = 'excellent'
    else if (averageQuality > 80 && retrospectiveRate < 20) performance = 'good'
    else if (averageQuality < 60 || retrospectiveRate > 30) performance = 'needs_improvement'
    
    return {
      operatorName,
      incidentsLogged: stats.incidents,
      averageQuality,
      responseTime,
      retrospectiveRate,
      performance
    }
  }).sort((a, b) => b.incidentsLogged - a.incidentsLogged)
}

function analyzeQualityTrends(incidents: any[]): any[] {
  // Simplified quality trend analysis
  return incidents.slice(-10).map((incident, index) => ({
    timestamp: incident.timestamp,
    quality: 75 + Math.random() * 20 // Placeholder
  }))
}

function analyzeResourceNeeds(incidents: any[], projectedTotal: number): string[] {
  const needs: string[] = []
  
  if (projectedTotal > incidents.length * 1.5) {
    needs.push('Additional staff deployment recommended for remaining event duration')
  }
  
  const medicalIncidents = incidents.filter(incident => 
    incident.incident_type?.toLowerCase().includes('medical')
  ).length
  
  if (medicalIncidents > incidents.length * 0.2) {
    needs.push('Consider additional medical resources')
  }
  
  return needs
}

function identifyRiskFactors(incidents: any[], timeRemaining: number): string[] {
  const risks: string[] = []
  
  if (timeRemaining > 4 && incidents.length / timeRemaining > 5) {
    risks.push('High incident rate may lead to staff fatigue')
  }
  
  const unresolvedIncidents = incidents.filter(incident => !incident.is_closed).length
  if (unresolvedIncidents > incidents.length * 0.3) {
    risks.push('High number of unresolved incidents may impact response capacity')
  }
  
  return risks
}

function identifyOpportunities(incidents: any[], timeRemaining: number): string[] {
  const opportunities: string[] = []
  
  if (incidents.length / timeRemaining < 2 && timeRemaining > 2) {
    opportunities.push('Low incident rate allows for proactive crowd management')
  }
  
  const highQualityIncidents = incidents.filter(incident => 
    incident.entry_type === 'contemporaneous' && !incident.is_amended
  ).length
  
  if (highQualityIncidents > incidents.length * 0.8) {
    opportunities.push('High log quality provides excellent training data for future events')
  }
  
  return opportunities
}

function analyzeHourlyPattern(incidents: any[]): { peakHour: number | null; pattern: string } {
  const hourlyCounts = new Array(24).fill(0)
  
  incidents.forEach(incident => {
    const hour = new Date(incident.timestamp).getHours()
    hourlyCounts[hour]++
  })
  
  const peakHour = hourlyCounts.indexOf(Math.max(...hourlyCounts))
  const pattern = peakHour >= 18 ? 'evening' : peakHour >= 12 ? 'afternoon' : 'morning'
  
  return { peakHour, pattern }
}
