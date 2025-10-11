'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'

export default function PWASplashScreen() {
  const [showSplash, setShowSplash] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    // Only show splash screen if app is running in standalone mode
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setShowSplash(true)
      
      // Lock body scroll when splash screen is shown
      const originalStyle = window.getComputedStyle(document.body).overflow
      document.body.style.overflow = 'hidden'
      
      // Hide splash screen after app loads
      const timer = setTimeout(() => {
        setIsLoaded(true)
        setTimeout(() => {
          setShowSplash(false)
          // Restore body scroll when splash screen is hidden
          document.body.style.overflow = originalStyle
        }, 500) // Fade out after loaded
      }, 2000) // Show for 2 seconds minimum

      return () => {
        clearTimeout(timer)
        // Restore body scroll on cleanup
        document.body.style.overflow = originalStyle
      }
    }
  }, [])

  if (!showSplash) {
    return null
  }

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[9999] flex items-center justify-center"
        style={{
          backgroundColor: '#2A3990', // Match theme color
        }}
        initial={{ opacity: 1 }}
        animate={{ opacity: isLoaded ? 0 : 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="text-center">
          {/* Logo */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="mb-8"
          >
            <Image
              src="/inCommand.png"
              alt="InCommand"
              width={200}
              height={80}
              className="mx-auto"
              priority
            />
          </motion.div>

          {/* App Name */}
          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="text-2xl font-bold text-white mb-2"
          >
            InCommand
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="text-blue-200 text-sm"
          >
            Event Management Platform
          </motion.p>

          {/* Loading indicator */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            className="mt-8"
          >
            <div className="flex justify-center">
              <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
