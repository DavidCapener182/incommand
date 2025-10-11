'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowPathIcon, XMarkIcon } from '@heroicons/react/24/outline'

export default function PWAUpdateNotification() {
  const [updateAvailable, setUpdateAvailable] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)

  useEffect(() => {
    // Listen for service worker updates
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        // Service worker has been updated
        setUpdateAvailable(true)
      })

      // Check if there's a waiting service worker
      navigator.serviceWorker.getRegistration().then((registration) => {
        if (registration?.waiting) {
          setUpdateAvailable(true)
        }
      })
    }
  }, [])

  const handleUpdate = async () => {
    setIsUpdating(true)
    
    try {
      // Send message to service worker to skip waiting
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration()
        if (registration?.waiting) {
          registration.waiting.postMessage({ type: 'SKIP_WAITING' })
        }
      }
      
      // Reload the page to use the new service worker
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    } catch (error) {
      console.error('Failed to update:', error)
      setIsUpdating(false)
    }
  }

  const handleDismiss = () => {
    setUpdateAvailable(false)
  }

  if (!updateAvailable) {
    return null
  }

  return (
    <AnimatePresence>
      <motion.div
        className="fixed top-4 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-sm"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -100, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
              <ArrowPathIcon className={`w-5 h-5 text-blue-600 dark:text-blue-400 ${isUpdating ? 'animate-spin' : ''}`} />
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-1">
                Update Available
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-300 mb-3">
                A new version of InCommand is ready. Update now for the latest features and improvements.
              </p>
              
              <div className="flex gap-2">
                <button
                  onClick={handleUpdate}
                  disabled={isUpdating}
                  className="flex-1 touch-target px-3 py-2 bg-blue-600 text-white rounded-lg font-semibold text-xs shadow-lg hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUpdating ? 'Updating...' : 'Update Now'}
                </button>
                <button
                  onClick={handleDismiss}
                  className="touch-target px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium text-xs hover:bg-gray-200 dark:hover:bg-gray-600 active:scale-95 transition-all"
                >
                  Later
                </button>
              </div>
            </div>

            <button
              onClick={handleDismiss}
              className="touch-target p-1 -m-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Dismiss"
            >
              <XMarkIcon className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
