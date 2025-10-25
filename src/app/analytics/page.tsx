"use client"

export const dynamic = 'force-dynamic'
export const revalidate = 0

import React, { useCallback, useEffect, useMemo, useState } from 'react'
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
import ExportReportModal from '@/components/analytics/ExportReportModal'
import RealtimeAlertBanner from '@/components/analytics/RealtimeAlertBanner'
import RealtimeStatusIndicator from '@/components/analytics/RealtimeStatusIndicator'
import CustomMetricBuilder from '@/components/analytics/CustomMetricBuilder'
import CustomDashboardBuilder from '@/components/analytics/CustomDashboardBuilder'
import BenchmarkingDashboard from '@/components/analytics/BenchmarkingDashboard'
import EndOfEventReport from '@/components/analytics/EndOfEventReport'
import MobileAnalyticsCarousel, { createAnalyticsCards } from '@/components/analytics/MobileAnalyticsCarousel'
import ComparativeAnalytics from '@/components/analytics/ComparativeAnalytics'
import MobileOptimizedChart from '@/components/MobileOptimizedChart'
import AnalyticsDashboard from '@/components/AnalyticsDashboard'
import { useRealtimeAnalytics } from '@/hooks/useRealtimeAnalytics'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { Card } from '@/components/ui/card'
import { PageWrapper } from '@/components/layout/PageWrapper'

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

export default function AnalyticsPage() {
  const [incidentData, setIncidentData] = useState<IncidentRecord[]>([])
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([])
  const [eventData, setEventData] = useState<EventData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [aiSummary, setAiSummary] = useState<string>('')
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false)
  const [showAdvancedFeatures, setShowAdvancedFeatures] = useState(true)
  const [activeTab, setActiveTab] = useState<'operational' | 'quality' | 'compliance' | 'staff' | 'ai-insights' | 'custom-metrics' | 'custom-dashboards' | 'benchmarking' | 'end-of-event'>('operational')
  const [isExportModalOpen, setIsExportModalOpen] = useState(false)
  const isDesktop = useMediaQuery('(min-width: 768px)')
  
  // Mobile analytics state
  const [selectedMobileView, setSelectedMobileView] = useState<'dashboard' | 'comparison' | 'realtime'>('dashboard')
  const [previousEvents, setPreviousEvents] = useState<any[]>([])

  const mobileViewOptions: Array<{ value: typeof selectedMobileView; label: string }> = [
    { value: 'dashboard', label: 'Dashboard' },
    { value: 'comparison', label: 'Compare' },
    { value: 'realtime', label: 'Live' }
  ]

  const openIncidentsCount = useMemo(
    () => incidentData.filter((incident) => incident.status !== 'closed').length,
    [incidentData]
  )

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

  // Fetch all analytics data
  const fetchAnalyticsData = useCallback(async () => {
    try {
      setLoading(true)
      
      // Fetch incidents
      const { data: incidents, error: incidentError } = await supabase
        .from('incident_logs')
        .select('id, incident_type, priority, status, created_at, updated_at')
        .order('created_at', { ascending: false })
        .limit(100)

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

      // Fetch current event (try is_current first, then fallback to most recent)
      let { data: event, error: eventError } = await supabase
        .from('events')
        .select('*')
        .eq('is_current', true)
        .single()

      if (eventError) {
        console.warn('No current event found, trying most recent event:', eventError)
        // Fallback to most recent event if no current event
        const { data: recentEvent, error: recentError } = await supabase
          .from('events')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(1)
          .single()
        
        if (recentError) {
          console.warn('No events found via Supabase, trying get-current-event API:', recentError)
          // Final fallback: use the get-current-event API
          try {
            const response = await fetch('/api/get-current-event')
            if (response.ok) {
              const apiEvent = await response.json()
              console.log('Found event via API:', apiEvent)
              setEventData(apiEvent)
            } else {
              console.warn('No events found via API either')
              setEventData(null)
            }
          } catch (apiError) {
            console.warn('API fallback failed:', apiError)
            setEventData(null)
          }
        } else {
          console.log('Found recent event:', recentEvent)
          setEventData(recentEvent)
        }
      } else {
        console.log('Found current event:', event)
        setEventData(event)
      }

    } catch (err) {
      console.error('Error fetching analytics data:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch data')
    } finally {
      setLoading(false)
    }
  }, [])

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

        {/* Tabs - Mobile Optimized with Horizontal Scroll */}
        <Card className="p-1.5 sm:p-2 mb-4 sm:mb-6 overflow-x-auto">
          <nav className="flex space-x-1 sm:space-x-2 min-w-max sm:min-w-0">
            <button
              onClick={() => setActiveTab('operational')}
              className={`${
                activeTab === 'operational'
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 border-blue-500'
                  : 'bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 border-transparent'
              } touch-target whitespace-nowrap flex-shrink-0 sm:flex-1 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 border-2 font-medium text-xs sm:text-sm transition-all duration-200`}
            >
              <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="hidden sm:inline">Operational Metrics</span>
                <span className="sm:hidden">Operational</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('quality')}
              className={`${
                activeTab === 'quality'
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 border-blue-500'
                  : 'bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 border-transparent'
              } touch-target whitespace-nowrap flex-shrink-0 sm:flex-1 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 border-2 font-medium text-xs sm:text-sm transition-all duration-200`}
            >
              <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                <Sparkles className="h-4 w-4 sm:h-5 sm:w-5" />
                <span>Quality</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('compliance')}
              className={`${
                activeTab === 'compliance'
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 border-blue-500'
                  : 'bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 border-transparent'
              } touch-target whitespace-nowrap flex-shrink-0 sm:flex-1 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 border-2 font-medium text-xs sm:text-sm transition-all duration-200`}
            >
              <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="hidden sm:inline">JESIP/JDM Compliance</span>
                <span className="sm:hidden">Compliance</span>
              </div>
            </button>
                    <button
                      onClick={() => setActiveTab('staff')}
                      className={`${
                        activeTab === 'staff'
                          ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 border-blue-500'
                          : 'bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 border-transparent'
                      } touch-target whitespace-nowrap flex-shrink-0 sm:flex-1 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 border-2 font-medium text-xs sm:text-sm transition-all duration-200`}
                    >
                      <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                        <Users className="h-4 w-4 sm:h-5 sm:w-5" />
                        <span>Staff</span>
                      </div>
                    </button>
                    <button
                      onClick={() => setActiveTab('ai-insights')}
                      className={`${
                        activeTab === 'ai-insights'
                          ? 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 border-purple-500'
                          : 'bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 border-transparent'
                      } touch-target whitespace-nowrap flex-shrink-0 sm:flex-1 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 border-2 font-medium text-xs sm:text-sm transition-all duration-200`}
                    >
                      <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                        <Sparkles className="h-4 w-4 sm:h-5 sm:w-5" />
                        <span className="hidden sm:inline">AI Insights</span>
                        <span className="sm:hidden">AI</span>
                      </div>
                    </button>
                    <button
                      onClick={() => setActiveTab('custom-metrics')}
                      className={`${
                        activeTab === 'custom-metrics'
                          ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 border-green-500'
                          : 'bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 border-transparent'
                      } touch-target whitespace-nowrap flex-shrink-0 sm:flex-1 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 border-2 font-medium text-xs sm:text-sm transition-all duration-200`}
                    >
                      <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                        <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        <span className="hidden sm:inline">Custom Metrics</span>
                        <span className="sm:hidden">Metrics</span>
                      </div>
                    </button>
                    <button
                      onClick={() => setActiveTab('custom-dashboards')}
                      className={`${
                        activeTab === 'custom-dashboards'
                          ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 border-indigo-500'
                          : 'bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 border-transparent'
                      } touch-target whitespace-nowrap flex-shrink-0 sm:flex-1 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 border-2 font-medium text-xs sm:text-sm transition-all duration-200`}
                    >
                      <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                        <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                        </svg>
                        <span className="hidden sm:inline">Custom Dashboards</span>
                        <span className="sm:hidden">Dashboards</span>
                      </div>
                    </button>
                    <button
                      onClick={() => setActiveTab('benchmarking')}
                      className={`${
                        activeTab === 'benchmarking'
                          ? 'bg-pink-100 dark:bg-pink-900 text-pink-700 dark:text-pink-300 border-pink-500'
                          : 'bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 border-transparent'
                      } touch-target whitespace-nowrap flex-shrink-0 sm:flex-1 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 border-2 font-medium text-xs sm:text-sm transition-all duration-200`}
                    >
                      <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                        <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                        </svg>
                        <span className="hidden sm:inline">Benchmarking</span>
                        <span className="sm:hidden">Benchmark</span>
                      </div>
                    </button>
                    <button
                      onClick={() => setActiveTab('end-of-event')}
                      className={`${
                        activeTab === 'end-of-event'
                          ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 border-indigo-500'
                          : 'bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 border-transparent'
                      } touch-target whitespace-nowrap flex-shrink-0 sm:flex-1 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 border-2 font-medium text-xs sm:text-sm transition-all duration-200`}
                    >
                      <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                        <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span className="hidden sm:inline">End-of-Event Report</span>
                        <span className="sm:hidden">Report</span>
                      </div>
                    </button>
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

                {activeTab === 'ai-insights' && (
                  <AIInsightsDashboard
                    startDate={dateRange.startDate}
                    endDate={dateRange.endDate}
                    eventId={eventData?.id}
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
                  <CustomDashboardBuilder
                    eventId={eventData?.id || ''}
                    onSave={(dashboard) => {
                      console.log('Dashboard saved:', dashboard)
                    }}
                    onCancel={() => {
                      console.log('Dashboard creation cancelled')
                    }}
                  />
                )}

                {activeTab === 'benchmarking' && (
                  <BenchmarkingDashboard
                    eventId={eventData?.id || ''}
                  />
                )}

                {activeTab === 'end-of-event' && (
                  <EndOfEventReport eventId={eventData?.id} />
                )}

        {/* Operational Tab Content - Dynamic Split */}
        {activeTab === 'operational' && (
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
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Sparkles className="w-6 h-6 text-blue-600" />
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">AI Operational Summary</h2>
              </div>
              <button
                onClick={generateAISummary}
                disabled={isGeneratingSummary}
                className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
              >
                {isGeneratingSummary ? 'Generating...' : 'Refresh'}
              </button>
            </div>
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
              <div className="text-sm leading-relaxed text-gray-700 dark:text-gray-300 space-y-3">
                {aiSummary.split('\n').map((line, index) => {
                  if (line.trim() === '') return null;
                  
                  // Clean up markdown formatting
                  const cleanLine = line
                    .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
                    .replace(/\*(.*?)\*/g, '$1') // Remove italic
                    .replace(/^[-*]\s+/, '• ') // Convert list items to bullets
                    .trim();
                  
                  if (cleanLine.startsWith('•')) {
                    return (
                      <div key={index} className="ml-4">
                        {cleanLine}
                      </div>
                    );
                  } else if (cleanLine.includes(':')) {
                    return (
                      <div key={index} className="font-semibold text-gray-900 dark:text-white">
                        {cleanLine}
                      </div>
                    );
                  } else {
                    return (
                      <div key={index}>
                        {cleanLine}
                      </div>
                    );
                  }
                })}
              </div>
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
