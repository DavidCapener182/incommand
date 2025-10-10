/**
 * Predictive Staffing AI
 * ML-powered resource allocation and staffing recommendations
 */

export interface StaffingRecommendation {
  timeSlot: string
  recommendedStaff: number
  currentStaff: number
  gap: number
  confidence: number
  rationale: string[]
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  adjustments: StaffAdjustment[]
}

export interface StaffAdjustment {
  role: string
  currentCount: number
  recommendedCount: number
  reason: string
  priority: 'high' | 'medium' | 'low'
}

export interface PredictiveStaffingOptions {
  eventId: string
  eventType: string
  expectedAttendance: number
  duration: number // hours
  historicalData?: StaffingHistory[]
  constraints?: StaffingConstraints
}

export interface StaffingHistory {
  date: string
  attendance: number
  staffCount: number
  incidentCount: number
  incidentTypes: Record<string, number>
  responseTime: number
  utilizationRate: number
}

export interface StaffingConstraints {
  minStaffPerArea?: number
  maxStaffPerArea?: number
  budgetLimit?: number
  availableStaff?: number
  requiredRoles?: string[]
}

export interface StaffingForecast {
  recommendations: StaffingRecommendation[]
  totalStaffNeeded: number
  peakDemandTime: string
  estimatedCost: number
  riskAssessment: RiskAssessment
  optimization: OptimizationSuggestions
}

export interface RiskAssessment {
  overall: 'low' | 'medium' | 'high' | 'critical'
  factors: RiskFactor[]
  mitigations: string[]
}

export interface RiskFactor {
  factor: string
  impact: 'low' | 'medium' | 'high'
  probability: number
  description: string
}

export interface OptimizationSuggestions {
  shifts: ShiftOptimization[]
  roleDistribution: RoleDistribution[]
  costSavings: number
  efficiencyGain: number
}

export interface ShiftOptimization {
  shiftName: string
  startTime: string
  endTime: string
  staffCount: number
  rationale: string
}

export interface RoleDistribution {
  role: string
  count: number
  percentage: number
  areas: string[]
}

export class PredictiveStaffing {
  /**
   * Generate staffing forecast
   */
  generateForecast(options: PredictiveStaffingOptions): StaffingForecast {
    const {
      eventType,
      expectedAttendance,
      duration,
      historicalData = [],
      constraints = {}
    } = options

    // Calculate base staffing need
    const baseStaffingRatio = this.getBaseStaffingRatio(eventType)
    const baseStaffNeeded = Math.ceil(expectedAttendance / baseStaffingRatio)

    // Generate hourly recommendations
    const recommendations = this.generateHourlyRecommendations(
      baseStaffNeeded,
      duration,
      expectedAttendance,
      historicalData
    )

    // Calculate total staff needed (peak)
    const totalStaffNeeded = Math.max(...recommendations.map(r => r.recommendedStaff))

    // Identify peak demand time
    const peakRecommendation = recommendations.reduce((max, rec) => 
      rec.recommendedStaff > max.recommendedStaff ? rec : max
    )
    const peakDemandTime = peakRecommendation.timeSlot

    // Estimate cost
    const estimatedCost = this.estimateCost(totalStaffNeeded, duration)

    // Risk assessment
    const riskAssessment = this.assessRisk(
      recommendations,
      expectedAttendance,
      historicalData
    )

    // Optimization suggestions
    const optimization = this.generateOptimizationSuggestions(
      recommendations,
      duration,
      constraints
    )

    return {
      recommendations,
      totalStaffNeeded,
      peakDemandTime,
      estimatedCost,
      riskAssessment,
      optimization
    }
  }

  /**
   * Generate recommendations for each hour
   */
  private generateHourlyRecommendations(
    baseStaff: number,
    duration: number,
    expectedAttendance: number,
    historicalData: StaffingHistory[]
  ): StaffingRecommendation[] {
    const recommendations: StaffingRecommendation[] = []

    for (let hour = 0; hour < duration; hour++) {
      // Calculate demand curve (typically peaks in middle hours)
      const demandMultiplier = this.calculateDemandMultiplier(hour, duration)
      const adjustedStaff = Math.ceil(baseStaff * demandMultiplier)

      // Apply historical adjustments
      const historicalAdjustment = this.getHistoricalAdjustment(hour, historicalData)
      const recommendedStaff = Math.max(
        Math.ceil(adjustedStaff * historicalAdjustment),
        Math.ceil(baseStaff * 0.5) // Minimum 50% of base
      )

      // Calculate risk level
      const riskLevel = this.calculateRiskLevel(recommendedStaff, expectedAttendance, hour, duration)

      // Generate rationale
      const rationale = this.generateRationale(
        hour,
        recommendedStaff,
        demandMultiplier,
        historicalAdjustment,
        riskLevel
      )

      // Generate adjustments by role
      const adjustments = this.generateRoleAdjustments(recommendedStaff, hour, duration)

      recommendations.push({
        timeSlot: this.formatTimeSlot(hour),
        recommendedStaff,
        currentStaff: 0, // Would come from actual staff data
        gap: recommendedStaff,
        confidence: this.calculateConfidence(historicalData),
        rationale,
        riskLevel,
        adjustments
      })
    }

    return recommendations
  }

  /**
   * Calculate demand multiplier based on time
   */
  private calculateDemandMultiplier(hour: number, totalDuration: number): number {
    // Typical demand curve: low at start, peaks in middle, decreases at end
    const normalizedHour = hour / totalDuration
    
    if (normalizedHour < 0.2) {
      // Opening hours (0-20%) - building up
      return 0.7 + (normalizedHour / 0.2) * 0.3
    } else if (normalizedHour < 0.8) {
      // Peak hours (20-80%) - full demand
      return 1.0 + 0.2 * Math.sin((normalizedHour - 0.2) * Math.PI * 2)
    } else {
      // Closing hours (80-100%) - winding down
      return 1.0 - ((normalizedHour - 0.8) / 0.2) * 0.3
    }
  }

  /**
   * Get staffing ratio based on event type
   */
  private getBaseStaffingRatio(eventType: string): number {
    const ratios: Record<string, number> = {
      'concert': 100, // 1 staff per 100 attendees
      'sports': 150,
      'festival': 80,
      'conference': 200,
      'default': 120
    }

    return ratios[eventType.toLowerCase()] || ratios.default
  }

  /**
   * Get historical adjustment factor
   */
  private getHistoricalAdjustment(hour: number, historicalData: StaffingHistory[]): number {
    if (historicalData.length === 0) return 1.0

    // Calculate average incident rate for similar time periods
    const avgIncidentRate = historicalData.reduce((sum, data) => 
      sum + (data.incidentCount / data.staffCount), 0
    ) / historicalData.length

    // Higher incident rate = more staff needed
    if (avgIncidentRate > 0.5) return 1.2
    if (avgIncidentRate > 0.3) return 1.1
    if (avgIncidentRate < 0.1) return 0.9
    
    return 1.0
  }

  /**
   * Calculate risk level
   */
  private calculateRiskLevel(
    staffCount: number,
    attendance: number,
    hour: number,
    duration: number
  ): 'low' | 'medium' | 'high' | 'critical' {
    const ratio = attendance / staffCount

    // Critical risk
    if (ratio > 150) return 'critical'
    
    // High risk during peak hours with high ratio
    const isPeakHour = hour > duration * 0.2 && hour < duration * 0.8
    if (isPeakHour && ratio > 120) return 'high'
    if (ratio > 130) return 'high'
    
    // Medium risk
    if (ratio > 100) return 'medium'
    
    return 'low'
  }

  /**
   * Generate rationale for recommendation
   */
  private generateRationale(
    hour: number,
    staffCount: number,
    demandMultiplier: number,
    historicalAdjustment: number,
    riskLevel: string
  ): string[] {
    const rationale: string[] = []

    if (demandMultiplier > 1.1) {
      rationale.push('Peak demand period - increased staffing recommended')
    } else if (demandMultiplier < 0.9) {
      rationale.push('Lower demand period - reduced staffing acceptable')
    }

    if (historicalAdjustment > 1.0) {
      rationale.push('Historical data shows higher incident rate during this period')
    }

    if (riskLevel === 'critical' || riskLevel === 'high') {
      rationale.push('High risk period - additional resources critical')
    }

    if (rationale.length === 0) {
      rationale.push('Standard staffing level appropriate')
    }

    return rationale
  }

  /**
   * Generate role-specific adjustments
   */
  private generateRoleAdjustments(
    totalStaff: number,
    hour: number,
    duration: number
  ): StaffAdjustment[] {
    // Typical role distribution for security events
    const isPeakHour = hour > duration * 0.2 && hour < duration * 0.8

    return [
      {
        role: 'Supervisors',
        currentCount: 0,
        recommendedCount: Math.ceil(totalStaff * 0.15), // 15% supervisors
        reason: 'Maintain span of control (1:6 ratio)',
        priority: 'high'
      },
      {
        role: 'Crowd Control',
        currentCount: 0,
        recommendedCount: Math.ceil(totalStaff * (isPeakHour ? 0.40 : 0.30)),
        reason: isPeakHour ? 'Peak crowd period' : 'Standard coverage',
        priority: isPeakHour ? 'high' : 'medium'
      },
      {
        role: 'Entry/Exit',
        currentCount: 0,
        recommendedCount: Math.ceil(totalStaff * 0.25),
        reason: 'All entry points must be covered',
        priority: 'high'
      },
      {
        role: 'Response Team',
        currentCount: 0,
        recommendedCount: Math.ceil(totalStaff * 0.20),
        reason: 'Mobile response capability',
        priority: 'medium'
      },
      {
        role: 'Control Room',
        currentCount: 0,
        recommendedCount: Math.max(2, Math.ceil(totalStaff * 0.10)),
        reason: 'Minimum 2 for redundancy',
        priority: 'high'
      }
    ]
  }

  /**
   * Assess overall risk
   */
  private assessRisk(
    recommendations: StaffingRecommendation[],
    attendance: number,
    historicalData: StaffingHistory[]
  ): RiskAssessment {
    const factors: RiskFactor[] = []

    // Check for understaffing
    const avgRatio = attendance / (recommendations.reduce((sum, r) => sum + r.recommendedStaff, 0) / recommendations.length)
    if (avgRatio > 120) {
      factors.push({
        factor: 'Understaffing Risk',
        impact: 'high',
        probability: 0.7,
        description: 'Staff-to-attendee ratio exceeds safe levels'
      })
    }

    // Check historical incident rate
    if (historicalData.length > 0) {
      const avgIncidentRate = historicalData.reduce((sum, d) => sum + d.incidentCount, 0) / historicalData.length
      if (avgIncidentRate > 20) {
        factors.push({
          factor: 'High Incident Rate',
          impact: 'medium',
          probability: 0.6,
          description: 'Historical data shows elevated incident frequency'
        })
      }
    }

    // Determine overall risk
    let overall: RiskAssessment['overall'] = 'low'
    if (factors.some(f => f.impact === 'high')) overall = 'high'
    else if (factors.length > 2) overall = 'medium'

    // Generate mitigations
    const mitigations = factors.map(f => 
      `Address ${f.factor}: ${f.description}`
    )

    return { overall, factors, mitigations }
  }

  /**
   * Generate optimization suggestions
   */
  private generateOptimizationSuggestions(
    recommendations: StaffingRecommendation[],
    duration: number,
    constraints: StaffingConstraints
  ): OptimizationSuggestions {
    // Generate shift structure
    const shifts: ShiftOptimization[] = []
    
    if (duration <= 8) {
      shifts.push({
        shiftName: 'Single Shift',
        startTime: '00:00',
        endTime: `${duration}:00`,
        staffCount: Math.max(...recommendations.map(r => r.recommendedStaff)),
        rationale: 'Event duration allows single shift coverage'
      })
    } else {
      // 8-hour shifts
      const shiftCount = Math.ceil(duration / 8)
      for (let i = 0; i < shiftCount; i++) {
        const shiftStart = i * 8
        const shiftEnd = Math.min((i + 1) * 8, duration)
        const shiftRecs = recommendations.slice(shiftStart, shiftEnd)
        const shiftStaff = Math.max(...shiftRecs.map(r => r.recommendedStaff))

        shifts.push({
          shiftName: `Shift ${i + 1}`,
          startTime: `${shiftStart}:00`,
          endTime: `${shiftEnd}:00`,
          staffCount: shiftStaff,
          rationale: `Peak demand: ${Math.max(...shiftRecs.map(r => r.recommendedStaff))} staff`
        })
      }
    }

    // Calculate role distribution
    const totalStaff = Math.max(...recommendations.map(r => r.recommendedStaff))
    const roleDistribution: RoleDistribution[] = [
      {
        role: 'Supervisors',
        count: Math.ceil(totalStaff * 0.15),
        percentage: 15,
        areas: ['Command Center', 'Mobile']
      },
      {
        role: 'Crowd Control',
        count: Math.ceil(totalStaff * 0.35),
        percentage: 35,
        areas: ['Main Arena', 'Concourse', 'High-density zones']
      },
      {
        role: 'Entry/Exit',
        count: Math.ceil(totalStaff * 0.25),
        percentage: 25,
        areas: ['Gates', 'Emergency Exits']
      },
      {
        role: 'Response Team',
        count: Math.ceil(totalStaff * 0.15),
        percentage: 15,
        areas: ['Mobile', 'First Aid', 'Incident Support']
      },
      {
        role: 'Control Room',
        count: Math.ceil(totalStaff * 0.10),
        percentage: 10,
        areas: ['Command Center']
      }
    ]

    // Calculate potential savings from optimization
    const costSavings = this.calculateCostSavings(shifts, recommendations)
    const efficiencyGain = this.calculateEfficiencyGain(shifts, roleDistribution)

    return {
      shifts,
      roleDistribution,
      costSavings,
      efficiencyGain
    }
  }

  /**
   * Real-time staffing adjustments
   */
  getRealtimeAdjustments(
    currentStaff: number,
    currentIncidentRate: number,
    currentUtilization: number
  ): StaffAdjustment[] {
    const adjustments: StaffAdjustment[] = []

    // Check incident rate
    if (currentIncidentRate > 2) { // More than 2 incidents per hour per staff
      adjustments.push({
        role: 'Response Team',
        currentCount: 0,
        recommendedCount: Math.ceil(currentStaff * 0.2),
        reason: 'High incident rate detected - increase response capacity',
        priority: 'high'
      })
    }

    // Check utilization
    if (currentUtilization > 85) {
      adjustments.push({
        role: 'All Roles',
        currentCount: currentStaff,
        recommendedCount: Math.ceil(currentStaff * 1.2),
        reason: 'Staff utilization above 85% - risk of burnout',
        priority: 'high'
      })
    } else if (currentUtilization < 40) {
      adjustments.push({
        role: 'All Roles',
        currentCount: currentStaff,
        recommendedCount: Math.ceil(currentStaff * 0.8),
        reason: 'Low utilization - opportunity for cost optimization',
        priority: 'low'
      })
    }

    return adjustments
  }

  // Private helper methods

  private formatTimeSlot(hour: number): string {
    const startHour = hour.toString().padStart(2, '0')
    const endHour = ((hour + 1) % 24).toString().padStart(2, '0')
    return `${startHour}:00 - ${endHour}:00`
  }

  private estimateCost(staffCount: number, hours: number): number {
    const hourlyRate = 25 // £25 per hour (typical security rate)
    return staffCount * hours * hourlyRate
  }

  private calculateConfidence(historicalData: StaffingHistory[]): number {
    if (historicalData.length === 0) return 0.5 // 50% confidence with no data
    if (historicalData.length < 3) return 0.6
    if (historicalData.length < 10) return 0.75
    return 0.9
  }

  private calculateCostSavings(
    shifts: ShiftOptimization[],
    hourlyRecommendations: StaffingRecommendation[]
  ): number {
    // Compare optimized shift structure vs continuous staffing
    const optimizedCost = shifts.reduce((sum, shift) => {
      const hours = parseInt(shift.endTime) - parseInt(shift.startTime)
      return sum + (shift.staffCount * hours * 25)
    }, 0)

    const continuousCost = Math.max(...hourlyRecommendations.map(r => r.recommendedStaff)) * 
      hourlyRecommendations.length * 25

    return Math.max(0, continuousCost - optimizedCost)
  }

  private calculateEfficiencyGain(
    shifts: ShiftOptimization[],
    roleDistribution: RoleDistribution[]
  ): number {
    // Estimate efficiency gain from proper role distribution
    // This is a simplified model
    const hasBalancedDistribution = roleDistribution.every(role => 
      role.percentage >= 10 && role.percentage <= 40
    )

    return hasBalancedDistribution ? 15 : 0 // 15% efficiency gain
  }
}

// Export singleton instance
export const predictiveStaffing = new PredictiveStaffing()
