'use client'

import { useState, useEffect } from 'react'
import {
  UserGroupIcon,
  ClockIcon,
  ChartBarIcon,
  TrophyIcon,
  SparklesIcon
} from '@heroicons/react/24/outline'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from 'recharts'
import { calculatePerformanceMetrics } from '@/lib/analytics/performanceMetrics'
import { getTopPerformingOperators, calculateSingleLogQuality } from '@/lib/analytics/logQualityMetrics'
import { supabase } from '@/lib/supabase'
import type { PerformanceMetrics } from '@/lib/analytics/performanceMetrics'

interface UserActivityDashboardProps {
  startDate: Date
  endDate: Date
  eventId?: string
}

interface UserActivity {
  userId: string
  callsign?: string
  incidentCount: number
  averageQuality: number
  retrospectiveRate: number
  amendmentRate: number
  activeHours: number
  incidentsPerHour: number
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316']

export default function UserActivityDashboard({ startDate, endDate, eventId }: UserActivityDashboardProps) {
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics | null>(null)
  const [topOperators, setTopOperators] = useState<any[]>([])
  const [userActivities, setUserActivities] = useState<UserActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      setError(null)
      
      try {
        // Fetch performance metrics and top operators
        const [perfData, topOpsData] = await Promise.all([
          calculatePerformanceMetrics(startDate, endDate, eventId),
          getTopPerformingOperators(startDate, endDate, eventId, 10)
        ])
        
        setPerformanceMetrics(perfData)
        setTopOperators(topOpsData)
        
        // Fetch detailed user activity data
        let query = supabase
          .from('incident_logs')
          .select('*')
          .gte('time_logged', startDate.toISOString())
          .lte('time_logged', endDate.toISOString())
          .not('logged_by_user_id', 'is', null)

        if (eventId) {
          query = query.eq('event_id', eventId)
        }

        const { data: logs, error: logsError } = await query

        if (logsError) throw logsError

        if (logs && logs.length > 0) {
          // Process user activity
          const userMap = new Map<string, {
            callsign?: string
            logs: any[]
            retrospective: number
            amended: number
          }>()

          logs.forEach(log => {
            if (!log.logged_by_user_id) return

            if (!userMap.has(log.logged_by_user_id)) {
              userMap.set(log.logged_by_user_id, {
                callsign: log.logged_by_callsign || undefined,
                logs: [],
                retrospective: 0,
                amended: 0
              })
            }

            const user = userMap.get(log.logged_by_user_id)!
            user.logs.push(log)
            if (log.entry_type === 'retrospective') user.retrospective++
            if (log.is_amended) user.amended++
          })

          // Calculate metrics for each user
          const periodHours = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60)
          
          const activities: UserActivity[] = Array.from(userMap.entries()).map(([userId, data]) => {
            // Calculate average quality
            const qualityScores = data.logs.map(log => calculateSingleLogQuality(log).score)
            const averageQuality = qualityScores.reduce((a, b) => a + b, 0) / qualityScores.length

            const retrospectiveRate = (data.retrospective / data.logs.length) * 100
            const amendmentRate = (data.amended / data.logs.length) * 100
            const incidentsPerHour = data.logs.length / Math.max(periodHours, 1)

            return {
              userId,
              callsign: data.callsign,
              incidentCount: data.logs.length,
              averageQuality: Math.round(averageQuality),
              retrospectiveRate: Math.round(retrospectiveRate * 10) / 10,
              amendmentRate: Math.round(amendmentRate * 10) / 10,
              activeHours: Math.min(periodHours, 24), // Estimate
              incidentsPerHour: Math.round(incidentsPerHour * 10) / 10
            }
          })

          // Sort by incident count
          activities.sort((a, b) => b.incidentCount - a.incidentCount)
          
          setUserActivities(activities)
        }
      } catch (err) {
        console.error('Error fetching user activity data:', err)
        setError('Failed to load user activity metrics')
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

  if (error || !performanceMetrics) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <UserGroupIcon className="h-12 w-12 text-red-600 mx-auto mb-3" />
        <p className="text-red-800 font-medium">{error || 'No data available'}</p>
      </div>
    )
  }

  // Prepare chart data
  const incidentsByOperator = userActivities.slice(0, 10).map(user => ({
    name: user.callsign || 'Unknown',
    incidents: user.incidentCount,
    quality: user.averageQuality
  }))

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-lg border border-gray-200 p-5 card-depth">
          <div className="flex items-center gap-2 mb-3">
            <UserGroupIcon className="h-5 w-5 text-blue-600" />
            <h4 className="font-medium text-gray-900">Active Operators</h4>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-blue-600">
              {performanceMetrics.staffUtilization.length}
            </span>
          </div>
          <p className="text-xs text-gray-600 mt-1">Total logged entries</p>
        </div>

        <div className="rounded-lg border border-gray-200 p-5 card-depth">
          <div className="flex items-center gap-2 mb-3">
            <ChartBarIcon className="h-5 w-5 text-green-600" />
            <h4 className="font-medium text-gray-900">Avg Entries/Operator</h4>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-green-600">
              {performanceMetrics.staffUtilization.length > 0
                ? Math.round(performanceMetrics.totalIncidents / performanceMetrics.staffUtilization.length)
                : 0
              }
            </span>
          </div>
          <p className="text-xs text-gray-600 mt-1">Per operator</p>
        </div>

        <div className="rounded-lg border border-gray-200 p-5 card-depth">
          <div className="flex items-center gap-2 mb-3">
            <ClockIcon className="h-5 w-5 text-purple-600" />
            <h4 className="font-medium text-gray-900">Avg Handling Time</h4>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-purple-600">
              {performanceMetrics.averageResolutionTime}
            </span>
            <span className="text-gray-500 text-sm">min</span>
          </div>
          <p className="text-xs text-gray-600 mt-1">Per incident</p>
        </div>

        <div className="rounded-lg border border-gray-200 p-5 card-depth">
          <div className="flex items-center gap-2 mb-3">
            <SparklesIcon className="h-5 w-5 text-amber-600" />
            <h4 className="font-medium text-gray-900">Top Quality Score</h4>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-amber-600">
              {topOperators.length > 0 ? topOperators[0].averageQuality : 0}
            </span>
            <span className="text-gray-500 text-sm">/100</span>
          </div>
          <p className="text-xs text-gray-600 mt-1">
            {topOperators.length > 0 ? topOperators[0].callsign : 'N/A'}
          </p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Incidents per Operator */}
        <div className="rounded-lg border border-gray-200 p-6 card-depth">
          <h4 className="font-medium text-gray-900 mb-4">Incidents per Operator</h4>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={incidentsByOperator}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis 
                dataKey="name"
                stroke="#6B7280"
                style={{ fontSize: '11px' }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis 
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
                dataKey="incidents" 
                fill="#3B82F6"
                radius={[8, 8, 0, 0]}
              >
                {incidentsByOperator.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Quality Scores by Operator */}
        <div className="rounded-lg border border-gray-200 p-6 card-depth">
          <h4 className="font-medium text-gray-900 mb-4">Quality Scores by Operator</h4>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={incidentsByOperator}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis 
                dataKey="name"
                stroke="#6B7280"
                style={{ fontSize: '11px' }}
                angle={-45}
                textAnchor="end"
                height={80}
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
                dataKey="quality" 
                fill="#10B981"
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed User Activity Table */}
      <div className="rounded-lg border border-gray-200 p-6 card-depth">
        <div className="flex items-center gap-2 mb-4">
          <TrophyIcon className="h-5 w-5 text-amber-500" />
          <h4 className="font-medium text-gray-900">Operator Performance Details</h4>
        </div>
        
        {userActivities.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Operator
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Entries
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quality Score
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Entries/Hour
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Retrospective %
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amendment %
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {userActivities.map((user, index) => (
                  <tr key={user.userId} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {index < 3 && (
                          <span className="text-lg">
                            {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                          </span>
                        )}
                        <span className="text-sm font-medium text-gray-900">
                          {user.callsign || 'Unknown'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                      {user.incidentCount}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-semibold ${
                          user.averageQuality >= 90 ? 'text-green-600' :
                          user.averageQuality >= 75 ? 'text-blue-600' :
                          user.averageQuality >= 60 ? 'text-amber-600' :
                          'text-red-600'
                        }`}>
                          {user.averageQuality}
                        </span>
                        <div className="w-20 bg-gray-200 rounded-full h-1.5">
                          <div 
                            className={`h-1.5 rounded-full ${
                              user.averageQuality >= 90 ? 'bg-green-600' :
                              user.averageQuality >= 75 ? 'bg-blue-600' :
                              user.averageQuality >= 60 ? 'bg-amber-600' :
                              'bg-red-600'
                            }`}
                            style={{ width: `${user.averageQuality}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                      {user.incidentsPerHour}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`text-sm ${
                        user.retrospectiveRate > 20 ? 'text-red-600 font-semibold' :
                        user.retrospectiveRate > 10 ? 'text-amber-600' :
                        'text-gray-600'
                      }`}>
                        {user.retrospectiveRate}%
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`text-sm ${
                        user.amendmentRate > 20 ? 'text-red-600 font-semibold' :
                        user.amendmentRate > 10 ? 'text-amber-600' :
                        'text-gray-600'
                      }`}>
                        {user.amendmentRate}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-center text-gray-500 py-8">No user activity data available</p>
        )}
      </div>
    </div>
  )
}

