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
import type { StaffingDiscipline } from '@/lib/database/staffing'
import { resolveDisciplines } from '@/lib/staffing/discipline'

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
  private supabase: SupabaseClient<any>

  constructor(eventId: string, companyId: string, supabaseClient: SupabaseClient<Database>) {
    this.eventId = eventId
    this.companyId = companyId
    this.supabase = supabaseClient as SupabaseClient<any>
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
      const { data: event } = await this.supabase
        .from('events')
        .select('id, event_type, expected_staff_count, venue_capacity')
        .eq('id', this.eventId)
        .single()

      const { data: staffingRoles } = await this.supabase
        .from('staffing_roles')
        .select('id, planned_count, discipline')
        .eq('company_id', this.companyId)
        .eq('event_id', this.eventId)

      const { data: staffingActuals } = await this.supabase
        .from('staffing_actuals')
        .select('role_id, actual_count')
        .eq('company_id', this.companyId)
        .eq('event_id', this.eventId)

      const actualMap = new Map(
        (staffingActuals ?? []).map((record) => [record.role_id, record.actual_count ?? 0])
      )

      const plannedFromRoles = staffingRoles?.reduce((sum, role) => sum + (role.planned_count || 0), 0) ?? 0
      const actualFromRoles =
        staffingRoles?.reduce((sum, role) => sum + (actualMap.get(role.id) ?? 0), 0) ?? 0

      const requiredDisciplines: StaffingDiscipline[] = resolveDisciplines(event?.event_type)

      const disciplineBreakdown = staffingRoles?.reduce<Record<string, { planned: number; actual: number }>>(
        (acc, role) => {
          const discipline = (role.discipline as StaffingDiscipline) || 'security'
          const entry = acc[discipline] ?? { planned: 0, actual: 0 }
          entry.planned += role.planned_count || 0
          entry.actual += actualMap.get(role.id) ?? 0
          acc[discipline] = entry
          return acc
        },
        {}
      ) ?? {}

      requiredDisciplines.forEach((discipline) => {
        if (!disciplineBreakdown[discipline]) {
          disciplineBreakdown[discipline] = { planned: 0, actual: 0 }
        }
      })

      let staffOnPost = actualFromRoles
      let plannedStaff = plannedFromRoles

      if (plannedStaff === 0) {
        const { data: assignments } = await this.supabase
          .from('callsign_assignments')
          .select('staff_id')
          .eq('event_id', this.eventId)

        const { count: totalStaff } = await this.supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('company_id', this.companyId)

        staffOnPost = assignments?.length || 0
        plannedStaff = event?.expected_staff_count || totalStaff || 1
      }

      const coverageRatioRaw = plannedStaff > 0 ? staffOnPost / plannedStaff : 1
      const coverageRatio = Math.max(0, coverageRatioRaw)
      const cappedCoverageRatio = Math.min(coverageRatio, 1)
      const surplusBonus = coverageRatio > 1 ? Math.min(Math.round((coverageRatio - 1) * 50), 5) : 0

      const disciplineGaps = requiredDisciplines.reduce((count, discipline) => {
        const stats = disciplineBreakdown[discipline]
        if (!stats || stats.planned === 0) {
          return count
        }
        return stats.actual < stats.planned ? count + 1 : count
      }, 0)

      let score = Math.round(cappedCoverageRatio * 100)
      score = Math.min(score + surplusBonus, 105)
      score = Math.max(score - disciplineGaps * 5, 0)
      score = Math.min(score, 100)

      const factors = [
        {
          factor: 'Coverage Ratio',
          impact:
            coverageRatio >= 1
              ? 0
              : -Math.round((1 - coverageRatio) * 100),
          description: `${staffOnPost} on post vs ${plannedStaff} planned (${Math.round(coverageRatio * 100)}%)`,
        },
        ...(surplusBonus > 0
          ? [
              {
                factor: 'Surplus Coverage',
                impact: surplusBonus,
                description: `Bonus applied for ${Math.round((coverageRatio - 1) * 100)}% over target`,
              },
            ]
          : []),
        {
          factor: 'Discipline Shortfalls',
          impact: -disciplineGaps * 5,
          description:
            disciplineGaps > 0
              ? `${disciplineGaps} discipline(s) under target`
              : 'All tracked disciplines at target',
        },
      ]

      return {
        score: Math.max(0, Math.min(100, score)),
        details: {
          staff_on_post: staffOnPost,
          planned_staff: plannedStaff,
          coverage_ratio: coverageRatio,
          coverage_bonus: surplusBonus,
          critical_gaps: disciplineGaps,
          disciplines: disciplineBreakdown,
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
        .select('venue_capacity, expected_attendance, event_type')
        .eq('id', this.eventId)
        .single()

      let capacity = event?.venue_capacity || event?.expected_attendance || 10000
      let currentCount = 0
      let source = 'attendance_logs'

      const isFootball = (event?.event_type || '').toLowerCase().includes('football')

      if (isFootball) {
        const [{ data: stands }, { data: occupancy }] = await Promise.all([
          this.supabase
            .from('stands')
            .select('id, capacity')
            .eq('company_id', this.companyId)
            .eq('event_id', this.eventId),
          this.supabase
            .from('stand_occupancy')
            .select('stand_id, current_occupancy')
            .eq('company_id', this.companyId)
            .eq('event_id', this.eventId),
        ])

        if (stands && stands.length > 0) {
          const occupancyMap = new Map(
            (occupancy ?? []).map((record) => [record.stand_id, record.current_occupancy ?? 0])
          )
          currentCount = stands.reduce((sum, stand) => sum + (occupancyMap.get(stand.id) ?? 0), 0)
          const derivedCapacity = stands.reduce((sum, stand) => sum + (stand.capacity ?? 0), 0)
          if (!event?.venue_capacity && derivedCapacity > 0) {
            capacity = derivedCapacity
          }
          source = 'stand_occupancy'
        }
      }

      if (!currentCount) {
        const { data: attendanceRecord } = await this.supabase
          .from('attendance_records')
          .select('occupied_seats')
          .eq('event_id', this.eventId)
          .order('timestamp', { ascending: false })
          .limit(1)
          .single()

        if (attendanceRecord) {
          currentCount = attendanceRecord.occupied_seats || 0
          source = 'attendance_records'
        }
      }

      if (!currentCount) {
        const { data: venueOccupancy } = await this.supabase
          .from('venue_occupancy')
          .select('current_occupancy')
          .eq('event_id', this.eventId)
          .order('captured_at', { ascending: false })
          .limit(1)
          .single()

        if (venueOccupancy) {
          currentCount = venueOccupancy.current_occupancy || 0
          source = 'venue_occupancy'
        }
      }

      const occupancyRatio = capacity > 0 ? currentCount / capacity : 0
      const occupancyPercentage = Math.round(occupancyRatio * 100)
      const metricLabel = isFootball ? 'Crowd Attendance' : 'Crowd Density'
      const metricDescription = isFootball
        ? 'Ticketed attendance vs. seating capacity'
        : 'Live occupancy vs. venue capacity'

      let score = 100
      let impact = 0

      if (isFootball) {
        if (occupancyRatio > 1.05) {
          score = 40
          impact = -60
        } else if (occupancyRatio > 1) {
          score = 60
          impact = -40
        } else if (occupancyRatio >= 0.95) {
          score = 100
          impact = 0
        } else if (occupancyRatio >= 0.85) {
          score = 85
          impact = -10
        } else {
          score = 75
          impact = -20
        }
      } else {
        if (occupancyRatio > 1.2) {
          score = 30
          impact = -70
        } else if (occupancyRatio > 1.05) {
          score = 50
          impact = -50
        } else if (occupancyRatio > 0.95) {
          score = 65
          impact = -35
        } else if (occupancyRatio > 0.85) {
          score = 80
          impact = -20
        } else if (occupancyRatio < 0.3) {
          score = 75
          impact = -25
        }
      }

      const factors = [
        {
          factor: metricLabel,
          impact,
          description: `${currentCount.toLocaleString()} / ${capacity.toLocaleString()} (${occupancyPercentage}%)`,
        },
      ]

      return {
        score: Math.max(0, Math.min(100, score)),
        details: {
          current_count: currentCount,
          capacity,
          occupancy_ratio: occupancyRatio,
          occupancy_percentage: occupancyPercentage,
          data_source: source,
          metric_label: metricLabel,
          metric_description: metricDescription,
          is_football: isFootball,
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

    const crowdDetails = scores.crowdDensityScore.details || {}
    const crowdLabel = crowdDetails.metric_label || 'Crowd Density'
    const crowdWarnThreshold = crowdDetails.is_football ? 95 : 90
    const crowdCriticalThreshold = crowdDetails.is_football ? 100 : 95

    if (crowdDetails.occupancy_percentage > crowdCriticalThreshold) {
      alerts.push({
        type: 'crowd',
        message: `${crowdLabel} exceeds capacity (${crowdDetails.occupancy_percentage}%)`,
        severity: 'high',
      })
    } else if (crowdDetails.occupancy_percentage > crowdWarnThreshold) {
      alerts.push({
        type: 'crowd',
        message: `${crowdLabel} approaching capacity (${crowdDetails.occupancy_percentage}%)`,
        severity: 'medium',
      })
    }

    return alerts
  }
}

