/**
 * Operational Readiness Calculation Engine
 * Feature 1: Real-Time Operational Readiness Index
 * 
 * Calculates operational readiness scores based on multiple factors:
 * - Staffing (25%): Staff on post vs planned
 * - Incident Pressure (25%): Current incident load
 * - Weather (15%): Current conditions and forecasts
 * - Transport (10%): Ingress/egress status
 * - Assets (10%): Infrastructure operational status
 * - Crowd Density (15%): Current occupancy vs capacity
 */

import type { Database } from '@/types/supabase'
import type { SupabaseClient } from '@supabase/supabase-js'

export interface ReadinessComponentScore {
  score: number // 0-100
  details: Record<string, any>
  factors: Array<{ factor: string; impact: number; description: string }>
}

export interface ReadinessScore {
  overall_score: number // 0-100
  component_scores: {
    staffing: ReadinessComponentScore
    incident_pressure: ReadinessComponentScore
    weather: ReadinessComponentScore
    transport: ReadinessComponentScore
    assets: ReadinessComponentScore
    crowd_density: ReadinessComponentScore
  }
  trend: 'improving' | 'stable' | 'declining'
  alerts: Array<{ type: string; message: string; severity: 'low' | 'medium' | 'high' }>
  calculated_at: string
}

// Component weights for overall score calculation
const COMPONENT_WEIGHTS = {
  staffing: 0.25,
  incident_pressure: 0.25,
  weather: 0.15,
  transport: 0.10,
  assets: 0.10,
  crowd_density: 0.15,
}

export class ReadinessEngine {
  private eventId: string
  private companyId: string
  private supabase: SupabaseClient<Database>

  constructor(eventId: string, companyId: string, supabaseClient: SupabaseClient<Database>) {
    this.eventId = eventId
    this.companyId = companyId
    this.supabase = supabaseClient
  }

  /**
   * Calculate overall operational readiness score
   */
  async calculateOverallReadiness(): Promise<ReadinessScore> {
    // Fetch all component data in parallel
    const [
      staffingScore,
      incidentPressureScore,
      weatherScore,
      transportScore,
      assetScore,
      crowdDensityScore,
      previousScore,
    ] = await Promise.all([
      this.calculateStaffingScore(),
      this.calculateIncidentPressureScore(),
      this.calculateWeatherScore(),
      this.calculateTransportScore(),
      this.calculateAssetStatusScore(),
      this.calculateCrowdDensityScore(),
      this.getPreviousScore(),
    ])

    // Calculate weighted overall score
    const overall_score = Math.round(
      staffingScore.score * COMPONENT_WEIGHTS.staffing +
        incidentPressureScore.score * COMPONENT_WEIGHTS.incident_pressure +
        weatherScore.score * COMPONENT_WEIGHTS.weather +
        transportScore.score * COMPONENT_WEIGHTS.transport +
        assetScore.score * COMPONENT_WEIGHTS.assets +
        crowdDensityScore.score * COMPONENT_WEIGHTS.crowd_density
    )

    // Determine trend
    const trend = this.calculateTrend(overall_score, previousScore)

    // Generate alerts
    const alerts = this.generateAlerts({
      overall_score,
      staffingScore,
      incidentPressureScore,
      weatherScore,
      transportScore,
      assetScore,
      crowdDensityScore,
    })

    return {
      overall_score,
      component_scores: {
        staffing: staffingScore,
        incident_pressure: incidentPressureScore,
        weather: weatherScore,
        transport: transportScore,
        assets: assetScore,
        crowd_density: crowdDensityScore,
      },
      trend,
      alerts,
      calculated_at: new Date().toISOString(),
    }
  }

  /**
   * Calculate staffing component score (0-100)
   * Based on: Staff on post vs planned, competency match, coverage gaps
   */
  async calculateStaffingScore(): Promise<ReadinessComponentScore> {
    try {
      // Get event details
      const { data: event } = await this.supabase
        .from('events')
        .select('id, expected_staff_count, venue_capacity')
        .eq('id', this.eventId)
        .single()

      // Get staff assignments for this event
      const { data: assignments } = await this.supabase
        .from('callsign_assignments')
        .select('staff_id, callsign, position_name, department')
        .eq('event_id', this.eventId)

      // Get total staff count (from profiles with company_id)
      const { count: totalStaff } = await this.supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', this.companyId)

      const staffOnPost = assignments?.length || 0
      const plannedStaff = event?.expected_staff_count || totalStaff || 1
      const coverageRatio = Math.min(staffOnPost / plannedStaff, 1.2) // Cap at 120% to avoid over-staffing bonus

      // Base score from coverage ratio (0-80 points)
      let score = Math.round(coverageRatio * 80)

      // Bonus for adequate coverage (10 points if >= 90%)
      if (coverageRatio >= 0.9) {
        score = Math.min(score + 10, 100)
      }

      // Penalty for critical gaps (deduct up to 20 points)
      const criticalGaps = this.identifyCriticalGaps(assignments || [])
      score = Math.max(score - criticalGaps * 5, 0)

      const factors = [
        {
          factor: 'Coverage Ratio',
          impact: coverageRatio >= 0.9 ? 10 : coverageRatio >= 0.7 ? 0 : -20,
          description: `${staffOnPost} on post vs ${plannedStaff} planned (${Math.round(coverageRatio * 100)}%)`,
        },
        {
          factor: 'Critical Gaps',
          impact: -criticalGaps * 5,
          description: criticalGaps > 0 ? `${criticalGaps} critical position(s) unfilled` : 'All critical positions filled',
        },
      ]

      return {
        score: Math.max(0, Math.min(100, score)),
        details: {
          staff_on_post: staffOnPost,
          planned_staff: plannedStaff,
          coverage_ratio: coverageRatio,
          critical_gaps: criticalGaps,
          assignments: assignments?.length || 0,
        },
        factors,
      }
    } catch (error) {
      console.error('Error calculating staffing score:', error)
      return {
        score: 50, // Default neutral score on error
        details: { error: 'Unable to calculate staffing score' },
        factors: [],
      }
    }
  }

  /**
   * Calculate incident pressure component score (0-100)
   * Based on: Open incidents, response times, escalation levels, incident rate
   */
  async calculateIncidentPressureScore(): Promise<ReadinessComponentScore> {
    try {
      const now = new Date()
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)

      // Get open incidents
      const { data: openIncidents } = await this.supabase
        .from('incident_logs')
        .select('id, incident_type, priority, timestamp, is_closed')
        .eq('event_id', this.eventId)
        .eq('is_closed', false)

      // Get incidents from last hour
      const { data: recentIncidents } = await this.supabase
        .from('incident_logs')
        .select('id, incident_type, priority, timestamp')
        .eq('event_id', this.eventId)
        .gte('timestamp', oneHourAgo.toISOString())

      const openCount = openIncidents?.length || 0
      const recentCount = recentIncidents?.length || 0

      // Count high-priority incidents
      const highPriorityCount =
        openIncidents?.filter((inc: any) => {
          const priority = (inc.priority || '').toLowerCase()
          return priority === 'urgent' || priority === 'high'
        }).length || 0

      // Calculate base score (fewer incidents = higher score)
      // 0 incidents = 100, 10+ incidents = 0 (linear scale)
      let score = Math.max(0, 100 - openCount * 10)

      // Penalty for high-priority incidents (more severe)
      score = Math.max(0, score - highPriorityCount * 15)

      // Penalty for high incident rate (recent incidents)
      if (recentCount > 5) {
        score = Math.max(0, score - 20)
      } else if (recentCount > 3) {
        score = Math.max(0, score - 10)
      }

      const factors = [
        {
          factor: 'Open Incidents',
          impact: -openCount * 10,
          description: `${openCount} open incident(s)`,
        },
        {
          factor: 'High Priority',
          impact: -highPriorityCount * 15,
          description: `${highPriorityCount} high-priority incident(s)`,
        },
        {
          factor: 'Recent Activity',
          impact: recentCount > 5 ? -20 : recentCount > 3 ? -10 : 0,
          description: `${recentCount} incident(s) in last hour`,
        },
      ]

      return {
        score: Math.max(0, Math.min(100, score)),
        details: {
          open_incidents: openCount,
          high_priority_incidents: highPriorityCount,
          recent_incidents: recentCount,
          incident_rate_per_hour: recentCount,
        },
        factors,
      }
    } catch (error) {
      console.error('Error calculating incident pressure score:', error)
      return {
        score: 75, // Default good score on error
        details: { error: 'Unable to calculate incident pressure score' },
        factors: [],
      }
    }
  }

  /**
   * Calculate weather component score (0-100)
   * Based on: Current conditions, forecasts, alerts
   */
  async calculateWeatherScore(): Promise<ReadinessComponentScore> {
    try {
      // Get event details for location
      const { data: event } = await this.supabase
        .from('events')
        .select('venue_address, event_date')
        .eq('id', this.eventId)
        .single()

      if (!event?.venue_address) {
        return {
          score: 75, // Default neutral score
          details: { note: 'No venue address available' },
          factors: [],
        }
      }

      // Try to get weather data from weather_logs or weather API
      // For now, return a default score - will be enhanced with actual weather integration
      const factors = [
        {
          factor: 'Weather Conditions',
          impact: 0,
          description: 'Weather monitoring not yet integrated',
        },
      ]

      return {
        score: 75, // Default neutral score until weather integration
        details: {
          note: 'Weather integration pending',
          venue_address: event.venue_address,
        },
        factors,
      }
    } catch (error) {
      console.error('Error calculating weather score:', error)
      return {
        score: 75,
        details: { error: 'Unable to calculate weather score' },
        factors: [],
      }
    }
  }

  /**
   * Calculate transport component score (0-100)
   * Based on: Ingress/egress flow, delays, capacity
   */
  async calculateTransportScore(): Promise<ReadinessComponentScore> {
    try {
      // Transport monitoring not yet implemented
      // Return default score for now
      return {
        score: 75, // Default neutral score
        details: {
          note: 'Transport monitoring not yet integrated',
        },
        factors: [
          {
            factor: 'Transport Status',
            impact: 0,
            description: 'Transport monitoring pending integration',
          },
        ],
      }
    } catch (error) {
      console.error('Error calculating transport score:', error)
      return {
        score: 75,
        details: { error: 'Unable to calculate transport score' },
        factors: [],
      }
    }
  }

  /**
   * Calculate asset status component score (0-100)
   * Based on: Infrastructure operational status
   */
  async calculateAssetStatusScore(): Promise<ReadinessComponentScore> {
    try {
      // Asset management not yet implemented
      // Return default score for now
      return {
        score: 85, // Default good score (assuming assets operational)
        details: {
          note: 'Asset management not yet integrated',
        },
        factors: [
          {
            factor: 'Asset Status',
            impact: 0,
            description: 'Asset monitoring pending integration',
          },
        ],
      }
    } catch (error) {
      console.error('Error calculating asset status score:', error)
      return {
        score: 85,
        details: { error: 'Unable to calculate asset status score' },
        factors: [],
      }
    }
  }

  /**
   * Calculate crowd density component score (0-100)
   * Based on: Current occupancy vs capacity, flow patterns
   */
  async calculateCrowdDensityScore(): Promise<ReadinessComponentScore> {
    try {
      // Get event capacity
      const { data: event } = await this.supabase
        .from('events')
        .select('venue_capacity, expected_attendance')
        .eq('id', this.eventId)
        .single()

      const capacity = event?.venue_capacity || event?.expected_attendance || 10000

      // Get current attendance (from attendance_logs or venue_occupancy)
      const { data: attendanceLogs } = await this.supabase
        .from('attendance_logs')
        .select('current_count')
        .eq('event_id', this.eventId)
        .order('timestamp', { ascending: false })
        .limit(1)
        .single()

      const currentCount = attendanceLogs?.current_count || 0
      const occupancyRatio = capacity > 0 ? currentCount / capacity : 0

      // Score calculation:
      // 0-60% occupancy = 100 (comfortable)
      // 60-80% = 80 (good)
      // 80-90% = 60 (moderate)
      // 90-100% = 40 (high)
      // >100% = 0 (over capacity)
      let score = 100
      if (occupancyRatio > 1.0) {
        score = 0
      } else if (occupancyRatio > 0.9) {
        score = 40
      } else if (occupancyRatio > 0.8) {
        score = 60
      } else if (occupancyRatio > 0.6) {
        score = 80
      }

      const factors = [
        {
          factor: 'Occupancy Ratio',
          impact: occupancyRatio > 0.9 ? -60 : occupancyRatio > 0.8 ? -40 : occupancyRatio > 0.6 ? -20 : 0,
          description: `${currentCount} / ${capacity} (${Math.round(occupancyRatio * 100)}%)`,
        },
      ]

      return {
        score: Math.max(0, Math.min(100, score)),
        details: {
          current_count: currentCount,
          capacity: capacity,
          occupancy_ratio: occupancyRatio,
          occupancy_percentage: Math.round(occupancyRatio * 100),
        },
        factors,
      }
    } catch (error) {
      console.error('Error calculating crowd density score:', error)
      return {
        score: 75,
        details: { error: 'Unable to calculate crowd density score' },
        factors: [],
      }
    }
  }

  /**
   * Get previous readiness score for trend calculation
   */
  private async getPreviousScore(): Promise<number | null> {
    try {
      const { data } = await this.supabase
        .from('operational_readiness')
        .select('overall_score')
        .eq('event_id', this.eventId)
        .order('timestamp', { ascending: false })
        .limit(1)
        .single()

      return data?.overall_score || null
    } catch {
      return null
    }
  }

  /**
   * Calculate trend based on current vs previous score
   */
  private calculateTrend(currentScore: number, previousScore: number | null): 'improving' | 'stable' | 'declining' {
    if (!previousScore) return 'stable'
    const diff = currentScore - previousScore
    if (diff > 5) return 'improving'
    if (diff < -5) return 'declining'
    return 'stable'
  }

  /**
   * Identify critical staffing gaps
   */
  private identifyCriticalGaps(assignments: any[]): number {
    // Critical positions that must be filled (can be configurable)
    const criticalPositions = ['Control', 'Medical Lead', 'Security Lead', 'Operations']
    const filledPositions = assignments.map((a: any) => a.position_name || a.callsign).filter(Boolean)
    const gaps = criticalPositions.filter((pos) => !filledPositions.some((filled) => filled.includes(pos)))
    return gaps.length
  }

  /**
   * Generate alerts based on scores
   */
  private generateAlerts(scores: {
    overall_score: number
    staffingScore: ReadinessComponentScore
    incidentPressureScore: ReadinessComponentScore
    weatherScore: ReadinessComponentScore
    transportScore: ReadinessComponentScore
    assetScore: ReadinessComponentScore
    crowdDensityScore: ReadinessComponentScore
  }): Array<{ type: string; message: string; severity: 'low' | 'medium' | 'high' }> {
    const alerts: Array<{ type: string; message: string; severity: 'low' | 'medium' | 'high' }> = []

    // Overall score alerts
    if (scores.overall_score < 50) {
      alerts.push({
        type: 'overall',
        message: 'Operational readiness is critically low',
        severity: 'high',
      })
    } else if (scores.overall_score < 60) {
      alerts.push({
        type: 'overall',
        message: 'Operational readiness is below optimal',
        severity: 'medium',
      })
    }

    // Component-specific alerts
    if (scores.staffingScore.score < 70) {
      alerts.push({
        type: 'staffing',
        message: `Staffing coverage is low (${scores.staffingScore.score}%)`,
        severity: scores.staffingScore.score < 50 ? 'high' : 'medium',
      })
    }

    if (scores.incidentPressureScore.score < 60) {
      alerts.push({
        type: 'incidents',
        message: `High incident pressure (${scores.incidentPressureScore.details.open_incidents} open incidents)`,
        severity: scores.incidentPressureScore.score < 40 ? 'high' : 'medium',
      })
    }

    if (scores.crowdDensityScore.details.occupancy_percentage > 90) {
      alerts.push({
        type: 'crowd',
        message: `Venue approaching capacity (${scores.crowdDensityScore.details.occupancy_percentage}%)`,
        severity: scores.crowdDensityScore.details.occupancy_percentage > 95 ? 'high' : 'medium',
      })
    }

    return alerts
  }
}

