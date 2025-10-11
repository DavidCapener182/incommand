import { Document, Page, Text, View, StyleSheet, PDFDownloadLink, Font } from '@react-pdf/renderer'

// Register fonts for better PDF rendering
Font.register({
  family: 'Roboto',
  fonts: [
    {
      src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-light-webfont.ttf',
      fontWeight: 300,
    },
    {
      src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf',
      fontWeight: 400,
    },
    {
      src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-medium-webfont.ttf',
      fontWeight: 500,
    },
    {
      src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf',
      fontWeight: 700,
    },
  ],
})

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 30,
    fontFamily: 'Roboto',
    fontSize: 10,
    lineHeight: 1.4,
  },
  header: {
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 2,
    borderBottomColor: '#3B82F6',
  },
  title: {
    fontSize: 24,
    fontWeight: 700,
    color: '#1F2937',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 10,
  },
  companyName: {
    fontSize: 10,
    color: '#9CA3AF',
    fontWeight: 500,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 600,
    color: '#1F2937',
    marginBottom: 10,
    paddingBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  metricCard: {
    width: '30%',
    padding: 10,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  metricTitle: {
    fontSize: 10,
    fontWeight: 500,
    color: '#6B7280',
    marginBottom: 5,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: 700,
    color: '#1F2937',
  },
  insightsBox: {
    backgroundColor: '#F3F4F6',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
  },
  insightsTitle: {
    fontSize: 12,
    fontWeight: 600,
    color: '#1F2937',
    marginBottom: 8,
  },
  insightsText: {
    fontSize: 10,
    color: '#4B5563',
    lineHeight: 1.5,
  },
  listContainer: {
    marginBottom: 15,
  },
  listTitle: {
    fontSize: 11,
    fontWeight: 600,
    color: '#1F2937',
    marginBottom: 8,
  },
  listItem: {
    fontSize: 10,
    color: '#4B5563',
    marginBottom: 4,
    paddingLeft: 10,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: 'center',
    fontSize: 8,
    color: '#9CA3AF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 10,
  },
})

export interface EventReportData {
  event: {
    id: string
    name: string
    event_date: string
    start_time: string
    end_time: string
    venue_name: string
    max_capacity: number
    actual_attendance?: number
    status: string
  }
  incidents: {
    total: number
    byType: Record<string, number>
    byPriority: Record<string, number>
    avgResponseTime: number
    resolved: number
    open: number
  }
  staff: {
    totalStaff: number
    assignedPositions: number
    radioSignouts: number
    avgResponseTime: number
    efficiencyScore: number
  }
  lessonsLearned: {
    strengths: string[]
    improvements: string[]
    recommendations: string[]
    confidence: number
  }
  aiInsights: string
}

export interface EventReportOptions {
  format: 'pdf' | 'html' | 'json'
  includeCharts?: boolean
  includeRecommendations?: boolean
  branding?: {
    companyName?: string
    logoUrl?: string
  }
}

const EventReportPDF = ({ data, options }: { data: EventReportData; options: EventReportOptions }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>End-of-Event Report</Text>
        <Text style={styles.subtitle}>{data.event.name}</Text>
        <Text style={styles.subtitle}>
          {new Date(data.event.event_date).toLocaleDateString()} • {data.event.venue_name}
        </Text>
        {options.branding?.companyName && (
          <Text style={styles.companyName}>{options.branding.companyName}</Text>
        )}
      </View>

      {/* Executive Summary */}
      {data.aiInsights && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Executive Summary</Text>
          <View style={styles.insightsBox}>
            <Text style={styles.insightsText}>{data.aiInsights}</Text>
          </View>
        </View>
      )}

      {/* Key Metrics */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Key Performance Metrics</Text>
        <View style={styles.metricsGrid}>
          <View style={styles.metricCard}>
            <Text style={styles.metricTitle}>Total Incidents</Text>
            <Text style={styles.metricValue}>{data.incidents.total}</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricTitle}>Resolution Rate</Text>
            <Text style={styles.metricValue}>
              {data.incidents.total > 0 
                ? Math.round((data.incidents.resolved / data.incidents.total) * 100)
                : 0}%
            </Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricTitle}>Avg Response Time</Text>
            <Text style={styles.metricValue}>{data.incidents.avgResponseTime.toFixed(1)}m</Text>
          </View>
        </View>
      </View>

      {/* Staff Performance */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Staff Performance</Text>
        <View style={styles.metricsGrid}>
          <View style={styles.metricCard}>
            <Text style={styles.metricTitle}>Positions Assigned</Text>
            <Text style={styles.metricValue}>{data.staff.assignedPositions}</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricTitle}>Radio Sign-outs</Text>
            <Text style={styles.metricValue}>{data.staff.radioSignouts}</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricTitle}>Efficiency Score</Text>
            <Text style={styles.metricValue}>{data.staff.efficiencyScore.toFixed(0)}%</Text>
          </View>
        </View>
      </View>

      {/* Lessons Learned */}
      {options.includeRecommendations && data.lessonsLearned && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Lessons Learned</Text>
          
          <View style={styles.listContainer}>
            <Text style={styles.listTitle}>Strengths</Text>
            {data.lessonsLearned.strengths.map((strength, index) => (
              <Text key={index} style={styles.listItem}>• {strength}</Text>
            ))}
          </View>

          <View style={styles.listContainer}>
            <Text style={styles.listTitle}>Areas for Improvement</Text>
            {data.lessonsLearned.improvements.map((improvement, index) => (
              <Text key={index} style={styles.listItem}>• {improvement}</Text>
            ))}
          </View>

          <View style={styles.listContainer}>
            <Text style={styles.listTitle}>Recommendations</Text>
            {data.lessonsLearned.recommendations.map((recommendation, index) => (
              <Text key={index} style={styles.listItem}>• {recommendation}</Text>
            ))}
          </View>
        </View>
      )}

      {/* Footer */}
      <Text style={styles.footer}>
        Generated on {new Date().toLocaleDateString()} • Confidence Score: {data.lessonsLearned.confidence}%
      </Text>
    </Page>
  </Document>
)

export async function generateEventReport(
  data: EventReportData, 
  options: EventReportOptions
): Promise<Blob> {
  try {
    if (options.format === 'pdf') {
      // For PDF generation, we'll use the React PDF approach
      // This would typically be done on the server side
      // For now, we'll return a mock PDF blob
      const pdfContent = JSON.stringify({ data, options })
      return new Blob([pdfContent], { type: 'application/pdf' })
    } else if (options.format === 'html') {
      const htmlContent = generateHTMLReport(data, options)
      return new Blob([htmlContent], { type: 'text/html' })
    } else if (options.format === 'json') {
      const jsonContent = JSON.stringify({ data, options }, null, 2)
      return new Blob([jsonContent], { type: 'application/json' })
    }
    
    throw new Error('Unsupported format')
  } catch (error) {
    console.error('Error generating report:', error)
    throw error
  }
}

function generateHTMLReport(data: EventReportData, options: EventReportOptions): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Event Report - ${data.event.name}</title>
    <style>
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            max-width: 800px; 
            margin: 0 auto; 
            padding: 20px;
            background: #f9f9f9;
        }
        .header { 
            background: #3B82F6; 
            color: white; 
            padding: 30px; 
            border-radius: 8px; 
            margin-bottom: 30px;
            text-align: center;
        }
        .header h1 { margin: 0; font-size: 28px; }
        .header p { margin: 5px 0 0; opacity: 0.9; }
        .section { 
            background: white; 
            padding: 25px; 
            margin-bottom: 20px; 
            border-radius: 8px; 
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .section h2 { 
            color: #3B82F6; 
            border-bottom: 2px solid #E5E7EB; 
            padding-bottom: 10px; 
            margin-bottom: 20px;
        }
        .metrics-grid { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); 
            gap: 20px; 
            margin-bottom: 20px;
        }
        .metric-card { 
            background: #F9FAFB; 
            padding: 20px; 
            border-radius: 8px; 
            text-align: center;
            border: 1px solid #E5E7EB;
        }
        .metric-value { 
            font-size: 24px; 
            font-weight: bold; 
            color: #1F2937; 
            margin-bottom: 5px;
        }
        .metric-label { 
            color: #6B7280; 
            font-size: 14px;
        }
        .insights-box { 
            background: #F3F4F6; 
            padding: 20px; 
            border-radius: 8px; 
            border-left: 4px solid #3B82F6;
            margin: 15px 0;
        }
        .list-section { 
            margin: 20px 0;
        }
        .list-title { 
            font-weight: 600; 
            color: #1F2937; 
            margin-bottom: 10px;
        }
        .list-item { 
            margin: 8px 0; 
            padding-left: 15px;
        }
        .footer { 
            text-align: center; 
            color: #9CA3AF; 
            margin-top: 40px; 
            padding-top: 20px; 
            border-top: 1px solid #E5E7EB;
        }
        .strengths { border-left-color: #10B981; }
        .improvements { border-left-color: #F59E0B; }
        .recommendations { border-left-color: #8B5CF6; }
    </style>
</head>
<body>
    <div class="header">
        <h1>End-of-Event Report</h1>
        <p>${data.event.name}</p>
        <p>${new Date(data.event.event_date).toLocaleDateString()} • ${data.event.venue_name}</p>
        ${options.branding?.companyName ? `<p><small>${options.branding.companyName}</small></p>` : ''}
    </div>

    ${data.aiInsights ? `
    <div class="section">
        <h2>Executive Summary</h2>
        <div class="insights-box">
            <p>${data.aiInsights}</p>
        </div>
    </div>
    ` : ''}

    <div class="section">
        <h2>Key Performance Metrics</h2>
        <div class="metrics-grid">
            <div class="metric-card">
                <div class="metric-value">${data.incidents.total}</div>
                <div class="metric-label">Total Incidents</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${data.incidents.total > 0 ? Math.round((data.incidents.resolved / data.incidents.total) * 100) : 0}%</div>
                <div class="metric-label">Resolution Rate</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${data.incidents.avgResponseTime.toFixed(1)}m</div>
                <div class="metric-label">Avg Response Time</div>
            </div>
        </div>
    </div>

    <div class="section">
        <h2>Staff Performance</h2>
        <div class="metrics-grid">
            <div class="metric-card">
                <div class="metric-value">${data.staff.assignedPositions}</div>
                <div class="metric-label">Positions Assigned</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${data.staff.radioSignouts}</div>
                <div class="metric-label">Radio Sign-outs</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${data.staff.efficiencyScore.toFixed(0)}%</div>
                <div class="metric-label">Efficiency Score</div>
            </div>
        </div>
    </div>

    ${options.includeRecommendations && data.lessonsLearned ? `
    <div class="section">
        <h2>Lessons Learned</h2>
        
        <div class="list-section">
            <div class="list-title">Strengths</div>
            ${data.lessonsLearned.strengths.map(strength => `<div class="list-item">• ${strength}</div>`).join('')}
        </div>

        <div class="list-section">
            <div class="list-title">Areas for Improvement</div>
            ${data.lessonsLearned.improvements.map(improvement => `<div class="list-item">• ${improvement}</div>`).join('')}
        </div>

        <div class="list-section">
            <div class="list-title">Recommendations</div>
            ${data.lessonsLearned.recommendations.map(recommendation => `<div class="list-item">• ${recommendation}</div>`).join('')}
        </div>
    </div>
    ` : ''}

    <div class="footer">
        <p>Generated on ${new Date().toLocaleDateString()} • Confidence Score: ${data.lessonsLearned.confidence}%</p>
    </div>
</body>
</html>
  `
}

export { EventReportPDF }
