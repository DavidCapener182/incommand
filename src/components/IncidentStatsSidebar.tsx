'use client'

import { useMemo } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts'
import { 
  ChartBarIcon, 
  ClockIcon,
  SparklesIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline'

interface IncidentStatsSidebarProps {
  incidents: any[]
  onExport?: () => void
}

const COLORS = {
  high: '#EF4444',
  medium: '#F59E0B',
  low: '#10B981',
  medical: '#DC2626',
  ejection: '#7C3AED',
  refusal: '#2563EB',
  other: '#6B7280'
}

export default function IncidentStatsSidebar({ incidents, onExport }: IncidentStatsSidebarProps) {
  // Filter today's incidents (exclude match flow logs)
  const todayIncidents = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return incidents.filter(i => {
      // Exclude match flow logs from statistics
      if (i.type === 'match_log') {
        return false
      }
      const incidentDate = new Date(i.time_logged || i.created_at)
      incidentDate.setHours(0, 0, 0, 0)
      return incidentDate.getTime() === today.getTime()
    })
  }, [incidents])

  // Calculate stats
  const stats = useMemo(() => {
    const byType: Record<string, number> = {}
    const byPriority: Record<string, number> = { high: 0, medium: 0, low: 0 }
    let totalResponseTime = 0
    let responseCount = 0

    todayIncidents.forEach(incident => {
      // Count by type
      const type = incident.incident_type || 'other'
      byType[type] = (byType[type] || 0) + 1

      // Count by priority
      const priority = incident.priority || 'medium'
      if (priority in byPriority) {
        byPriority[priority]++
      }

      // Calculate response time
      if (incident.time_logged && incident.time_of_occurrence) {
        const logged = new Date(incident.time_logged)
        const occurred = new Date(incident.time_of_occurrence)
        const diff = (logged.getTime() - occurred.getTime()) / (1000 * 60) // minutes
        if (diff >= 0 && diff < 1440) { // Less than 24 hours
          totalResponseTime += diff
          responseCount++
        }
      }
    })

    // Top 5 incident types
    const typeData = Object.entries(byType)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([type, count]) => ({
        name: type.replace('_', ' '),
        value: count
      }))

    const priorityData = Object.entries(byPriority)
      .map(([priority, count]) => ({
        name: priority,
        value: count
      }))
      .filter(d => d.value > 0)

    const avgResponseTime = responseCount > 0 ? Math.round(totalResponseTime / responseCount) : 0

    return {
      total: todayIncidents.length,
      typeData,
      priorityData,
      avgResponseTime
    }
  }, [todayIncidents])

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Today&apos;s Stats</h3>
        {onExport && (
          <button
            onClick={onExport}
            className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title="Export today's logs"
          >
            <ArrowDownTrayIcon className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Total Count */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
        <div className="flex items-center gap-2 mb-1">
          <ChartBarIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          <p className="text-sm font-medium text-blue-900 dark:text-blue-200">Total Incidents</p>
        </div>
        <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{stats.total}</p>
        <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">Since midnight</p>
      </div>

      {/* Average Response Time */}
      <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
        <div className="flex items-center gap-2 mb-1">
          <ClockIcon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          <p className="text-sm font-medium text-purple-900 dark:text-purple-200">Avg Response</p>
        </div>
        <div className="flex items-baseline gap-1">
          <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">{stats.avgResponseTime}</p>
          <span className="text-sm text-purple-700 dark:text-purple-300">min</span>
        </div>
        <p className="text-xs text-purple-700 dark:text-purple-300 mt-1">Time to log</p>
      </div>

      {/* By Priority Breakdown */}
      {stats.priorityData.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">By Priority</h4>
          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={stats.priorityData} layout="horizontal">
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="name" width={60} style={{ fontSize: '12px' }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px'
                }}
              />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {stats.priorityData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS] || COLORS.other} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* By Type Breakdown */}
      {stats.typeData.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Top Incident Types</h4>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={stats.typeData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => {
                  const percentage = typeof percent === 'number' ? percent * 100 : 0
                  return `${name}: ${percentage.toFixed(0)}%`
                }}
                outerRadius={70}
                fill="#8884d8"
                dataKey="value"
              >
                {stats.typeData.map((entry, index) => {
                  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6']
                  return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                })}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Quality Indicator */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
        <div className="flex items-center gap-2 mb-2">
          <SparklesIcon className="h-4 w-4 text-gray-500" />
          <p className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">Quick Quality Check</p>
        </div>
        <div className="space-y-2 text-xs text-gray-600 dark:text-gray-400">
          <div className="flex justify-between">
            <span>Logged today:</span>
            <span className="font-semibold">{stats.total}</span>
          </div>
          <div className="flex justify-between">
            <span>Avg response:</span>
            <span className={`font-semibold ${
              stats.avgResponseTime < 15 ? 'text-green-600' :
              stats.avgResponseTime < 30 ? 'text-amber-600' :
              'text-red-600'
            }`}>
              {stats.avgResponseTime}m
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
