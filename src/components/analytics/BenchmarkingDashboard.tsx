'use client'

import React, { useState, useEffect, useMemo } from 'react'
import {
  ChartBarIcon,
  TrophyIcon,
  ExclamationTriangleIcon,
  LightBulbIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  MinusIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend } from 'recharts'
import { benchmarkEngine, type BenchmarkReport, type PerformanceComparison } from '@/lib/benchmarking/benchmarkEngine'

interface BenchmarkingDashboardProps {
  organizationName?: string
  eventName?: string
  industry: string
  eventType: string
  metrics: Record<string, number>
  historicalData?: Record<string, number[]>
  period?: { start: Date; end: Date }
  className?: string
}

const RATING_COLORS = {
  excellent: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-800 dark:text-green-200', border: 'border-green-500' },
  good: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-800 dark:text-blue-200', border: 'border-blue-500' },
  average: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-800 dark:text-yellow-200', border: 'border-yellow-500' },
  below_average: { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-800 dark:text-orange-200', border: 'border-orange-500' },
  poor: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-800 dark:text-red-200', border: 'border-red-500' }
}

const PRIORITY_COLORS = {
  high: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200',
  medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200',
  low: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200'
}

export default function BenchmarkingDashboard({
  organizationName = 'Your Organization',
  eventName = 'Current Event',
  industry,
  eventType,
  metrics,
  historicalData,
  period = { start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), end: new Date() },
  className = ''
}: BenchmarkingDashboardProps) {
  const [report, setReport] = useState<BenchmarkReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'comparisons' | 'actions' | 'trends'>('overview')

  useEffect(() => {
    generateReport()
  }, [metrics, industry, eventType])

  const generateReport = () => {
    setLoading(true)
    try {
      const benchmarkReport = benchmarkEngine.generateReport(
        organizationName,
        eventName,
        metrics,
        industry,
        eventType,
        period,
        historicalData
      )
      setReport(benchmarkReport)
    } catch (error) {
      console.error('Error generating benchmark report:', error)
    } finally {
      setLoading(false)
    }
  }

  // Prepare chart data
  const comparisonChartData = useMemo(() => {
    if (!report) return []
    
    return report.comparisons.map(comp => ({
      name: comp.metric,
      current: comp.currentValue,
      excellent: comp.benchmarkValues.excellent,
      good: comp.benchmarkValues.good,
      average: comp.benchmarkValues.average
    }))
  }, [report])

  const radarChartData = useMemo(() => {
    if (!report) return []
    
    return report.comparisons.map(comp => ({
      metric: comp.metric,
      percentile: comp.percentile,
      target: 90 // Target 90th percentile
    }))
  }, [report])

  if (loading || !report) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 ${className}`}>
        <div className="flex justify-center items-center h-64">
          <div className="text-lg text-gray-600 dark:text-gray-300">Generating benchmark report...</div>
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with Overall Score */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-700 dark:from-blue-800 dark:to-purple-900 text-white p-6 rounded-xl shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <TrophyIcon className="h-8 w-8" />
              <h2 className="text-3xl font-bold">Performance Benchmarking</h2>
            </div>
            <p className="text-blue-100 dark:text-blue-200 mb-4">
              {report.organizationName} • {report.eventName} • {report.industry} / {report.eventType}
            </p>
            <div className="flex items-center gap-6">
              <div>
                <div className="text-sm text-blue-200">Overall Score</div>
                <div className="text-4xl font-bold">{report.overallScore.toFixed(1)}</div>
                <div className="text-sm text-blue-200">Percentile</div>
              </div>
              <div className={`px-4 py-2 rounded-lg font-semibold text-lg ${
                report.overallRating === 'excellent' ? 'bg-green-500' :
                report.overallRating === 'good' ? 'bg-blue-500' :
                report.overallRating === 'average' ? 'bg-yellow-500' :
                report.overallRating === 'below_average' ? 'bg-orange-500' :
                'bg-red-500'
              }`}>
                {report.overallRating.replace('_', ' ').toUpperCase()}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-blue-200 mb-1">Report Date</div>
            <div className="font-medium">{new Date(report.reportDate).toLocaleDateString()}</div>
            <div className="text-sm text-blue-200 mt-2 mb-1">Period</div>
            <div className="font-medium text-sm">
              {report.period.start.toLocaleDateString()} - {report.period.end.toLocaleDateString()}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-2">
        <nav className="flex space-x-2">
          {[
            { id: 'overview', label: 'Overview', icon: ChartBarIcon },
            { id: 'comparisons', label: 'Detailed Comparisons', icon: InformationCircleIcon },
            { id: 'actions', label: 'Action Items', icon: LightBulbIcon },
            { id: 'trends', label: 'Trends', icon: ArrowTrendingUpIcon }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`${
                activeTab === tab.id
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 border-blue-500'
                  : 'bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 border-transparent'
              } flex-1 rounded-lg px-4 py-3 border-2 font-medium text-sm transition-all duration-200`}
            >
              <div className="flex items-center justify-center gap-2">
                <tab.icon className="h-5 w-5" />
                <span>{tab.label}</span>
              </div>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Strengths and Weaknesses */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Strengths */}
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <TrophyIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Strengths</h3>
              </div>
              {report.strengths.length > 0 ? (
                <ul className="space-y-2">
                  {report.strengths.map((strength, index) => (
                    <li key={index} className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
                      <span className="text-green-600 dark:text-green-400 mt-1">✓</span>
                      <span>{strength}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-600 dark:text-gray-400">No standout strengths identified.</p>
              )}
            </div>

            {/* Weaknesses */}
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <ExclamationTriangleIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Areas for Improvement</h3>
              </div>
              {report.weaknesses.length > 0 ? (
                <ul className="space-y-2">
                  {report.weaknesses.map((weakness, index) => (
                    <li key={index} className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
                      <span className="text-red-600 dark:text-red-400 mt-1">!</span>
                      <span>{weakness}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-600 dark:text-gray-400">All metrics are performing well!</p>
              )}
            </div>
          </div>

          {/* Radar Chart - Performance Profile */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Performance Profile</h3>
            <ResponsiveContainer width="100%" height={400}>
              <RadarChart data={radarChartData}>
                <PolarGrid stroke="#E5E7EB" />
                <PolarAngleAxis dataKey="metric" stroke="#6B7280" />
                <PolarRadiusAxis angle={90} domain={[0, 100]} stroke="#6B7280" />
                <Radar name="Current Performance" dataKey="percentile" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.6} />
                <Radar name="Target (90th percentile)" dataKey="target" stroke="#10B981" fill="#10B981" fillOpacity={0.3} />
                <Legend />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* Bar Chart - Comparison */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Performance vs Benchmarks</h3>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={comparisonChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="name" stroke="#6B7280" />
                <YAxis stroke="#6B7280" />
                <Tooltip />
                <Legend />
                <Bar dataKey="current" name="Current" fill="#3B82F6" />
                <Bar dataKey="excellent" name="Excellent (Top 10%)" fill="#10B981" />
                <Bar dataKey="good" name="Good (Top 25%)" fill="#6366F1" />
                <Bar dataKey="average" name="Average (50th %)" fill="#F59E0B" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {activeTab === 'comparisons' && (
        <div className="space-y-4">
          {report.comparisons.map((comparison, index) => {
            const ratingColors = RATING_COLORS[comparison.rating]
            return (
              <div key={index} className={`bg-white dark:bg-gray-800 border ${ratingColors.border} rounded-lg p-6`}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{comparison.metric}</h3>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                        {comparison.currentValue.toFixed(1)}
                      </span>
                      <span className={`px-3 py-1 rounded-full font-semibold ${ratingColors.bg} ${ratingColors.text}`}>
                        {comparison.rating.replace('_', ' ').toUpperCase()}
                      </span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {comparison.percentile}th percentile
                      </span>
                    </div>
                  </div>
                  {comparison.gap !== 0 && (
                    <div className="text-right">
                      <div className="text-sm text-gray-600 dark:text-gray-400">Gap to Next Tier</div>
                      <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                        {Math.abs(comparison.gap).toFixed(1)}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        ({Math.abs(comparison.gapPercentage).toFixed(1)}%)
                      </div>
                    </div>
                  )}
                </div>

                {/* Benchmark Values */}
                <div className="grid grid-cols-5 gap-2 mb-4">
                  {[
                    { label: 'Excellent', value: comparison.benchmarkValues.excellent, color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200' },
                    { label: 'Good', value: comparison.benchmarkValues.good, color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200' },
                    { label: 'Average', value: comparison.benchmarkValues.average, color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200' },
                    { label: 'Below Avg', value: comparison.benchmarkValues.belowAverage, color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200' },
                    { label: 'Poor', value: comparison.benchmarkValues.poor, color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200' }
                  ].map((benchmark, i) => (
                    <div key={i} className={`${benchmark.color} rounded-lg p-3 text-center`}>
                      <div className="text-xs font-medium mb-1">{benchmark.label}</div>
                      <div className="text-lg font-bold">{benchmark.value.toFixed(1)}</div>
                    </div>
                  ))}
                </div>

                {/* Insights */}
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Insights</h4>
                  <ul className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
                    {comparison.insights.map((insight, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
                        <span>{insight}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Recommendations */}
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Recommendations</h4>
                  <ul className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
                    {comparison.recommendations.map((rec, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-green-600 dark:text-green-400 mt-0.5">→</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {activeTab === 'actions' && (
        <div className="space-y-4">
          {report.actionItems.length > 0 ? (
            report.actionItems.map((action, index) => (
              <div key={index} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${PRIORITY_COLORS[action.priority]}`}>
                        {action.priority.toUpperCase()} PRIORITY
                      </span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">{action.category}</span>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{action.title}</h3>
                    <p className="text-gray-700 dark:text-gray-300 mb-4">{action.description}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Expected Improvement</div>
                    <div className="text-lg font-semibold text-green-600 dark:text-green-400">{action.expectedImprovement}</div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Timeframe</div>
                    <div className="text-lg font-semibold text-gray-900 dark:text-white">{action.timeframe}</div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Required Resources</div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {action.resources.map((resource, i) => (
                        <span key={i} className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 text-xs rounded-full">
                          {resource}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-12 text-center">
              <TrophyIcon className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Excellent Performance!
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                All metrics are performing at or above industry standards. Keep up the great work!
              </p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'trends' && (
        <div className="space-y-6">
          {/* Trend Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-3">
                <ArrowTrendingUpIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
                <h3 className="font-semibold text-gray-900 dark:text-white">Improving</h3>
              </div>
              {report.trendAnalysis.improving.length > 0 ? (
                <ul className="space-y-1">
                  {report.trendAnalysis.improving.map((metric, i) => (
                    <li key={i} className="text-sm text-gray-700 dark:text-gray-300">• {metric}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-600 dark:text-gray-400">No improving trends</p>
              )}
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-3">
                <MinusIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                <h3 className="font-semibold text-gray-900 dark:text-white">Stable</h3>
              </div>
              {report.trendAnalysis.stable.length > 0 ? (
                <ul className="space-y-1">
                  {report.trendAnalysis.stable.map((metric, i) => (
                    <li key={i} className="text-sm text-gray-700 dark:text-gray-300">• {metric}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-600 dark:text-gray-400">No stable trends</p>
              )}
            </div>

            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-3">
                <ArrowTrendingDownIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
                <h3 className="font-semibold text-gray-900 dark:text-white">Declining</h3>
              </div>
              {report.trendAnalysis.declining.length > 0 ? (
                <ul className="space-y-1">
                  {report.trendAnalysis.declining.map((metric, i) => (
                    <li key={i} className="text-sm text-gray-700 dark:text-gray-300">• {metric}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-600 dark:text-gray-400">No declining trends</p>
              )}
            </div>
          </div>

          {/* Volatility Analysis */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Performance Volatility</h3>
            <div className="flex items-center gap-4">
              <div className={`px-4 py-2 rounded-lg font-semibold ${
                report.trendAnalysis.volatility === 'high' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200' :
                report.trendAnalysis.volatility === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200' :
                'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200'
              }`}>
                {report.trendAnalysis.volatility.toUpperCase()}
              </div>
              <p className="text-gray-700 dark:text-gray-300">
                {report.trendAnalysis.volatility === 'high' && 'Performance varies significantly. Consider process standardization.'}
                {report.trendAnalysis.volatility === 'medium' && 'Some performance variation is present. Monitor key metrics closely.'}
                {report.trendAnalysis.volatility === 'low' && 'Performance is consistent. Processes are well-established.'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
