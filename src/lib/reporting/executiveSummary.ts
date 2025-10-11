/**
 * Executive Summary Generator
 * AI-powered 1-page executive summaries
 */


export interface ExecutiveSummaryData {
  eventName: string
  eventType: string
  venue: string
  dates: { start: Date; end: Date }
  attendance: {
    expected: number
    actual: number
    peak: number
  }
  incidents: {
    total: number
    byType: Record<string, number>
    byPriority: Record<string, number>
    open: number
    closed: number
    averageResponseTime: number
    averageResolutionTime: number
  }
  staffing: {
    deployed: number
    utilization: number
    mostActiveOperators: Array<{ callsign: string; incidents: number }>
  }
  performance: {
    qualityScore: number
    complianceRate: number
    safetyRating: number
    clientSatisfaction?: number
  }
  keyHighlights: string[]
  criticalIncidents: any[]
  recommendations: string[]
}

export interface ExecutiveSummary {
  title: string
  generatedAt: string
  period: string
  executiveOverview: string
  keyMetrics: KeyMetric[]
  performanceHighlights: string[]
  concernAreas: string[]
  criticalEvents: CriticalEvent[]
  recommendations: Recommendation[]
  nextSteps: string[]
  conclusion: string
}

export interface KeyMetric {
  label: string
  value: string
  change?: string
  status: 'excellent' | 'good' | 'concern' | 'critical'
}

export interface CriticalEvent {
  time: string
  type: string
  description: string
  resolution: string
  impact: 'low' | 'medium' | 'high'
}

export interface Recommendation {
  priority: 'immediate' | 'short-term' | 'long-term'
  category: string
  recommendation: string
  expectedBenefit: string
}

export class ExecutiveSummaryGenerator {
  /**
   * Generate executive summary
   */
  generate(data: ExecutiveSummaryData): ExecutiveSummary {
    const period = `${data.dates.start.toLocaleDateString()} - ${data.dates.end.toLocaleDateString()}`
    
    return {
      title: `Executive Summary: ${data.eventName}`,
      generatedAt: new Date().toISOString(),
      period,
      executiveOverview: this.generateOverview(data),
      keyMetrics: this.generateKeyMetrics(data),
      performanceHighlights: this.generateHighlights(data),
      concernAreas: this.generateConcerns(data),
      criticalEvents: this.generateCriticalEvents(data),
      recommendations: this.generateRecommendations(data),
      nextSteps: this.generateNextSteps(data),
      conclusion: this.generateConclusion(data)
    }
  }

  /**
   * Generate PDF of executive summary
   */
  async generatePDF(summary: ExecutiveSummary): Promise<Blob> {
    const { jsPDF } = await import('jspdf')
    const doc = new jsPDF()

    let yPos = 20

    // Title
    doc.setFontSize(20)
    doc.setFont('helvetica', 'bold')
    doc.text(summary.title, 20, yPos)
    yPos += 15

    // Period
    doc.setFontSize(12)
    doc.setFont('helvetica', 'normal')
    doc.text(summary.period, 20, yPos)
    yPos += 10

    // Executive Overview
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('Executive Overview', 20, yPos)
    yPos += 8

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    const overviewLines = doc.splitTextToSize(summary.executiveOverview, 170)
    doc.text(overviewLines, 20, yPos)
    yPos += overviewLines.length * 5 + 5

    // Key Metrics
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('Key Metrics', 20, yPos)
    yPos += 8

    summary.keyMetrics.forEach(metric => {
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.text(metric.label, 25, yPos)
      doc.setFont('helvetica', 'normal')
      doc.text(metric.value, 100, yPos)
      if (metric.change) {
        doc.text(metric.change, 150, yPos)
      }
      yPos += 6
    })
    yPos += 5

    // Add more sections...
    if (yPos > 250) {
      doc.addPage()
      yPos = 20
    }

    // Performance Highlights
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('Performance Highlights', 20, yPos)
    yPos += 8

    summary.performanceHighlights.forEach(highlight => {
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.text('• ' + highlight, 25, yPos)
      yPos += 6
    })

    return doc.output('blob')
  }

  // Private helper methods

  private generateOverview(data: ExecutiveSummaryData): string {
    const successRate = ((data.incidents.closed / data.incidents.total) * 100).toFixed(1)
    const attendanceRate = ((data.attendance.actual / data.attendance.expected) * 100).toFixed(1)

    return `${data.eventName}, a ${data.eventType} event held at ${data.venue}, successfully managed ${data.attendance.actual.toLocaleString()} attendees (${attendanceRate}% of expected capacity). The event recorded ${data.incidents.total} incidents with a ${successRate}% resolution rate and an average response time of ${data.incidents.averageResponseTime.toFixed(1)} minutes. Overall performance scored ${data.performance.qualityScore.toFixed(1)}/100 with ${data.performance.complianceRate.toFixed(1)}% compliance rate, demonstrating ${this.getPerformanceRating(data.performance.qualityScore)} operational standards.`
  }

  private generateKeyMetrics(data: ExecutiveSummaryData): KeyMetric[] {
    return [
      {
        label: 'Total Incidents',
        value: data.incidents.total.toString(),
        status: data.incidents.total < 20 ? 'excellent' : data.incidents.total < 50 ? 'good' : 'concern'
      },
      {
        label: 'Response Time',
        value: `${data.incidents.averageResponseTime.toFixed(1)} min`,
        status: data.incidents.averageResponseTime < 5 ? 'excellent' : data.incidents.averageResponseTime < 10 ? 'good' : 'concern'
      },
      {
        label: 'Quality Score',
        value: `${data.performance.qualityScore.toFixed(1)}/100`,
        status: data.performance.qualityScore > 90 ? 'excellent' : data.performance.qualityScore > 75 ? 'good' : 'concern'
      },
      {
        label: 'Compliance Rate',
        value: `${data.performance.complianceRate.toFixed(1)}%`,
        status: data.performance.complianceRate > 95 ? 'excellent' : data.performance.complianceRate > 85 ? 'good' : 'concern'
      },
      {
        label: 'Staff Utilization',
        value: `${data.staffing.utilization.toFixed(1)}%`,
        status: data.staffing.utilization < 80 ? 'good' : data.staffing.utilization < 90 ? 'concern' : 'critical'
      }
    ]
  }

  private generateHighlights(data: ExecutiveSummaryData): string[] {
    const highlights: string[] = []

    if (data.performance.qualityScore > 90) {
      highlights.push('Outstanding log quality maintained throughout event')
    }

    if (data.incidents.averageResponseTime < 5) {
      highlights.push('Exceptional response times achieved (under 5 minutes)')
    }

    if (data.performance.complianceRate > 95) {
      highlights.push('Excellent compliance with JESIP/JDM standards (>95%)')
    }

    if (data.attendance.actual > data.attendance.expected) {
      highlights.push(`Above-expected attendance: ${((data.attendance.actual / data.attendance.expected - 1) * 100).toFixed(1)}% over capacity`)
    }

    return highlights.length > 0 ? highlights : ['Event completed successfully with no major issues']
  }

  private generateConcerns(data: ExecutiveSummaryData): string[] {
    const concerns: string[] = []

    if (data.incidents.open > 5) {
      concerns.push(`${data.incidents.open} incidents remain unresolved`)
    }

    if (data.incidents.averageResponseTime > 10) {
      concerns.push('Response times exceeded 10-minute target')
    }

    if (data.performance.qualityScore < 75) {
      concerns.push('Log quality below acceptable standards (<75)')
    }

    if (data.staffing.utilization > 85) {
      concerns.push('Staff utilization above sustainable levels (>85%)')
    }

    return concerns
  }

  private generateCriticalEvents(data: ExecutiveSummaryData): CriticalEvent[] {
    return data.criticalIncidents.map(incident => ({
      time: new Date(incident.timestamp).toLocaleTimeString(),
      type: incident.incident_type,
      description: incident.occurrence.slice(0, 100) + (incident.occurrence.length > 100 ? '...' : ''),
      resolution: incident.action_taken.slice(0, 100),
      impact: incident.priority === 'high' ? 'high' : incident.priority === 'medium' ? 'medium' : 'low'
    }))
  }

  private generateRecommendations(data: ExecutiveSummaryData): Recommendation[] {
    const recommendations: Recommendation[] = []

    if (data.incidents.averageResponseTime > 10) {
      recommendations.push({
        priority: 'immediate',
        category: 'Operations',
        recommendation: 'Review and optimize incident response procedures',
        expectedBenefit: 'Reduce response time by 30-40%'
      })
    }

    if (data.performance.qualityScore < 80) {
      recommendations.push({
        priority: 'short-term',
        category: 'Training',
        recommendation: 'Implement refresher training on structured logging',
        expectedBenefit: 'Improve log quality to >85%'
      })
    }

    if (data.staffing.utilization > 80) {
      recommendations.push({
        priority: 'short-term',
        category: 'Staffing',
        recommendation: 'Increase staff allocation by 15-20% for similar events',
        expectedBenefit: 'Reduce staff burnout and improve response capability'
      })
    }

    return recommendations
  }

  private generateNextSteps(data: ExecutiveSummaryData): string[] {
    const steps: string[] = []

    if (data.incidents.open > 0) {
      steps.push(`Close remaining ${data.incidents.open} open incidents`)
    }

    steps.push('Conduct team debrief within 48 hours')
    steps.push('Archive event documentation')
    steps.push('Share lessons learned with stakeholders')

    if (data.criticalIncidents.length > 0) {
      steps.push('Review critical incidents for procedural improvements')
    }

    return steps
  }

  private generateConclusion(data: ExecutiveSummaryData): string {
    const rating = this.getPerformanceRating(data.performance.qualityScore)
    return `Overall, ${data.eventName} was executed with ${rating} standards. The team demonstrated ${data.performance.complianceRate > 90 ? 'strong' : 'adequate'} compliance and maintained ${data.incidents.averageResponseTime < 8 ? 'excellent' : 'acceptable'} response times. ${data.incidents.open > 0 ? `Follow-up is required to close ${data.incidents.open} remaining incidents.` : 'All incidents were successfully resolved.'} The event serves as a ${data.performance.qualityScore > 85 ? 'positive' : 'learning'} reference for future operations.`
  }

  private getPerformanceRating(score: number): string {
    if (score > 90) return 'outstanding'
    if (score > 80) return 'excellent'
    if (score > 70) return 'good'
    if (score > 60) return 'satisfactory'
    return 'needs improvement'
  }
}

export const executiveSummaryGenerator = new ExecutiveSummaryGenerator()
