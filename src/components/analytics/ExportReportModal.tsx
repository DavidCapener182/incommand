'use client'

import { useState } from 'react'
import { XMarkIcon, DocumentArrowDownIcon } from '@heroicons/react/24/outline'
import { generateReport, downloadReport, type ReportOptions, type ReportData } from '@/lib/analytics/reportGenerator'
import { calculateLogQualityMetrics } from '@/lib/analytics/logQualityMetrics'
import { calculateComplianceMetrics } from '@/lib/analytics/complianceMetrics'
import { calculatePerformanceMetrics } from '@/lib/analytics/performanceMetrics'

interface ExportReportModalProps {
  isOpen: boolean
  onClose: () => void
  eventId?: string
  eventName?: string
}

export default function ExportReportModal({ isOpen, onClose, eventId, eventName }: ExportReportModalProps) {
  const [format, setFormat] = useState<'pdf' | 'csv' | 'json'>('pdf')
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  })
  const [includeSections, setIncludeSections] = useState({
    executiveSummary: true,
    logQuality: true,
    compliance: true,
    performance: true,
    recommendations: true
  })
  const [companyName, setCompanyName] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const handleGenerate = async () => {
    setIsGenerating(true)
    setError(null)

    try {
      const start = new Date(dateRange.start)
      const end = new Date(dateRange.end)
      end.setHours(23, 59, 59, 999)

      // Fetch data
      const [quality, compliance, performance] = await Promise.all([
        includeSections.logQuality
          ? calculateLogQualityMetrics(start, end, eventId)
          : Promise.resolve(undefined),
        includeSections.compliance
          ? calculateComplianceMetrics(start, end, eventId)
          : Promise.resolve(undefined),
        includeSections.performance
          ? calculatePerformanceMetrics(start, end, eventId)
          : Promise.resolve(undefined)
      ])

      // Generate AI summary if requested
      let aiSummary: string | undefined
      if (includeSections.executiveSummary) {
        try {
          const response = await fetch('/api/v1/ai/prompt', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              prompt: `Generate a brief executive summary for this analytics report:
              
Quality Score: ${quality?.overallScore || 'N/A'}
Compliance Grade: ${compliance?.legalReadinessScore || 'N/A'}
Total Incidents: ${performance?.totalIncidents || 0}
Avg Response Time: ${performance?.averageResponseTime || 0} minutes

Provide 2-3 paragraphs highlighting key insights, trends, and recommendations.`,
              max_tokens: 300
            })
          })

          if (response.ok) {
            const data = await response.json()
            aiSummary = data.summary || 'No summary generated.'
          }
        } catch (err) {
          console.warn('Failed to generate AI summary:', err)
          aiSummary = 'Executive summary not available.'
        }
      }

      const reportData: ReportData = {
        quality,
        compliance,
        performance,
        aiSummary
      }

      const options: ReportOptions = {
        format,
        dateRange: { start, end },
        eventName,
        includeSections,
        branding: companyName ? { companyName } : undefined
      }

      const content = await generateReport(reportData, options)
      
      const timestamp = new Date().toISOString().split('T')[0]
      const filename = `analytics-report-${timestamp}.${format}`
      
      downloadReport(content, filename, format)

      // Success - close modal after brief delay
      setTimeout(() => {
        onClose()
        setIsGenerating(false)
      }, 1000)

    } catch (err) {
      console.error('Error generating report:', err)
      setError(err instanceof Error ? err.message : 'Failed to generate report')
      setIsGenerating(false)
    }
  }

  const toggleSection = (section: keyof typeof includeSections) => {
    setIncludeSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <DocumentArrowDownIcon className="h-6 w-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Export Analytics Report</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <XMarkIcon className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          {/* Format Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Report Format
            </label>
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => setFormat('pdf')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  format === 'pdf'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-600 hover:border-blue-300'
                }`}
              >
                <div className="font-medium text-gray-900 dark:text-white">PDF</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Formatted report</div>
              </button>
              <button
                onClick={() => setFormat('csv')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  format === 'csv'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-600 hover:border-blue-300'
                }`}
              >
                <div className="font-medium text-gray-900 dark:text-white">CSV</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Raw data</div>
              </button>
              <button
                onClick={() => setFormat('json')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  format === 'json'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-600 hover:border-blue-300'
                }`}
              >
                <div className="font-medium text-gray-900 dark:text-white">JSON</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">API format</div>
              </button>
            </div>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                End Date
              </label>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          {/* Include Sections */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Include in Report
            </label>
            <div className="space-y-2">
              {(Object.keys(includeSections) as Array<keyof typeof includeSections>).map((section) => (
                <label key={section} className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={includeSections[section]}
                    onChange={() => toggleSection(section)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">
                    {section.replace(/([A-Z])/g, ' $1').trim()}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Branding (PDF only) */}
          {format === 'pdf' && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Company Name (Optional)
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Your company name"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={isGenerating}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <DocumentArrowDownIcon className="h-5 w-5" />
                  <span>Generate Report</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

