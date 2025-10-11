// Event Report Generator - Simplified version without PDF generation
// PDF functionality will be restored once dependency issues are resolved

export interface EventReportData {
  event: {
    id: string
    name: string
    event_date: string
    venue_name: string
    description?: string
  }
  metrics: {
    totalIncidents: number
    resolvedIncidents: number
    averageResponseTime: number
    averageResolutionTime: number
    qualityScore: number
    complianceScore: number
  }
  insights: {
    patterns: string[]
    anomalies: string[]
    trends: string[]
    recommendations: string[]
  }
  lessonsLearned: {
    whatWorked: string[]
    whatDidntWork: string[]
    improvements: string[]
    impact: 'low' | 'medium' | 'high'
  }[]
}

export interface EventReportOptions {
  includeCharts: boolean
  includeDetailedMetrics: boolean
  includeAIInsights: boolean
  branding?: {
    companyName?: string
    logoUrl?: string
  }
}

// Generate a comprehensive event report
export async function generateEventReport(
  eventId: string,
  options: EventReportOptions = {
    includeCharts: true,
    includeDetailedMetrics: true,
    includeAIInsights: true,
  }
): Promise<EventReportData> {
  try {
    // Mock data for now - will be replaced with real data fetching
    const mockData: EventReportData = {
      event: {
        id: eventId,
        name: 'Sample Event',
        event_date: new Date().toISOString(),
        venue_name: 'Sample Venue',
        description: 'A sample event for testing purposes',
      },
      metrics: {
        totalIncidents: 25,
        resolvedIncidents: 23,
        averageResponseTime: 4.2,
        averageResolutionTime: 12.5,
        qualityScore: 8.7,
        complianceScore: 95.2,
      },
      insights: {
        patterns: [
          'Peak incident activity occurred during evening hours (7-9 PM)',
          'Most incidents were resolved within 15 minutes',
          'Crowd control incidents were most common during peak attendance',
        ],
        anomalies: [
          'Unusual spike in medical incidents at 8:30 PM',
          'Longer than average resolution time for technical issues',
        ],
        trends: [
          'Overall incident rate decreased by 15% compared to previous events',
          'Response times improved by 20% with new communication protocols',
          'Staff efficiency increased by 25% with better training',
        ],
        recommendations: [
          'Increase medical staff during peak hours',
          'Implement pre-event technical checks',
          'Continue current communication protocols',
          'Consider additional crowd control measures for large events',
        ],
      },
      lessonsLearned: [
        {
          whatWorked: [
            'New communication system improved response times',
            'Additional security cameras provided better coverage',
            'Staff training on new procedures was effective',
          ],
          whatDidntWork: [
            'Medical response was slower during peak hours',
            'Technical issues caused delays in some areas',
          ],
          improvements: [
            'Add more medical personnel during peak hours',
            'Implement pre-event technical equipment checks',
            'Create backup communication channels',
          ],
          impact: 'high',
        },
      ],
    }

    return mockData
  } catch (error) {
    console.error('Error generating event report:', error)
    throw new Error('Failed to generate event report')
  }
}

// Download report as various formats
export async function downloadReport(
  data: EventReportData,
  format: 'pdf' | 'excel' | 'csv' = 'pdf'
): Promise<void> {
  try {
    switch (format) {
      case 'pdf':
        // PDF generation temporarily disabled due to dependency issues
        console.log('PDF generation temporarily disabled')
        alert('PDF generation is temporarily disabled due to dependency issues. Please try Excel or CSV export.')
        break
      
      case 'excel':
        // Generate Excel file
        const excelData = generateExcelData(data)
        downloadFile(excelData, `event-report-${data.event.id}.xlsx`, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        break
      
      case 'csv':
        // Generate CSV file
        const csvData = generateCSVData(data)
        downloadFile(csvData, `event-report-${data.event.id}.csv`, 'text/csv')
        break
      
      default:
        throw new Error(`Unsupported format: ${format}`)
    }
  } catch (error) {
    console.error('Error downloading report:', error)
    throw new Error('Failed to download report')
  }
}

// Generate Excel data (simplified)
function generateExcelData(data: EventReportData): string {
  const rows = [
    ['Event Report', data.event.name],
    ['Event Date', new Date(data.event.event_date).toLocaleDateString()],
    ['Venue', data.event.venue_name],
    [''],
    ['Metrics'],
    ['Total Incidents', data.metrics.totalIncidents],
    ['Resolved Incidents', data.metrics.resolvedIncidents],
    ['Average Response Time (min)', data.metrics.averageResponseTime],
    ['Average Resolution Time (min)', data.metrics.averageResolutionTime],
    ['Quality Score', data.metrics.qualityScore],
    ['Compliance Score', data.metrics.complianceScore],
    [''],
    ['AI Insights'],
    ['Patterns'],
    ...data.insights.patterns.map(pattern => ['', pattern]),
    ['Anomalies'],
    ...data.insights.anomalies.map(anomaly => ['', anomaly]),
    ['Trends'],
    ...data.insights.trends.map(trend => ['', trend]),
    ['Recommendations'],
    ...data.insights.recommendations.map(rec => ['', rec]),
    [''],
    ['Lessons Learned'],
    ...data.lessonsLearned.flatMap(lesson => [
      ['What Worked'],
      ...lesson.whatWorked.map(item => ['', item]),
      ['What Didn\'t Work'],
      ...lesson.whatDidntWork.map(item => ['', item]),
      ['Improvements'],
      ...lesson.improvements.map(item => ['', item]),
      ['Impact', lesson.impact],
      ['']
    ])
  ]
  
  return rows.map(row => row.join(',')).join('\n')
}

// Generate CSV data
function generateCSVData(data: EventReportData): string {
  return generateExcelData(data) // Same format for simplicity
}

// Download file helper
function downloadFile(data: string, filename: string, mimeType: string): void {
  const blob = new Blob([data], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

// Export placeholder for PDF component (will be restored later)
export const EventReportPDF = null
