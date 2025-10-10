/**
 * AI Decision Support System
 * Provides intelligent recommendations for command decisions
 */

export interface DecisionContext {
  currentSituation: {
    totalIncidents: number
    openIncidents: number
    highPriorityIncidents: number
    staffOnDuty: number
    attendanceCount: number
    timeOfDay: string
    weatherConditions?: string
  }
  recentTrends: {
    incidentRate: number
    responseTime: number
    utilizationRate: number
  }
  resources: {
    availableStaff: number
    medicsOnSite: number
    securityPresence: number
    emergencyServicesDistance: number // minutes
  }
}

export interface DecisionRecommendation {
  action: string
  priority: 'immediate' | 'urgent' | 'consider' | 'monitor'
  confidence: number
  reasoning: string[]
  expectedOutcome: string
  risks: string[]
  alternatives: AlternativeAction[]
  requiredResources: string[]
  estimatedTime: string
  successProbability: number
}

export interface AlternativeAction {
  action: string
  pros: string[]
  cons: string[]
  confidence: number
}

export interface SituationAssessment {
  severity: 'normal' | 'elevated' | 'serious' | 'critical'
  trends: Array<{ metric: string; direction: 'improving' | 'stable' | 'worsening' }>
  alerts: string[]
  recommendations: DecisionRecommendation[]
  nextReview: string // Time for next assessment
}

export class DecisionSupport {
  /**
   * Assess current situation and provide recommendations
   */
  assessSituation(context: DecisionContext): SituationAssessment {
    const severity = this.determineSeverity(context)
    const trends = this.analyzeTrends(context)
    const alerts = this.generateAlerts(context, severity)
    const recommendations = this.generateRecommendations(context, severity)
    const nextReview = this.calculateNextReview(severity)

    return {
      severity,
      trends,
      alerts,
      recommendations,
      nextReview
    }
  }

  /**
   * Get recommendation for specific scenario
   */
  getRecommendation(
    scenario: string,
    context: DecisionContext
  ): DecisionRecommendation {
    const scenarioLower = scenario.toLowerCase()

    // Medical emergency
    if (scenarioLower.includes('medical') || scenarioLower.includes('ambulance')) {
      return this.getMedicalEmergencyRecommendation(context)
    }

    // Crowd surge
    if (scenarioLower.includes('crowd') || scenarioLower.includes('surge')) {
      return this.getCrowdSurgeRecommendation(context)
    }

    // Fire/evacuation
    if (scenarioLower.includes('fire') || scenarioLower.includes('evacuation')) {
      return this.getEvacuationRecommendation(context)
    }

    // Staff shortage
    if (scenarioLower.includes('staff') || scenarioLower.includes('shortage')) {
      return this.getStaffShortageRecommendation(context)
    }

    // Default recommendation
    return this.getDefaultRecommendation(scenario, context)
  }

  /**
   * Predictive decision making
   */
  predictOutcome(
    proposedAction: string,
    context: DecisionContext
  ): {
    likelihood: number
    outcomes: Array<{ scenario: string; probability: number; impact: string }>
    recommendation: 'proceed' | 'proceed_with_caution' | 'reconsider'
  } {
    // Analyze potential outcomes
    const outcomes = this.analyzeActionOutcomes(proposedAction, context)
    
    // Calculate overall likelihood of success
    const positiveOutcomes = outcomes.filter(o => o.impact === 'positive')
    const likelihood = positiveOutcomes.reduce((sum, o) => sum + o.probability, 0) / outcomes.length

    // Generate recommendation
    let recommendation: 'proceed' | 'proceed_with_caution' | 'reconsider'
    if (likelihood > 0.7) {
      recommendation = 'proceed'
    } else if (likelihood > 0.5) {
      recommendation = 'proceed_with_caution'
    } else {
      recommendation = 'reconsider'
    }

    return {
      likelihood,
      outcomes,
      recommendation
    }
  }

  // Private helper methods

  private determineSeverity(context: DecisionContext): SituationAssessment['severity'] {
    const { currentSituation, recentTrends, resources } = context

    // Critical conditions
    if (currentSituation.highPriorityIncidents > 5 ||
        currentSituation.openIncidents > 20 ||
        recentTrends.responseTime > 15 ||
        recentTrends.utilizationRate > 90) {
      return 'critical'
    }

    // Serious conditions
    if (currentSituation.highPriorityIncidents > 3 ||
        currentSituation.openIncidents > 10 ||
        recentTrends.responseTime > 10 ||
        recentTrends.utilizationRate > 75) {
      return 'serious'
    }

    // Elevated conditions
    if (currentSituation.openIncidents > 5 ||
        recentTrends.incidentRate > 2 ||
        recentTrends.utilizationRate > 60) {
      return 'elevated'
    }

    return 'normal'
  }

  private analyzeTrends(context: DecisionContext): Array<{ metric: string; direction: 'improving' | 'stable' | 'worsening' }> {
    const { recentTrends } = context
    const trends: Array<{ metric: string; direction: 'improving' | 'stable' | 'worsening' }> = []

    // Analyze incident rate
    if (recentTrends.incidentRate > 3) {
      trends.push({ metric: 'Incident Rate', direction: 'worsening' })
    } else if (recentTrends.incidentRate < 1) {
      trends.push({ metric: 'Incident Rate', direction: 'improving' })
    } else {
      trends.push({ metric: 'Incident Rate', direction: 'stable' })
    }

    // Analyze response time
    if (recentTrends.responseTime > 10) {
      trends.push({ metric: 'Response Time', direction: 'worsening' })
    } else if (recentTrends.responseTime < 5) {
      trends.push({ metric: 'Response Time', direction: 'improving' })
    } else {
      trends.push({ metric: 'Response Time', direction: 'stable' })
    }

    // Analyze utilization
    if (recentTrends.utilizationRate > 80) {
      trends.push({ metric: 'Staff Utilization', direction: 'worsening' })
    } else if (recentTrends.utilizationRate < 50) {
      trends.push({ metric: 'Staff Utilization', direction: 'improving' })
    } else {
      trends.push({ metric: 'Staff Utilization', direction: 'stable' })
    }

    return trends
  }

  private generateAlerts(context: DecisionContext, severity: string): string[] {
    const alerts: string[] = []

    if (context.currentSituation.highPriorityIncidents > 3) {
      alerts.push(`${context.currentSituation.highPriorityIncidents} high-priority incidents active`)
    }

    if (context.recentTrends.responseTime > 10) {
      alerts.push('Response times exceeding 10-minute target')
    }

    if (context.recentTrends.utilizationRate > 85) {
      alerts.push('Staff utilization above 85% - consider additional resources')
    }

    if (context.currentSituation.openIncidents > 15) {
      alerts.push('High volume of open incidents - prioritization needed')
    }

    return alerts
  }

  private generateRecommendations(context: DecisionContext, severity: string): DecisionRecommendation[] {
    const recommendations: DecisionRecommendation[] = []

    // High priority incident response
    if (context.currentSituation.highPriorityIncidents > 0) {
      recommendations.push({
        action: 'Deploy additional response teams to high-priority incidents',
        priority: 'immediate',
        confidence: 0.9,
        reasoning: [
          `${context.currentSituation.highPriorityIncidents} high-priority incidents require immediate attention`,
          'Early response reduces escalation risk'
        ],
        expectedOutcome: 'Faster resolution of critical incidents',
        risks: ['May reduce coverage in other areas'],
        alternatives: [
          {
            action: 'Escalate to emergency services immediately',
            pros: ['Professional support', 'Faster response'],
            cons: ['External dependency', 'Potential delay'],
            confidence: 0.7
          }
        ],
        requiredResources: ['Response team', 'Supervisor', 'Medic (if medical)'],
        estimatedTime: '5-10 minutes',
        successProbability: 0.85
      })
    }

    // Staff utilization
    if (context.recentTrends.utilizationRate > 80) {
      recommendations.push({
        action: 'Request additional staff or redistribute resources',
        priority: 'urgent',
        confidence: 0.85,
        reasoning: [
          'Staff utilization above 80% increases burnout risk',
          'Response quality may degrade with overutilization'
        ],
        expectedOutcome: 'Improved response capability and staff welfare',
        risks: ['Budget impact', 'Coordination overhead'],
        alternatives: [
          {
            action: 'Prioritize incidents and defer low-priority tasks',
            pros: ['No additional cost', 'Immediate implementation'],
            cons: ['Some tasks remain unaddressed'],
            confidence: 0.7
          }
        ],
        requiredResources: ['On-call staff', 'Supervisor approval'],
        estimatedTime: '15-30 minutes',
        successProbability: 0.75
      })
    }

    // Open incident backlog
    if (context.currentSituation.openIncidents > 10) {
      recommendations.push({
        action: 'Conduct rapid incident triage and prioritization',
        priority: 'consider',
        confidence: 0.8,
        reasoning: [
          `${context.currentSituation.openIncidents} open incidents may overwhelm capacity`,
          'Prioritization ensures critical issues are addressed first'
        ],
        expectedOutcome: 'Clear action plan for incident resolution',
        risks: ['Some low-priority incidents may be delayed'],
        alternatives: [],
        requiredResources: ['Command team', '10-15 minutes'],
        estimatedTime: '15 minutes',
        successProbability: 0.9
      })
    }

    return recommendations
  }

  private getMedicalEmergencyRecommendation(context: DecisionContext): DecisionRecommendation {
    return {
      action: 'Activate emergency medical protocol',
      priority: 'immediate',
      confidence: 0.95,
      reasoning: [
        'Medical emergencies require immediate professional response',
        'Time is critical for positive outcomes',
        'Duty of care obligations'
      ],
      expectedOutcome: 'Rapid medical attention and stabilization',
      risks: ['Resource diversion from other areas'],
      alternatives: [
        {
          action: 'Deploy on-site first aiders while awaiting ambulance',
          pros: ['Immediate care', 'Stabilization'],
          cons: ['Limited medical capability'],
          confidence: 0.8
        }
      ],
      requiredResources: ['Medic', 'Ambulance', 'Clear access route', 'Communication'],
      estimatedTime: 'Immediate (ambulance: 8-12 min typical)',
      successProbability: 0.9
    }
  }

  private getCrowdSurgeRecommendation(context: DecisionContext): DecisionRecommendation {
    return {
      action: 'Implement crowd relief procedures',
      priority: 'immediate',
      confidence: 0.9,
      reasoning: [
        'Crowd surges can rapidly escalate to life-threatening situations',
        'Early intervention prevents crush injuries',
        'JESIP principle: coordinate response'
      ],
      expectedOutcome: 'Controlled crowd dispersion and safety',
      risks: ['Requires significant resource deployment'],
      alternatives: [
        {
          action: 'Open additional exit routes',
          pros: ['Reduces pressure', 'Provides escape options'],
          cons: ['May require venue modifications'],
          confidence: 0.85
        }
      ],
      requiredResources: ['Crowd control team', 'Barriers', 'PA system', 'Command coordination'],
      estimatedTime: '5-15 minutes',
      successProbability: 0.8
    }
  }

  private getEvacuationRecommendation(context: DecisionContext): DecisionRecommendation {
    return {
      action: 'Initiate controlled evacuation procedure',
      priority: 'immediate',
      confidence: 0.95,
      reasoning: [
        'Fire/evacuation scenarios require immediate action',
        'Controlled evacuation prevents panic',
        'Legal and safety obligations'
      ],
      expectedOutcome: 'Safe and orderly evacuation of all persons',
      risks: ['Crowd surge at exits', 'Panic', 'Injuries during egress'],
      alternatives: [
        {
          action: 'Investigate and contain - partial evacuation',
          pros: ['Less disruptive', 'Contained response'],
          cons: ['Risk if situation escalates'],
          confidence: 0.6
        }
      ],
      requiredResources: ['All security staff', 'Stewarding team', 'PA system', 'Fire service'],
      estimatedTime: '10-30 minutes for full evacuation',
      successProbability: 0.85
    }
  }

  private getStaffShortageRecommendation(context: DecisionContext): DecisionRecommendation {
    return {
      action: 'Activate on-call staff and reallocate resources',
      priority: 'urgent',
      confidence: 0.8,
      reasoning: [
        'Current staff levels insufficient for safe operations',
        'Utilization approaching unsafe levels',
        'Risk of delayed responses'
      ],
      expectedOutcome: 'Restored adequate staffing levels',
      risks: ['Budget implications', 'Response time for on-call staff'],
      alternatives: [
        {
          action: 'Prioritize critical areas and reduce low-priority coverage',
          pros: ['No additional cost', 'Immediate'],
          cons: ['Reduced overall coverage'],
          confidence: 0.65
        }
      ],
      requiredResources: ['On-call staff', 'Management approval', 'Transportation'],
      estimatedTime: '30-60 minutes',
      successProbability: 0.75
    }
  }

  private getDefaultRecommendation(scenario: string, context: DecisionContext): DecisionRecommendation {
    return {
      action: 'Assess situation and gather more information',
      priority: 'consider',
      confidence: 0.6,
      reasoning: [
        'Scenario requires additional context for specific recommendation',
        'Current data insufficient for high-confidence decision'
      ],
      expectedOutcome: 'Better understanding of situation for informed decision',
      risks: ['Potential delay in response'],
      alternatives: [],
      requiredResources: ['Command team review', '5-10 minutes'],
      estimatedTime: '5-10 minutes',
      successProbability: 0.7
    }
  }

  private analyzeActionOutcomes(
    action: string,
    context: DecisionContext
  ): Array<{ scenario: string; probability: number; impact: string }> {
    // Simplified outcome analysis
    return [
      {
        scenario: 'Action succeeds as planned',
        probability: 0.7,
        impact: 'positive'
      },
      {
        scenario: 'Action partially succeeds with minor issues',
        probability: 0.2,
        impact: 'neutral'
      },
      {
        scenario: 'Action fails or creates complications',
        probability: 0.1,
        impact: 'negative'
      }
    ]
  }

  private calculateNextReview(severity: string): string {
    switch (severity) {
      case 'critical':
        return '5 minutes'
      case 'serious':
        return '15 minutes'
      case 'elevated':
        return '30 minutes'
      default:
        return '60 minutes'
    }
  }
}

// Export singleton instance
export const decisionSupport = new DecisionSupport()
