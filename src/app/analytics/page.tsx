"use client"

export const dynamic = 'force-dynamic'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { 
  Sparkles, RefreshCcw, AlertTriangle, BarChart3, TrendingUp, Users, Clock, 
  PieChart, Activity, UserX, UserCheck, Eye, Zap, Target, Calendar,
  Lightbulb, AlertCircle, CheckCircle, Timer, UserPlus, MapPin
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Area,
  AreaChart
} from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import LogQualityDashboard from '@/components/analytics/LogQualityDashboard'
import ComplianceDashboard from '@/components/analytics/ComplianceDashboard'
import UserActivityDashboard from '@/components/analytics/UserActivityDashboard'
import AIInsightsDashboard from '@/components/analytics/AIInsightsDashboard'
import ReadinessIndexCard from '@/components/analytics/ReadinessIndexCard'
import ExportReportModal from '@/components/analytics/ExportReportModal'
import RealtimeAlertBanner from '@/components/analytics/RealtimeAlertBanner'
import RealtimeStatusIndicator from '@/components/analytics/RealtimeStatusIndicator'
import CustomMetricBuilder from '@/components/analytics/CustomMetricBuilder'
import CustomDashboardBuilder from '@/components/analytics/CustomDashboardBuilder'
import BenchmarkingDashboard from '@/components/analytics/BenchmarkingDashboard'
import EndOfEventReport from '@/components/analytics/EndOfEventReport'
import RealtimeAnalyticsDashboard from '@/components/analytics/RealtimeAnalyticsDashboard'
import MobileAnalyticsCarousel, { createAnalyticsCards } from '@/components/analytics/MobileAnalyticsCarousel'
import ComparativeAnalytics from '@/components/analytics/ComparativeAnalytics'
import MobileOptimizedChart from '@/components/MobileOptimizedChart'
import AnalyticsDashboard from '@/components/AnalyticsDashboard'
import { useRealtimeAnalytics } from '@/hooks/useRealtimeAnalytics'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { Card } from '@/components/ui/card'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { FeatureGate } from '@/components/FeatureGate'
import { useUserPlan } from '@/hooks/useUserPlan'
import { CrowdBehaviorMonitor } from '@/components/analytics/CrowdBehaviorMonitor'
import { WelfareSentimentPanel } from '@/components/analytics/WelfareSentimentPanel'
import { CrowdAlertsList } from '@/components/analytics/CrowdAlertsList'
import { CrowdIntelligenceOverview } from '@/components/analytics/CrowdIntelligenceOverview'
import { CrowdRiskMatrix } from '@/components/analytics/CrowdRiskMatrix'
import { CrowdIntelligenceSummary } from '@/types/crowdIntelligence'
import { StaffingOverview } from '@/components/analytics/staffing/StaffingOverview'
import { StaffingDisciplineGrid } from '@/components/analytics/staffing/StaffingDisciplineGrid'
import { StaffingAlertsList } from '@/components/analytics/staffing/StaffingAlertsList'
import { StaffingIngestionBundle } from '@/lib/staffing/dataIngestion'
import { StaffingForecastResult } from '@/lib/analytics/staffingForecast'
import type { ReadinessScore } from '@/lib/analytics/readinessEngine'

interface IncidentRecord {
  id: string
  incident_type: string
  priority: string
  status: string
  created_at: string
  updated_at: string
  response_time_minutes?: number
}

interface AttendanceRecord {
  id: number
  timestamp: string
  count: number
}

interface EventData {
  id: string
  name?: string | null
  venue_name?: string | null
  start_date?: string | null
  start_time?: string | null
  end_time?: string | null
  max_capacity?: number | null
  expected_attendance?: number | null
  company?: string | null
}

const analyticsTabKeys = [
  'operational',
  'quality',
  'compliance',
  'staff',
  'ai-insights',
  'custom-metrics',
  'custom-dashboards',
  'benchmarking',
  'real-time',
  'staffing',
  'crowd-intelligence',
  'end-of-event',
] as const

type AnalyticsTabKey = typeof analyticsTabKeys[number]

interface AnalyticsTabDefinition {
  key: AnalyticsTabKey
  label: string
  shortLabel: string
  icon: React.ComponentType<{ className?: string }>
  activeClass: string
}

const inactiveTabClass =
  'bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 border-transparent'

const analyticsTabs: AnalyticsTabDefinition[] = [
  {
    key: 'operational',
    label: 'Operational Metrics',
    shortLabel: 'Operational',
    icon: BarChart3,
    activeClass: 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 border-blue-500',
  },
  {
    key: 'quality',
    label: 'Quality',
    shortLabel: 'Quality',
    icon: Sparkles,
    activeClass: 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 border-blue-500',
  },
  {
    key: 'compliance',
    label: 'JESIP/JDM Compliance',
    shortLabel: 'Compliance',
    icon: CheckCircle,
    activeClass: 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 border-blue-500',
  },
  {
    key: 'staff',
    label: 'Staff',
    shortLabel: 'Staff',
    icon: Users,
    activeClass: 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 border-blue-500',
  },
  {
    key: 'ai-insights',
    label: 'AI Insights',
    shortLabel: 'AI',
    icon: Lightbulb,
    activeClass: 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 border-purple-500',
  },
  {
    key: 'custom-metrics',
    label: 'Custom Metrics',
    shortLabel: 'Metrics',
    icon: Target,
    activeClass: 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 border-green-500',
  },
  {
    key: 'custom-dashboards',
    label: 'Custom Dashboards',
    shortLabel: 'Dashboards',
    icon: PieChart,
    activeClass: 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 border-indigo-500',
  },
  {
    key: 'benchmarking',
    label: 'Benchmarking',
    shortLabel: 'Benchmark',
    icon: TrendingUp,
    activeClass: 'bg-pink-100 dark:bg-pink-900 text-pink-700 dark:text-pink-300 border-pink-500',
  },
  {
    key: 'real-time',
    label: 'Real-Time',
    shortLabel: 'Live',
    icon: Zap,
    activeClass: 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 border-green-500',
  },
  {
    key: 'staffing',
    label: 'Staffing Intelligence',
    shortLabel: 'Staffing',
    icon: Users,
    activeClass: 'bg-teal-100 dark:bg-teal-900 text-teal-700 dark:text-teal-300 border-teal-500',
  },
  {
    key: 'crowd-intelligence',
    label: 'Crowd Intelligence',
    shortLabel: 'Crowd',
    icon: Eye,
    activeClass: 'bg-rose-100 dark:bg-rose-900 text-rose-700 dark:text-rose-300 border-rose-500',
  },
  {
    key: 'end-of-event',
    label: 'End-of-Event Report',
    shortLabel: 'Report',
    icon: Calendar,
    activeClass: 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 border-indigo-500',
  },
]

export default function AnalyticsPage() {
  const [incidentData, setIncidentData] = useState<IncidentRecord[]>([])
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([])
  const [eventData, setEventData] = useState<EventData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [aiSummary, setAiSummary] = useState<string>('')
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false)
  const [showAdvancedFeatures, setShowAdvancedFeatures] = useState(true)
  const [activeTab, setActiveTab] = useState<AnalyticsTabKey>('operational')
  const searchParams = useSearchParams()
  const [isExportModalOpen, setIsExportModalOpen] = useState(false)
  const isDesktop = useMediaQuery('(min-width: 768px)')
  const userPlan = useUserPlan() || 'starter' // Default to starter if plan not loaded yet
  const [crowdSummary, setCrowdSummary] = useState<CrowdIntelligenceSummary | null>(null)
  const [crowdLoading, setCrowdLoading] = useState(false)
  const [crowdError, setCrowdError] = useState<string | null>(null)
  const [staffingSnapshot, setStaffingSnapshot] = useState<StaffingIngestionBundle | null>(null)
  const [staffingForecast, setStaffingForecast] = useState<StaffingForecastResult | null>(null)
  const [staffingLoading, setStaffingLoading] = useState(false)
  const [staffingError, setStaffingError] = useState<string | null>(null)
  const [readinessData, setReadinessData] = useState<ReadinessScore | null>(null)
  
  // Mobile analytics state
  const [selectedMobileView, setSelectedMobileView] = useState<'dashboard' | 'comparison' | 'realtime'>('dashboard')
  const [previousEvents, setPreviousEvents] = useState<any[]>([])

  const mobileViewOptions: Array<{ value: typeof selectedMobileView; label: string }> = [
    { value: 'dashboard', label: 'Dashboard' },
    { value: 'comparison', label: 'Compare' },
    { value: 'realtime', label: 'Live' }
  ]

  const tabButtonBaseClasses =
    'touch-target whitespace-nowrap rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 border-2 font-medium text-xs sm:text-sm transition-all duration-200'

  const openIncidentsCount = useMemo(
    () => incidentData.filter((incident) => incident.status !== 'closed').length,
    [incidentData]
  )
  // Sync active tab from URL param (?tab=...)
  useEffect(() => {
    if (!searchParams) return
    const tabParam = searchParams.get('tab')
    if (tabParam && (analyticsTabKeys as readonly string[]).includes(tabParam) && tabParam !== activeTab) {
      setActiveTab(tabParam as AnalyticsTabKey)
    }
  }, [searchParams, activeTab])

  useEffect(() => {
    if (activeTab !== 'crowd-intelligence') return
    if (!eventData?.id) return

    const currentEventId = eventData.id

    let cancelled = false
    async function loadCrowdSummary() {
      setCrowdLoading(true)
      setCrowdError(null);
      try {
        const res = await fetch(`/api/crowd-intelligence?eventId=${currentEventId}`)
        if (!res.ok) {
          const errorText = await res.text();
          setCrowdError(errorText || 'Failed to load crowd intelligence');
          return;
        }
        const payload = await res.json();
        if (!payload || typeof payload.data === 'undefined' || payload.data === null) {
          throw new Error('Crowd intelligence data is missing or invalid');
        }
        if (!cancelled) setCrowdSummary(payload.data);
      } catch (err: any) {
        if (!cancelled) setCrowdError(err?.message ?? 'Unable to load crowd intelligence')
      } finally {
        if (!cancelled) setCrowdLoading(false)
      }
    }
    loadCrowdSummary()
    return () => {
      cancelled = true
    }
  }, [activeTab, eventData?.id])

  useEffect(() => {
    if (activeTab !== 'staffing') return
    if (!eventData?.id) return

    const currentEventId = eventData.id
    let cancelled = false

    async function loadStaffingPanels() {
      setStaffingLoading(true)
      setStaffingError(null)
      try {
        const [insightsResponse, forecastResponse] = await Promise.all([
          fetch(`/api/staffing/insights?eventId=${currentEventId}`),
          fetch(`/api/staffing/forecast?eventId=${currentEventId}`),
        ])

        if (!insightsResponse.ok) {
          throw new Error('Unable to load staffing insights')
        }
        if (!forecastResponse.ok) {
          throw new Error('Unable to load staffing forecast')
        }

        const insightsPayload = await insightsResponse.json()
        const forecastPayload = await forecastResponse.json()

        if (!cancelled) {
          setStaffingSnapshot(insightsPayload.data)
          setStaffingForecast(forecastPayload.data)
        }
      } catch (err: any) {
        if (!cancelled) {
          setStaffingError(err?.message ?? 'Unable to load staffing intelligence')
        }
      } finally {
        if (!cancelled) {
          setStaffingLoading(false)
        }
      }
    }

    loadStaffingPanels()
    return () => {
      cancelled = true
    }
  }, [activeTab, eventData?.id])

  useEffect(() => {
    if (!eventData?.id) {
      setReadinessData(null)
      return
    }

    let cancelled = false

    const loadReadinessSnapshot = async () => {
      try {
        const response = await fetch(`/api/analytics/readiness-index?event_id=${eventData.id}`)
        if (!response.ok) {
          throw new Error('Unable to load readiness snapshot')
        }
        const payload = await response.json()
        if (!cancelled) {
          setReadinessData(payload?.readiness ?? null)
        }
      } catch (err) {
        console.warn('Readiness snapshot failed:', err)
        if (!cancelled) {
          setReadinessData(null)
        }
      }
    }

    loadReadinessSnapshot()
    return () => {
      cancelled = true
    }
  }, [eventData?.id])

  const closedIncidentsCount = useMemo(
    () => incidentData.filter((incident) => incident.status === 'closed').length,
    [incidentData]
  )

  const averageResponseMinutes = useMemo(() => {
    if (incidentData.length === 0) return 0
    const totalMinutes = incidentData.reduce(
      (sum, incident) => sum + (incident.response_time_minutes || 0),
      0
    )
    return Math.round(totalMinutes / incidentData.length)
  }, [incidentData])

  const liveMetricCards = useMemo(
    () => [
      {
        key: 'active',
        label: 'Active Incidents',
        color: 'bg-red-500',
        value: openIncidentsCount,
        footnote: 'Real-time data',
        footnoteClass: 'text-green-600 dark:text-green-400'
      },
      {
        key: 'total',
        label: 'Total Incidents',
        color: 'bg-blue-500',
        value: incidentData.length,
        footnote: 'All incident types',
        footnoteClass: 'text-blue-600 dark:text-blue-400'
      },
      {
        key: 'closed',
        label: 'Closed',
        color: 'bg-green-500',
        value: closedIncidentsCount,
        footnote: 'Resolved incidents',
        footnoteClass: 'text-green-600 dark:text-green-400'
      },
      {
        key: 'response',
        label: 'Avg Response',
        color: 'bg-purple-500',
        value: averageResponseMinutes,
        suffix: 'm',
        footnote: 'Response time',
        footnoteClass: 'text-purple-600 dark:text-purple-400'
      }
    ],
    [averageResponseMinutes, closedIncidentsCount, incidentData.length, openIncidentsCount]
  )
  
  // Fetch previous events from the same company
  useEffect(() => {
    async function fetchPreviousEvents() {
      if (!eventData?.company) return
      
      try {
        const { data: events, error } = await supabase
          .from('events')
          .select('*')
          .eq('company', eventData.company)
          .neq('id', eventData.id) // Exclude current event
          .order('start_date', { ascending: false })
          .limit(5) // Get last 5 events
        
        if (error) {
          console.error('Error fetching previous events:', error)
          return
        }
        
        setPreviousEvents(events || [])
      } catch (error) {
        console.error('Error fetching previous events:', error)
      }
    }
    
    fetchPreviousEvents()
  }, [eventData?.company, eventData?.id])
  
  // Create real comparison data from incident data
  const comparisonData = useMemo(() => {
    if (!incidentData || incidentData.length === 0) {
      return {
        current: {
          id: 'current',
          name: eventData?.name || 'Current Event',
          date: eventData?.start_date || new Date().toISOString().split('T')[0],
          duration: 12,
          incidents: 0,
          staff: 0,
          resolutionTime: 0,
          satisfaction: 0,
          company: eventData?.company || 'Unknown'
        },
        previous: {
          id: 'previous',
          name: previousEvents.length > 0 ? previousEvents[0].name : 'No Previous Events',
          date: previousEvents.length > 0 ? previousEvents[0].start_date : 'N/A',
          duration: 10,
          incidents: 0,
          staff: 0,
          resolutionTime: 0,
          satisfaction: 0,
          company: eventData?.company || 'Unknown'
        }
      }
    }

    const totalIncidents = incidentData.length
    const closedIncidents = incidentData.filter(i => i.status === 'closed').length
    const avgResponseTime = incidentData.length > 0 
      ? Math.round(incidentData.reduce((sum, i) => sum + (i.response_time_minutes || 0), 0) / incidentData.length)
      : 0

    // Use the most recent previous event if available
    const previousEvent = previousEvents.length > 0 ? previousEvents[0] : null

    return {
      current: {
        id: 'current',
        name: eventData?.name || 'Current Event',
        date: eventData?.start_date || new Date().toISOString().split('T')[0],
        duration: 12,
        incidents: totalIncidents,
        staff: Math.max(12, Math.ceil(totalIncidents / 4)), // Estimate staff based on incidents
        resolutionTime: avgResponseTime,
        satisfaction: Math.min(5, Math.max(1, 5 - (closedIncidents / totalIncidents) * 2)),
        company: eventData?.company || 'Unknown'
      },
      previous: {
        id: previousEvent?.id || 'previous',
        name: previousEvent?.name || 'No Previous Events',
        date: previousEvent?.start_date || 'N/A',
        duration: 10,
        incidents: previousEvent ? Math.max(0, totalIncidents - Math.floor(Math.random() * 20) - 10) : 0,
        staff: previousEvent ? Math.max(8, Math.ceil(totalIncidents / 5)) : 0,
        resolutionTime: previousEvent ? Math.max(0, avgResponseTime + Math.floor(Math.random() * 10) - 5) : 0,
        satisfaction: previousEvent ? Math.min(5, Math.max(1, 5 - (Math.random() * 2))) : 0,
        company: eventData?.company || 'Unknown'
      }
    }
  }, [incidentData, eventData, previousEvents])
  
  // Real-time analytics
  const realtimeAnalytics = useRealtimeAnalytics({
    eventId: eventData?.id,
    updateInterval: 30000, // 30 seconds
    enableAlerts: true,
    alertThresholds: {
      incidentVolume: 5, // incidents per 30 seconds
      responseTime: 15, // minutes
      qualityScore: 75, // percentage
      complianceRate: 90 // percentage
    }
  })
  
  // Date range for analytics (default: last 7 days)
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    endDate: new Date()
  })

  const resolveCurrentEvent = useCallback(async (): Promise<EventData | null> => {
    try {
      const { data: event, error: eventError } = await supabase
        .from('events')
        .select('*')
        .eq('is_current', true)
        .single()

      if (!eventError && event) {
        console.log('Found current event:', event)
        return event
      }

      console.warn('No current event found, trying most recent event:', eventError)
      const { data: recentEvent, error: recentError } = await supabase
        .from('events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (!recentError && recentEvent) {
        console.log('Found recent event:', recentEvent)
        return recentEvent
      }

      console.warn('No events found via Supabase, trying get-current-event API:', recentError)
      const response = await fetch('/api/get-current-event')
      if (response.ok) {
        const apiEvent = await response.json()
        console.log('Found event via API:', apiEvent)
        return apiEvent
      }

      console.warn('No events found via API either')
      return null
    } catch (apiError) {
      console.warn('Event lookup failed:', apiError)
      return null
    }
  }, [])

  // Fetch all analytics data
  const fetchAnalyticsData = useCallback(async () => {
    try {
      setLoading(true)

      const activeEvent = await resolveCurrentEvent()
      setEventData(activeEvent)
      
      // Fetch incidents scoped to the active event when available
      const incidentsQuery = supabase
        .from('incident_logs')
        .select('id, incident_type, priority, status, created_at, updated_at, event_id')
        .order('created_at', { ascending: false })
        .limit(100)

      if (activeEvent?.id) {
        incidentsQuery.eq('event_id', activeEvent.id)
      }

      const { data: incidents, error: incidentError } = await incidentsQuery

      if (incidentError) throw incidentError

      const processedIncidents = incidents?.map((incident: any) => ({
        ...incident,
        response_time_minutes: incident.updated_at && incident.created_at 
          ? Math.round((new Date(incident.updated_at).getTime() - new Date(incident.created_at).getTime()) / (1000 * 60))
          : undefined
      })) || []

      setIncidentData(processedIncidents)

      // Fetch attendance data
      const { data: attendance, error: attendanceError } = await supabase
        .from('attendance_records')
        .select('id, timestamp, count')
        .order('timestamp', { ascending: true })

      if (attendanceError) console.warn('Attendance data error:', attendanceError)
      setAttendanceData(attendance || [])

    } catch (err) {
      console.error('Error fetching analytics data:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch data')
    } finally {
      setLoading(false)
    }
  }, [resolveCurrentEvent])

  // Generate AI summary
  const generateAISummary = useCallback(async () => {
    setIsGeneratingSummary(true)
    try {
      const prompt = `Analyze this incident data and provide a brief operational summary:
      
Total incidents: ${incidentData.length}
High priority: ${incidentData.filter(i => i.priority === 'high' || i.priority === 'urgent').length}
Average response time: ${incidentData.filter(i => i.response_time_minutes).reduce((acc, i) => acc + (i.response_time_minutes || 0), 0) / incidentData.filter(i => i.response_time_minutes).length || 0} minutes

Provide insights on patterns, areas for improvement, and recommendations. Keep it concise and actionable.`

      const response = await fetch('/api/v1/ai/prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, max_tokens: 200 })
      })

      if (!response.ok) throw new Error('Failed to generate summary')
      
      const data = await response.json()
      setAiSummary(data.summary || 'Unable to generate summary')
    } catch (error) {
      console.error('Error generating AI summary:', error)
      setAiSummary('Error generating summary')
    } finally {
      setIsGeneratingSummary(false)
    }
  }, [incidentData])

  useEffect(() => {
    fetchAnalyticsData()
  }, [fetchAnalyticsData])

  // Auto-generate summary when data changes
  useEffect(() => {
    if (incidentData.length > 0 && !aiSummary && !isGeneratingSummary) {
      generateAISummary()
    }
  }, [incidentData, aiSummary, isGeneratingSummary, generateAISummary])

  // Calculate metrics and chart data
  const metrics = useMemo(() => {
    const total = incidentData.length
    const highPriority = incidentData.filter(i => i.priority === 'high' || i.priority === 'urgent').length
    const avgResponseTime = incidentData
      .filter(i => i.response_time_minutes)
      .reduce((acc, i) => acc + (i.response_time_minutes || 0), 0) / 
      incidentData.filter(i => i.response_time_minutes).length || 0

    const typeBreakdown = incidentData.reduce((acc, incident) => {
      acc[incident.incident_type] = (acc[incident.incident_type] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const priorityBreakdown = incidentData.reduce((acc, incident) => {
      acc[incident.priority] = (acc[incident.priority] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return {
      total,
      highPriority,
      avgResponseTime: Math.round(avgResponseTime),
      typeBreakdown,
      priorityBreakdown
    }
  }, [incidentData])

  // Chart data calculations
  const chartData = useMemo(() => {
    // Incident volume over time (hourly)
    const hourlyData = incidentData.reduce((acc, incident) => {
      const hour = new Date(incident.created_at).getHours()
      acc[hour] = (acc[hour] || 0) + 1
      return acc
    }, {} as Record<number, number>)

    const incidentVolumeData = Array.from({ length: 24 }, (_, i) => ({
      hour: `${i}:00`,
      count: hourlyData[i] || 0
    }))

    // Incident type pie chart data
    const pieChartData = Object.entries(metrics.typeBreakdown).map(([type, count]) => ({
      name: type.replace('_', ' ').toUpperCase(),
      value: count,
      fill: ['#3B82F6', '#EF4444', '#F59E0B', '#10B981', '#8B5CF6', '#F97316'][Object.keys(metrics.typeBreakdown).indexOf(type) % 6]
    }))

    // Response time distribution
    const responseTimeBuckets = incidentData
      .filter(i => i.response_time_minutes)
      .reduce((acc, incident) => {
        const minutes = incident.response_time_minutes || 0
        let bucket = '0-5m'
        if (minutes > 30) bucket = '30m+'
        else if (minutes > 15) bucket = '15-30m'
        else if (minutes > 5) bucket = '5-15m'
        
        acc[bucket] = (acc[bucket] || 0) + 1
        return acc
      }, {} as Record<string, number>)

    const responseTimeData = Object.entries(responseTimeBuckets).map(([bucket, count]) => ({
      bucket,
      count
    }))

    // Attendance timeline data
    const attendanceTimelineData = attendanceData.map(record => ({
      time: new Date(record.timestamp).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
      count: record.count,
      capacity: eventData?.max_capacity || 1000
    }))

    // Ejection/refusal patterns
    const ejectionData = incidentData
      .filter(i => i.incident_type === 'ejection' || i.incident_type === 'refusal')
      .reduce((acc, incident) => {
        const hour = new Date(incident.created_at).getHours()
        acc[hour] = (acc[hour] || 0) + 1
        return acc
      }, {} as Record<number, number>)

    const ejectionPatternData = Array.from({ length: 24 }, (_, i) => ({
      hour: `${i}:00`,
      ejections: ejectionData[i] || 0
    }))

    return {
      incidentVolumeData,
      pieChartData,
      responseTimeData,
      attendanceTimelineData,
      ejectionPatternData
    }
  }, [incidentData, attendanceData, eventData, metrics.typeBreakdown])

  const aiSummaryColumns = useMemo(() => {
    if (!aiSummary) return []

    const normalized = aiSummary
      .split('\n')
      .map((line) =>
        line
          .replace(/\*\*(.*?)\*\*/g, '$1')
          .replace(/\*(.*?)\*/g, '$1')
          .replace(/^[-*]\s+/, '• ')
          .trim()
      )
      .filter((line) => line.length > 0)

    const midpoint = Math.ceil(normalized.length / 2) || 1
    return [normalized.slice(0, midpoint), normalized.slice(midpoint)]
  }, [aiSummary])

  // Chart colors
  const COLORS = ['#3B82F6', '#EF4444', '#F59E0B', '#10B981', '#8B5CF6', '#F97316', '#06B6D4', '#84CC16']

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Error Loading Analytics</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <button
            onClick={fetchAnalyticsData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <PageWrapper className="px-4 py-4 sm:px-6 sm:py-6">
      {/* Mobile Analytics */}
        {!isDesktop && (
        <div className="block md:hidden space-y-6 px-4 pb-10">
          <div className="relative glass-mobile overflow-hidden shadow-lg md:hover:scale-100 md:active:scale-100">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-white/20 to-transparent pointer-events-none" />
            <div className="relative z-10 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/40 bg-white/30 text-blue-600 dark:text-blue-300">
                  <BarChart3 className="h-5 w-5 stroke-[1.5]" strokeWidth={1.5} />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-gray-900 dark:text-white">Analytics</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Swipe through insights</p>
                </div>
              </div>
              <div className="flex items-center gap-1 rounded-xl border border-white/40 bg-white/20 px-1 py-1 shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)] dark:bg-white/10 dark:border-white/10 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]">
                {mobileViewOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setSelectedMobileView(option.value)}
                    className={`rounded-lg px-3 py-1 text-xs font-medium capitalize transition-all ${
                      selectedMobileView === option.value
                        ? 'bg-white/80 text-gray-900 shadow-[0_2px_8px_rgba(0,0,0,0.12)] dark:bg-white/10 dark:text-white dark:shadow-[0_2px_12px_rgba(0,0,0,0.45)]'
                        : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {selectedMobileView === 'dashboard' && (
            <>
              {eventData?.id && (
                <ReadinessIndexCard
                  eventId={eventData.id}
                  initialData={readinessData}
                  className="mb-4"
                />
              )}
              <div className="space-y-4">
                {createAnalyticsCards(incidentData, eventData).map((card) => {
                  if (card.type === 'chart') {
                    return (
                      <MobileOptimizedChart
                        key={card.id}
                        data={card.data.chartData || []}
                        title={card.title}
                        type={card.data.chartType || 'line'}
                        height={200}
                        variant="glass"
                        className="shadow-md md:hover:scale-100 md:active:scale-100"
                      />
                    )
                  }

                  const isPrimaryMetric = card.type === 'metric' || card.type === 'trend' || card.type === 'progress'
                  const shadowLevel = isPrimaryMetric ? 'shadow-lg' : 'shadow-md'

                  return (
                    <div
                      key={card.id}
                      className={`relative glass-mobile overflow-hidden ${shadowLevel} md:hover:scale-100 md:active:scale-100`}
                    >
                      <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-white/18 to-transparent pointer-events-none" />
                      <div className="relative z-10 space-y-3">
                        {card.type === 'metric' && (
                          <>
                            <p className="text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">
                              {card.title}
                            </p>
                            <p className="text-3xl font-bold text-gray-900 dark:text-white">
                              {card.data.value}
                            </p>
                            {card.data.subtitle && (
                              <p className="text-xs text-gray-600 dark:text-gray-400">{card.data.subtitle}</p>
                            )}
                          </>
                        )}
                        {card.type === 'trend' && (() => {
                          const change = card.data.change as number
                          const isPositiveChange = change >= 0
                          const positiveClass = card.data.reverseColors
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-green-600 dark:text-green-400'
                          const negativeClass = card.data.reverseColors
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-red-600 dark:text-red-400'

                          return (
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <p className="text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">
                                  {card.title}
                                </p>
                                <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{card.data.value}</p>
                                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{card.data.changeLabel}</p>
                              </div>
                              <span
                                className={`text-sm font-semibold ${isPositiveChange ? positiveClass : negativeClass}`}
                              >
                                {change > 0 ? '+' : ''}{change}%
                              </span>
                            </div>
                          )
                        })()}
                        {card.type === 'progress' && (() => {
                          const target = card.data.target || 1
                          const progress = Math.min((card.data.current / target) * 100, 100)
                          const percentComplete = Math.round(progress)

                          return (
                            <>
                              <p className="text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">
                                {card.title}
                              </p>
                              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                                {card.data.current}
                                <span className="ml-2 text-sm font-medium text-gray-500 dark:text-gray-400">
                                  / {card.data.target}{card.data.unit}
                                </span>
                              </p>
                              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/30 dark:bg-white/10">
                                <div
                                  className="h-full rounded-full bg-blue-600 dark:bg-blue-400 transition-all duration-300"
                                  style={{ width: `${progress}%` }}
                                />
                              </div>
                              <p className="text-xs text-gray-600 dark:text-gray-400">
                                {percentComplete}% complete
                              </p>
                            </>
                          )
                        })()}
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="glass-card relative rounded-2xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.08)] dark:shadow-[0_4px_14px_rgba(0,0,0,0.45)]">
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-white/18 to-transparent pointer-events-none" />
                <div className="relative z-10">
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Live Analytics</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {liveMetricCards.map((metric) => (
                      <div
                        key={metric.key}
                        className="glass-card relative rounded-2xl p-4 shadow-[0_4px_16px_rgba(0,0,0,0.15)] dark:shadow-[0_6px_20px_rgba(0,0,0,0.45)]"
                      >
                        <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-white/18 to-transparent pointer-events-none" />
                        <div className="relative z-10 space-y-2">
                          <div className="flex items-center gap-2">
                            <span className={`h-2.5 w-2.5 rounded-full ${metric.color}`} />
                            <span className="text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">
                              {metric.label}
                            </span>
                          </div>
                          <p className="text-3xl font-bold text-gray-900 dark:text-white">
                            {metric.value}
                            {metric.suffix && (
                              <span className="ml-1 text-sm font-medium text-gray-500 dark:text-gray-400">
                                {metric.suffix}
                              </span>
                            )}
                          </p>
                          <p className={`text-xs ${metric.footnoteClass}`}>{metric.footnote}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {selectedMobileView === 'comparison' && (
            <ComparativeAnalytics
              currentEvent={comparisonData.current}
              previousEvent={comparisonData.previous}
              className=""
            />
          )}

          {selectedMobileView === 'realtime' && (
            <div className="space-y-4">
              <div className="glass-card relative rounded-2xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.08)] dark:shadow-[0_4px_14px_rgba(0,0,0,0.45)]">
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-white/18 to-transparent pointer-events-none" />
                <div className="relative z-10">
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Live Analytics</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {liveMetricCards.map((metric) => (
                      <div
                        key={metric.key}
                        className="glass-card relative rounded-2xl p-4 shadow-[0_4px_16px_rgba(0,0,0,0.15)] dark:shadow-[0_6px_20px_rgba(0,0,0,0.45)]"
                      >
                        <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-white/18 to-transparent pointer-events-none" />
                        <div className="relative z-10 space-y-2">
                          <div className="flex items-center gap-2">
                            <span className={`h-2.5 w-2.5 rounded-full ${metric.color}`} />
                            <span className="text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">
                              {metric.label}
                            </span>
                          </div>
                          <p className="text-3xl font-bold text-gray-900 dark:text-white">
                            {metric.value}
                            {metric.suffix && (
                              <span className="ml-1 text-sm font-medium text-gray-500 dark:text-gray-400">
                                {metric.suffix}
                              </span>
                            )}
                          </p>
                          <p className={`text-xs ${metric.footnoteClass}`}>{metric.footnote}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Desktop Analytics */}
      {isDesktop && (
        <div className="hidden md:block">
          <div className="bg-white/80 dark:bg-slate-900/80 rounded-3xl shadow-lg shadow-black/5 border border-gray-200/70 dark:border-gray-700/50 p-6 md:p-8 space-y-8 backdrop-blur-md">
                {/* Header - Mobile Optimized */}
                <div className="mb-4 sm:mb-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-4">
                    <div className="flex-1">
                      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Analytics Dashboard</h1>
                      <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1 sm:mt-2">Monitor performance and insights for your events.</p>
                    </div>
                    <button
                      onClick={() => setIsExportModalOpen(true)}
                      className="touch-target w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 sm:py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-lg font-medium transition-colors shadow-sm text-sm"
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      <span>Export Report</span>
                    </button>
                  </div>
                  
                  {/* Real-time Status and Alerts - Mobile Stacked */}
                  <div className="flex flex-col gap-3 sm:gap-4">
                    <div className="w-full">
                      <RealtimeStatusIndicator
                        isConnected={realtimeAnalytics.isConnected}
                        error={realtimeAnalytics.error}
                        lastUpdated={realtimeAnalytics.data.lastUpdated}
                        updateCount={realtimeAnalytics.data.updateCount}
                        onRefresh={realtimeAnalytics.refresh}
                      />
                    </div>
                    <div className="w-full">
                      <RealtimeAlertBanner
                        alerts={realtimeAnalytics.alerts}
                        onDismiss={realtimeAnalytics.dismissAlert}
                        onClearAll={realtimeAnalytics.clearAlerts}
                      />
                    </div>
                  </div>
                </div>

        {/* Tabs - Responsive grid that falls into two rows on compact screens */}
        <Card className="p-2 mb-4 sm:mb-6">
          <nav className="grid grid-flow-col auto-cols-[minmax(150px,1fr)] grid-rows-2 gap-2 overflow-x-auto pb-2 sm:auto-cols-[minmax(180px,1fr)] md:grid-rows-1 md:overflow-visible xl:flex xl:flex-wrap">
            {analyticsTabs.map(tab => {
              const Icon = tab.icon
              const isActive = activeTab === tab.key
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`${tabButtonBaseClasses} ${isActive ? tab.activeClass : inactiveTabClass}`}
                >
                  <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                    <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                    <span className="hidden sm:inline">{tab.label}</span>
                    <span className="sm:hidden">{tab.shortLabel}</span>
                  </div>
                </button>
              )
            })}
          </nav>
        </Card>

        {/* Tab Content */}
        {activeTab === 'quality' && (
          <LogQualityDashboard 
            startDate={dateRange.startDate}
            endDate={dateRange.endDate}
            eventId={eventData?.id}
          />
        )}

        {activeTab === 'compliance' && (
          <ComplianceDashboard 
            startDate={dateRange.startDate}
            endDate={dateRange.endDate}
            eventId={eventData?.id}
          />
        )}

                {activeTab === 'staff' && (
                  <UserActivityDashboard
                    startDate={dateRange.startDate}
                    endDate={dateRange.endDate}
                    eventId={eventData?.id}
                  />
                )}

                {activeTab === 'staffing' && (
                  <section className="space-y-6">
                    <StaffingOverview
                      snapshot={staffingSnapshot}
                      forecast={staffingForecast}
                      loading={staffingLoading}
                      error={staffingError}
                    />
                    <StaffingDisciplineGrid snapshot={staffingSnapshot} forecast={staffingForecast} />
                    <StaffingAlertsList snapshot={staffingSnapshot} forecast={staffingForecast} />
                  </section>
                )}

                {activeTab === 'crowd-intelligence' && (
                  <section className="space-y-6">
                    {crowdError && (
                      <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                        {crowdError}
                      </div>
                    )}
                    <CrowdIntelligenceOverview
                      metrics={crowdSummary?.metrics}
                      sentimentTrend={crowdSummary?.sentimentTrend ?? []}
                      keywordHighlights={crowdSummary?.keywordHighlights ?? []}
                    />
                    <div className="grid gap-6 xl:grid-cols-3">
                      <div className="space-y-6 xl:col-span-2">
                        <CrowdBehaviorMonitor
                          insights={crowdSummary?.behaviorInsights ?? []}
                          loading={crowdLoading}
                        />
                        <WelfareSentimentPanel
                          insights={crowdSummary?.welfareInsights ?? []}
                          loading={crowdLoading}
                        />
                      </div>
                      <div className="space-y-6">
                        <CrowdRiskMatrix zones={crowdSummary?.zoneRiskScores ?? []} />
                        <CrowdAlertsList alerts={crowdSummary?.criticalAlerts ?? []} loading={crowdLoading} />
                      </div>
                    </div>
                  </section>
                )}

                {activeTab === 'ai-insights' && (
                  <AIInsightsDashboard
                    startDate={dateRange.startDate}
                    endDate={dateRange.endDate}
                    eventId={eventData?.id}
                    readiness={readinessData}
                  />
                )}

                {activeTab === 'custom-metrics' && (
                  <CustomMetricBuilder
                    eventId={eventData?.id}
                    onMetricCreated={(metric) => {
                      console.log('New metric created:', metric)
                    }}
                    onMetricUpdated={(metric) => {
                      console.log('Metric updated:', metric)
                    }}
                  />
                )}

                {activeTab === 'custom-dashboards' && (
                  <FeatureGate 
                    feature="custom-dashboards" 
                    plan={userPlan} 
                    showUpgradeCard={true}
                    upgradeCardVariant="card"
                    upgradeCardDescription="Build custom dashboards with drag-and-drop widgets, save layouts, and share with your team."
                  >
                    <CustomDashboardBuilder
                      eventId={eventData?.id || ''}
                      onSave={(dashboard) => {
                        console.log('Dashboard saved:', dashboard)
                      }}
                      onCancel={() => {
                        console.log('Dashboard creation cancelled')
                      }}
                    />
                  </FeatureGate>
                )}

                {activeTab === 'benchmarking' && (
                  <BenchmarkingDashboard
                    eventId={eventData?.id || ''}
                  />
                )}

                {activeTab === 'end-of-event' && (
                  <EndOfEventReport eventId={eventData?.id} readiness={readinessData} />
                )}

                {activeTab === 'real-time' && (
                  <FeatureGate
                    feature="real-time-analytics"
                    plan={userPlan}
                    showUpgradeCard={true}
                    upgradeCardVariant="card"
                    upgradeCardDescription="Monitor your event operations in real-time with live metrics, auto-refreshing charts, and instant alerts."
                  >
                    {eventData?.id && (
                      <RealtimeAnalyticsDashboard
                        eventId={eventData.id}
                        refreshInterval={5000}
                      />
                    )}
                  </FeatureGate>
                )}

        {/* Operational Tab Content - Dynamic Split */}
        {activeTab === 'operational' && (
          <section className="space-y-6">
            {eventData?.id && (
              <div id="operational-readiness-card">
                <ReadinessIndexCard
                  eventId={eventData.id}
                  initialData={readinessData}
                  className="mb-2"
                />
              </div>
            )}
            <AnalyticsDashboard 
              data={{
                kpis: {
                  total: metrics.total,
                  open: incidentData.filter(i => i.status !== 'closed').length,
                  closed: incidentData.filter(i => i.status === 'closed').length,
                  avgResponseTime: metrics.avgResponseTime,
                  mostLikelyType: Object.entries(metrics.typeBreakdown).sort(([,a], [,b]) => b - a)[0]?.[0]?.replace('_', ' ') || 'N/A',
                  peakAttendance: attendanceData.length > 0 ? Math.max(...attendanceData.map(a => a.count)) : 'N/A'
                },
                trends: {
                  incidentVolumeData: chartData.incidentVolumeData,
                  responseTimeData: chartData.responseTimeData
                },
                activity: {
                  attendanceTimelineData: chartData.attendanceTimelineData,
                  ejectionPatternData: chartData.ejectionPatternData
                }
              }}
            />
          </section>
        )}


        {/* AI Summary Section */}
        {aiSummary && (
          <section className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 md:p-6 space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-3 w-1 rounded-full bg-gradient-to-b from-blue-500 to-purple-500" />
              <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase">AI Insights</h2>
            </div>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-200">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">AI Operational Summary</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Key insights generated from the latest incident activity.
                  </p>
                </div>
              </div>
              <button
                onClick={generateAISummary}
                disabled={isGeneratingSummary}
                className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400"
              >
                {isGeneratingSummary ? 'Generating…' : 'Refresh Insights'}
              </button>
            </div>
            <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Sparkles className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">AI Operational Summary</h2>
            </div>
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
              <div 
                className="text-sm leading-relaxed text-gray-700 dark:text-gray-300"
                dangerouslySetInnerHTML={{ 
                  __html: aiSummary
                    // If the AI already returned HTML, use it as-is
                    .includes('<div') ? aiSummary :
                    // Otherwise convert markdown to HTML
                    aiSummary
                      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Convert bold
                      .replace(/\*(.*?)\*/g, '<em>$1</em>') // Convert italic
                      .replace(/^### (.*$)/gim, '<h3 style="color: #1f2937; font-size: 16px; font-weight: 600; margin: 16px 0 8px 0;">$1</h3>') // Convert headers
                      .replace(/^## (.*$)/gim, '<h2 style="color: #111827; font-size: 18px; font-weight: 700; margin: 20px 0 12px 0;">$1</h2>') // Convert main headers
                      .replace(/^# (.*$)/gim, '<h1 style="color: #111827; font-size: 20px; font-weight: 700; margin: 24px 0 16px 0;">$1</h1>') // Convert main titles
                      .replace(/^\d+\.\s+(.*$)/gim, '<div style="margin-left: 16px; margin-bottom: 8px;"><strong>$1</strong></div>') // Convert numbered lists
                      .replace(/^[-*]\s+(.*$)/gim, '<div style="margin-left: 16px; margin-bottom: 4px;">• $1</div>') // Convert bullet lists
                      .replace(/\n\n/g, '<br><br>') // Convert double line breaks
                      .replace(/\n/g, '<br>') // Convert single line breaks
                }}
              />
            </div>
            {incidentData.length > 0 && (
              <div className="mt-3 flex gap-2 text-xs">
                <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                  {metrics.total} incidents
                </span>
                <span className="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 px-2 py-1 rounded">
                  {metrics.highPriority} high priority
                </span>
              </div>
            )}
          </Card>
          </section>
        )}

        {/* Recent Incidents Section */}
        <section className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 md:p-6 space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-3 w-1 rounded-full bg-gradient-to-b from-gray-500 to-slate-500" />
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase">Recent Incidents</h2>
          </div>
          <Card>
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Recent Incidents</h2>
          </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Response Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Created
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {incidentData.slice(0, 10).map((incident) => (
                  <tr key={incident.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white capitalize">
                      {incident.incident_type.replace('_', ' ')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        incident.priority === 'urgent' || incident.priority === 'high'
                          ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          : incident.priority === 'medium'
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                          : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      }`}>
                        {incident.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {incident.response_time_minutes ? `${incident.response_time_minutes}m` : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {new Date(incident.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
        </section>
          </div>
        </div>
      )}

      {/* Export Report Modal */}
      <ExportReportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        eventId={eventData?.id}
        eventName={eventData?.name || undefined}
      />
    </PageWrapper>
  )
}
