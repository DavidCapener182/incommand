import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  Image,
} from '@react-pdf/renderer';

// Register enhanced fonts
Font.register({
  family: 'Inter',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTcviYw.ttf' },
    { src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTcviYw.ttf', fontWeight: 700 },
  ],
});

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Inter',
    fontSize: 10,
    padding: 24,
    backgroundColor: '#fff',
    color: '#222',
    lineHeight: 1.4,
  },
  logo: {
    width: 100,
    height: 32,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 12,
    borderBottom: '2 solid #1a237e',
  },
  title: {
    fontSize: 24,
    fontWeight: 700,
    color: '#1a237e',
  },
  timestamp: {
    fontSize: 9,
    color: '#666',
  },
  section: {
    marginBottom: 16,
    paddingBottom: 12,
    borderBottom: '1 solid #eee',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: '#1a237e',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  metricCard: {
    width: '48%',
    marginRight: '2%',
    marginBottom: 8,
    padding: 8,
    backgroundColor: '#f8f9fa',
    borderRadius: 4,
  },
  metricLabel: {
    fontSize: 8,
    color: '#666',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  metricValue: {
    fontSize: 14,
    fontWeight: 700,
    color: '#1a237e',
  },
  incidentTypes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: 8,
  },
  incidentType: {
    padding: 4,
    backgroundColor: '#e3f2fd',
    borderRadius: 4,
    fontSize: 8,
    color: '#1565c0',
  },
  lessonsLearned: {
    backgroundColor: '#fff3e0',
    padding: 12,
    borderRadius: 4,
    marginBottom: 8,
  },
  lessonsTitle: {
    fontSize: 10,
    fontWeight: 700,
    color: '#ef6c00',
    marginBottom: 6,
  },
  lesson: {
    fontSize: 9,
    color: '#333',
    marginBottom: 4,
    paddingLeft: 8,
  },
  staffEfficiency: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  efficiencyMetric: {
    textAlign: 'center',
    flex: 1,
  },
  efficiencyValue: {
    fontSize: 16,
    fontWeight: 700,
    color: '#2e7d32',
  },
  efficiencyLabel: {
    fontSize: 8,
    color: '#666',
  },
  weatherSummary: {
    backgroundColor: '#e8f5e8',
    padding: 8,
    borderRadius: 4,
  },
  table: {
    marginTop: 8,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#1a237e',
    paddingVertical: 6,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '1 solid #eee',
    paddingVertical: 4,
  },
  tableCell: {
    flex: 1,
    paddingHorizontal: 4,
    fontSize: 8,
  },
  tableCellHeader: {
    fontWeight: 700,
    color: '#fff',
  },
  tableCellLast: {
    flex: 2,
  },
  footer: {
    position: 'absolute',
    bottom: 24,
    left: 24,
    right: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTop: '1 solid #eee',
  },
  signature: {
    flex: 1,
    marginRight: 20,
  },
  signatureLabel: {
    fontSize: 9,
    fontWeight: 700,
    color: '#1a237e',
    marginBottom: 4,
  },
  signatureLine: {
    borderBottom: '1 solid #333',
    height: 20,
  },
  pageNumber: {
    fontSize: 8,
    color: '#666',
  },
  alert: {
    backgroundColor: '#ffebee',
    padding: 8,
    borderRadius: 4,
    marginBottom: 8,
  },
  alertTitle: {
    fontSize: 9,
    fontWeight: 700,
    color: '#c62828',
    marginBottom: 4,
  },
  alertText: {
    fontSize: 8,
    color: '#333',
  },
});

interface EnhancedEndOfEventPDFProps {
  logoUrl?: string;
  headOfSecurity?: string;
  eventDate?: string;
  eventName?: string;
  staffBriefedTime?: string;
  doorsOpenTime?: string;
  supportActs?: string;
  mainAct?: string;
  showdownTime?: string;
  venueClearTime?: string;
  incidentSummary?: string;
  logs?: any[];
  incidentReportFileName?: string;
  signatureType?: string;
  signatureScribble?: string;
  // Enhanced props
  metrics?: {
    totalIncidents: number;
    averageResponseTime: string;
    resolutionRate: number;
    staffEfficiency: number;
    crowdDensity: string;
  };
  topIncidentTypes?: Array<{
    type: string;
    count: number;
    percentage: number;
  }>;
  lessonsLearned?: string[];
  aiInsights?: {
    anomalies: string[];
    recommendations: string[];
    confidence: number;
  };
  weatherSummary?: {
    temperature: string;
    conditions: string;
    impact: string;
  };
  staffPerformance?: {
    totalStaff: number;
    averageResponseTime: string;
    incidentsPerStaff: number;
    efficiencyScore: number;
  };
  venueType?: string;
  benchmarking?: {
    percentile: number;
    comparison: string;
    metrics: Record<string, { current: number; average: number }>;
  };
}

const EnhancedEndOfEventPDF = ({
  logoUrl = '/inCommand.png',
  headOfSecurity,
  eventDate,
  eventName,
  staffBriefedTime,
  doorsOpenTime,
  supportActs,
  mainAct,
  showdownTime,
  venueClearTime,
  incidentSummary,
  logs = [],
  incidentReportFileName,
  signatureType,
  signatureScribble,
  metrics,
  topIncidentTypes = [],
  lessonsLearned = [],
  aiInsights,
  weatherSummary,
  staffPerformance,
  venueType,
  benchmarking,
}: EnhancedEndOfEventPDFProps) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Enhanced Header */}
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Image src={logoUrl} style={styles.logo} />
          <Text style={[styles.title, { marginLeft: 12 }]}>
            End of Event Report
          </Text>
        </View>
        <Text style={styles.timestamp}>
          Generated: {new Date().toLocaleString()}
        </Text>
      </View>

      {/* Key Metrics Dashboard */}
      {metrics && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Event Performance Metrics</Text>
          <View style={styles.metricsGrid}>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Total Incidents</Text>
              <Text style={styles.metricValue}>{metrics.totalIncidents}</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Avg Response Time</Text>
              <Text style={styles.metricValue}>{metrics.averageResponseTime}</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Resolution Rate</Text>
              <Text style={styles.metricValue}>{metrics.resolutionRate}%</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Staff Efficiency</Text>
              <Text style={styles.metricValue}>{metrics.staffEfficiency}/100</Text>
            </View>
          </View>
        </View>
      )}

      {/* Top Incident Types */}
      {topIncidentTypes.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Top 3 Incident Types</Text>
          <View style={styles.incidentTypes}>
            {topIncidentTypes.slice(0, 3).map((incident, index) => (
              <View key={index} style={styles.incidentType}>
                <Text>{incident.type} ({incident.count})</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* AI Insights & Lessons Learned */}
      {(lessonsLearned.length > 0 || aiInsights) && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>AI Insights & Lessons Learned</Text>
          
          {lessonsLearned.length > 0 && (
            <View style={styles.lessonsLearned}>
              <Text style={styles.lessonsTitle}>Key Lessons Learned:</Text>
              {lessonsLearned.map((lesson, index) => (
                <Text key={index} style={styles.lesson}>
                  • {lesson}
                </Text>
              ))}
            </View>
          )}

          {aiInsights && aiInsights.anomalies.length > 0 && (
            <View style={styles.alert}>
              <Text style={styles.alertTitle}>
                AI Detected Anomalies (Confidence: {aiInsights.confidence}%)
              </Text>
              {aiInsights.anomalies.map((anomaly, index) => (
                <Text key={index} style={styles.alertText}>
                  • {anomaly}
                </Text>
              ))}
            </View>
          )}

          {aiInsights && aiInsights.recommendations.length > 0 && (
            <View style={styles.lessonsLearned}>
              <Text style={styles.lessonsTitle}>AI Recommendations:</Text>
              {aiInsights.recommendations.map((rec, index) => (
                <Text key={index} style={styles.lesson}>
                  • {rec}
                </Text>
              ))}
            </View>
          )}
        </View>
      )}

      {/* Staff Performance */}
      {staffPerformance && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Staff Performance Summary</Text>
          <View style={styles.staffEfficiency}>
            <View style={styles.efficiencyMetric}>
              <Text style={styles.efficiencyValue}>{staffPerformance.totalStaff}</Text>
              <Text style={styles.efficiencyLabel}>Total Staff</Text>
            </View>
            <View style={styles.efficiencyMetric}>
              <Text style={styles.efficiencyValue}>{staffPerformance.averageResponseTime}</Text>
              <Text style={styles.efficiencyLabel}>Avg Response</Text>
            </View>
            <View style={styles.efficiencyMetric}>
              <Text style={styles.efficiencyValue}>{staffPerformance.incidentsPerStaff}</Text>
              <Text style={styles.efficiencyLabel}>Incidents/Staff</Text>
            </View>
            <View style={styles.efficiencyMetric}>
              <Text style={styles.efficiencyValue}>{staffPerformance.efficiencyScore}/100</Text>
              <Text style={styles.efficiencyLabel}>Efficiency</Text>
            </View>
          </View>
        </View>
      )}

      {/* Weather Impact */}
      {weatherSummary && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Weather Impact</Text>
          <View style={styles.weatherSummary}>
            <Text style={styles.metricLabel}>Temperature: {weatherSummary.temperature}</Text>
            <Text style={styles.metricLabel}>Conditions: {weatherSummary.conditions}</Text>
            <Text style={styles.metricLabel}>Impact: {weatherSummary.impact}</Text>
          </View>
        </View>
      )}

      {/* Benchmarking */}
      {benchmarking && venueType && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Benchmarking vs {venueType} Events
          </Text>
          <Text style={styles.metricLabel}>
            Performance: {benchmarking.percentile}th percentile
          </Text>
          <Text style={styles.metricLabel}>
            {benchmarking.comparison}
          </Text>
        </View>
      )}

      {/* Event Details */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Event Details</Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <View style={{ flex: 1 }}>
            <Text style={styles.metricLabel}>Head of Security</Text>
            <Text style={styles.metricValue}>{headOfSecurity || '-'}</Text>
            
            <Text style={styles.metricLabel}>Event Date</Text>
            <Text style={styles.metricValue}>{eventDate || '-'}</Text>
            
            <Text style={styles.metricLabel}>Event Name</Text>
            <Text style={styles.metricValue}>{eventName || '-'}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.metricLabel}>Doors Open</Text>
            <Text style={styles.metricValue}>{doorsOpenTime || '-'}</Text>
            
            <Text style={styles.metricLabel}>Showdown</Text>
            <Text style={styles.metricValue}>{showdownTime || '-'}</Text>
            
            <Text style={styles.metricLabel}>Venue Clear</Text>
            <Text style={styles.metricValue}>{venueClearTime || '-'}</Text>
          </View>
        </View>
      </View>

      {/* Incident Summary */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Incident Summary</Text>
        <Text style={styles.metricValue}>{incidentSummary || 'No incidents reported'}</Text>
      </View>

      {/* Detailed Incident Log */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Detailed Incident Log</Text>
        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={[styles.tableCell, styles.tableCellHeader]}>Type</Text>
            <Text style={[styles.tableCell, styles.tableCellHeader]}>Time</Text>
            <Text style={[styles.tableCell, styles.tableCellHeader, styles.tableCellLast]}>Details</Text>
          </View>
          {logs.length > 0 ? (
            logs.map((log: any, idx: number) => (
              <View key={idx} style={styles.tableRow}>
                <Text style={styles.tableCell}>{log.type}</Text>
                <Text style={styles.tableCell}>{log.time}</Text>
                <Text style={[styles.tableCell, styles.tableCellLast]}>{log.details}</Text>
              </View>
            ))
          ) : (
            <View style={styles.tableRow}>
              <Text style={styles.tableCell}>-</Text>
              <Text style={styles.tableCell}>-</Text>
              <Text style={[styles.tableCell, styles.tableCellLast]}>No incidents logged</Text>
            </View>
          )}
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.signature}>
          <Text style={styles.signatureLabel}>Head of Security Signature</Text>
          <View style={styles.signatureLine} />
        </View>
        <Text style={styles.pageNumber}>Page 1 of 1</Text>
      </View>
    </Page>
  </Document>
);

export default EnhancedEndOfEventPDF;
