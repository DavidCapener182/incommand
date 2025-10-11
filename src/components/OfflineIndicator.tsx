'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { WifiIcon, SignalSlashIcon, ArrowPathIcon } from '@heroicons/react/24/outline'

export default function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true)
  const [isReconnecting, setIsReconnecting] = useState(false)

  useEffect(() => {
    // Set initial state
    setIsOnline(navigator.onLine)

    const handleOnline = () => {
      setIsOnline(true)
      setIsReconnecting(false)
    }

    const handleOffline = () => {
      setIsOnline(false)
      setIsReconnecting(false)
    }

    // Listen for online/offline events
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Show reconnecting state briefly when coming back online
  useEffect(() => {
    if (isOnline && !navigator.onLine) {
      setIsReconnecting(true)
      const timer = setTimeout(() => setIsReconnecting(false), 2000)
      return () => clearTimeout(timer)
    }
  }, [isOnline])

  if (isOnline && !isReconnecting) {
    return null
  }

  return (
    <AnimatePresence>
      <motion.div
        className="fixed top-0 left-0 right-0 z-50"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        exit={{ y: -100 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <div className={`px-4 py-3 text-center text-sm font-medium ${
          isReconnecting 
            ? 'bg-yellow-500 text-yellow-900' 
            : 'bg-red-500 text-red-900'
        }`}>
          <div className="flex items-center justify-center gap-2">
            {isReconnecting ? (
              <>
                <ArrowPathIcon className="w-4 h-4 animate-spin" />
                <span>Reconnecting...</span>
              </>
            ) : (
              <>
                <SignalSlashIcon className="w-4 h-4" />
                <span>You&apos;re offline. Some features may be limited.</span>
              </>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}