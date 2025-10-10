'use client'

import React, { useEffect, useState } from 'react'
import { 
  WifiIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  ClockIcon
} from '@heroicons/react/24/outline'
import { useRouter } from 'next/navigation'

export default function OfflinePage() {
  const router = useRouter()
  const [isOnline, setIsOnline] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  const [lastAttempt, setLastAttempt] = useState<Date>(new Date())

  useEffect(() => {
    // Check if online
    setIsOnline(navigator.onLine)

    // Listen for online/offline events
    const handleOnline = () => {
      setIsOnline(true)
      // Redirect to dashboard when connection is restored
      setTimeout(() => {
        router.push('/dashboard')
      }, 1000)
    }

    const handleOffline = () => {
      setIsOnline(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [router])

  const handleRetry = async () => {
    setRetryCount(prev => prev + 1)
    setLastAttempt(new Date())

    try {
      // Try to fetch a small resource to check connectivity
      const response = await fetch('/api/health', {
        method: 'HEAD',
        cache: 'no-cache'
      })

      if (response.ok) {
        setIsOnline(true)
        router.push('/dashboard')
      }
    } catch (error) {
      console.error('Still offline:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-blue-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Status Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 text-center">
          {/* Icon */}
          <div className="mb-6">
            {isOnline ? (
              <div className="inline-flex items-center justify-center w-24 h-24 bg-green-100 dark:bg-green-900/30 rounded-full">
                <WifiIcon className="h-12 w-12 text-green-600 dark:text-green-400" />
              </div>
            ) : (
              <div className="inline-flex items-center justify-center w-24 h-24 bg-orange-100 dark:bg-orange-900/30 rounded-full animate-pulse">
                <WifiIcon className="h-12 w-12 text-orange-600 dark:text-orange-400" />
              </div>
            )}
          </div>

          {/* Status Message */}
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
            {isOnline ? 'Connection Restored!' : 'You\'re Offline'}
          </h1>
          
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {isOnline 
              ? 'Your connection has been restored. Redirecting...'
              : 'No internet connection detected. Some features may be unavailable.'
            }
          </p>

          {/* Offline Features */}
          {!isOnline && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6 text-left">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                <ExclamationTriangleIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                Available Offline
              </h3>
              <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                <li className="flex items-start gap-2">
                  <span className="text-green-600 dark:text-green-400 mt-0.5">✓</span>
                  <span>View cached incidents and logs</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 dark:text-green-400 mt-0.5">✓</span>
                  <span>Create new incidents (will sync when online)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 dark:text-green-400 mt-0.5">✓</span>
                  <span>View staff directory</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-600 dark:text-orange-400 mt-0.5">!</span>
                  <span>Real-time updates unavailable</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-600 dark:text-orange-400 mt-0.5">!</span>
                  <span>Analytics data may be outdated</span>
                </li>
              </ul>
            </div>
          )}

          {/* Retry Info */}
          {!isOnline && retryCount > 0 && (
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-4">
              <ClockIcon className="h-4 w-4" />
              <span>
                Last attempt: {lastAttempt.toLocaleTimeString()} ({retryCount} {retryCount === 1 ? 'retry' : 'retries'})
              </span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            {!isOnline && (
              <button
                onClick={handleRetry}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                <ArrowPathIcon className="h-5 w-5" />
                <span>Retry Connection</span>
              </button>
            )}
            
            <button
              onClick={() => router.push('/dashboard')}
              className="w-full px-6 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg font-medium transition-colors"
            >
              {isOnline ? 'Go to Dashboard' : 'Continue Offline'}
            </button>
          </div>
        </div>

        {/* Tips Card */}
        <div className="mt-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Troubleshooting Tips</h3>
          <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <li>• Check your WiFi or mobile data connection</li>
            <li>• Try moving to an area with better signal</li>
            <li>• Restart your device if connection issues persist</li>
            <li>• Contact your IT support if problems continue</li>
          </ul>
        </div>

        {/* Status Indicator */}
        <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-orange-500'}`}></div>
          <span>{isOnline ? 'Online' : 'Offline'} Mode</span>
        </div>
      </div>
    </div>
  )
}
