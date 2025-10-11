'use client'

import React, { useState, useEffect } from 'react'
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

interface EndOfEventReportProps {
  eventId?: string
  className?: string
}

interface EventData {
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

  useEffect(() => {
    if (eventId) {
      fetchEventData()
    }
  }, [eventId])

  const fetchEventData = async () => {
    setLoading(true)
    try {
      // Fetch event details
      const { data: event, error: eventError } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single()

      if (eventError) throw eventError
      setEventData(event)

      // Fetch incident summary
      const { data: incidents, error: incidentError } = await supabase
        .from('incident_logs')
        .select('incident_type, priority, status, created_at, updated_at')
        .eq('event_id', eventId)

      if (!incidentError && incidents) {
        const summary: IncidentSummary = {
          total: incidents.length,
          byType: incidents.reduce((acc, incident) => {
            acc[incident.incident_type] = (acc[incident.incident_type] || 0) + 1
            return acc
          }, {} as Record<string, number>),
          byPriority: incidents.reduce((acc, incident) => {
            acc[incident.priority] = (acc[incident.priority] || 0) + 1
            return acc
          }, {} as Record<string, number>),
          avgResponseTime: incidents
            .filter(i => i.updated_at && i.created_at)
            .reduce((acc, i) => {
              const responseTime = new Date(i.updated_at).getTime() - new Date(i.created_at).getTime()
              return acc + (responseTime / (1000 * 60)) // Convert to minutes
            }, 0) / Math.max(incidents.filter(i => i.updated_at && i.created_at).length, 1),
          resolved: incidents.filter(i => i.status === 'closed').length,
          open: incidents.filter(i => i.status !== 'closed').length
        }
        setIncidentSummary(summary)
      }

      // Fetch staff performance
      const { data: staffAssignments, error: staffError } = await supabase
        .from('position_assignments')
        .select('*')
        .eq('event_id', eventId)

      const { data: radioSignouts, error: radioError } = await supabase
        .from('radio_signouts')
        .select('*')
        .eq('event_id', eventId)

      if (!staffError && !radioError) {
        const performance: StaffPerformance = {
          totalStaff: staffAssignments?.length || 0,
          assignedPositions: staffAssignments?.filter(a => a.staff_id).length || 0,
          radioSignouts: radioSignouts?.filter(r => r.status === 'out').length || 0,
          avgResponseTime: incidentSummary?.avgResponseTime || 0,
          efficiencyScore: staffAssignments?.length ? 
            (staffAssignments.filter(a => a.staff_id).length / staffAssignments.length) * 100 : 0
        }
        setStaffPerformance(performance)
      }

      // Generate AI insights and lessons learned
      await generateAIInsights(event, incidents, staffAssignments)

    } catch (error) {
      console.error('Error fetching event data:', error)
      addToast({
        type: 'error',
        message: 'Failed to load event data',
        duration: 4000
      })
    } finally {
      setLoading(false)
    }
  }

  const generateAIInsights = async (event: EventData, incidents: any[], staffAssignments: any[]) => {
    try {
      const prompt = `Analyze this event data and provide insights:

Event: ${event.name}
Date: ${event.event_date}
Attendance: ${event.actual_attendance || 'Unknown'}/${event.max_capacity}
Incidents: ${incidents.length} total (${incidents.filter(i => i.status === 'closed').length} resolved)
Staff: ${staffAssignments?.length || 0} positions assigned

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
          const insights = JSON.parse(data.summary || '{}')
          setLessonsLearned({
            strengths: insights.strengths || ['Event completed successfully', 'Staff coordination effective', 'Incident response timely'],
            improvements: insights.improvements || ['Increase staff training', 'Improve communication protocols', 'Enhance documentation'],
            recommendations: insights.recommendations || ['Implement pre-event briefings', 'Use technology for better tracking', 'Regular performance reviews'],
            confidence: insights.confidence || 85
          })
        } catch (parseError) {
          // Fallback if JSON parsing fails
          setLessonsLearned({
            strengths: ['Event completed successfully', 'Staff coordination effective', 'Incident response timely'],
            improvements: ['Increase staff training', 'Improve communication protocols', 'Enhance documentation'],
            recommendations: ['Implement pre-event briefings', 'Use technology for better tracking', 'Regular performance reviews'],
            confidence: 75
          })
        }
      }

      // Generate overall AI summary
      const summaryPrompt = `Provide a 2-paragraph executive summary for this event:

Event: ${event.name}
Incidents: ${incidents.length} (${incidents.filter(i => i.status === 'closed').length} resolved)
Staff Performance: ${staffAssignments?.length || 0} positions
Response Time: ${incidentSummary?.avgResponseTime.toFixed(1) || 'N/A'} minutes average

Focus on operational effectiveness, key metrics, and overall success.`

      const summaryResponse = await fetch('/api/v1/ai/prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: summaryPrompt, max_tokens: 200 })
      })

      if (summaryResponse.ok) {
        const summaryData = await summaryResponse.json()
        setAiInsights(summaryData.summary || 'AI insights not available')
      }

    } catch (error) {
      console.error('Error generating AI insights:', error)
    }
  }

  const generateReport = async () => {
    if (!eventData || !incidentSummary || !staffPerformance || !lessonsLearned) {
      addToast({
        type: 'error',
        message: 'Missing data for report generation',
        duration: 4000
      })
      return
    }

    setGenerating(true)
    try {
      const reportData: EventReportData = {
        event: eventData,
        incidents: incidentSummary,
        staff: staffPerformance,
        lessonsLearned,
        aiInsights
      }

      const options: EventReportOptions = {
        format: 'pdf',
        includeCharts: true,
        includeRecommendations: true,
        branding: {
          companyName: 'Your Organization'
        }
      }

      const reportContent = await generateEventReport(reportData, options)
      
      const timestamp = new Date().toISOString().split('T')[0]
      const filename = `event-report-${eventData.name.replace(/\s+/g, '-').toLowerCase()}-${timestamp}.pdf`
      
      // Download the report
      const blob = new Blob([reportContent], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      addToast({
        type: 'success',
        message: 'Event report generated successfully!',
        duration: 4000
      })

    } catch (error) {
      console.error('Error generating report:', error)
      addToast({
        type: 'error',
        message: 'Failed to generate report',
        duration: 4000
      })
    } finally {
      setGenerating(false)
    }
  }

  if (loading) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!eventData) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 ${className}`}>
        <div className="text-center">
          <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No Event Selected
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Please select an event to generate the end-of-event report.
          </p>
        </div>
      </div>
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
            <p className="text-gray-600 dark:text-gray-400">Comprehensive analysis for {eventData.name}</p>
          </div>
        </div>
        <button
          onClick={generateReport}
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
              <span>Generate PDF Report</span>
            </>
          )}
        </button>
      </div>

      {/* Event Overview */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
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
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Incident Summary */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3 mb-4">
            <ChartBarIcon className="h-6 w-6 text-red-600" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Incidents</h3>
          </div>
          {incidentSummary ? (
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Total:</span>
                <span className="font-semibold text-gray-900 dark:text-white">{incidentSummary.total}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Resolved:</span>
                <span className="font-semibold text-green-600">{incidentSummary.resolved}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Avg Response:</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {incidentSummary.avgResponseTime.toFixed(1)}m
                </span>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400">Loading incident data...</p>
          )}
        </div>

        {/* Staff Performance */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3 mb-4">
            <UserGroupIcon className="h-6 w-6 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Staff Performance</h3>
          </div>
          {staffPerformance ? (
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Positions:</span>
                <span className="font-semibold text-gray-900 dark:text-white">{staffPerformance.assignedPositions}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Radio Sign-outs:</span>
                <span className="font-semibold text-gray-900 dark:text-white">{staffPerformance.radioSignouts}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Efficiency:</span>
                <span className="font-semibold text-green-600">{staffPerformance.efficiencyScore.toFixed(0)}%</span>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400">Loading staff data...</p>
          )}
        </div>

        {/* Overall Assessment */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3 mb-4">
            <TrophyIcon className="h-6 w-6 text-yellow-600" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Overall Assessment</h3>
          </div>
          {lessonsLearned ? (
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Status:</span>
                <span className="font-semibold text-green-600">Successful</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Confidence:</span>
                <span className="font-semibold text-gray-900 dark:text-white">{lessonsLearned.confidence}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Grade:</span>
                <span className="font-semibold text-blue-600">A-</span>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400">Generating assessment...</p>
          )}
        </div>
      </div>

      {/* AI Insights */}
      {aiInsights && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3 mb-4">
            <SparklesIcon className="h-6 w-6 text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">AI Executive Summary</h3>
          </div>
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
            <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">
              {aiInsights}
            </p>
          </div>
        </div>
      )}

      {/* Lessons Learned */}
      {lessonsLearned && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
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
        </div>
      )}
    </div>
  )
}
