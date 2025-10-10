/**
 * Analytics Type Definitions
 * Central type definitions for analytics features
 */

// Re-export from analytics modules for convenience
export type {
  LogQualityMetrics,
  LogQualityTrend
} from '@/lib/analytics/logQualityMetrics'

export type {
  ComplianceMetrics,
  ComplianceTrend
} from '@/lib/analytics/complianceMetrics'

export type {
  PerformanceMetrics,
  ResponseTimeDistribution
} from '@/lib/analytics/performanceMetrics'

/**
 * Common date range filter
 */
export interface DateRangeFilter {
  startDate: Date
  endDate: Date
  preset?: 'today' | 'yesterday' | 'last7days' | 'last30days' | 'thisWeek' | 'thisMonth' | 'custom'
}

/**
 * Analytics dashboard filter options
 */
export interface AnalyticsFilters extends DateRangeFilter {
  eventId?: string
  incidentType?: string
  priority?: string
  operatorId?: string
  status?: string
}

/**
 * Chart data point for trend visualizations
 */
export interface ChartDataPoint {
  date: string
  value: number
  label?: string
  color?: string
}

/**
 * KPI Card data structure
 */
export interface KPICardData {
  title: string
  value: number | string
  unit?: string
  trend?: {
    direction: 'up' | 'down' | 'stable'
    percentage: number
    period: string
  }
  icon?: React.ComponentType<{ className?: string }>
  color?: 'green' | 'yellow' | 'red' | 'blue' | 'gray'
  tooltip?: string
}

/**
 * Export report options
 */
export interface ExportReportOptions {
  format: 'pdf' | 'csv' | 'excel' | 'json'
  includeSections: {
    executiveSummary: boolean
    kpis: boolean
    logQuality: boolean
    compliance: boolean
    performance: boolean
    staffMetrics: boolean
    charts: boolean
    recommendations: boolean
  }
  dateRange: DateRangeFilter
  eventId?: string
  branding?: {
    logo?: string
    companyName?: string
    primaryColor?: string
  }
}

/**
 * Analytics insight (AI-generated)
 */
export interface AnalyticsInsight {
  id: string
  type: 'trend' | 'anomaly' | 'prediction' | 'recommendation'
  severity: 'info' | 'warning' | 'critical'
  title: string
  description: string
  data?: Record<string, any>
  actionable: boolean
  action?: {
    label: string
    onClick: () => void
  }
  timestamp: string
}

/**
 * Dashboard widget configuration
 */
export interface DashboardWidget {
  id: string
  type: 'kpi' | 'chart' | 'table' | 'insight' | 'custom'
  title: string
  position: { row: number; col: number }
  size: { width: number; height: number }
  config: Record<string, any>
  refreshInterval?: number // milliseconds
}

/**
 * User activity summary
 */
export interface UserActivitySummary {
  userId: string
  userName?: string
  callsign?: string
  period: {
    start: string
    end: string
  }
  metrics: {
    totalLogs: number
    averageQuality: number
    retrospectiveRate: number
    amendmentRate: number
    activeHours: number
    incidentsPerHour: number
  }
  rank?: number
  badge?: 'top-performer' | 'most-active' | 'quality-leader'
}

/**
 * Incident statistics summary
 */
export interface IncidentStatsSummary {
  totalIncidents: number
  activeIncidents: number
  closedIncidents: number
  byType: Record<string, number>
  byPriority: Record<string, number>
  byStatus: Record<string, number>
  averageResponseTime: number
  averageResolutionTime: number
  qualityScore: number
  complianceGrade: string
}

/**
 * Trend analysis result
 */
export interface TrendAnalysis {
  metric: string
  currentValue: number
  previousValue: number
  change: number
  changePercentage: number
  direction: 'increasing' | 'decreasing' | 'stable'
  significance: 'high' | 'medium' | 'low'
  interpretation: string
}

/**
 * Predictive forecast
 */
export interface PredictiveForecast {
  metric: string
  currentValue: number
  predictedValue: number
  confidence: number // 0-100
  timeframe: string
  factors: string[]
  recommendation?: string
}

/**
 * Quality improvement opportunity
 */
export interface QualityImprovement {
  area: string
  currentScore: number
  potentialScore: number
  impact: 'high' | 'medium' | 'low'
  effort: 'high' | 'medium' | 'low'
  recommendations: string[]
  affectedLogs?: string[]
}

/**
 * Compliance check result
 */
export interface ComplianceCheckResult {
  check: string
  passed: boolean
  score: number
  details: string
  issues?: Array<{
    severity: 'critical' | 'warning' | 'info'
    description: string
    affectedItems: number
    resolution: string
  }>
}

/**
 * Analytics API response wrapper
 */
export interface AnalyticsAPIResponse<T> {
  success: boolean
  data?: T
  error?: string
  metadata?: {
    calculatedAt: string
    cacheHit: boolean
    executionTime: number
  }
}

/**
 * Real-time analytics update
 */
export interface AnalyticsUpdate {
  type: 'metric' | 'insight' | 'alert'
  metric?: string
  value?: any
  timestamp: string
  source: string
}
