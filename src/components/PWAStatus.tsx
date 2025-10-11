'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  WifiIcon, 
  SignalSlashIcon, 
  DevicePhoneMobileIcon,
  ClockIcon,
  CpuChipIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'

interface PWAStatusProps {
  className?: string
}

export default function PWAStatus({ className = '' }: PWAStatusProps) {
  const [isOnline, setIsOnline] = useState(true)
  const [isStandalone, setIsStandalone] = useState(false)
  const [isServiceWorkerSupported, setIsServiceWorkerSupported] = useState(false)
  const [isServiceWorkerActive, setIsServiceWorkerActive] = useState(false)
  const [lastSync, setLastSync] = useState<Date | null>(null)

  useEffect(() => {
    // Check online status
    setIsOnline(navigator.onLine)
    
    // Check if running as PWA
    setIsStandalone(window.matchMedia('(display-mode: standalone)').matches)
    
    // Check service worker support
    setIsServiceWorkerSupported('serviceWorker' in navigator)
    
    // Check service worker registration
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then((registration) => {
        setIsServiceWorkerActive(!!registration?.active)
      })
    }

    // Set last sync time
    setLastSync(new Date())

    // Listen for online/offline events
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const getStatusColor = (status: boolean) => status ? 'text-green-500' : 'text-red-500'
  const getStatusIcon = (status: boolean) => status ? CheckCircleIcon : ExclamationTriangleIcon

  return (
    <motion.div
      className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center gap-2 mb-3">
        <CpuChipIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        <h3 className="font-semibold text-gray-900 dark:text-white">PWA Status</h3>
      </div>

      <div className="space-y-3">
        {/* Connection Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isOnline ? (
              <WifiIcon className="w-4 h-4 text-green-500" />
            ) : (
              <SignalSlashIcon className="w-4 h-4 text-red-500" />
            )}
            <span className="text-sm text-gray-700 dark:text-gray-300">Connection</span>
          </div>
          <span className={`text-sm font-medium ${getStatusColor(isOnline)}`}>
            {isOnline ? 'Online' : 'Offline'}
          </span>
        </div>

        {/* PWA Mode */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DevicePhoneMobileIcon className="w-4 h-4 text-blue-500" />
            <span className="text-sm text-gray-700 dark:text-gray-300">PWA Mode</span>
          </div>
          <span className={`text-sm font-medium ${getStatusColor(isStandalone)}`}>
            {isStandalone ? 'Active' : 'Browser'}
          </span>
        </div>

        {/* Service Worker */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CpuChipIcon className="w-4 h-4 text-purple-500" />
            <span className="text-sm text-gray-700 dark:text-gray-300">Service Worker</span>
          </div>
          <span className={`text-sm font-medium ${getStatusColor(isServiceWorkerActive)}`}>
            {isServiceWorkerSupported ? (isServiceWorkerActive ? 'Active' : 'Inactive') : 'Not Supported'}
          </span>
        </div>

        {/* Last Sync */}
        {lastSync && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ClockIcon className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-700 dark:text-gray-300">Last Sync</span>
            </div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {lastSync.toLocaleTimeString()}
            </span>
          </div>
        )}
      </div>

      {/* PWA Benefits */}
      {isStandalone && (
        <motion.div
          className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="text-xs text-gray-600 dark:text-gray-400">
            <div className="font-medium mb-1">PWA Benefits Active:</div>
            <ul className="space-y-1 text-xs">
              <li>• Offline functionality</li>
              <li>• App-like experience</li>
              <li>• Push notifications</li>
              <li>• Background sync</li>
            </ul>
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}
