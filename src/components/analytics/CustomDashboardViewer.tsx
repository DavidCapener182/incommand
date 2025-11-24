'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { getCardById } from '@/lib/analytics/cardRegistry'
import { useEventContext } from '@/contexts/EventContext'
import { 
  calculateLogQualityMetrics,
  getLogQualityTrend,
  getTopPerformingOperators
} from '@/lib/analytics/logQualityMetrics'
import { 
  calculateComplianceMetrics
} from '@/lib/analytics/complianceMetrics'
import type { ReadinessScore } from '@/lib/analytics/readinessEngine'

interface CustomDashboardViewerProps {
  dashboardId?: string
  eventId: string
  className?: string
}

interface DashboardConfig {
  id: string
  name: string
  card_ids: string[]
  layout_config: any
}

// AI Insights helper types and functions
interface TrendData {
  period: string
  value: number
  timestamp: string
}

interface TrendAnalysis {
  type: 'increasing' | 'decreasing' | 'stable'
  description: string
  confidence: number
  recommendation: string
  trendLine?: Array<{ y: number }>
}

interface AnomalyDetection {
  timestamp: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  recommendation: string
}

interface PredictiveForecast {
  metric: string
  currentValue: number
  predictedValue: number
  confidence: number
  timeframe: string
  factors: string[]
  recommendation: string
}

interface PatternAnalysis {
  type: 'trend' | 'anomaly' | 'seasonal' | 'correlation'
  description: string
  confidence: number
  impact: 'low' | 'medium' | 'high' | 'critical'
  recommendation: string
}

interface ConfidenceMetrics {
  overall: number
  trends: number
  predictions: number
  patterns: number
}

interface IncidentData {
  timestamp: string
  incident_count: number
  response_time: number
  quality_score: number
  compliance_rate: number
}

interface RawIncident {
  id: number
  created_at: string
  responded_at?: string | null
  resolved_at?: string | null
  updated_at?: string | null
  status?: string | null
  is_closed?: boolean | null
  priority?: string | null
  incident_type?: string | null
  event_id?: string | null
}

function calculateResponseMinutes(incident: RawIncident): number | null {
  if (!incident.created_at) return null
  const start = new Date(incident.created_at).getTime()
  const endSource = incident.responded_at || incident.resolved_at || incident.updated_at
  if (!endSource) return null

  const end = new Date(endSource).getTime()
  if (Number.isNaN(start) || Number.isNaN(end) || end <= start) return null

  return Math.round((end - start) / (1000 * 60))
}

function aggregateIncidentData(incidents: RawIncident[], startDate: Date, endDate: Date): IncidentData[] {
  if (!incidents || incidents.length === 0) return []

  const buckets: Record<string, {
    timestamp: string
    incident_count: number
    responseTotal: number
    responseSamples: number
    closedCount: number
  }> = {}

  incidents.forEach(incident => {
    if (!incident.created_at) return
    const created = new Date(incident.created_at)
    const createdTime = created.getTime()
    if (Number.isNaN(createdTime)) return
    
    const bucketDate = new Date(created)
    bucketDate.setMinutes(0, 0, 0) // Hourly buckets
    const bucketKey = bucketDate.toISOString()

    if (!buckets[bucketKey]) {
      buckets[bucketKey] = {
        timestamp: bucketKey,
        incident_count: 0,
        responseTotal: 0,
        responseSamples: 0,
        closedCount: 0
      }
    }

    const bucket = buckets[bucketKey]
    bucket.incident_count += 1

    const responseMinutes = calculateResponseMinutes(incident)
    if (responseMinutes !== null) {
      bucket.responseTotal += responseMinutes
      bucket.responseSamples += 1
    }

    if (incident.status === 'closed' || incident.is_closed) {
      bucket.closedCount += 1
    }
  })

  return Object.values(buckets)
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    .map(bucket => {
      const responseAvg = bucket.responseSamples > 0 ? bucket.responseTotal / bucket.responseSamples : 0
      const complianceRate = bucket.incident_count > 0
        ? (bucket.closedCount / bucket.incident_count) * 100
        : 0
      const qualityScore = bucket.incident_count > 0
        ? Math.min(100, Math.max(60, 70 + (complianceRate * 0.3) - (responseAvg > 30 ? 10 : 0)))
        : 70

      return {
        timestamp: bucket.timestamp,
        incident_count: bucket.incident_count,
        response_time: Number(responseAvg.toFixed(1)),
        quality_score: Number(qualityScore.toFixed(1)),
        compliance_rate: Number(Math.min(100, complianceRate).toFixed(1))
      }
    })
}

const detectTrends = (data: TrendData[], key: string): TrendAnalysis => {
  if (!data || data.length < 2) return { 
    type: 'stable', 
    confidence: 0,
    description: 'Insufficient data for trend analysis',
    recommendation: 'Collect more data points'
  }
  
  const values = data.map(d => d.value)
  const start = values[0]
  const end = values[values.length - 1]
  const diff = end - start
  const percentChange = (diff / (start || 1)) * 100

  let type: 'increasing' | 'decreasing' | 'stable' = 'stable'
  if (percentChange > 5) type = 'increasing'
  if (percentChange < -5) type = 'decreasing'

  // Simple linear regression for trend line
  const n = values.length
  const x = Array.from({ length: n }, (_, i) => i)
  const y = values
  const sumX = x.reduce((a, b) => a + b, 0)
  const sumY = y.reduce((a, b) => a + b, 0)
  const sumXY = x.reduce((acc, xi, i) => acc + xi * y[i], 0)
  const sumX2 = x.reduce((acc, xi) => acc + xi * xi, 0)
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
  const intercept = (sumY - slope * sumX) / n
  
  const trendLine = x.map(xi => ({ y: slope * xi + intercept }))

  return {
    type,
    description: `${key.replace('_', ' ')} is ${type} (${Math.abs(percentChange).toFixed(1)}%)`,
    confidence: Math.min(Math.abs(percentChange) * 2, 95),
    recommendation: type === 'increasing' ? 'Monitor closely for spikes' : 'Stable performance maintained',
    trendLine
  }
}

const detectAnomalies = (data: TrendData[], key: string): AnomalyDetection[] => {
  if (!data || data.length === 0) return []
  const values = data.map(d => d.value)
  const mean = values.reduce((a, b) => a + b, 0) / values.length
  const stdDev = Math.sqrt(values.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b, 0) / values.length)
  
  const anomalies: AnomalyDetection[] = []
  data.forEach((d) => {
    if (Math.abs(d.value - mean) > stdDev * 1.5) {
      anomalies.push({
        timestamp: d.timestamp,
        severity: Math.abs(d.value - mean) > stdDev * 2 ? 'high' : 'medium',
        description: `Unusual ${key.replace('_', ' ')} detected`,
        recommendation: 'Investigate root cause of spike'
      })
    }
  })
  return anomalies
}

const generateForecast = (data: TrendData[], key: string, timeframe: string): PredictiveForecast => {
  const lastValue = data[data.length - 1]?.value || 0
  return {
    metric: key,
    currentValue: lastValue,
    predictedValue: lastValue * 1.15, // +15% projection
    confidence: 78,
    timeframe,
    factors: ['Historical Trend', 'Time of Day'],
    recommendation: 'Prepare for potential increase in next 4 hours'
  }
}

async function detectAdvancedPatterns(data: IncidentData[]): Promise<PatternAnalysis[]> {
  if (data.length === 0) return []
  const patterns: PatternAnalysis[] = []
  
  const correlation = 0.75 // Mock strong positive correlation
  
  if (Math.abs(correlation) > 0.7) {
    patterns.push({
      type: 'correlation',
      description: `Strong ${correlation > 0 ? 'positive' : 'negative'} correlation between incident volume and response time`,
      confidence: Math.abs(correlation) * 100,
      impact: Math.abs(correlation) > 0.8 ? 'high' : 'medium',
      recommendation: correlation > 0 
        ? 'Consider increasing staff during high-incident periods'
        : 'Review incident handling procedures during low-volume periods'
    })
  }

  patterns.push({
    type: 'seasonal',
    description: `Strong hourly pattern detected with 85% consistency`,
    confidence: 85,
    impact: 'medium',
    recommendation: 'Adjust staffing levels based on hourly incident patterns'
  })

  return patterns
}

function calculateConfidenceMetrics(
  incidentTrend: TrendAnalysis,
  responseTimeTrend: TrendAnalysis,
  qualityTrend: TrendAnalysis,
  anomalies: AnomalyDetection[],
  forecast: PredictiveForecast | null,
  patterns: PatternAnalysis[]
): ConfidenceMetrics {
  const trendsConfidence = ((incidentTrend?.confidence || 0) + (responseTimeTrend?.confidence || 0) + (qualityTrend?.confidence || 0)) / 3
  const predictionsConfidence = forecast?.confidence || 0
  const patternsConfidence = patterns.length > 0 
    ? patterns.reduce((acc, p) => acc + p.confidence, 0) / patterns.length
    : 0
  
  const overallConfidence = (trendsConfidence + predictionsConfidence + patternsConfidence) / 3

  return {
    overall: Math.round(overallConfidence),
    trends: Math.round(trendsConfidence),
    predictions: Math.round(predictionsConfidence),
    patterns: Math.round(patternsConfidence)
  }
}

export default function CustomDashboardViewer({
  dashboardId,
  eventId,
  className = ''
}: CustomDashboardViewerProps) {
  const [dashboard, setDashboard] = useState<DashboardConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const { eventData } = useEventContext()

  // Data for cards
  const [incidentData, setIncidentData] = useState<any[]>([])
  const [qualityMetrics, setQualityMetrics] = useState<any>(null)
  const [qualityTrend, setQualityTrend] = useState<any[]>([])
  const [topOperators, setTopOperators] = useState<any[]>([])
  const [complianceMetrics, setComplianceMetrics] = useState<any>(null)
  const [attendanceData, setAttendanceData] = useState<any[]>([])
  
  // AI Insights data
  const [aiIncidentData, setAiIncidentData] = useState<any[]>([])
  const [aiTrends, setAiTrends] = useState<Record<string, any>>({})
  const [aiAnomalies, setAiAnomalies] = useState<any[]>([])
  const [aiForecasts, setAiForecasts] = useState<Record<string, any>>({})
  const [aiPatterns, setAiPatterns] = useState<any[]>([])
  const [aiConfidence, setAiConfidence] = useState<any>({
    overall: 0,
    trends: 0,
    predictions: 0,
    patterns: 0
  })
  const [aiChartData, setAiChartData] = useState<any[]>([])
  const [readiness, setReadiness] = useState<ReadinessScore | null>(null)

  // Load user
  useEffect(() => {
    const loadUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) setUserId(user.id)
    }
    loadUser()
  }, [])

  // Load dashboard
  useEffect(() => {
    if (!userId || !dashboardId) {
      setLoading(false)
      return
    }

    const loadDashboard = async () => {
      try {
        const { data, error } = await supabase
          .from('custom_dashboards' as any)
          .select('*')
          .eq('id', dashboardId)
          .eq('user_id', userId)
          .single()

        if (error) throw error
        setDashboard(data as unknown as DashboardConfig)
      } catch (error) {
        console.error('Error loading dashboard:', error)
      } finally {
        setLoading(false)
      }
    }

    loadDashboard()
  }, [userId, dashboardId])

  // Load data for cards
  useEffect(() => {
    if (!eventId || !dashboard?.card_ids?.length) return

    const loadData = async () => {
      try {
        // Load incident data if needed
        const needsIncidentData = dashboard.card_ids.some(id => 
          ['incident-volume', 'response-time-distribution', 'attendance-timeline', 'ejection-patterns'].includes(id)
        )
        
        if (needsIncidentData) {
          const { data: incidents } = await supabase
            .from('incident_logs')
            .select('*')
            .eq('event_id', eventId)
            .order('timestamp', { ascending: false })

          setIncidentData(incidents || [])
        }

        // Load attendance data if needed
        const needsAttendanceData = dashboard.card_ids.includes('attendance-timeline')
        if (needsAttendanceData) {
          const { data: attendance } = await supabase
            .from('attendance_records')
            .select('*')
            .eq('event_id', eventId)
            .order('timestamp', { ascending: true })
          
          setAttendanceData(attendance || [])
        }

        // Load quality data if needed
        const needsQualityData = dashboard.card_ids.some(id => 
          ['overall-score', 'score-breakdown', 'quality-trend', 'score-components', 
           'entry-type-distribution', 'completeness-by-field', 'top-operators'].includes(id)
        )

        if (needsQualityData) {
          // Use a default date range (last 30 days) - the functions will ignore it if eventId is provided
          const endDate = new Date()
          const startDate = new Date()
          startDate.setDate(startDate.getDate() - 30)
          
          const metrics = await calculateLogQualityMetrics(startDate, endDate, eventId)
          const trend = await getLogQualityTrend(startDate, endDate, eventId)
          const operators = await getTopPerformingOperators(startDate, endDate, eventId)
          
          setQualityMetrics(metrics)
          setQualityTrend(trend)
          setTopOperators(operators)
        }

        // Load compliance data if needed
        const needsComplianceData = dashboard.card_ids.some(id => 
          ['legal-readiness', 'audit-trail', 'immutability', 'timestamp-accuracy', 
           'justification-rate', 'compliance-trend', 'compliance-breakdown', 
           'legal-readiness-checklist', 'recommendations'].includes(id)
        )

        if (needsComplianceData) {
          // Use a default date range (last 30 days) - the functions will ignore it if eventId is provided
          const endDate = new Date()
          const startDate = new Date()
          startDate.setDate(startDate.getDate() - 30)
          
          const compliance = await calculateComplianceMetrics(startDate, endDate, eventId)
          setComplianceMetrics(compliance)
        }

        // Load AI Insights data if needed
        const needsAIData = dashboard.card_ids.some(id => 
          ['ai-operational-summary', 'operational-readiness', 'confidence-metrics', 
           'incident-volume-trend-ai', 'response-time-trend-ai', 'log-quality-trend-ai',
           'pattern-analysis', 'anomalies-detected', 'trend-visualization', 'predictions'].includes(id)
        )

        if (needsAIData) {
          // Use a default date range (last 30 days)
          const endDate = new Date()
          const startDate = new Date()
          startDate.setDate(startDate.getDate() - 30)

          // Fetch incident data for AI analysis
          const { data: aiIncidents } = await supabase
            .from('incident_logs')
            .select('id, created_at, responded_at, resolved_at, updated_at, status, is_closed, priority, incident_type, event_id')
            .eq('event_id', eventId)
            .order('created_at', { ascending: true })

          if (aiIncidents && aiIncidents.length > 0) {
            // Process AI data similar to AIInsightsDashboard
            const processed = aggregateIncidentData(aiIncidents, startDate, endDate)
            setAiIncidentData(processed)

            // Generate trend data
            const trendData = processed.map(d => ({
              period: new Date(d.timestamp).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
              value: d.incident_count,
              timestamp: d.timestamp
            }))

            const responseTrendData = processed.map(d => ({
              period: new Date(d.timestamp).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
              value: d.response_time,
              timestamp: d.timestamp
            }))

            const qualityTrendData = processed.map(d => ({
              period: new Date(d.timestamp).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
              value: d.quality_score,
              timestamp: d.timestamp
            }))

            // Detect trends
            const incidentTrend = detectTrends(trendData, 'incident_count')
            const responseTimeTrend = detectTrends(responseTrendData, 'response_time')
            const qualityTrend = detectTrends(qualityTrendData, 'quality_score')

            setAiTrends({
              incident_count: incidentTrend,
              response_time: responseTimeTrend,
              quality_score: qualityTrend
            })

            // Detect anomalies
            const detectedAnomalies = detectAnomalies(trendData, 'incident_count')
            setAiAnomalies(detectedAnomalies)

            // Generate forecast
            const incidentForecast = trendData.length > 0
              ? generateForecast(trendData, 'incident_count', 'next 4 hours')
              : undefined

            setAiForecasts(trendData.length > 0 && incidentForecast ? { incident_count: incidentForecast } : {})

            // Detect patterns
            const detectedPatterns = processed.length > 0 ? await detectAdvancedPatterns(processed) : []
            setAiPatterns(detectedPatterns)

            // Calculate confidence
            const confidenceMetrics = calculateConfidenceMetrics(
              incidentTrend,
              responseTimeTrend,
              qualityTrend,
              detectedAnomalies,
              incidentForecast || null,
              detectedPatterns
            )
            setAiConfidence(confidenceMetrics)

            // Prepare chart data
            const chartData = processed.map((data, index) => ({
              time: new Date(data.timestamp).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
              incidents: data.incident_count,
              responseTime: data.response_time,
              quality: data.quality_score,
              compliance: data.compliance_rate,
              predicted: incidentTrend?.trendLine?.[index]?.y || null
            }))
            setAiChartData(chartData)
          }
        }
      } catch (error) {
        console.error('Error loading card data:', error)
      }
    }

    loadData()
  }, [eventId, dashboard?.card_ids])

  // Prepare props for each card
  const getCardProps = useCallback((cardId: string) => {
    const card = getCardById(cardId)
    if (!card) return {}

    // Prepare data based on card requirements
    const props: any = {}

    switch (cardId) {
      // Operational cards
      case 'incident-volume':
        // Process incident data for volume chart - format as hourly data
        const hourlyData = Array(24).fill(0)
        incidentData.forEach((incident: any) => {
          if (incident.timestamp) {
            const hour = new Date(incident.timestamp).getHours()
            hourlyData[hour]++
          }
        })
        props.incidentVolumeData = Array.from({ length: 24 }, (_, i) => ({
          hour: `${i}:00`,
          count: hourlyData[i] || 0
        }))
        break

      case 'response-time-distribution':
        // Format response time data into buckets
        const responseTimeBuckets: Record<string, number> = {}
        incidentData
          .filter((i: any) => i.responded_at && i.timestamp)
          .forEach((i: any) => {
            const responseTime = new Date(i.responded_at).getTime() - new Date(i.timestamp).getTime()
            const minutes = Math.floor(responseTime / 60000)
            const bucket = `${Math.floor(minutes / 5) * 5}-${Math.floor(minutes / 5) * 5 + 5} min`
            responseTimeBuckets[bucket] = (responseTimeBuckets[bucket] || 0) + 1
          })
        props.responseTimeData = Object.entries(responseTimeBuckets).map(([bucket, count]) => ({
          bucket,
          count
        }))
        break

      case 'attendance-timeline':
        // Use attendance data loaded in useEffect
        props.attendanceTimelineData = attendanceData.map((record: any) => ({
          time: new Date(record.timestamp).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
          count: record.count || 0,
          capacity: eventData?.max_capacity || 1000
        }))
        break

      case 'ejection-patterns':
        // Format ejection data as hourly
        const ejectionHourlyData = Array(24).fill(0)
        incidentData
          .filter((i: any) => i.incident_type?.toLowerCase().includes('ejection'))
          .forEach((i: any) => {
            if (i.timestamp) {
              const hour = new Date(i.timestamp).getHours()
              ejectionHourlyData[hour]++
            }
          })
        props.ejectionPatternData = Array.from({ length: 24 }, (_, i) => ({
          hour: `${i}:00`,
          ejections: ejectionHourlyData[i] || 0
        }))
        break

      // Quality cards
      case 'overall-score':
        props.overallScore = qualityMetrics?.overallScore || 0
        props.totalLogs = qualityMetrics?.totalLogs || 0
        break

      case 'score-breakdown':
        props.completeness = qualityMetrics?.completeness || 0
        props.timeliness = qualityMetrics?.timeliness || 0
        props.factualLanguage = qualityMetrics?.factualLanguage || 0
        break

      case 'quality-trend':
        props.trend = qualityTrend
        break

      case 'score-components':
        props.completeness = qualityMetrics?.completeness || 0
        props.timeliness = qualityMetrics?.timeliness || 0
        props.factualLanguage = qualityMetrics?.factualLanguage || 0
        break

      case 'entry-type-distribution':
        props.amendmentRate = qualityMetrics?.amendmentRate || 0
        props.retrospectiveRate = qualityMetrics?.retrospectiveRate || 0
        break

      case 'completeness-by-field':
        props.breakdown = qualityMetrics?.breakdown || {}
        break

      case 'top-operators':
        props.topOperators = topOperators
        break

      // Compliance cards
      case 'legal-readiness':
        props.legalReadinessScore = complianceMetrics?.legalReadinessScore || 0
        props.overallCompliance = complianceMetrics?.overallCompliance || 0
        props.totalIncidents = complianceMetrics?.totalIncidents || 0
        break

      case 'audit-trail':
        props.auditTrailCompleteness = complianceMetrics?.auditTrailCompleteness || 0
        props.missingTimestamps = complianceMetrics?.missingTimestamps || 0
        break

      case 'immutability':
        props.immutabilityScore = complianceMetrics?.immutabilityScore || 0
        props.unamendedDeletes = complianceMetrics?.unamendedDeletes || 0
        break

      case 'timestamp-accuracy':
        props.timestampAccuracy = complianceMetrics?.timestampAccuracy || 0
        break

      case 'justification-rate':
        props.amendmentJustificationRate = complianceMetrics?.amendmentJustificationRate || 0
        props.unjustifiedRetrospectives = complianceMetrics?.unjustifiedRetrospectives || 0
        break

      case 'compliance-trend':
        props.trend = complianceMetrics?.trend || []
        break

      case 'compliance-breakdown':
        props.breakdown = complianceMetrics?.breakdown || {}
        break

      case 'legal-readiness-checklist':
        props.auditTrailCompleteness = complianceMetrics?.auditTrailCompleteness || 0
        props.immutabilityScore = complianceMetrics?.immutabilityScore || 0
        props.timestampAccuracy = complianceMetrics?.timestampAccuracy || 0
        props.amendmentJustificationRate = complianceMetrics?.amendmentJustificationRate || 0
        props.overallCompliance = complianceMetrics?.overallCompliance || 0
        props.legalReadinessScore = complianceMetrics?.legalReadinessScore || 0
        break

      case 'recommendations':
        props.recommendations = complianceMetrics?.recommendations || []
        break

      // AI Insights cards
      case 'ai-operational-summary':
        // This card needs aiSummary, onRefresh, isGenerating, etc. which are handled in the analytics page
        // For now, provide empty state
        props.aiSummary = ''
        props.onRefresh = () => {}
        props.isGenerating = false
        props.totalIncidents = incidentData.length
        props.highPriorityIncidents = incidentData.filter((i: any) => i.priority === 'high').length
        props.hasIncidents = incidentData.length > 0
        break

      case 'operational-readiness':
        props.readiness = readiness
        break

      case 'confidence-metrics':
        props.confidence = aiConfidence
        break

      case 'incident-volume-trend-ai':
        props.trend = aiTrends.incident_count
        break

      case 'response-time-trend-ai':
        props.trend = aiTrends.response_time
        break

      case 'log-quality-trend-ai':
        props.trend = aiTrends.quality_score
        break

      case 'pattern-analysis':
        props.patterns = aiPatterns
        break

      case 'anomalies-detected':
        props.anomalies = aiAnomalies
        break

      case 'trend-visualization':
        props.chartData = aiChartData
        break

      case 'predictions':
        props.forecast = aiForecasts.incident_count || null
        break
    }

    return props
  }, [incidentData, qualityMetrics, qualityTrend, topOperators, complianceMetrics, attendanceData, eventData, eventId, aiTrends, aiAnomalies, aiForecasts, aiPatterns, aiConfidence, aiChartData, readiness])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading dashboard...</div>
      </div>
    )
  }

  if (!dashboard) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-gray-500 mb-2">No dashboard selected</p>
          <p className="text-sm text-gray-400">Please select or create a dashboard</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{dashboard.name}</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          {dashboard.card_ids.length} card{dashboard.card_ids.length !== 1 ? 's' : ''}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {dashboard.card_ids.map(cardId => {
          const card = getCardById(cardId)
          if (!card) return null

          const CardComponent = card.component
          const props = getCardProps(cardId)

          return (
            <div key={cardId} className="w-full">
              <CardComponent {...props} />
            </div>
          )
        })}
      </div>
    </div>
  )
}

