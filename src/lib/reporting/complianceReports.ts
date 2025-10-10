/**
 * Compliance Certification Reports
 * Generate compliance reports for licensing and audits
 */

export interface ComplianceReport {
  reportId: string
  eventId: string
  eventName: string
  generatedAt: string
  reportingPeriod: { start: Date; end: Date }
  standard: 'JESIP' | 'JDM' | 'ISO22320' | 'NIMS' | 'Custom'
  certificationBody?: string
  overallCompliance: {
    score: number
    rating: 'Full Compliance' | 'Substantial Compliance' | 'Partial Compliance' | 'Non-Compliance'
    findings: number
  }
  sections: ComplianceSection[]
  auditTrail: AuditEntry[]
  signatures: SignatureEntry[]
}

export interface ComplianceSection {
  id: string
  requirement: string
  description: string
  status: 'compliant' | 'partial' | 'non-compliant' | 'not-applicable'
  evidence: Evidence[]
  notes?: string
  score: number
}

export interface Evidence {
  type: 'log' | 'document' | 'photo' | 'metric'
  reference: string
  description: string
  timestamp: string
}

export interface AuditEntry {
  timestamp: string
  action: string
  user: string
  details: string
}

export interface SignatureEntry {
  role: string
  name: string
  timestamp: string
  signature?: string
}

export const JESIP_REQUIREMENTS = [
  {
    id: 'jesip-1',
    requirement: 'Co-location',
    description: 'Command team co-located for effective coordination',
    category: 'Command & Control'
  },
  {
    id: 'jesip-2',
    requirement: 'Communication',
    description: 'Clear communication protocols established and followed',
    category: 'Communication'
  },
  {
    id: 'jesip-3',
    requirement: 'Coordination',
    description: 'Multi-agency coordination procedures implemented',
    category: 'Coordination'
  },
  {
    id: 'jesip-4',
    requirement: 'Joint Understanding of Risk',
    description: 'Shared risk assessment and management',
    category: 'Risk Management'
  },
  {
    id: 'jesip-5',
    requirement: 'Shared Situational Awareness',
    description: 'Common operating picture maintained',
    category: 'Situational Awareness'
  }
]

export const JDM_REQUIREMENTS = [
  {
    id: 'jdm-1',
    requirement: 'Decision Making Model',
    description: 'Structured decision-making process followed',
    category: 'Decision Making'
  },
  {
    id: 'jdm-2',
    requirement: 'Information Gathering',
    description: 'Systematic information collection and verification',
    category: 'Intelligence'
  },
  {
    id: 'jdm-3',
    requirement: 'Risk Assessment',
    description: 'Dynamic risk assessment conducted',
    category: 'Risk'
  },
  {
    id: 'jdm-4',
    requirement: 'Options & Contingencies',
    description: 'Multiple options considered with contingencies',
    category: 'Planning'
  },
  {
    id: 'jdm-5',
    requirement: 'Review & Reassess',
    description: 'Continuous review and reassessment of decisions',
    category: 'Review'
  }
]

export class ComplianceReportGenerator {
  /**
   * Generate JESIP compliance report
   */
  async generateJESIPReport(
    eventId: string,
    eventName: string,
    period: { start: Date; end: Date },
    incidentLogs: any[]
  ): Promise<ComplianceReport> {
    const sections = await this.assessJESIPCompliance(incidentLogs)
    const overallScore = this.calculateOverallScore(sections)
    
    return {
      reportId: `JESIP-${Date.now()}`,
      eventId,
      eventName,
      generatedAt: new Date().toISOString(),
      reportingPeriod: period,
      standard: 'JESIP',
      overallCompliance: {
        score: overallScore,
        rating: this.getComplianceRating(overallScore),
        findings: sections.filter(s => s.status !== 'compliant').length
      },
      sections,
      auditTrail: this.generateAuditTrail(incidentLogs),
      signatures: []
    }
  }

  /**
   * Generate JDM compliance report
   */
  async generateJDMReport(
    eventId: string,
    eventName: string,
    period: { start: Date; end: Date },
    incidentLogs: any[]
  ): Promise<ComplianceReport> {
    const sections = await this.assessJDMCompliance(incidentLogs)
    const overallScore = this.calculateOverallScore(sections)
    
    return {
      reportId: `JDM-${Date.now()}`,
      eventId,
      eventName,
      generatedAt: new Date().toISOString(),
      reportingPeriod: period,
      standard: 'JDM',
      overallCompliance: {
        score: overallScore,
        rating: this.getComplianceRating(overallScore),
        findings: sections.filter(s => s.status !== 'compliant').length
      },
      sections,
      auditTrail: this.generateAuditTrail(incidentLogs),
      signatures: []
    }
  }

  private async assessJESIPCompliance(logs: any[]): Promise<ComplianceSection[]> {
    return JESIP_REQUIREMENTS.map(req => {
      const evidence = this.findEvidence(logs, req.id)
      const score = this.scoreRequirement(evidence)
      
      return {
        id: req.id,
        requirement: req.requirement,
        description: req.description,
        status: score > 80 ? 'compliant' : score > 50 ? 'partial' : 'non-compliant',
        evidence,
        score
      }
    })
  }

  private async assessJDMCompliance(logs: any[]): Promise<ComplianceSection[]> {
    return JDM_REQUIREMENTS.map(req => {
      const evidence = this.findEvidence(logs, req.id)
      const score = this.scoreRequirement(evidence)
      
      return {
        id: req.id,
        requirement: req.requirement,
        description: req.description,
        status: score > 80 ? 'compliant' : score > 50 ? 'partial' : 'non-compliant',
        evidence,
        score
      }
    })
  }

  private findEvidence(logs: any[], requirementId: string): Evidence[] {
    // Analyze logs for compliance evidence
    const evidence: Evidence[] = []
    
    // Check for contemporaneous logging (communication requirement)
    const contemporaneousRate = logs.filter(l => l.entry_type === 'contemporaneous').length / logs.length
    if (contemporaneousRate > 0.9) {
      evidence.push({
        type: 'metric',
        reference: 'contemporaneous-logging',
        description: `${(contemporaneousRate * 100).toFixed(1)}% contemporaneous logging rate`,
        timestamp: new Date().toISOString()
      })
    }

    // Check for amendment tracking (audit trail requirement)
    const amendmentTracking = logs.some(l => l.is_amended && l.amendment_reason)
    if (amendmentTracking) {
      evidence.push({
        type: 'log',
        reference: 'amendment-tracking',
        description: 'Complete amendment audit trail maintained',
        timestamp: new Date().toISOString()
      })
    }

    return evidence
  }

  private scoreRequirement(evidence: Evidence[]): number {
    if (evidence.length === 0) return 0
    if (evidence.length >= 3) return 95
    if (evidence.length >= 2) return 75
    return 50
  }

  private calculateOverallScore(sections: ComplianceSection[]): number {
    return sections.reduce((sum, s) => sum + s.score, 0) / sections.length
  }

  private getComplianceRating(score: number): ComplianceReport['overallCompliance']['rating'] {
    if (score >= 90) return 'Full Compliance'
    if (score >= 75) return 'Substantial Compliance'
    if (score >= 50) return 'Partial Compliance'
    return 'Non-Compliance'
  }

  private generateAuditTrail(logs: any[]): AuditEntry[] {
    return logs.slice(0, 10).map(log => ({
      timestamp: log.time_logged,
      action: log.is_amended ? 'LOG_AMENDED' : 'LOG_CREATED',
      user: log.logged_by_callsign,
      details: `${log.incident_type}: ${log.occurrence.slice(0, 50)}...`
    }))
  }
}

export const complianceReportGenerator = new ComplianceReportGenerator()
