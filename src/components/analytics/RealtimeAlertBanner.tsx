'use client'

import React from 'react'
import { 
  ExclamationTriangleIcon,
  XMarkIcon,
  CheckCircleIcon,
  InformationCircleIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline'
import type { RealtimeAlert } from '@/hooks/useRealtimeAnalytics'

interface RealtimeAlertBannerProps {
  alerts: RealtimeAlert[]
  onDismiss: (alertId: string) => void
  onClearAll: () => void
  className?: string
}

const SEVERITY_CONFIG = {
  low: {
    icon: InformationCircleIcon,
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    borderColor: 'border-blue-200 dark:border-blue-800',
    textColor: 'text-blue-800 dark:text-blue-200',
    iconColor: 'text-blue-600 dark:text-blue-400'
  },
  medium: {
    icon: ExclamationTriangleIcon,
    bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
    borderColor: 'border-yellow-200 dark:border-yellow-800',
    textColor: 'text-yellow-800 dark:text-yellow-200',
    iconColor: 'text-yellow-600 dark:text-yellow-400'
  },
  high: {
    icon: ExclamationCircleIcon,
    bgColor: 'bg-orange-50 dark:bg-orange-900/20',
    borderColor: 'border-orange-200 dark:border-orange-800',
    textColor: 'text-orange-800 dark:text-orange-200',
    iconColor: 'text-orange-600 dark:text-orange-400'
  },
  critical: {
    icon: ExclamationCircleIcon,
    bgColor: 'bg-red-50 dark:bg-red-900/20',
    borderColor: 'border-red-200 dark:border-red-800',
    textColor: 'text-red-800 dark:text-red-200',
    iconColor: 'text-red-600 dark:text-red-400'
  }
}

const TYPE_CONFIG = {
  threshold: 'Threshold Exceeded',
  anomaly: 'Anomaly Detected',
  trend: 'Trend Alert',
  quality: 'Quality Issue'
}

export default function RealtimeAlertBanner({ 
  alerts, 
  onDismiss, 
  onClearAll, 
  className = '' 
}: RealtimeAlertBannerProps) {
  if (alerts.length === 0) return null

  // Group alerts by severity for display priority
  const criticalAlerts = alerts.filter(alert => alert.severity === 'critical')
  const highAlerts = alerts.filter(alert => alert.severity === 'high')
  const mediumAlerts = alerts.filter(alert => alert.severity === 'medium')
  const lowAlerts = alerts.filter(alert => alert.severity === 'low')

  const displayAlerts = [...criticalAlerts, ...highAlerts, ...mediumAlerts, ...lowAlerts].slice(0, 3)

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Alert Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              Live Alerts
            </span>
          </div>
          <span className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 text-xs font-medium rounded-full">
            {alerts.length}
          </span>
        </div>
        {alerts.length > 3 && (
          <button
            onClick={onClearAll}
            className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Alert Items */}
      <div className="space-y-2">
        {displayAlerts.map((alert) => {
          const config = SEVERITY_CONFIG[alert.severity]
          const Icon = config.icon

          return (
            <div
              key={alert.id}
              className={`${config.bgColor} ${config.borderColor} border rounded-lg p-3 transition-all duration-200 hover:shadow-sm`}
            >
              <div className="flex items-start gap-3">
                <Icon className={`h-5 w-5 ${config.iconColor} flex-shrink-0 mt-0.5`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-sm font-medium ${config.textColor}`}>
                      {alert.title}
                    </span>
                    <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs rounded-full">
                      {TYPE_CONFIG[alert.type]}
                    </span>
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                      alert.severity === 'critical' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200' :
                      alert.severity === 'high' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200' :
                      alert.severity === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200' :
                      'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200'
                    }`}>
                      {alert.severity.toUpperCase()}
                    </span>
                  </div>
                  <p className={`text-sm ${config.textColor} mb-2`}>
                    {alert.message}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                      <span>
                        {new Date(alert.timestamp).toLocaleTimeString('en-GB', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                      {alert.value !== undefined && (
                        <span>
                          Value: {alert.value.toFixed(1)}
                          {alert.threshold && ` (Threshold: ${alert.threshold})`}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => onDismiss(alert.id)}
                      className={`p-1 ${config.textColor} hover:bg-white/50 dark:hover:bg-gray-800/50 rounded transition-colors`}
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Show More Indicator */}
      {alerts.length > 3 && (
        <div className="text-center">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            +{alerts.length - 3} more alerts
          </span>
        </div>
      )}
    </div>
  )
}
