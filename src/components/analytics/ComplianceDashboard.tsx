'use client'

import { useState, useEffect } from 'react'
import {
  ShieldCheckIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  DocumentCheckIcon,
  LockClosedIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline'
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
  ResponsiveContainer
} from 'recharts'
import { calculateComplianceMetrics, getComplianceTrend } from '@/lib/analytics/complianceMetrics'
import type { ComplianceMetrics, ComplianceTrend } from '@/lib/analytics/complianceMetrics'

interface ComplianceDashboardProps {
  startDate: Date
  endDate: Date
  eventId?: string
}

const GRADE_COLORS = {
  A: '#10B981',
  B: '#3B82F6',
  C: '#F59E0B',
  D: '#F97316',
  F: '#EF4444'
}

const GRADE_LABELS = {
  A: 'Excellent',
  B: 'Good',
  C: 'Fair',
  D: 'Poor',
  F: 'Critical'
}

function getGradeColor(grade: 'A' | 'B' | 'C' | 'D' | 'F'): string {
  return GRADE_COLORS[grade]
}

function getGradeLabel(grade: 'A' | 'B' | 'C' | 'D' | 'F'): string {
  return GRADE_LABELS[grade]
}

export default function ComplianceDashboard({ startDate, endDate, eventId }: ComplianceDashboardProps) {
  const [metrics, setMetrics] = useState<ComplianceMetrics | null>(null)
  const [trend, setTrend] = useState<ComplianceTrend[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      setError(null)
      
      try {
        console.log('ComplianceDashboard - Fetching data for:', { startDate, endDate, eventId })
        const [metricsData, trendData] = await Promise.all([
          calculateComplianceMetrics(startDate, endDate, eventId),
          getComplianceTrend(startDate, endDate, eventId, 'day')
        ])
        
        console.log('ComplianceDashboard - Received metrics:', metricsData)
        setMetrics(metricsData)
        setTrend(trendData)
      } catch (err) {
        console.error('Error fetching compliance data:', err)
        setError('Failed to load compliance metrics')
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
  }, [startDate, endDate, eventId])

  const handleExportReport = () => {
    if (!metrics) return
    
    // Create compliance report
    const report = {
      generatedAt: new Date().toISOString(),
      period: {
        start: metrics.periodStart,
        end: metrics.periodEnd
      },
      compliance: {
        grade: metrics.legalReadinessScore,
        score: metrics.overallCompliance,
        auditTrail: metrics.auditTrailCompleteness,
        immutability: metrics.immutabilityScore,
        timestamps: metrics.timestampAccuracy,
        justifications: metrics.amendmentJustificationRate
      },
      recommendations: metrics.recommendations,
      details: metrics.details,
      totalIncidents: metrics.totalIncidents
    }
    
    // Convert to JSON and download
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `compliance-report-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error || !metrics) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <ExclamationTriangleIcon className="h-12 w-12 text-red-600 mx-auto mb-3" />
        <p className="text-red-800 font-medium">{error || 'No data available'}</p>
      </div>
    )
  }

  const gradeColor = getGradeColor(metrics.legalReadinessScore)
  const gradeLabel = getGradeLabel(metrics.legalReadinessScore)

  // Prepare compliance breakdown
  const complianceBreakdown = [
    { name: 'Audit Trail', score: metrics.auditTrailCompleteness },
    { name: 'Immutability', score: metrics.immutabilityScore },
    { name: 'Timestamps', score: metrics.timestampAccuracy },
    { name: 'Justifications', score: metrics.amendmentJustificationRate }
  ]

  return (
    <div className="space-y-6">
      {/* Legal Readiness Header */}
      <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-8 border border-emerald-100">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-700 mb-2">JESIP/JDM Compliance Grade</h3>
            <div className="flex items-center gap-4">
              <span 
                className="text-8xl font-bold"
                style={{ color: gradeColor }}
              >
                {metrics.legalReadinessScore}
              </span>
              <div>
                <p className="text-2xl font-semibold" style={{ color: gradeColor }}>
                  {gradeLabel}
                </p>
                <p className="text-lg text-gray-600 mt-1">
                  {metrics.overallCompliance.toFixed(1)}% Compliant
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  {metrics.totalIncidents} incidents analyzed
                </p>
              </div>
            </div>
          </div>
          
          {/* Export Button */}
          <button
            onClick={handleExportReport}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
          >
            <ArrowDownTrayIcon className="h-5 w-5 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Export Report</span>
          </button>
        </div>
      </div>

      {/* Compliance Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Audit Trail Completeness */}
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-3">
            <DocumentCheckIcon className="h-5 w-5 text-blue-600" />
            <h4 className="font-medium text-gray-900">Audit Trail</h4>
          </div>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-3xl font-bold text-blue-600">
              {metrics.auditTrailCompleteness.toFixed(1)}
            </span>
            <span className="text-gray-500">%</span>
          </div>
          <p className="text-xs text-gray-600">Complete metadata</p>
          {metrics.details.missingTimestamps > 0 && (
            <p className="text-xs text-red-600 mt-1">
              {metrics.details.missingTimestamps} missing fields
            </p>
          )}
        </div>

        {/* Immutability Score */}
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-3">
            <LockClosedIcon className="h-5 w-5 text-purple-600" />
            <h4 className="font-medium text-gray-900">Immutability</h4>
          </div>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-3xl font-bold text-purple-600">
              {metrics.immutabilityScore.toFixed(1)}
            </span>
            <span className="text-gray-500">%</span>
          </div>
          <p className="text-xs text-gray-600">No destructive edits</p>
          {metrics.details.unamendedDeletes > 0 && (
            <p className="text-xs text-red-600 mt-1">
              {metrics.details.unamendedDeletes} violations
            </p>
          )}
        </div>

        {/* Timestamp Accuracy */}
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-3">
            <ClockIcon className="h-5 w-5 text-green-600" />
            <h4 className="font-medium text-gray-900">Timestamps</h4>
          </div>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-3xl font-bold text-green-600">
              {metrics.timestampAccuracy.toFixed(1)}
            </span>
            <span className="text-gray-500">%</span>
          </div>
          <p className="text-xs text-gray-600">Dual timestamps accurate</p>
        </div>

        {/* Justification Rate */}
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircleIcon className="h-5 w-5 text-amber-600" />
            <h4 className="font-medium text-gray-900">Justifications</h4>
          </div>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-3xl font-bold text-amber-600">
              {metrics.amendmentJustificationRate.toFixed(1)}
            </span>
            <span className="text-gray-500">%</span>
          </div>
          <p className="text-xs text-gray-600">Amendments explained</p>
          {metrics.details.unjustifiedRetrospectives > 0 && (
            <p className="text-xs text-red-600 mt-1">
              {metrics.details.unjustifiedRetrospectives} missing
            </p>
          )}
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Compliance Trend */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h4 className="font-medium text-gray-900 mb-4">Compliance Trend</h4>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis 
                dataKey="date" 
                tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                stroke="#6B7280"
                style={{ fontSize: '12px' }}
              />
              <YAxis 
                domain={[0, 100]}
                stroke="#6B7280"
                style={{ fontSize: '12px' }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  padding: '8px 12px'
                }}
                labelFormatter={(date) => new Date(date).toLocaleDateString()}
                formatter={(value: number, name: string) => [
                  `${value.toFixed(1)}%`,
                  'Compliance'
                ]}
              />
              <Line 
                type="monotone" 
                dataKey="score" 
                stroke="#10B981" 
                strokeWidth={2}
                dot={{ fill: '#10B981', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Compliance Breakdown */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h4 className="font-medium text-gray-900 mb-4">Compliance Breakdown</h4>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={complianceBreakdown} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis 
                type="number"
                domain={[0, 100]}
                stroke="#6B7280"
                style={{ fontSize: '12px' }}
              />
              <YAxis 
                type="category"
                dataKey="name"
                stroke="#6B7280"
                style={{ fontSize: '12px' }}
                width={100}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  padding: '8px 12px'
                }}
                formatter={(value: number) => `${value.toFixed(1)}%`}
              />
              <Bar 
                dataKey="score" 
                fill="#10B981"
                radius={[0, 8, 8, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Legal Readiness Checklist */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <ShieldCheckIcon className="h-5 w-5 text-green-600" />
          <h4 className="font-medium text-gray-900">Legal Readiness Checklist</h4>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              {metrics.auditTrailCompleteness === 100 ? (
                <CheckCircleIcon className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              ) : (
                <ExclamationTriangleIcon className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
              )}
              <div>
                <p className="text-sm font-medium text-gray-900">Complete Audit Trail</p>
                <p className="text-xs text-gray-600">All incidents have full metadata</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              {metrics.immutabilityScore === 100 ? (
                <CheckCircleIcon className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              ) : (
                <ExclamationTriangleIcon className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
              )}
              <div>
                <p className="text-sm font-medium text-gray-900">Immutable Records</p>
                <p className="text-xs text-gray-600">No destructive edits or deletions</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              {metrics.timestampAccuracy >= 95 ? (
                <CheckCircleIcon className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              ) : (
                <ExclamationTriangleIcon className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
              )}
              <div>
                <p className="text-sm font-medium text-gray-900">Accurate Timestamps</p>
                <p className="text-xs text-gray-600">Dual timestamps properly recorded</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-start gap-3">
              {metrics.amendmentJustificationRate === 100 ? (
                <CheckCircleIcon className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              ) : (
                <ExclamationTriangleIcon className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
              )}
              <div>
                <p className="text-sm font-medium text-gray-900">Justified Amendments</p>
                <p className="text-xs text-gray-600">All changes have reasons documented</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              {metrics.overallCompliance >= 95 ? (
                <CheckCircleIcon className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              ) : (
                <ExclamationTriangleIcon className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
              )}
              <div>
                <p className="text-sm font-medium text-gray-900">JESIP Standards</p>
                <p className="text-xs text-gray-600">Aligned with Joint Doctrine Manual</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              {metrics.legalReadinessScore === 'A' || metrics.legalReadinessScore === 'B' ? (
                <CheckCircleIcon className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              ) : (
                <ExclamationTriangleIcon className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
              )}
              <div>
                <p className="text-sm font-medium text-gray-900">Court Ready</p>
                <p className="text-xs text-gray-600">Audit trail suitable for legal proceedings</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      {metrics.recommendations.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h4 className="font-medium text-blue-900 mb-3">📋 Recommendations</h4>
          <ul className="space-y-2">
            {metrics.recommendations.map((recommendation, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-blue-800">
                <span className="text-blue-600 mt-0.5">•</span>
                <span>{recommendation}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

