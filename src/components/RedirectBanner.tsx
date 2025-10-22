"use client"

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { XMarkIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'

export function RedirectBanner() {
  const [isVisible, setIsVisible] = useState(false)
  const searchParams = useSearchParams()
  
  const redirectedFrom = searchParams?.get('redirectedFrom')
  const message = searchParams?.get('message')

  useEffect(() => {
    // Show banner if user was redirected from a protected route
    if (redirectedFrom && redirectedFrom !== '/login' && redirectedFrom !== '/signup') {
      setIsVisible(true)
      
      // Auto-hide after 8 seconds
      const timer = setTimeout(() => {
        setIsVisible(false)
      }, 8000)
      
      return () => clearTimeout(timer)
    }
  }, [redirectedFrom])

  if (!isVisible) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -50 }}
        transition={{ duration: 0.3 }}
        className="fixed top-0 left-0 right-0 z-50 bg-amber-50 border-b border-amber-200 shadow-sm"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="h-5 w-5 text-amber-400 mr-3" />
              <div className="text-sm">
                <p className="text-amber-800 font-medium">
                  {message || 'Redirected to login – please sign in to continue'}
                </p>
                {redirectedFrom && (
                  <p className="text-amber-700 text-xs mt-1">
                    You were trying to access: <span className="font-mono">{redirectedFrom}</span>
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={() => setIsVisible(false)}
              className="ml-4 flex-shrink-0 text-amber-400 hover:text-amber-500 transition-colors"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
