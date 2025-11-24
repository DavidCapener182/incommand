'use client'

import { useState, useEffect } from 'react'
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import { calculateComplianceMetrics, getComplianceTrend } from '@/lib/analytics/complianceMetrics'
import type { ComplianceMetrics, ComplianceTrend } from '@/lib/analytics/complianceMetrics'
import LegalReadinessCard from './cards/compliance/LegalReadinessCard'
import AuditTrailCard from './cards/compliance/AuditTrailCard'
import ImmutabilityCard from './cards/compliance/ImmutabilityCard'
import TimestampAccuracyCard from './cards/compliance/TimestampAccuracyCard'
import JustificationRateCard from './cards/compliance/JustificationRateCard'
import ComplianceTrendCard from './cards/compliance/ComplianceTrendCard'
import ComplianceBreakdownCard from './cards/compliance/ComplianceBreakdownCard'
import LegalReadinessChecklistCard from './cards/compliance/LegalReadinessChecklistCard'
import RecommendationsCard from './cards/compliance/RecommendationsCard'

interface ComplianceDashboardProps {
  startDate: Date
  endDate: Date
  eventId?: string
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

  // Prepare compliance breakdown
  const complianceBreakdown = [
    { name: 'Audit Trail', score: metrics.auditTrailCompleteness },
    { name: 'Immutability', score: metrics.immutabilityScore },
    { name: 'Timestamps', score: metrics.timestampAccuracy },
    { name: 'Justifications', score: metrics.amendmentJustificationRate }
  ]

  return (
    <div className="space-y-6">
      <LegalReadinessCard
        legalReadinessScore={metrics.legalReadinessScore}
        overallCompliance={metrics.overallCompliance}
        totalIncidents={metrics.totalIncidents}
        onExport={handleExportReport}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <AuditTrailCard
          auditTrailCompleteness={metrics.auditTrailCompleteness}
          missingTimestamps={metrics.details.missingTimestamps}
        />
        <ImmutabilityCard
          immutabilityScore={metrics.immutabilityScore}
          unamendedDeletes={metrics.details.unamendedDeletes}
        />
        <TimestampAccuracyCard
          timestampAccuracy={metrics.timestampAccuracy}
        />
        <JustificationRateCard
          amendmentJustificationRate={metrics.amendmentJustificationRate}
          unjustifiedRetrospectives={metrics.details.unjustifiedRetrospectives}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ComplianceTrendCard trend={trend} />
        <ComplianceBreakdownCard breakdown={complianceBreakdown} />
      </div>

      <LegalReadinessChecklistCard
        auditTrailCompleteness={metrics.auditTrailCompleteness}
        immutabilityScore={metrics.immutabilityScore}
        timestampAccuracy={metrics.timestampAccuracy}
        amendmentJustificationRate={metrics.amendmentJustificationRate}
        overallCompliance={metrics.overallCompliance}
        legalReadinessScore={metrics.legalReadinessScore}
      />

      <RecommendationsCard recommendations={metrics.recommendations} />
    </div>
  )
}

