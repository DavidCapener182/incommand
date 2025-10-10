'use client'

import React from 'react'
import { 
  WifiIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'

interface RealtimeStatusIndicatorProps {
  isConnected: boolean
  error: string | null
  lastUpdated: string
  updateCount: number
  onRefresh: () => void
  className?: string
}

export default function RealtimeStatusIndicator({
  isConnected,
  error,
  lastUpdated,
  updateCount,
  onRefresh,
  className = ''
}: RealtimeStatusIndicatorProps) {
  const getStatusColor = () => {
    if (error) return 'text-red-500'
    if (isConnected) return 'text-green-500'
    return 'text-yellow-500'
  }

  const getStatusText = () => {
    if (error) return 'Connection Error'
    if (isConnected) return 'Live'
    return 'Connecting...'
  }

  const getStatusIcon = () => {
    if (error) return ExclamationTriangleIcon
    if (isConnected) return WifiIcon
    return ArrowPathIcon
  }

  const StatusIcon = getStatusIcon()
  const isAnimated = isConnected && !error

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Status Indicator */}
      <div className="flex items-center gap-2">
        <div className="relative">
          <StatusIcon 
            className={`h-4 w-4 ${getStatusColor()} ${isAnimated ? 'animate-pulse' : ''}`} 
          />
          {isConnected && !error && (
            <div className={`absolute -top-1 -right-1 h-2 w-2 bg-green-500 rounded-full animate-ping`}></div>
          )}
        </div>
        <span className={`text-sm font-medium ${getStatusColor()}`}>
          {getStatusText()}
        </span>
      </div>

      {/* Last Updated */}
      <div className="text-xs text-gray-500 dark:text-gray-400">
        Updated {new Date(lastUpdated).toLocaleTimeString('en-GB', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        })}
      </div>

      {/* Update Count */}
      <div className="text-xs text-gray-400 dark:text-gray-500">
        #{updateCount}
      </div>

      {/* Refresh Button */}
      <button
        onClick={onRefresh}
        className="p-1 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        title="Refresh data"
      >
        <ArrowPathIcon className="h-4 w-4" />
      </button>

      {/* Error Message */}
      {error && (
        <div className="text-xs text-red-600 dark:text-red-400 max-w-xs truncate" title={error}>
          {error}
        </div>
      )}
    </div>
  )
}
