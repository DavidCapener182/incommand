'use client'

import React, { useEffect, useState } from 'react'
import { 
  WifiIcon,
  CloudArrowUpIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'
import { motion, AnimatePresence } from 'framer-motion'
import { useOffline } from '@/hooks/useOffline'

export default function OfflineIndicator() {
  const {
    isOnline,
    hasPendingSync,
    syncStatus,
    lastSyncTime,
    getPendingSyncCount,
    triggerSync
  } = useOffline()

  const [pendingCount, setPendingCount] = useState(0)
  const [isExpanded, setIsExpanded] = useState(false)

  useEffect(() => {
    const updatePendingCount = async () => {
      const count = await getPendingSyncCount()
      setPendingCount(count)
    }

    updatePendingCount()
    const interval = setInterval(updatePendingCount, 10000) // Update every 10 seconds

    return () => clearInterval(interval)
  }, [getPendingSyncCount, hasPendingSync])

  // Auto-hide online indicator after 3 seconds
  useEffect(() => {
    if (isOnline && !hasPendingSync) {
      const timer = setTimeout(() => {
        setIsExpanded(false)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [isOnline, hasPendingSync])

  // Show when offline or has pending sync
  const shouldShow = !isOnline || hasPendingSync || syncStatus !== 'idle'

  if (!shouldShow && !isExpanded) {
    return null
  }

  const handleSync = async () => {
    await triggerSync()
  }

  return (
    <AnimatePresence>
      {(shouldShow || isExpanded) && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed top-0 left-0 right-0 z-50 flex justify-center p-2"
        >
          <div
            className={`${
              !isOnline
                ? 'bg-orange-500 dark:bg-orange-600'
                : syncStatus === 'syncing'
                ? 'bg-blue-500 dark:bg-blue-600'
                : syncStatus === 'success'
                ? 'bg-green-500 dark:bg-green-600'
                : syncStatus === 'error'
                ? 'bg-red-500 dark:bg-red-600'
                : 'bg-gray-700 dark:bg-gray-800'
            } text-white rounded-full px-4 py-2 shadow-2xl flex items-center gap-3 cursor-pointer hover:scale-105 transition-transform`}
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {/* Icon */}
            <div className="flex-shrink-0">
              {!isOnline ? (
                <WifiIcon className="h-5 w-5 animate-pulse" />
              ) : syncStatus === 'syncing' ? (
                <ArrowPathIcon className="h-5 w-5 animate-spin" />
              ) : syncStatus === 'success' ? (
                <CheckCircleIcon className="h-5 w-5" />
              ) : syncStatus === 'error' ? (
                <ExclamationTriangleIcon className="h-5 w-5" />
              ) : (
                <CloudArrowUpIcon className="h-5 w-5" />
              )}
            </div>

            {/* Message */}
            <div className="flex-1 text-sm font-medium">
              {!isOnline ? (
                <span>You're Offline</span>
              ) : syncStatus === 'syncing' ? (
                <span>Syncing data...</span>
              ) : syncStatus === 'success' ? (
                <span>All data synced!</span>
              ) : syncStatus === 'error' ? (
                <span>Sync failed. Retry?</span>
              ) : hasPendingSync && pendingCount > 0 ? (
                <span>{pendingCount} item{pendingCount !== 1 ? 's' : ''} pending sync</span>
              ) : (
                <span>You're back online!</span>
              )}
            </div>

            {/* Badge */}
            {hasPendingSync && pendingCount > 0 && syncStatus !== 'syncing' && (
              <span className="flex-shrink-0 bg-white/30 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-bold">
                {pendingCount}
              </span>
            )}

            {/* Sync Button */}
            {isOnline && hasPendingSync && syncStatus !== 'syncing' && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleSync()
                }}
                className="flex-shrink-0 bg-white/20 hover:bg-white/30 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium transition-colors"
              >
                Sync Now
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Compact version for bottom bar
export function OfflineIndicatorCompact() {
  const { isOnline, hasPendingSync, syncStatus } = useOffline()

  if (isOnline && !hasPendingSync && syncStatus === 'idle') {
    return null
  }

  return (
    <div className="flex items-center gap-2">
      <div className={`w-2 h-2 rounded-full ${
        !isOnline
          ? 'bg-orange-500 animate-pulse'
          : syncStatus === 'syncing'
          ? 'bg-blue-500 animate-pulse'
          : syncStatus === 'success'
          ? 'bg-green-500'
          : syncStatus === 'error'
          ? 'bg-red-500'
          : 'bg-gray-400'
      }`}></div>
      <span className="text-xs text-gray-600 dark:text-gray-400">
        {!isOnline ? 'Offline' : syncStatus === 'syncing' ? 'Syncing...' : 'Pending'}
      </span>
    </div>
  )
}
