// src/components/OfflineIndicator.tsx
'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  WifiIcon, 
  CloudArrowUpIcon,
  CloudArrowDownIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'
import { useOfflineSync } from '@/hooks/useOfflineSync'

interface OfflineIndicatorProps {
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  showWhenOnline?: boolean
  className?: string
}

export default function OfflineIndicator({
  position = 'top-right',
  showWhenOnline = false,
  className = ''
}: OfflineIndicatorProps) {
  const [state, actions] = useOfflineSync()
  const { isOnline, isSyncInProgress, syncProgress, queueStatus } = state

  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4'
  }

  const shouldShow = !isOnline || showWhenOnline || isSyncInProgress || queueStatus.pending > 0 || queueStatus.failed > 0

  return (
    <AnimatePresence>
      {shouldShow && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className={`fixed ${positionClasses[position]} z-50 ${className}`}
        >
          {/* Offline Warning */}
          {!isOnline && (
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl px-4 py-3 shadow-lg backdrop-blur-sm"
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <WifiIcon className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                  <motion.div
                    className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                </div>
                <div>
                  <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-300">
                    You&apos;re offline
                  </p>
                  <p className="text-xs text-yellow-700 dark:text-yellow-400">
                    Changes will sync when reconnected
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Syncing Indicator */}
          {isOnline && isSyncInProgress && (
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl px-4 py-3 shadow-lg backdrop-blur-sm"
            >
              <div className="flex items-center gap-3">
                <ArrowPathIcon className="h-5 w-5 text-blue-600 dark:text-blue-400 animate-spin" />
                <div>
                  <p className="text-sm font-semibold text-blue-800 dark:text-blue-300">
                    Syncing...
                  </p>
                  <p className="text-xs text-blue-700 dark:text-blue-400">
                    {syncProgress.completed} of {syncProgress.total} items
                  </p>
                </div>
              </div>
              
              {/* Progress Bar */}
              {syncProgress.total > 0 && (
                <div className="mt-2 w-full h-1.5 bg-blue-100 dark:bg-blue-900/50 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-blue-600 dark:bg-blue-400"
                    initial={{ width: 0 }}
                    animate={{ width: `${(syncProgress.completed / syncProgress.total) * 100}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              )}
            </motion.div>
          )}

          {/* Queued Items Indicator */}
          {isOnline && !isSyncInProgress && queueStatus.pending > 0 && (
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3 shadow-lg backdrop-blur-sm"
            >
              <div className="flex items-center gap-3">
                <CloudArrowUpIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                <div>
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-300">
                    {queueStatus.pending} pending
                  </p>
                  <button
                    onClick={actions.triggerManualSync}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Sync now
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Failed Items Indicator */}
          {queueStatus.failed > 0 && (
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3 shadow-lg backdrop-blur-sm mt-2"
            >
              <div className="flex items-center gap-3">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-600 dark:text-red-400" />
                <div>
                  <p className="text-sm font-semibold text-red-800 dark:text-red-300">
                    {queueStatus.failed} failed
                  </p>
                  <div className="flex gap-2 mt-1">
                    <button
                      onClick={actions.triggerManualSync}
                      className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      Retry
                    </button>
                    <button
                      onClick={actions.clearFailedOperations}
                      className="text-xs text-red-600 dark:text-red-400 hover:underline"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Online & All Synced Indicator */}
          {isOnline && !isSyncInProgress && queueStatus.pending === 0 && queueStatus.failed === 0 && showWhenOnline && (
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ delay: 2 }}
              className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl px-4 py-3 shadow-lg backdrop-blur-sm"
            >
              <div className="flex items-center gap-3">
                <CheckCircleIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
                <p className="text-sm font-semibold text-green-800 dark:text-green-300">
                  All changes synced
                </p>
              </div>
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Compact version for bottom nav or header
export function OfflineIndicatorCompact() {
  const [state] = useOfflineSync()
  const { isOnline, isSyncInProgress, queueStatus } = state

  if (isOnline && !isSyncInProgress && queueStatus.pending === 0 && queueStatus.failed === 0) {
    return null
  }

  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      className="relative"
    >
      {!isOnline && (
        <div className="flex items-center gap-2 px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
          <WifiIcon className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
          <span className="text-xs font-medium text-yellow-700 dark:text-yellow-300">Offline</span>
        </div>
      )}

      {isOnline && isSyncInProgress && (
        <div className="flex items-center gap-2 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
          <ArrowPathIcon className="h-4 w-4 text-blue-600 dark:text-blue-400 animate-spin" />
          <span className="text-xs font-medium text-blue-700 dark:text-blue-300">Syncing</span>
        </div>
      )}

      {isOnline && !isSyncInProgress && queueStatus.pending > 0 && (
        <div className="flex items-center gap-2 px-2 py-1 bg-gray-100 dark:bg-gray-900/30 rounded-lg">
          <CloudArrowUpIcon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{queueStatus.pending}</span>
        </div>
      )}

      {queueStatus.failed > 0 && (
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white dark:border-gray-900"
        />
      )}
    </motion.div>
  )
}
