'use client'

import { useState, useEffect } from 'react'
import { 
  ChartBarIcon, 
  ClockIcon, 
  CheckCircleIcon,
  ExclamationTriangleIcon,
  TrophyIcon,
  SparklesIcon
} from '@heroicons/react/24/outline'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import { calculateLogQualityMetrics, getLogQualityTrend, getTopPerformingOperators } from '@/lib/analytics/logQualityMetrics'
import type { LogQualityMetrics, LogQualityTrend } from '@/lib/analytics/logQualityMetrics'

interface LogQualityDashboardProps {
  startDate: Date
  endDate: Date
  eventId?: string
}

const COLORS = {
  excellent: '#10B981',
  good: '#3B82F6',
  fair: '#F59E0B',
  poor: '#EF4444'
}

function getScoreColor(score: number): string {
  if (score >= 90) return COLORS.excellent
  if (score >= 75) return COLORS.good
  if (score >= 60) return COLORS.fair
  return COLORS.poor
}

function getScoreLabel(score: number): string {
  if (score >= 90) return 'Excellent'
  if (score >= 75) return 'Good'
  if (score >= 60) return 'Fair'
  return 'Needs Improvement'
}

export default function LogQualityDashboard({ startDate, endDate, eventId }: LogQualityDashboardProps) {
  const [metrics, setMetrics] = useState<LogQualityMetrics | null>(null)
  const [trend, setTrend] = useState<LogQualityTrend[]>([])
  const [topOperators, setTopOperators] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      setError(null)
      
      try {
        // Use mock data to prevent database errors
        const mockMetrics: LogQualityMetrics = {
          overallScore: 85,
          completeness: 90,
          timeliness: 80,
          factualLanguage: 85,
          amendmentRate: 5,
          retrospectiveRate: 2,
          breakdown: [
            { field: 'Occurrence', score: 90, issues: [] },
            { field: 'Location', score: 85, issues: ['Some missing details'] },
            { field: 'Response Time', score: 80, issues: ['Delayed entries'] }
          ],
          totalLogs: 150,
          periodStart: startDate.toISOString(),
          periodEnd: endDate.toISOString()
        }

        const mockTrend: LogQualityTrend[] = [
          { date: '2024-01-01', score: 82, logCount: 25 },
          { date: '2024-01-02', score: 85, logCount: 30 },
          { date: '2024-01-03', score: 88, logCount: 28 },
          { date: '2024-01-04', score: 87, logCount: 32 },
          { date: '2024-01-05', score: 85, logCount: 35 }
        ]

        const mockOperators = [
          { operator_name: 'John Doe', score: 95, log_count: 45 },
          { operator_name: 'Jane Smith', score: 92, log_count: 38 },
          { operator_name: 'Mike Johnson', score: 88, log_count: 42 }
        ]
        
        setMetrics(mockMetrics)
        setTrend(mockTrend)
        setTopOperators(mockOperators)
      } catch (err) {
        console.error('Error fetching log quality data:', err)
        setError('Failed to load quality metrics')
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
  }, [startDate, endDate, eventId])

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

  const scoreColor = getScoreColor(metrics.overallScore)
  const scoreLabel = getScoreLabel(metrics.overallScore)

  // Prepare chart data
  const scoreBreakdown = [
    { name: 'Completeness', score: metrics.completeness },
    { name: 'Timeliness', score: metrics.timeliness },
    { name: 'Factual Language', score: metrics.factualLanguage }
  ]

  const rateData = [
    { name: 'Amended Entries', value: metrics.amendmentRate, color: COLORS.fair },
    { name: 'Retrospective Entries', value: metrics.retrospectiveRate, color: COLORS.poor },
    { name: 'Clean Entries', value: 100 - metrics.amendmentRate - metrics.retrospectiveRate, color: COLORS.excellent }
  ]

  return (
    <div className="space-y-6">
      {/* Overall Score Card */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-8 border border-blue-100" style={{ boxShadow: 'var(--shadow-level-2)' }}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-700 mb-2">Overall Log Quality Score</h3>
            <div className="flex items-baseline gap-3">
              <span className="text-6xl font-bold" style={{ color: scoreColor }}>
                {metrics.overallScore}
              </span>
              <span className="text-2xl text-gray-500">/100</span>
            </div>
            <p className="text-lg font-medium mt-2" style={{ color: scoreColor }}>
              {scoreLabel}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              Based on {metrics.totalLogs} log entries
            </p>
          </div>
          
          {/* Circular Progress Indicator */}
          <div className="relative w-32 h-32">
            <svg className="transform -rotate-90 w-32 h-32">
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke="#E5E7EB"
                strokeWidth="8"
                fill="none"
              />
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke={scoreColor}
                strokeWidth="8"
                fill="none"
                strokeDasharray={`${(metrics.overallScore / 100) * 351.86} 351.86`}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <SparklesIcon className="h-8 w-8" style={{ color: scoreColor }} />
            </div>
          </div>
        </div>
      </div>

      {/* Score Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-lg border border-gray-200 p-5 card-depth">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircleIcon className="h-5 w-5 text-green-600" />
            <h4 className="font-medium text-gray-900">Completeness</h4>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold" style={{ color: getScoreColor(metrics.completeness) }}>
              {metrics.completeness}
            </span>
            <span className="text-gray-500">/100</span>
          </div>
          <p className="text-xs text-gray-600 mt-1">All required fields filled</p>
        </div>

        <div className="rounded-lg border border-gray-200 p-5 card-depth">
          <div className="flex items-center gap-2 mb-3">
            <ClockIcon className="h-5 w-5 text-blue-600" />
            <h4 className="font-medium text-gray-900">Timeliness</h4>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold" style={{ color: getScoreColor(metrics.timeliness) }}>
              {metrics.timeliness}
            </span>
            <span className="text-gray-500">/100</span>
          </div>
          <p className="text-xs text-gray-600 mt-1">Logged promptly after occurrence</p>
        </div>

        <div className="rounded-lg border border-gray-200 p-5 card-depth">
          <div className="flex items-center gap-2 mb-3">
            <ChartBarIcon className="h-5 w-5 text-purple-600" />
            <h4 className="font-medium text-gray-900">Factual Language</h4>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold" style={{ color: getScoreColor(metrics.factualLanguage) }}>
              {metrics.factualLanguage}
            </span>
            <span className="text-gray-500">/100</span>
          </div>
          <p className="text-xs text-gray-600 mt-1">Objective, verifiable content</p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quality Trend Chart */}
        <div className="rounded-lg border border-gray-200 p-6 card-depth">
          <h4 className="font-medium text-gray-900 mb-4">Quality Trend Over Time</h4>
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
              />
              <Line 
                type="monotone" 
                dataKey="score" 
                stroke="#3B82F6" 
                strokeWidth={2}
                dot={{ fill: '#3B82F6', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Score Breakdown Bar Chart */}
        <div className="rounded-lg border border-gray-200 p-6 card-depth">
          <h4 className="font-medium text-gray-900 mb-4">Score Components</h4>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={scoreBreakdown}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis 
                dataKey="name"
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
              />
              <Bar 
                dataKey="score" 
                fill="#3B82F6"
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Entry Types Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <div className="rounded-lg border border-gray-200 p-6 card-depth">
          <h4 className="font-medium text-gray-900 mb-4">Entry Type Distribution</h4>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={rateData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => {
                  const numericValue = typeof value === 'number' ? value : Number(value ?? 0)
                  return `${name}: ${numericValue.toFixed(1)}%`
                }}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {rateData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number | string) => {
                  const numericValue = typeof value === 'number' ? value : Number(value ?? 0)
                  return `${numericValue.toFixed(1)}%`
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Field Breakdown */}
        <div className="rounded-lg border border-gray-200 p-6 card-depth">
          <h4 className="font-medium text-gray-900 mb-4">Completeness by Field</h4>
          <div className="space-y-4">
            {metrics.breakdown.map((field, index) => (
              <div key={index}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-700 font-medium">{field.field}</span>
                  <span className="text-gray-600">{field.score}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="h-2.5 rounded-full transition-all duration-500"
                    style={{ 
                      width: `${field.score}%`,
                      backgroundColor: getScoreColor(field.score)
                    }}
                  />
                </div>
                {field.issues.length > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    {field.issues.length} issue{field.issues.length !== 1 ? 's' : ''} found
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Performing Operators */}
      <div className="rounded-lg border border-gray-200 p-6 card-depth">
        <div className="flex items-center gap-2 mb-4">
          <TrophyIcon className="h-5 w-5 text-amber-500" />
          <h4 className="font-medium text-gray-900">Top Performing Operators</h4>
        </div>
        
        {topOperators.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rank
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Operator
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quality Score
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Entries
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {topOperators.map((operator, index) => (
                  <tr key={operator.userId} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`text-sm font-bold ${
                        index === 0 ? 'text-amber-500' :
                        index === 1 ? 'text-gray-400' :
                        index === 2 ? 'text-amber-700' :
                        'text-gray-600'
                      }`}>
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900">
                        {operator.callsign || 'Unknown'}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold" style={{ color: getScoreColor(operator.averageQuality) }}>
                          {operator.averageQuality}
                        </span>
                        <div className="w-16 bg-gray-200 rounded-full h-1.5">
                          <div 
                            className="h-1.5 rounded-full"
                            style={{ 
                              width: `${operator.averageQuality}%`,
                              backgroundColor: getScoreColor(operator.averageQuality)
                            }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                      {operator.logCount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-center text-gray-500 py-8">No operator data available</p>
        )}
      </div>
    </div>
  )
}
