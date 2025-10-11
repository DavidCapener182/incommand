'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { XMarkIcon, ArrowDownTrayIcon, DevicePhoneMobileIcon } from '@heroicons/react/24/outline'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [showIOSInstructions, setShowIOSInstructions] = useState(false)

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      return
    }

    // Check if dismissed recently
    const dismissedAt = localStorage.getItem('pwa-install-dismissed')
    if (dismissedAt) {
      const daysSinceDismiss = (Date.now() - parseInt(dismissedAt)) / (1000 * 60 * 60 * 24)
      if (daysSinceDismiss < 7) {
        return
      }
    }

    // Detect iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    setIsIOS(iOS)

    // For non-iOS, listen for beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      
      // Show prompt after a short delay (better UX)
      setTimeout(() => {
        setShowPrompt(true)
      }, 3000)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    // For iOS, show after delay if not installed
    if (iOS) {
      setTimeout(() => {
        setShowPrompt(true)
      }, 5000)
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) {
      if (isIOS) {
        setShowIOSInstructions(true)
        return
      }
      return
    }

    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    
    if (outcome === 'accepted') {
      console.log('PWA installed')
    }
    
    setDeferredPrompt(null)
    setShowPrompt(false)
  }

  const handleDismiss = () => {
    localStorage.setItem('pwa-install-dismissed', Date.now().toString())
    setShowPrompt(false)
    setShowIOSInstructions(false)
  }

  if (!showPrompt) {
    return null
  }

  return (
    <AnimatePresence>
      {/* iOS Installation Instructions */}
      {showIOSInstructions ? (
        <motion.div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleDismiss}
        >
          <motion.div
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-sm w-full p-6"
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                  <DevicePhoneMobileIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">Install InCommand</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Add to Home Screen</p>
                </div>
              </div>
              <button
                onClick={handleDismiss}
                className="touch-target p-2 -m-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <XMarkIcon className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                To install InCommand on your iPhone or iPad:
              </p>
              
              <ol className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
                  <span>Tap the <strong>Share</strong> button at the bottom of Safari</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
                  <span>Scroll down and tap <strong>&quot;Add to Home Screen&quot;</strong></span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">3</span>
                  <span>Tap <strong>&quot;Add&quot;</strong> in the top right</span>
                </li>
              </ol>

              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-700">
                <p className="text-xs text-blue-900 dark:text-blue-200">
                  <strong>Benefits:</strong> Faster loading, offline access, and a native app experience!
                </p>
              </div>
            </div>

            <button
              onClick={handleDismiss}
              className="button-primary w-full mt-6"
            >
              Got it!
            </button>
          </motion.div>
        </motion.div>
      ) : (
        /* Install Banner */
        <motion.div
          className="fixed bottom-24 left-4 right-4 z-40 md:hidden"
          style={{
            bottom: 'max(env(safe-area-inset-bottom) + 7rem, 7.5rem)',
            left: 'max(env(safe-area-inset-left), 1rem)',
            right: 'max(env(safe-area-inset-right), 1rem)',
          }}
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-2xl p-4 border border-blue-500">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur">
                <DevicePhoneMobileIcon className="w-6 h-6 text-white" />
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold text-white mb-1">Install InCommand</h3>
                <p className="text-xs text-blue-100 mb-3">
                  Get faster access and work offline
                </p>
                
                <div className="flex gap-2">
                  <button
                    onClick={handleInstall}
                    className="flex-1 touch-target px-4 py-2.5 bg-white text-blue-600 rounded-lg font-semibold text-sm shadow-lg hover:bg-blue-50 active:scale-95 transition-all"
                  >
                    <span className="flex items-center justify-center gap-2">
                      <ArrowDownTrayIcon className="w-4 h-4" />
                      Install
                    </span>
                  </button>
                  <button
                    onClick={handleDismiss}
                    className="touch-target px-4 py-2.5 bg-white/20 text-white rounded-lg font-medium text-sm backdrop-blur hover:bg-white/30 active:scale-95 transition-all"
                  >
                    Later
                  </button>
                </div>
              </div>

              <button
                onClick={handleDismiss}
                className="touch-target p-2 -m-2 rounded-lg hover:bg-white/10 transition-colors"
                aria-label="Dismiss"
              >
                <XMarkIcon className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

