'use client'

import { useState, useEffect } from 'react'
import {
  ChartBarIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  UserGroupIcon,
  CursorArrowRaysIcon,
  ArrowPathIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline'
import { errorTracker } from '@/lib/monitoring/errorTracking'
import { performanceMonitor } from '@/lib/monitoring/performanceMonitor'
import { usageAnalytics } from '@/lib/monitoring/usageAnalytics'
import { Line, Bar, Pie } from 'recharts'

export default function MonitoringDashboard() {
  const [errorMetrics, setErrorMetrics] = useState(errorTracker.getMetrics())
  const [perfReport, setPerfReport] = useState(performanceMonitor.getReport())
  const [usageMetrics, setUsageMetrics] = useState(usageAnalytics.getMetrics())
  const [activeTab, setActiveTab] = useState<'errors' | 'performance' | 'usage'>('errors')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Initial load
    setIsLoading(true)
    setErrorMetrics(errorTracker.getMetrics())
    setPerfReport(performanceMonitor.getReport())
    setUsageMetrics(usageAnalytics.getMetrics())
    setIsLoading(false)

    const interval = setInterval(() => {
      setErrorMetrics(errorTracker.getMetrics())
      setPerfReport(performanceMonitor.getReport())
      setUsageMetrics(usageAnalytics.getMetrics())
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  const handleExport = (type: 'errors' | 'performance' | 'usage') => {
    let data = ''
    let filename = ''

    switch (type) {
      case 'errors':
        data = errorTracker.exportLogs()
        filename = 'error-logs.json'
        break
      case 'performance':
        data = performanceMonitor.exportMetrics()
        filename = 'performance-metrics.json'
        break
      case 'usage':
        data = usageAnalytics.exportEvents()
        filename = 'usage-events.json'
        break
    }

    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  const tabs = [
    { id: 'errors' as const, label: 'Error Tracking', icon: ExclamationTriangleIcon },
    { id: 'performance' as const, label: 'Performance', icon: ClockIcon },
    { id: 'usage' as const, label: 'Usage Analytics', icon: CursorArrowRaysIcon }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          System Monitoring
        </h1>
        <button
          onClick={() => handleExport(activeTab)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <ArrowDownTrayIcon className="h-5 w-5" />
          Export {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Data
        </button>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-2 shadow-sm">
        <div className="flex gap-2">
          {tabs.map(tab => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-all
                  ${activeTab === tab.id
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 border border-blue-500'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }
                `}
              >
                <Icon className="h-5 w-5" />
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Error Tracking Tab */}
      {activeTab === 'errors' && (
        <div className="space-y-6">
          {/* Error Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Errors</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {errorMetrics.totalErrors}
                  </p>
                </div>
                <ExclamationTriangleIcon className="h-12 w-12 text-red-500" />
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Error Rate</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {errorMetrics.errorRate}/min
                  </p>
                </div>
                <ChartBarIcon className="h-12 w-12 text-orange-500" />
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Critical Errors</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {errorMetrics.errorsByLevel['error'] || 0}
                  </p>
                </div>
                <ExclamationTriangleIcon className="h-12 w-12 text-red-600" />
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Warnings</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {errorMetrics.errorsByLevel['warning'] || 0}
                  </p>
                </div>
                <ExclamationTriangleIcon className="h-12 w-12 text-yellow-500" />
              </div>
            </div>
          </div>

          {/* Top Errors */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Most Frequent Errors
            </h3>
            <div className="space-y-3">
              {errorMetrics.topErrors.map((error, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {error.message}
                    </p>
                  </div>
                  <span className="ml-4 px-3 py-1 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 text-sm font-medium rounded-full">
                    {error.count} occurrences
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Errors */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Recent Errors
            </h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {errorMetrics.recentErrors.map(error => (
                <div
                  key={error.id}
                  className="p-3 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`
                          px-2 py-1 text-xs font-medium rounded
                          ${error.level === 'error' ? 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200' :
                            error.level === 'warning' ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-200' :
                            'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200'}
                        `}>
                          {error.level.toUpperCase()}
                        </span>
                        {error.component && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {error.component}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-900 dark:text-white font-medium">
                        {error.message}
                      </p>
                      {error.stack && (
                        <details className="mt-2">
                          <summary className="text-xs text-gray-500 dark:text-gray-400 cursor-pointer hover:text-gray-700 dark:hover:text-gray-300">
                            View stack trace
                          </summary>
                          <pre className="mt-2 text-xs text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 p-2 rounded overflow-x-auto">
                            {error.stack}
                          </pre>
                        </details>
                      )}
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap ml-4">
                      {new Date(error.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Performance Tab */}
      {activeTab === 'performance' && (
        <div className="space-y-6">
          {/* Performance Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Avg Page Load</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {perfReport.avgPageLoadTime.toFixed(0)}ms
                  </p>
                </div>
                <ClockIcon className="h-12 w-12 text-blue-500" />
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Avg API Call</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {perfReport.avgApiCallTime.toFixed(0)}ms
                  </p>
                </div>
                <ClockIcon className="h-12 w-12 text-green-500" />
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Avg Render</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {perfReport.avgRenderTime.toFixed(0)}ms
                  </p>
                </div>
                <ClockIcon className="h-12 w-12 text-purple-500" />
              </div>
            </div>
          </div>

          {/* Slowest Operations */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Slowest Operations
            </h3>
            <div className="space-y-2">
              {perfReport.slowestOperations.map((op, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <span className={`
                      px-2 py-1 text-xs font-medium rounded
                      ${op.type === 'pageLoad' ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200' :
                        op.type === 'apiCall' ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-200' :
                        'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-200'}
                    `}>
                      {op.type}
                    </span>
                    <p className="text-sm text-gray-900 dark:text-white truncate">
                      {op.name}
                    </p>
                  </div>
                  <span className={`
                    ml-4 px-3 py-1 text-sm font-medium rounded-full
                    ${op.duration > 2000 ? 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200' :
                      op.duration > 1000 ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-200' :
                      'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-200'}
                  `}>
                    {op.duration.toFixed(0)}ms
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* API Call Stats */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              API Endpoint Performance
            </h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {Object.entries(perfReport.apiCallStats).map(([endpoint, stats]) => (
                <div
                  key={endpoint}
                  className="p-3 border border-gray-200 dark:border-gray-600 rounded-lg"
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate flex-1">
                      {endpoint}
                    </p>
                    <span className="ml-4 text-sm text-gray-600 dark:text-gray-400">
                      {stats.count} calls
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400">
                    <span>Avg: {stats.avgDuration.toFixed(0)}ms</span>
                    <span className={stats.errorRate > 10 ? 'text-red-600 dark:text-red-400 font-medium' : ''}>
                      Error Rate: {stats.errorRate.toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Usage Analytics Tab */}
      {activeTab === 'usage' && (
        <div className="space-y-6">
          {/* Usage Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Events</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {usageMetrics.totalEvents}
                  </p>
                </div>
                <CursorArrowRaysIcon className="h-12 w-12 text-blue-500" />
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Unique Users</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {usageMetrics.uniqueUsers}
                  </p>
                </div>
                <UserGroupIcon className="h-12 w-12 text-green-500" />
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Active Sessions</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {usageMetrics.activeSessions}
                  </p>
                </div>
                <ArrowPathIcon className="h-12 w-12 text-purple-500" />
              </div>
            </div>
          </div>

          {/* Top Pages */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Most Visited Pages
            </h3>
            <div className="space-y-2">
              {usageMetrics.topPages.map((page, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <p className="text-sm text-gray-900 dark:text-white font-medium">
                    {page.page}
                  </p>
                  <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 text-sm font-medium rounded-full">
                    {page.views} views
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Top Features */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Most Used Features
            </h3>
            <div className="space-y-2">
              {usageMetrics.topFeatures.map((feature, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <p className="text-sm text-gray-900 dark:text-white font-medium">
                    {feature.feature}
                  </p>
                  <span className="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-200 text-sm font-medium rounded-full">
                    {feature.uses} uses
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Device & Browser Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Device Types
              </h3>
              <div className="space-y-2">
                {Object.entries(usageMetrics.deviceBreakdown).map(([device, count]) => (
                  <div key={device} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                      {device}
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500"
                          style={{
                            width: `${(count / usageMetrics.totalEvents) * 100}%`
                          }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white w-12 text-right">
                        {count}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Browsers
              </h3>
              <div className="space-y-2">
                {Object.entries(usageMetrics.browserBreakdown).map(([browser, count]) => (
                  <div key={browser} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {browser}
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-green-500"
                          style={{
                            width: `${(count / usageMetrics.totalEvents) * 100}%`
                          }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white w-12 text-right">
                        {count}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

