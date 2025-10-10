'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { 
  detectTrends, 
  detectAnomalies, 
  generateForecast,
  type TrendData,
  type TrendAnalysis,
  type AnomalyDetection,
  type PredictiveForecast
} from '@/lib/ai/trendDetection'
import { 
  ChartBarIcon,
  ExclamationTriangleIcon,
  LightBulbIcon,
  ArrowArrowTrendingUpIcon,
  ArrowArrowTrendingDownIcon,
  ClockIcon,
  SparklesIcon,
  EyeIcon
} from '@heroicons/react/24/outline'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'

interface AIInsightsDashboardProps {
  startDate: Date
  endDate: Date
  eventId?: string
}

interface IncidentData {
  timestamp: string
  incident_count: number
  response_time: number
  quality_score: number
  compliance_rate: number
}

const SEVERITY_COLORS = {
  low: 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/30',
  medium: 'text-orange-600 bg-orange-100 dark:text-orange-400 dark:bg-orange-900/30',
  high: 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/30',
  critical: 'text-red-800 bg-red-200 dark:text-red-300 dark:bg-red-900/50'
}

export default function AIInsightsDashboard({ startDate, endDate, eventId }: AIInsightsDashboardProps) {
  const [incidentData, setIncidentData] = useState<IncidentData[]>([])
  const [loading, setLoading] = useState(true)
  const [trends, setTrends] = useState<Record<string, TrendAnalysis>>({})
  const [anomalies, setAnomalies] = useState<AnomalyDetection[]>([])
  const [forecasts, setForecasts] = useState<Record<string, PredictiveForecast>>({})

  // Fetch incident data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        // Simulate API call - replace with actual Supabase query
        const mockData: IncidentData[] = generateMockData(startDate, endDate)
        setIncidentData(mockData)

        // Analyze trends
        const trendData = mockData.map(d => ({
          period: new Date(d.timestamp).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
          value: d.incident_count,
          timestamp: d.timestamp
        }))

        const incidentTrend = detectTrends(trendData, 'incident_count')
        const responseTimeTrend = detectTrends(
          mockData.map(d => ({
            period: new Date(d.timestamp).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
            value: d.response_time,
            timestamp: d.timestamp
          })), 
          'response_time'
        )
        const qualityTrend = detectTrends(
          mockData.map(d => ({
            period: new Date(d.timestamp).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
            value: d.quality_score,
            timestamp: d.timestamp
          })), 
          'quality_score'
        )

        setTrends({
          incident_count: incidentTrend,
          response_time: responseTimeTrend,
          quality_score: qualityTrend
        })

        // Detect anomalies
        const detectedAnomalies = detectAnomalies(trendData, 'incident_count')
        setAnomalies(detectedAnomalies)

        // Generate forecasts
        const incidentForecast = generateForecast(trendData, 'incident_count', 'next 4 hours')
        setForecasts({
          incident_count: incidentForecast
        })

      } catch (error) {
        console.error('Error fetching AI insights data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [startDate, endDate, eventId])

  // Chart data preparation
  const chartData = useMemo(() => {
    return incidentData.map((data, index) => ({
      time: new Date(data.timestamp).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
      incidents: data.incident_count,
      responseTime: data.response_time,
      quality: data.quality_score,
      compliance: data.compliance_rate,
      predicted: trends.incident_count?.trendLine[index]?.y || null
    }))
  }, [incidentData, trends])

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
          <SparklesIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">AI Insights</h2>
          <p className="text-gray-600 dark:text-gray-400">Intelligent pattern analysis and predictions</p>
        </div>
      </div>

      {/* Key Insights Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Incident Trend */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3 mb-4">
            <ChartBarIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <h3 className="font-semibold text-gray-900 dark:text-white">Incident Volume</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              {trends.incident_count?.type === 'increasing' ? (
                <ArrowTrendingUpIcon className="h-4 w-4 text-red-500" />
              ) : trends.incident_count?.type === 'decreasing' ? (
                <ArrowTrendingDownIcon className="h-4 w-4 text-green-500" />
              ) : (
                <div className="h-4 w-4 bg-gray-400 rounded-full"></div>
              )}
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {trends.incident_count?.description || 'No trend data'}
              </span>
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Confidence: {trends.incident_count?.confidence.toFixed(0)}%
            </div>
            <div className="text-xs text-blue-600 dark:text-blue-400">
              {trends.incident_count?.recommendation}
            </div>
          </div>
        </div>

        {/* Response Time Trend */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3 mb-4">
            <ClockIcon className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            <h3 className="font-semibold text-gray-900 dark:text-white">Response Times</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              {trends.response_time?.type === 'increasing' ? (
                <ArrowTrendingUpIcon className="h-4 w-4 text-red-500" />
              ) : trends.response_time?.type === 'decreasing' ? (
                <ArrowTrendingDownIcon className="h-4 w-4 text-green-500" />
              ) : (
                <div className="h-4 w-4 bg-gray-400 rounded-full"></div>
              )}
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {trends.response_time?.description || 'No trend data'}
              </span>
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Confidence: {trends.response_time?.confidence.toFixed(0)}%
            </div>
            <div className="text-xs text-orange-600 dark:text-orange-400">
              {trends.response_time?.recommendation}
            </div>
          </div>
        </div>

        {/* Quality Trend */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3 mb-4">
            <LightBulbIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
            <h3 className="font-semibold text-gray-900 dark:text-white">Log Quality</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              {trends.quality_score?.type === 'increasing' ? (
                <ArrowTrendingUpIcon className="h-4 w-4 text-green-500" />
              ) : trends.quality_score?.type === 'decreasing' ? (
                <ArrowTrendingDownIcon className="h-4 w-4 text-red-500" />
              ) : (
                <div className="h-4 w-4 bg-gray-400 rounded-full"></div>
              )}
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {trends.quality_score?.description || 'No trend data'}
              </span>
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Confidence: {trends.quality_score?.confidence.toFixed(0)}%
            </div>
            <div className="text-xs text-green-600 dark:text-green-400">
              {trends.quality_score?.recommendation}
            </div>
          </div>
        </div>
      </div>

      {/* Anomalies Section */}
      {anomalies.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3 mb-4">
            <ExclamationTriangleIcon className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Anomalies Detected</h3>
            <span className="px-2 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 text-xs font-medium rounded-full">
              {anomalies.length}
            </span>
          </div>
          <div className="space-y-3">
            {anomalies.slice(0, 5).map((anomaly, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${SEVERITY_COLORS[anomaly.severity]}`}>
                  {anomaly.severity.toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {anomaly.description}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {new Date(anomaly.timestamp).toLocaleString()}
                  </div>
                  <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                    {anomaly.recommendation}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Forecasts Section */}
      {forecasts.incident_count && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3 mb-4">
            <EyeIcon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Predictions</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">Next 4 Hours</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Current:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {forecasts.incident_count.currentValue} incidents
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Predicted:</span>
                  <span className="font-medium text-purple-600 dark:text-purple-400">
                    {forecasts.incident_count.predictedValue.toFixed(1)} incidents
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Confidence:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {forecasts.incident_count.confidence.toFixed(0)}%
                  </span>
                </div>
              </div>
              <div className="mt-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <div className="text-sm text-purple-800 dark:text-purple-200">
                  {forecasts.incident_count.recommendation}
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">Key Factors</h4>
              <div className="space-y-2">
                {forecasts.incident_count.factors.map((factor, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <div className="h-2 w-2 bg-purple-500 rounded-full"></div>
                    {factor}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Trend Visualization */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Trend Analysis</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="time" 
                stroke="#6B7280"
                fontSize={12}
              />
              <YAxis stroke="#6B7280" fontSize={12} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  color: '#374151'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="incidents" 
                stroke="#3B82F6" 
                strokeWidth={2}
                name="Actual Incidents"
                dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
              />
              <Line 
                type="monotone" 
                dataKey="predicted" 
                stroke="#8B5CF6" 
                strokeWidth={2}
                strokeDasharray="5 5"
                name="Trend Line"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

// Mock data generator for development
function generateMockData(startDate: Date, endDate: Date): IncidentData[] {
  const data: IncidentData[] = []
  const now = new Date(startDate)
  
  // Generate hourly data points
  while (now <= endDate) {
    // Simulate realistic patterns with some randomness
    const hour = now.getHours()
    let baseIncidents = 2
    
    // Peak hours (evening events)
    if (hour >= 18 && hour <= 22) {
      baseIncidents = 8 + Math.random() * 6
    } else if (hour >= 12 && hour <= 17) {
      baseIncidents = 4 + Math.random() * 4
    }
    
    // Add some anomalies
    if (Math.random() < 0.1) {
      baseIncidents *= (2 + Math.random() * 2) // Spike
    }
    
    data.push({
      timestamp: now.toISOString(),
      incident_count: Math.round(baseIncidents),
      response_time: 5 + Math.random() * 15,
      quality_score: 75 + Math.random() * 20,
      compliance_rate: 85 + Math.random() * 15
    })
    
    now.setHours(now.getHours() + 1)
  }
  
  return data
}
