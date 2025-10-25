'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { 
  DocumentTextIcon,
  SparklesIcon,
  ArrowDownTrayIcon,
  ClockIcon,
  UserGroupIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  LightBulbIcon,
  CalendarIcon,
  MapPinIcon,
  TrophyIcon
} from '@heroicons/react/24/outline'
import { supabase } from '@/lib/supabase'
import { generateEventReport, type EventReportData, type EventReportOptions } from '@/lib/analytics/eventReportGenerator'
import { useToast } from '@/components/Toast'
import { Card } from '@/components/ui/card'

interface EndOfEventReportProps {
  eventId?: string
  className?: string
}

interface EventData {
  id: string
  name?: string
  venue_name?: string
  event_date: string
  start_time: string
  end_time: string
  max_capacity?: number
  expected_attendance?: number
  actual_attendance?: number
  status: string
}

interface IncidentSummary {
  total: number
  byType: Record<string, number>
  byPriority: Record<string, number>
  avgResponseTime: number
  resolved: number
  open: number
}

interface StaffPerformance {
  totalStaff: number
  assignedPositions: number
  radioSignouts: number
  avgResponseTime: number
  efficiencyScore: number
}

interface LessonsLearned {
  strengths: string[]
  improvements: string[]
  recommendations: string[]
  confidence: number
}

const buildIncidentSummary = (incidents: any[]): IncidentSummary => {
  if (!incidents || incidents.length === 0) {
    return {
      total: 0,
      byType: {},
      byPriority: {},
      avgResponseTime: 0,
      resolved: 0,
      open: 0
    }
  }

  const resolvedIncidents = incidents.filter((incident) => incident.status === 'closed')
  const incidentsWithResponse = incidents.filter((incident) => incident.updated_at && incident.created_at)
  const avgResponseTime =
    incidentsWithResponse.length > 0
      ? incidentsWithResponse.reduce((acc, incident) => {
          const responseTime =
            new Date(incident.updated_at).getTime() - new Date(incident.created_at).getTime()
          return acc + responseTime / (1000 * 60)
        }, 0) / incidentsWithResponse.length
      : 0

  return {
    total: incidents.length,
    byType: incidents.reduce((acc: Record<string, number>, incident: any) => {
      const key = incident.incident_type || 'unknown'
      acc[key] = (acc[key] || 0) + 1
      return acc
    }, {}),
    byPriority: incidents.reduce((acc: Record<string, number>, incident: any) => {
      const key = incident.priority || 'unspecified'
      acc[key] = (acc[key] || 0) + 1
      return acc
    }, {}),
    avgResponseTime,
    resolved: resolvedIncidents.length,
    open: incidents.length - resolvedIncidents.length
  }
}

const buildStaffPerformance = (
  assignments: any[] | null,
  radioSignouts: any[] | null,
  summary: IncidentSummary | null
): StaffPerformance => {
  const totalAssignments = assignments?.length || 0
  const assignedPositions = assignments?.filter((a) => a.staff_id).length || 0
  const radiosOut = radioSignouts?.filter((r) => r.status === 'out').length || 0

  return {
    totalStaff: totalAssignments,
    assignedPositions,
    radioSignouts: radiosOut,
    avgResponseTime: summary?.avgResponseTime || 0,
    efficiencyScore: totalAssignments > 0 ? (assignedPositions / totalAssignments) * 100 : 0
  }
}

export default function EndOfEventReport({ eventId, className = '' }: EndOfEventReportProps) {
  const { addToast } = useToast()
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [eventData, setEventData] = useState<EventData | null>(null)
  const [incidentSummary, setIncidentSummary] = useState<IncidentSummary | null>(null)
  const [staffPerformance, setStaffPerformance] = useState<StaffPerformance | null>(null)
  const [lessonsLearned, setLessonsLearned] = useState<LessonsLearned | null>(null)
  const [aiInsights, setAiInsights] = useState<string>('')
  const [showPreview, setShowPreview] = useState(false)
  const [detailedIncidents, setDetailedIncidents] = useState<any[]>([])
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false)
  const [emailForm, setEmailForm] = useState({
    recipients: '',
    subject: '',
    message: '',
    includeAttachment: true
  })
  const [isSendingEmail, setIsSendingEmail] = useState(false)


  const fetchEventData = useCallback(async () => {
    if (!eventId) {
      setEventData(null)
      setIncidentSummary(null)
      setStaffPerformance(null)
      setLessonsLearned(null)
      setAiInsights('')
      setDetailedIncidents([])
      setLoading(false)
      return
    }

    // Prevent multiple simultaneous fetches
    if (loading) {
      return
    }

    setLoading(true)
    try {
      const { data: event, error: eventError } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single()

      if (eventError) {
        throw eventError
      }

      setEventData(event as unknown as EventData)

      const { data: incidents, error: incidentError } = await supabase
        .from('incident_logs')
        .select('*')
        .eq('event_id', eventId)
        .order('created_at', { ascending: false })

      if (incidentError) {
        console.warn('Incident summary error:', incidentError)
      }

      const incidentRecords = incidents || []
      setDetailedIncidents(incidentRecords)
      const summary = buildIncidentSummary(incidentRecords)
      setIncidentSummary(summary)

      const [staffAssignmentsResult, radioSignoutsResult] = await Promise.all([
        supabase
          .from('position_assignments')
          .select('*')
          .eq('event_id', eventId),
        supabase
          .from('radio_signouts')
          .select('*')
          .eq('event_id', eventId)
      ])

      if (staffAssignmentsResult.error) {
        console.warn('Staff assignment error:', staffAssignmentsResult.error)
      }

      if (radioSignoutsResult.error) {
        console.warn('Radio sign-out error:', radioSignoutsResult.error)
      }

      const performance = buildStaffPerformance(
        staffAssignmentsResult.data || [],
        radioSignoutsResult.data || [],
        summary
      )
      setStaffPerformance(performance)

      // Generate AI insights inline to avoid circular dependency
      try {
        const resolvedCount = incidentRecords.filter((incident: any) => incident.status === 'closed').length
        const prompt = `Analyze this event data and provide insights:

Event: ${(event as any).name}
Date: ${(event as any).event_date}
Attendance: ${(event as any).actual_attendance || 'Unknown'}/${(event as any).max_capacity}
Incidents: ${incidentRecords.length} total (${resolvedCount} resolved)
Staff: ${staffAssignmentsResult.data?.length || 0} positions assigned

Provide:
1. 3 key strengths of this event
2. 3 areas for improvement
3. 3 actionable recommendations for future events
4. Overall assessment with confidence score (0-100)

Format as JSON with keys: strengths, improvements, recommendations, confidence`

        const response = await fetch('/api/v1/ai/prompt', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt, max_tokens: 500 })
        })

        if (response.ok) {
          const data = await response.json()
          try {
            // Clean the response - remove markdown formatting if present
            let cleanResponse = data.summary || '{}'
            
            // Remove markdown code block formatting
            if (cleanResponse.includes('```json')) {
              cleanResponse = cleanResponse.replace(/```json\s*/, '').replace(/\s*```/, '')
            }
            if (cleanResponse.includes('```')) {
              cleanResponse = cleanResponse.replace(/```\s*/, '').replace(/\s*```/, '')
            }
            
            const insights = JSON.parse(cleanResponse)
            setLessonsLearned({
              strengths:
                insights.strengths || [
                  'Event completed successfully',
                  'Staff coordination effective',
                  'Incident response timely'
                ],
              improvements:
                insights.improvements || [
                  'Increase staff training',
                  'Improve communication protocols',
                  'Enhance documentation'
                ],
              recommendations:
                insights.recommendations || [
                  'Implement pre-event briefings',
                  'Use technology for better tracking',
                  'Regular performance reviews'
                ],
              confidence: insights.confidence || 85
            })
          } catch (parseError) {
            console.warn('Unable to parse AI lessons learned response:', parseError)
            setLessonsLearned({
              strengths: [
                'Event completed successfully',
                'Staff coordination effective',
                'Incident response timely'
              ],
              improvements: [
                'Increase staff training',
                'Improve communication protocols',
                'Enhance documentation'
              ],
              recommendations: [
                'Implement pre-event briefings',
                'Use technology for better tracking',
                'Regular performance reviews'
              ],
              confidence: 75
            })
          }
        }

        // Generate overall AI summary
        const summaryPrompt = `Provide a concise executive summary for this event:

Event: ${event.name}
Incidents: ${incidentRecords.length} (${resolvedCount} resolved)
Staff Performance: ${staffAssignmentsResult.data?.length || 0} positions
Response Time: ${summary?.avgResponseTime?.toFixed(1) || 'N/A'} minutes average

Focus on operational effectiveness, key metrics, and overall success. Provide two short paragraphs.`

        const summaryResponse = await fetch('/api/v1/ai/prompt', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: summaryPrompt, max_tokens: 200 })
        })

        if (summaryResponse.ok) {
          const summaryData = await summaryResponse.json()
          setAiInsights(summaryData.summary || 'AI insights not available')
        }
      } catch (aiError) {
        console.error('Error generating AI insights:', aiError)
        // Don't show toast for AI insights failure, just log it
      }
    } catch (error) {
      console.error('Error fetching event data:', error)
      
      // Check if it's a network error
      const isNetworkError = error instanceof TypeError && error.message.includes('Failed to fetch')
      const isResourceError = error instanceof Error && error.message.includes('ERR_INSUFFICIENT_RESOURCES')
      
      addToast({
        type: 'error',
        title: 'Event Data Error',
        message: isNetworkError || isResourceError 
          ? 'Network connection issue. Please check your connection and try again.'
          : 'Failed to load event data',
        duration: 4000
      })
    } finally {
      setLoading(false)
    }
  }, [eventId, addToast])

  useEffect(() => {
    // Debounce the fetch to prevent excessive calls
    const timeoutId = setTimeout(() => {
    fetchEventData()
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [fetchEventData])

  const generateCSVReport = useCallback((): string => {
    const rows = [
      ['Event Report', eventData?.name || ''],
      ['Date', eventData ? new Date(eventData.event_date).toLocaleDateString() : ''],
      ['Venue', eventData?.venue_name || ''],
      [''],
      ['INCIDENT SUMMARY'],
      ['Total Incidents', incidentSummary?.total || 0],
      ['Resolved', incidentSummary?.resolved || 0],
      ['Open', incidentSummary?.open || 0],
      ['Average Response Time (min)', incidentSummary?.avgResponseTime.toFixed(1) || 'N/A'],
      [''],
      ['STAFF PERFORMANCE'],
      ['Assigned Positions', staffPerformance?.assignedPositions || 0],
      ['Radio Sign-outs', staffPerformance?.radioSignouts || 0],
      ['Efficiency Score (%)', staffPerformance?.efficiencyScore.toFixed(0) || 0],
      [''],
      ['LESSONS LEARNED - STRENGTHS'],
      ...((lessonsLearned?.strengths || []).map(s => ['', s])),
      [''],
      ['LESSONS LEARNED - IMPROVEMENTS'],
      ...((lessonsLearned?.improvements || []).map(i => ['', i])),
      [''],
      ['LESSONS LEARNED - RECOMMENDATIONS'],
      ...((lessonsLearned?.recommendations || []).map(r => ['', r])),
      [''],
      ['AI INSIGHTS'],
      ['', aiInsights]
    ]
    return rows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')
  }, [eventData, incidentSummary, staffPerformance, lessonsLearned, aiInsights])

  const generateReport = useCallback(async (format: 'pdf' | 'csv' = 'pdf') => {
    if (!eventData || !incidentSummary || !staffPerformance || !lessonsLearned) {
      addToast({
        type: 'error',
        title: 'Cannot Generate Report',
        message: 'Missing data for report generation',
        duration: 4000
      })
      return
    }

    setGenerating(true)
    try {
      const timestamp = new Date().toISOString().split('T')[0]
      const eventName = eventData.name || eventData.venue_name || `Event-${eventData.id.slice(0, 8)}`
      const filename = `event-report-${eventName.replace(/\s+/g, '-').toLowerCase()}-${timestamp}.${format}`
      
      if (format === 'csv') {
        // Generate CSV report
        const csvContent = generateCSVReport()
        const blob = new Blob([csvContent], { type: 'text/csv' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = filename
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        // For PDF, create a print-friendly version
        window.print()
      }

      addToast({
        type: 'success',
        title: 'Report Ready',
        message: 'Event report generated successfully!',
        duration: 4000
      })

    } catch (error) {
      console.error('Error generating report:', error)
      addToast({
        type: 'error',
        title: 'Report Failed',
        message: 'Failed to generate report',
        duration: 4000
      })
    } finally {
      setGenerating(false)
    }
  }, [eventData, incidentSummary, staffPerformance, lessonsLearned, generateCSVReport, addToast])

  const sendEmailReport = useCallback(async () => {
    if (!emailForm.recipients.trim()) {
      addToast({
        type: 'error',
        title: 'Missing Recipients',
        message: 'Please enter at least one recipient email',
        duration: 4000
      })
      return
    }

    setIsSendingEmail(true)
    try {
      const response = await fetch('/api/v1/reports/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: eventData?.id,
          eventName: eventData?.name,
          recipients: emailForm.recipients.split(',').map(e => e.trim()),
          subject: emailForm.subject || `Event Report: ${eventData?.name}`,
          message: emailForm.message,
          reportData: {
            event: eventData,
            incidents: incidentSummary,
            staff: staffPerformance,
            lessonsLearned,
            aiInsights
          },
          includeAttachment: emailForm.includeAttachment
        })
      })

      if (!response.ok) throw new Error('Failed to send email')

      addToast({
        type: 'success',
        title: 'Email Sent',
        message: 'Report sent successfully!',
        duration: 4000
      })

      setIsEmailModalOpen(false)
      setEmailForm({
        recipients: '',
        subject: '',
        message: '',
        includeAttachment: true
      })

    } catch (error) {
      console.error('Error sending email:', error)
      addToast({
        type: 'error',
        title: 'Email Failed',
        message: 'Failed to send email. Please try again.',
        duration: 4000
      })
    } finally {
      setIsSendingEmail(false)
    }
  }, [emailForm, eventData, incidentSummary, staffPerformance, lessonsLearned, aiInsights, addToast])

  // All useMemo hooks must also be before conditional returns
  const computedMetrics = useMemo(() => {
    const totalIncidents = incidentSummary?.total ?? 0
    const resolvedIncidents = incidentSummary?.resolved ?? 0
    const resolutionRate = totalIncidents > 0 ? (resolvedIncidents / totalIncidents) * 100 : 100
    const avgResponse = incidentSummary?.avgResponseTime ?? 0
    const highPriorityCount =
      (incidentSummary?.byPriority?.high || 0) + (incidentSummary?.byPriority?.urgent || 0)
    const topIncidentEntry =
      incidentSummary && totalIncidents > 0
        ? Object.entries(incidentSummary.byType).sort((a, b) => b[1] - a[1])[0]
        : null
    const attendanceFill =
      eventData?.actual_attendance && eventData?.max_capacity
        ? Math.round((eventData.actual_attendance / eventData.max_capacity) * 100)
        : null
    const staffingCoverage = staffPerformance
      ? Math.round(staffPerformance.efficiencyScore)
      : null

    return {
      totalIncidents,
      resolvedIncidents,
      resolutionRate,
      avgResponse,
      highPriorityCount,
      topIncidentLabel: topIncidentEntry ? topIncidentEntry[0] : null,
      topIncidentCount: topIncidentEntry ? topIncidentEntry[1] : 0,
      attendanceFill,
      staffingCoverage,
      openIncidents: incidentSummary?.open ?? 0,
      radiosOut: staffPerformance?.radioSignouts ?? 0
    }
  }, [eventData, incidentSummary, staffPerformance])

  const priorityBreakdown = useMemo(() => {
    if (!incidentSummary?.total) {
      return []
    }

    return Object.entries(incidentSummary.byPriority)
      .sort((a, b) => b[1] - a[1])
      .map(([priority, count]) => ({
        priority,
        count,
        percentage: Math.round((count / incidentSummary.total) * 100)
      }))
  }, [incidentSummary])

  const incidentTypeBreakdown = useMemo(() => {
    if (!incidentSummary?.total) {
      return []
    }

    return Object.entries(incidentSummary.byType)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([type, count]) => ({
        type,
        count,
        percentage: Math.round((count / incidentSummary.total) * 100)
      }))
  }, [incidentSummary])

  const operationalHighlights = useMemo(() => {
    type Highlight = {
      title: string
      value: string
      description: string
      Icon: React.ElementType
      accent: string
    }

    const highlights: Highlight[] = []

    if (computedMetrics.totalIncidents > 0) {
      highlights.push({
        title: 'Resolution Rate',
        value: `${Math.round(computedMetrics.resolutionRate)}%`,
        description: `${computedMetrics.resolvedIncidents} of ${computedMetrics.totalIncidents} incidents closed`,
        Icon: CheckCircleIcon,
        accent: 'text-green-600'
      })
      highlights.push({
        title: 'Average Response',
        value: `${computedMetrics.avgResponse.toFixed(1)} min`,
        description: 'Mean time from incident creation to closure',
        Icon: ClockIcon,
        accent: 'text-blue-600'
      })
    }

    if (computedMetrics.staffingCoverage !== null) {
      highlights.push({
        title: 'Staffing Coverage',
        value: `${computedMetrics.staffingCoverage}%`,
        description: 'Positions filled during the event',
        Icon: UserGroupIcon,
        accent: 'text-purple-600'
      })
    }

    highlights.push({
      title: 'High Priority Incidents',
      value: computedMetrics.highPriorityCount.toString(),
      description: 'Critical and high-priority events recorded',
      Icon: ExclamationTriangleIcon,
      accent: 'text-amber-500'
    })

    if (computedMetrics.attendanceFill !== null && eventData) {
      highlights.push({
        title: 'Attendance Achieved',
        value: `${computedMetrics.attendanceFill}%`,
        description: `${eventData.actual_attendance?.toLocaleString() || '0'} of ${eventData.max_capacity?.toLocaleString() || 'N/A'} capacity`,
        Icon: TrophyIcon,
        accent: 'text-indigo-600'
      })
    }

    return highlights
  }, [computedMetrics, eventData])

  // NOW we can have conditional returns, AFTER all hooks
  
  // If no eventId provided, show message to select an event
  if (!eventId || eventId === '') {
    return (
      <Card className={`p-8 text-center ${className}`}>
        <DocumentTextIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          No Event Selected
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Please select an event to generate the end-of-event report.
        </p>
      </Card>
    )
  }

  // Show loading skeleton while fetching data
  if (loading) {
    return (
      <Card className={`p-4 sm:p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-4"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 mb-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </Card>
    )
  }

  // If data couldn't be loaded after loading completed
  if (!eventData) {
    return (
      <Card className={`p-6 text-center ${className}`}>
        <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Event data unavailable
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          We could not load the event details. Please refresh or try selecting a different event.
        </p>
      </Card>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <DocumentTextIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">End-of-Event Report</h2>
            <p className="text-gray-600 dark:text-gray-400">Comprehensive analysis for {eventData.name || eventData.venue_name || `Event ${eventData.id.slice(0, 8)}`}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setIsEmailModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <span>Email Report</span>
          </button>
          <button
            onClick={() => generateReport('pdf')}
            disabled={generating}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
          >
            {generating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Generating...</span>
              </>
            ) : (
              <>
                <ArrowDownTrayIcon className="h-5 w-5" />
                <span>Print/PDF</span>
              </>
            )}
          </button>
          <button
            onClick={() => generateReport('csv')}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
          >
            <ArrowDownTrayIcon className="h-5 w-5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {operationalHighlights.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {operationalHighlights.map((metric) => (
            <Card key={metric.title} className="p-5 sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    {metric.title}
                  </p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white mt-1">
                    {metric.value}
                  </p>
                </div>
                <div className="rounded-full bg-gray-100 dark:bg-gray-800/80 p-3">
                  <metric.Icon className={`h-6 w-6 ${metric.accent}`} />
                </div>
              </div>
              <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
                {metric.description}
              </p>
            </Card>
          ))}
        </div>
      )}

      {/* Event Overview */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Event Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="flex items-center gap-3">
            <CalendarIcon className="h-8 w-8 text-blue-600" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Date</p>
              <p className="font-semibold text-gray-900 dark:text-white">
                {new Date(eventData.event_date).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <MapPinIcon className="h-8 w-8 text-green-600" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Venue</p>
              <p className="font-semibold text-gray-900 dark:text-white">{eventData.venue_name}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <UserGroupIcon className="h-8 w-8 text-purple-600" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Attendance</p>
              <p className="font-semibold text-gray-900 dark:text-white">
                {eventData.actual_attendance || 'N/A'} / {eventData.max_capacity}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ClockIcon className="h-8 w-8 text-orange-600" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Duration</p>
              <p className="font-semibold text-gray-900 dark:text-white">
                {eventData.start_time} - {eventData.end_time}
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Incident Summary */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-50 dark:bg-red-900/20">
                <ChartBarIcon className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Incident Summary</h3>
            </div>
            <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">
              {computedMetrics.totalIncidents} total
            </span>
          </div>

          {incidentSummary ? (
            <>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Resolved</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {computedMetrics.resolvedIncidents}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Open</p>
                  <p className="text-lg font-semibold text-orange-600">
                    {computedMetrics.openIncidents}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Resolution Rate</p>
                  <p className="text-lg font-semibold text-green-600">
                    {Math.round(computedMetrics.resolutionRate)}%
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Avg Response</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {computedMetrics.avgResponse.toFixed(1)} min
                  </p>
                </div>
              </div>

              {incidentTypeBreakdown.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">
                    Top incident patterns
                  </p>
                  <ul className="space-y-2">
                    {incidentTypeBreakdown.map(({ type, count, percentage }) => (
                      <li key={type} className="flex items-center gap-3 text-sm">
                        <div className="flex-1">
                          <div className="flex justify-between">
                            <span className="font-medium text-gray-900 dark:text-white capitalize">
                              {type.replace(/_/g, ' ')}
                            </span>
                            <span className="text-gray-500 dark:text-gray-400">
                              {count} • {percentage}%
                            </span>
                          </div>
                          <div className="h-2 mt-1 rounded-full bg-gray-100 dark:bg-gray-800">
                            <div
                              className="h-full rounded-full bg-red-500 dark:bg-red-600"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          ) : (
            <p className="text-gray-500 dark:text-gray-400">Loading incident data...</p>
          )}
        </Card>

        {/* Staff Performance */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                <UserGroupIcon className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Staff Performance</h3>
            </div>
            <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">
              {staffPerformance?.totalStaff || 0} roles
            </span>
          </div>

          {staffPerformance ? (
            <>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Positions Filled</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {staffPerformance.assignedPositions}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Coverage</p>
                  <p className="text-lg font-semibold text-green-600">
                    {computedMetrics.staffingCoverage ?? 0}%
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Radio Sign-outs</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {computedMetrics.radiosOut}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Avg Response</p>
                  <p className="text-lg font-semibold text-blue-600">
                    {computedMetrics.avgResponse.toFixed(1)} min
                  </p>
                </div>
              </div>
              <div className="mt-4 rounded-lg border border-blue-100 dark:border-blue-900/40 bg-blue-50 dark:bg-blue-900/10 p-3 text-sm text-blue-800 dark:text-blue-200">
                Coverage maintained at {computedMetrics.staffingCoverage ?? 0}% with{' '}
                {computedMetrics.radiosOut} radios deployed for the event.
              </div>
            </>
          ) : (
            <p className="text-gray-500 dark:text-gray-400">Loading staff data...</p>
          )}
        </Card>

        {/* Risk & Priority */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-900/20">
              <ExclamationTriangleIcon className="h-6 w-6 text-amber-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Risk Profile</h3>
          </div>

          {priorityBreakdown.length > 0 ? (
            <div className="space-y-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">
                  Priority distribution
                </p>
                <ul className="space-y-2">
                  {priorityBreakdown.map(({ priority, count, percentage }) => (
                    <li key={priority} className="text-sm">
                      <div className="flex justify-between">
                        <span className="capitalize text-gray-900 dark:text-white">{priority}</span>
                        <span className="text-gray-500 dark:text-gray-400">
                          {count} • {percentage}%
                        </span>
                      </div>
                      <div className="h-2 mt-1 rounded-full bg-gray-100 dark:bg-gray-800">
                        <div
                          className="h-full rounded-full bg-amber-500 dark:bg-amber-600"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-lg border border-amber-100 dark:border-amber-900/30 bg-amber-50 dark:bg-amber-900/10 p-3 text-sm text-amber-800 dark:text-amber-200">
                {computedMetrics.highPriorityCount} high-priority incidents flagged with{' '}
                {computedMetrics.openIncidents} open at close.
              </div>
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400">Priority breakdown unavailable.</p>
          )}
        </Card>
      </div>

      {/* AI Insights */}
      {aiInsights && (
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <SparklesIcon className="h-6 w-6 text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">AI Executive Summary</h3>
          </div>
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
            <div className="space-y-3 text-sm leading-relaxed text-gray-700 dark:text-gray-300">
              {aiInsights
                .split('\n')
                .map(line => line.trim())
                .filter(Boolean)
                .map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
            </div>
          </div>
        </Card>
      )}

      {/* Detailed Incident Logs Table */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <DocumentTextIcon className="h-6 w-6 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Complete Incident Log</h3>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              ({detailedIncidents?.length || 0} incidents recorded)
            </span>
          </div>
          <div className="flex gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <span className="text-gray-600 dark:text-gray-400">
                {detailedIncidents?.filter(i => i.status === 'closed' || i.status === 'logged').length || 0} Closed
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
              <span className="text-gray-600 dark:text-gray-400">
                {detailedIncidents?.filter(i => i.status === 'in_progress').length || 0} In Progress
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-red-500 rounded-full"></span>
              <span className="text-gray-600 dark:text-gray-400">
                {detailedIncidents?.filter(i => i.status === 'open').length || 0} Open
              </span>
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 table-fixed">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="w-20 px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Incident ID
                </th>
                <th className="w-32 px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Type & Priority
                </th>
                <th className="w-48 px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Occurrence
                </th>
                <th className="w-24 px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="w-24 px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Created
                </th>
                <th className="w-28 px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Response Time
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions & Amendments
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {detailedIncidents && detailedIncidents.length > 0 ? (
                detailedIncidents.slice(0, 10).map((incident, index) => {
                  const responseTime = incident.updated_at && incident.timestamp 
                    ? Math.round((new Date(incident.updated_at).getTime() - new Date(incident.timestamp).getTime()) / (1000 * 60))
                    : incident.updated_at && incident.created_at 
                    ? Math.round((new Date(incident.updated_at).getTime() - new Date(incident.created_at).getTime()) / (1000 * 60))
                    : null
                  
                  return (
                    <tr key={incident.id || index} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="w-20 px-4 py-4 whitespace-nowrap text-sm font-mono text-gray-900 dark:text-white">
                        {incident.log_number ? incident.log_number.split('-').pop() : incident.id || String(index + 1).padStart(3, '0')}
                      </td>
                      <td className="w-32 px-4 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                            {incident.incident_type?.replace(/_/g, ' ') || incident.type?.replace(/_/g, ' ') || incident.occurrence || 'Unknown'}
                          </span>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            incident.priority === 'urgent' || incident.priority === 'high'
                              ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                              : incident.priority === 'medium'
                              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                              : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          }`}>
                            {incident.priority ? incident.priority.charAt(0).toUpperCase() + incident.priority.slice(1) : 'Unspecified'}
                          </span>
                        </div>
                      </td>
                      <td className="w-48 px-4 py-4 text-sm text-gray-900 dark:text-white">
                        <div className="break-words">
                          <span className="text-sm">
                            {incident.occurrence || incident.description || incident.notes || 'No description'}
                          </span>
                        </div>
                      </td>
                      <td className="w-24 px-4 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          incident.status === 'closed' || incident.status === 'logged'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : incident.status === 'in_progress'
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        }`}>
                          {incident.status ? incident.status.charAt(0).toUpperCase() + incident.status.slice(1) : 'Unknown'}
                        </span>
                      </td>
                      <td className="w-24 px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {incident.timestamp ? new Date(incident.timestamp).toLocaleTimeString() : incident.created_at ? new Date(incident.created_at).toLocaleTimeString() : 'N/A'}
                      </td>
                      <td className="w-28 px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {responseTime ? `${responseTime}m` : 'N/A'}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-900 dark:text-white">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                            <span className="text-xs">Incident logged by {incident.callsign_from || 'Staff'}</span>
                          </div>
                          {incident.updated_at && incident.updated_at !== incident.timestamp && incident.updated_at !== incident.created_at && (
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                              <span className="text-xs">Status updated to {incident.status}</span>
                            </div>
                          )}
                          {incident.status === 'closed' && (
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                              <span className="text-xs">Incident resolved</span>
                            </div>
                          )}
                          {incident.callsign_to && (
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                              <span className="text-xs">Assigned to {incident.callsign_to}</span>
                            </div>
                          )}
                          {incident.action_taken && (
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
                              <span className="text-xs">Action: {incident.action_taken}</span>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                    <div className="flex flex-col items-center gap-2">
                      <DocumentTextIcon className="h-8 w-8 text-gray-300" />
                      <span className="text-lg font-medium">No incidents recorded for this event</span>
                      <span className="text-sm">This indicates excellent event management!</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {detailedIncidents && detailedIncidents.length > 10 && (
          <div className="mt-4 text-center">
            <button className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200">
              View all {detailedIncidents.length} incidents →
            </button>
          </div>
        )}
      </Card>

      {/* Lessons Learned */}
      {lessonsLearned && (
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <LightBulbIcon className="h-6 w-6 text-yellow-600" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Lessons Learned</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Strengths */}
            <div>
              <h4 className="font-medium text-green-600 dark:text-green-400 mb-3 flex items-center gap-2">
                <CheckCircleIcon className="h-4 w-4" />
                Strengths
              </h4>
              <ul className="space-y-2">
                {lessonsLearned.strengths.map((strength, index) => (
                  <li key={index} className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-2">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0"></span>
                    {strength}
                  </li>
                ))}
              </ul>
            </div>

            {/* Improvements */}
            <div>
              <h4 className="font-medium text-orange-600 dark:text-orange-400 mb-3 flex items-center gap-2">
                <ExclamationTriangleIcon className="h-4 w-4" />
                Areas for Improvement
              </h4>
              <ul className="space-y-2">
                {lessonsLearned.improvements.map((improvement, index) => (
                  <li key={index} className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-2">
                    <span className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-2 flex-shrink-0"></span>
                    {improvement}
                  </li>
                ))}
              </ul>
            </div>

            {/* Recommendations */}
            <div>
              <h4 className="font-medium text-blue-600 dark:text-blue-400 mb-3 flex items-center gap-2">
                <LightBulbIcon className="h-4 w-4" />
                Recommendations
              </h4>
              <ul className="space-y-2">
                {lessonsLearned.recommendations.map((recommendation, index) => (
                  <li key={index} className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-2">
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                    {recommendation}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Card>
      )}

      {/* Email Modal */}
      {isEmailModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto card-modal">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Email Event Report
                </h3>
                <button
                  onClick={() => setIsEmailModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Recipients (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={emailForm.recipients}
                    onChange={(e) => setEmailForm(prev => ({ ...prev, recipients: e.target.value }))}
                    placeholder="email1@example.com, email2@example.com"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Subject
                  </label>
                  <input
                    type="text"
                    value={emailForm.subject}
                    onChange={(e) => setEmailForm(prev => ({ ...prev, subject: e.target.value }))}
                    placeholder={`Event Report: ${eventData?.name}`}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Message
                  </label>
                  <textarea
                    value={emailForm.message}
                    onChange={(e) => setEmailForm(prev => ({ ...prev, message: e.target.value }))}
                    rows={4}
                    placeholder="Add a personal message..."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="includeAttachment"
                    checked={emailForm.includeAttachment}
                    onChange={(e) => setEmailForm(prev => ({ ...prev, includeAttachment: e.target.checked }))}
                    className="rounded border-gray-300 dark:border-gray-600"
                  />
                  <label htmlFor="includeAttachment" className="text-sm text-gray-700 dark:text-gray-300">
                    Include CSV attachment
                  </label>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    <strong>Preview:</strong> The report will include all metrics, AI insights, and lessons learned from this event.
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setIsEmailModalOpen(false)}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={sendEmailReport}
                  disabled={isSendingEmail || !emailForm.recipients.trim()}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
                >
                  {isSendingEmail ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white inline-block mr-2"></div>
                      Sending...
                    </>
                  ) : (
                    'Send Report'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
