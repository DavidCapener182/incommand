/**
 * Report Generation System
 * PDF/CSV/JSON export functionality for analytics and compliance reports
 */

import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { LogQualityMetrics } from './logQualityMetrics'
import type { ComplianceMetrics } from './complianceMetrics'
import type { PerformanceMetrics } from './performanceMetrics'

export interface ReportOptions {
  format: 'pdf' | 'csv' | 'json'
  dateRange: {
    start: Date
    end: Date
  }
  eventName?: string
  includeSections: {
    executiveSummary: boolean
    logQuality: boolean
    compliance: boolean
    performance: boolean
    recommendations: boolean
  }
  branding?: {
    logo?: string
    companyName?: string
    primaryColor?: string
  }
}

export interface ReportData {
  quality?: LogQualityMetrics
  compliance?: ComplianceMetrics
  performance?: PerformanceMetrics
  aiSummary?: string
}

/**
 * Generate comprehensive analytics report
 */
export async function generateReport(
  data: ReportData,
  options: ReportOptions
): Promise<Blob | string> {
  switch (options.format) {
    case 'pdf':
      return generatePDFReport(data, options)
    case 'csv':
      return generateCSVReport(data, options)
    case 'json':
      return generateJSONReport(data, options)
    default:
      throw new Error(`Unsupported format: ${options.format}`)
  }
}

/**
 * Generate PDF report with charts and tables
 */
async function generatePDFReport(
  data: ReportData,
  options: ReportOptions
): Promise<Blob> {
  const doc = new jsPDF()
  const primaryColor = options.branding?.primaryColor || '#3B82F6'
  let yPosition = 20

  // Header
  doc.setFontSize(24)
  doc.setTextColor(primaryColor)
  doc.text('Analytics Report', 20, yPosition)
  yPosition += 10

  // Company name
  if (options.branding?.companyName) {
    doc.setFontSize(12)
    doc.setTextColor('#6B7280')
    doc.text(options.branding.companyName, 20, yPosition)
    yPosition += 10
  }

  // Date range
  doc.setFontSize(10)
  doc.setTextColor('#6B7280')
  const dateStr = `${options.dateRange.start.toLocaleDateString()} - ${options.dateRange.end.toLocaleDateString()}`
  doc.text(dateStr, 20, yPosition)
  yPosition += 5

  if (options.eventName) {
    doc.text(`Event: ${options.eventName}`, 20, yPosition)
    yPosition += 10
  } else {
    yPosition += 5
  }

  // Divider line
  doc.setDrawColor('#E5E7EB')
  doc.line(20, yPosition, 190, yPosition)
  yPosition += 10

  // Executive Summary
  if (options.includeSections.executiveSummary && data.aiSummary) {
    doc.setFontSize(16)
    doc.setTextColor('#000000')
    doc.text('Executive Summary', 20, yPosition)
    yPosition += 8

    doc.setFontSize(10)
    doc.setTextColor('#374151')
    const summaryLines = doc.splitTextToSize(data.aiSummary, 170)
    doc.text(summaryLines, 20, yPosition)
    yPosition += summaryLines.length * 5 + 10
  }

  // Check if new page needed
  if (yPosition > 250) {
    doc.addPage()
    yPosition = 20
  }

  // Log Quality Section
  if (options.includeSections.logQuality && data.quality) {
    doc.setFontSize(16)
    doc.setTextColor('#000000')
    doc.text('Log Quality Metrics', 20, yPosition)
    yPosition += 8

    // Quality score card
    doc.setFillColor('#EFF6FF')
    doc.roundedRect(20, yPosition, 80, 30, 3, 3, 'F')
    
    doc.setFontSize(10)
    doc.setTextColor('#6B7280')
    doc.text('Overall Quality Score', 25, yPosition + 8)
    
    doc.setFontSize(32)
    const scoreColor = getScoreColor(data.quality.overallScore)
    doc.setTextColor(scoreColor)
    doc.text(`${data.quality.overallScore}`, 25, yPosition + 20)
    
    doc.setFontSize(12)
    doc.setTextColor('#6B7280')
    doc.text('/100', 45, yPosition + 20)

    yPosition += 40

    // Quality breakdown table
    const qualityTableData = [
      ['Metric', 'Score'],
      ['Completeness', `${data.quality.completeness}/100`],
      ['Timeliness', `${data.quality.timeliness}/100`],
      ['Factual Language', `${data.quality.factualLanguage}/100`],
      ['Amendment Rate', `${data.quality.amendmentRate.toFixed(1)}%`],
      ['Retrospective Rate', `${data.quality.retrospectiveRate.toFixed(1)}%`]
    ]

    autoTable(doc, {
      startY: yPosition,
      head: [qualityTableData[0]],
      body: qualityTableData.slice(1),
      theme: 'grid',
      headStyles: { fillColor: primaryColor },
      margin: { left: 20 }
    })

    yPosition = (doc as any).lastAutoTable.finalY + 10
  }

  // Check if new page needed
  if (yPosition > 230) {
    doc.addPage()
    yPosition = 20
  }

  // Compliance Section
  if (options.includeSections.compliance && data.compliance) {
    doc.setFontSize(16)
    doc.setTextColor('#000000')
    doc.text('JESIP/JDM Compliance', 20, yPosition)
    yPosition += 8

    // Compliance grade card
    doc.setFillColor('#ECFDF5')
    doc.roundedRect(20, yPosition, 80, 30, 3, 3, 'F')
    
    doc.setFontSize(10)
    doc.setTextColor('#6B7280')
    doc.text('Legal Readiness Grade', 25, yPosition + 8)
    
    doc.setFontSize(48)
    const gradeColor = getGradeColor(data.compliance.legalReadinessScore)
    doc.setTextColor(gradeColor)
    doc.text(data.compliance.legalReadinessScore, 25, yPosition + 25)

    yPosition += 40

    // Compliance breakdown table
    const complianceTableData = [
      ['Metric', 'Score'],
      ['Overall Compliance', `${data.compliance.overallCompliance.toFixed(1)}%`],
      ['Audit Trail Completeness', `${data.compliance.auditTrailCompleteness.toFixed(1)}%`],
      ['Immutability Score', `${data.compliance.immutabilityScore.toFixed(1)}%`],
      ['Timestamp Accuracy', `${data.compliance.timestampAccuracy.toFixed(1)}%`],
      ['Amendment Justification', `${data.compliance.amendmentJustificationRate.toFixed(1)}%`]
    ]

    autoTable(doc, {
      startY: yPosition,
      head: [complianceTableData[0]],
      body: complianceTableData.slice(1),
      theme: 'grid',
      headStyles: { fillColor: '#10B981' },
      margin: { left: 20 }
    })

    yPosition = (doc as any).lastAutoTable.finalY + 10
  }

  // Check if new page needed
  if (yPosition > 230) {
    doc.addPage()
    yPosition = 20
  }

  // Performance Section
  if (options.includeSections.performance && data.performance) {
    doc.setFontSize(16)
    doc.setTextColor('#000000')
    doc.text('Performance Metrics', 20, yPosition)
    yPosition += 8

    const perfTableData = [
      ['Metric', 'Value'],
      ['Total Incidents', `${data.performance.totalIncidents}`],
      ['Closed Incidents', `${data.performance.closedIncidents}`],
      ['Avg Response Time', `${data.performance.averageResponseTime} min`],
      ['Avg Resolution Time', `${data.performance.averageResolutionTime} min`],
      ['Response Quality', `${data.performance.responseQuality}%`],
      ['Incidents/Hour', `${data.performance.averageIncidentsPerHour.toFixed(1)}`]
    ]

    autoTable(doc, {
      startY: yPosition,
      head: [perfTableData[0]],
      body: perfTableData.slice(1),
      theme: 'grid',
      headStyles: { fillColor: '#8B5CF6' },
      margin: { left: 20 }
    })

    yPosition = (doc as any).lastAutoTable.finalY + 10
  }

  // Recommendations
  if (options.includeSections.recommendations && data.compliance?.recommendations) {
    // Check if new page needed
    if (yPosition > 220) {
      doc.addPage()
      yPosition = 20
    }

    doc.setFontSize(16)
    doc.setTextColor('#000000')
    doc.text('Recommendations', 20, yPosition)
    yPosition += 8

    doc.setFontSize(10)
    doc.setTextColor('#374151')
    data.compliance.recommendations.forEach((rec, index) => {
      const lines = doc.splitTextToSize(`${index + 1}. ${rec}`, 170)
      doc.text(lines, 25, yPosition)
      yPosition += lines.length * 5 + 3
    })
  }

  // Footer
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor('#9CA3AF')
    doc.text(
      `Generated ${new Date().toLocaleString()} | Page ${i} of ${pageCount}`,
      20,
      285
    )
  }

  return doc.output('blob')
}

/**
 * Generate CSV export
 */
async function generateCSVReport(
  data: ReportData,
  options: ReportOptions
): Promise<string> {
  const rows: string[][] = []

  // Header
  rows.push(['Analytics Report'])
  rows.push([`Date Range: ${options.dateRange.start.toLocaleDateString()} - ${options.dateRange.end.toLocaleDateString()}`])
  if (options.eventName) {
    rows.push([`Event: ${options.eventName}`])
  }
  rows.push([])

  // Log Quality
  if (options.includeSections.logQuality && data.quality) {
    rows.push(['LOG QUALITY METRICS'])
    rows.push(['Metric', 'Score'])
    rows.push(['Overall Score', `${data.quality.overallScore}`])
    rows.push(['Completeness', `${data.quality.completeness}`])
    rows.push(['Timeliness', `${data.quality.timeliness}`])
    rows.push(['Factual Language', `${data.quality.factualLanguage}`])
    rows.push(['Amendment Rate', `${data.quality.amendmentRate.toFixed(1)}%`])
    rows.push(['Retrospective Rate', `${data.quality.retrospectiveRate.toFixed(1)}%`])
    rows.push(['Total Logs', `${data.quality.totalLogs}`])
    rows.push([])
  }

  // Compliance
  if (options.includeSections.compliance && data.compliance) {
    rows.push(['COMPLIANCE METRICS'])
    rows.push(['Metric', 'Score'])
    rows.push(['Legal Readiness Grade', data.compliance.legalReadinessScore])
    rows.push(['Overall Compliance', `${data.compliance.overallCompliance.toFixed(1)}%`])
    rows.push(['Audit Trail', `${data.compliance.auditTrailCompleteness.toFixed(1)}%`])
    rows.push(['Immutability', `${data.compliance.immutabilityScore.toFixed(1)}%`])
    rows.push(['Timestamps', `${data.compliance.timestampAccuracy.toFixed(1)}%`])
    rows.push(['Justifications', `${data.compliance.amendmentJustificationRate.toFixed(1)}%`])
    rows.push([])
  }

  // Performance
  if (options.includeSections.performance && data.performance) {
    rows.push(['PERFORMANCE METRICS'])
    rows.push(['Metric', 'Value'])
    rows.push(['Total Incidents', `${data.performance.totalIncidents}`])
    rows.push(['Closed Incidents', `${data.performance.closedIncidents}`])
    rows.push(['Avg Response Time', `${data.performance.averageResponseTime} min`])
    rows.push(['Avg Resolution Time', `${data.performance.averageResolutionTime} min`])
    rows.push(['Response Quality', `${data.performance.responseQuality}%`])
    rows.push(['Incidents/Hour', `${data.performance.averageIncidentsPerHour.toFixed(1)}`])
    rows.push([])
  }

  return rows.map(row => row.join(',')).join('\n')
}

/**
 * Generate JSON export
 */
async function generateJSONReport(
  data: ReportData,
  options: ReportOptions
): Promise<string> {
  const report = {
    generatedAt: new Date().toISOString(),
    dateRange: {
      start: options.dateRange.start.toISOString(),
      end: options.dateRange.end.toISOString()
    },
    eventName: options.eventName,
    quality: options.includeSections.logQuality ? data.quality : undefined,
    compliance: options.includeSections.compliance ? data.compliance : undefined,
    performance: options.includeSections.performance ? data.performance : undefined,
    aiSummary: options.includeSections.executiveSummary ? data.aiSummary : undefined
  }

  return JSON.stringify(report, null, 2)
}

/**
 * Helper: Get color for quality score
 */
function getScoreColor(score: number): string {
  if (score >= 90) return '#10B981'
  if (score >= 75) return '#3B82F6'
  if (score >= 60) return '#F59E0B'
  return '#EF4444'
}

/**
 * Helper: Get color for compliance grade
 */
function getGradeColor(grade: string): string {
  const colors: Record<string, string> = {
    'A': '#10B981',
    'B': '#3B82F6',
    'C': '#F59E0B',
    'D': '#F97316',
    'F': '#EF4444'
  }
  return colors[grade] || '#6B7280'
}

/**
 * Download report as file
 */
export function downloadReport(content: Blob | string, filename: string, format: 'pdf' | 'csv' | 'json') {
  const blob = content instanceof Blob ? content : new Blob([content], {
    type: format === 'pdf' ? 'application/pdf' : format === 'csv' ? 'text/csv' : 'application/json'
  })

  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

