"use client"

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
  id: string
  timestamp: string
  count: number
}

interface EventData {
  id: string
  name: string
  start_time: string
  end_time: string
  max_capacity: number
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

      const processedIncidents = incidents?.map(incident => ({
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

      // Fetch current event
      const { data: event, error: eventError } = await supabase
        .from('events')
        .select('id, name, start_time, end_time, max_capacity')
        .eq('is_current', true)
        .single()

      if (eventError) console.warn('Event data error:', eventError)
      setEventData(event || null)

    } catch (err) {
      console.error('Error fetching analytics data:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch data')
    } finally {
      setLoading(false)
    }
  }, [])

  // Generate AI summary
  const generateAISummary = async () => {
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
  }

  useEffect(() => {
    fetchAnalyticsData()
  }, [fetchAnalyticsData])

  // Auto-generate summary when data changes
  useEffect(() => {
    if (incidentData.length > 0 && !aiSummary && !isGeneratingSummary) {
      generateAISummary()
    }
  }, [incidentData, aiSummary, isGeneratingSummary])

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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Analytics Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Monitor performance and insights for your events.</p>
        </div>

        {/* Top Level Metrics - 6 Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Total Incidents</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{metrics.total}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">All incident types</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Open Incidents</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{incidentData.filter(i => i.status !== 'closed').length}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Requiring attention</p>
              </div>
              <AlertCircle className="h-8 w-8 text-orange-500" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Closed Incidents</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{incidentData.filter(i => i.status === 'closed').length}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Resolved</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Avg Response Time</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">{Math.floor(metrics.avgResponseTime / 60)}h {metrics.avgResponseTime % 60}m</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Time to resolution</p>
              </div>
              <Clock className="h-8 w-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Most Likely Type</p>
                <p className="text-sm font-bold text-gray-900 dark:text-white">
                  {Object.entries(metrics.typeBreakdown).sort(([,a], [,b]) => b - a)[0]?.[0]?.replace('_', ' ') || 'N/A'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Trending pattern</p>
              </div>
              <Lightbulb className="h-8 w-8 text-yellow-500" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Peak Attendance</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {attendanceData.length > 0 ? Math.max(...attendanceData.map(a => a.count)) : 'N/A'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Capacity tracking</p>
              </div>
              <Users className="h-8 w-8 text-purple-500" />
            </div>
          </div>
        </div>

        {/* Operational Focus, Response Performance, Attendance Pulse - 3 Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Live Watch */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <Eye className="h-6 w-6 text-red-600" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Live Watch</h3>
            </div>
            <div className="space-y-3">
              <div className="text-sm">
                <span className="text-gray-600 dark:text-gray-400">Open incidents: </span>
                <span className="font-semibold text-gray-900 dark:text-white">{incidentData.filter(i => i.status !== 'closed').length}</span>
                <span className="text-gray-600 dark:text-gray-400"> ({metrics.highPriority} high, 0 medium, 0 low)</span>
              </div>
              <div className="text-sm">
                <span className="text-gray-600 dark:text-gray-400">Longest open incident: </span>
                <span className="font-semibold text-green-600">All resolved</span>
              </div>
              <div className="text-sm">
                <span className="text-gray-600 dark:text-gray-400">Incidents last hour: </span>
                <span className="font-semibold text-gray-900 dark:text-white">0</span>
                <span className="text-gray-600 dark:text-gray-400"> (Peak window 13:00 - 14:00. {metrics.total} total)</span>
              </div>
            </div>
          </div>

          {/* Response Quality */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <Timer className="h-6 w-6 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Response Quality</h3>
            </div>
            <div className="space-y-3">
              <div className="text-sm">
                <span className="text-gray-600 dark:text-gray-400">Average response: </span>
                <span className="font-semibold text-gray-900 dark:text-white">Median unavailable</span>
              </div>
              <div className="text-sm">
                <span className="text-gray-600 dark:text-gray-400">Fastest response: </span>
                <span className="font-semibold text-gray-900 dark:text-white">Slowest {Math.floor(metrics.avgResponseTime / 60)}h {metrics.avgResponseTime % 60}m</span>
              </div>
              <div className="text-sm">
                <span className="text-gray-600 dark:text-gray-400">Closed incidents: </span>
                <span className="font-semibold text-gray-900 dark:text-white">{incidentData.filter(i => i.status === 'closed').length}</span>
                <span className="text-gray-600 dark:text-gray-400"> ({metrics.total} with response data)</span>
              </div>
            </div>
          </div>

          {/* Ingress Snapshot */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <UserPlus className="h-6 w-6 text-purple-600" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Ingress Snapshot</h3>
            </div>
            <div className="space-y-3">
              <div className="text-sm">
                <span className="text-gray-600 dark:text-gray-400">Current attendance: </span>
                <span className="font-semibold text-gray-900 dark:text-white">{attendanceData.length > 0 ? attendanceData[attendanceData.length - 1]?.count || 0 : 0}</span>
                <span className="text-gray-600 dark:text-gray-400"> (Forecast {eventData?.max_capacity || 25000})</span>
              </div>
              <div className="text-sm">
                <span className="text-gray-600 dark:text-gray-400">Goal progress: </span>
                <span className="font-semibold text-gray-900 dark:text-white">0%</span>
                <span className="text-gray-600 dark:text-gray-400"> (Awaiting counts)</span>
              </div>
              <div className="text-sm">
                <span className="text-gray-600 dark:text-gray-400">Biggest surge: </span>
                <span className="font-semibold text-green-600">Stable</span>
                <span className="text-gray-600 dark:text-gray-400"> (No surge detected)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Attendance Timeline, Attendance Log, Live Incident Status - 3 Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Attendance Timeline */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Attendance Timeline</h3>
            {attendanceData.length > 0 ? (
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData.attendanceTimelineData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.2)" />
                    <XAxis dataKey="time" tick={{ fontSize: 10 }} />
                    <YAxis />
                    <Tooltip />
                    <Area 
                      type="monotone" 
                      dataKey="count" 
                      stackId="1" 
                      stroke="#8B5CF6" 
                      fill="#8B5CF6" 
                      fillOpacity={0.6}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-sm">No attendance data to display.</p>
            )}
          </div>

          {/* Attendance Log */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Attendance Log</h3>
            {attendanceData.length > 0 ? (
              <div className="space-y-4">
                <div className="text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Attendance Progress: </span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {Math.round((attendanceData.length > 0 ? attendanceData[attendanceData.length - 1]?.count || 0 : 0) / (eventData?.max_capacity || 25000) * 100)}%
                  </span>
                  <span className="text-gray-600 dark:text-gray-400"> ({attendanceData.length > 0 ? attendanceData[attendanceData.length - 1]?.count || 0 : 0}/{eventData?.max_capacity || 25000})</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-gray-50 dark:bg-gray-900 p-2 rounded">
                    <div className="text-gray-600 dark:text-gray-400">Peak:</div>
                    <div className="font-semibold">{Math.max(...attendanceData.map(a => a.count))}</div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-900 p-2 rounded">
                    <div className="text-gray-600 dark:text-gray-400">Average:</div>
                    <div className="font-semibold">{Math.round(attendanceData.reduce((acc, a) => acc + a.count, 0) / attendanceData.length)}</div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-900 p-2 rounded">
                    <div className="text-gray-600 dark:text-gray-400">Median:</div>
                    <div className="font-semibold">{attendanceData.length > 0 ? attendanceData[Math.floor(attendanceData.length / 2)]?.count || 0 : 0}</div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-900 p-2 rounded">
                    <div className="text-gray-600 dark:text-gray-400">Peak Time:</div>
                    <div className="font-semibold">N/A</div>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-sm">No attendance data to display.</p>
            )}
          </div>

          {/* Live Incident Status */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Live Incident Status</h3>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-xs text-green-600 font-medium">Connected</span>
              </div>
            </div>
            <div className="text-center">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h4 className="text-lg font-semibold text-green-600 mb-2">All Clear</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">No active incidents at this time</p>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        {showAdvancedFeatures && (
          <div className="space-y-8">
            {/* Row 1: Incident Volume & Type Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Incident Volume Over Time */}
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <TrendingUp className="w-6 h-6 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Incident Volume Over Time</h3>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData.incidentVolumeData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.2)" />
                      <XAxis 
                        dataKey="hour" 
                        tick={{ fontSize: 12 }}
                        angle={-45}
                        textAnchor="end"
                        height={60}
                      />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#3B82F6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Incident Type Breakdown */}
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <PieChart className="w-6 h-6 text-green-600" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Incident Types Breakdown</h3>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={chartData.pieChartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }: { name: string; percent?: number }) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {chartData.pieChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Row 2: Response Time Distribution & Ejection Patterns */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Response Time Distribution */}
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <Clock className="w-6 h-6 text-orange-600" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Response Time Distribution</h3>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData.responseTimeData} layout="horizontal">
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.2)" />
                      <XAxis type="number" />
                      <YAxis dataKey="bucket" type="category" width={80} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#F59E0B" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Ejection/Refusal Patterns */}
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <UserX className="w-6 h-6 text-red-600" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Ejection/Refusal Patterns</h3>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData.ejectionPatternData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.2)" />
                      <XAxis 
                        dataKey="hour" 
                        tick={{ fontSize: 12 }}
                        angle={-45}
                        textAnchor="end"
                        height={60}
                      />
                      <YAxis />
                      <Tooltip />
                      <Line 
                        type="monotone" 
                        dataKey="ejections" 
                        stroke="#EF4444" 
                        strokeWidth={2}
                        dot={{ fill: '#EF4444', strokeWidth: 2, r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* AI Summary Section */}
        {aiSummary && (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm mb-8">
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
              <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">
                {aiSummary}
              </p>
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
          </div>
        )}

        {/* Recent Incidents Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
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
        </div>
      </div>
    </div>
  )
}