// src/components/ui/MicroInteractions.tsx
'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { CheckCircleIcon, XCircleIcon, ExclamationTriangleIcon, InformationCircleIcon } from '@heroicons/react/24/outline'

/**
 * Micro-interaction components for enhanced user feedback
 * Provides visual and motion feedback for user actions
 */

// Success checkmark animation
export function SuccessCheck({ size = 'md', className = '' }: { size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  }

  return (
    <motion.div
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ type: 'spring', stiffness: 200, damping: 15 }}
      className={className}
    >
      <CheckCircleIcon className={`${sizeClasses[size]} text-green-500`} />
    </motion.div>
  )
}

// Loading spinner
export function LoadingDots({ className = '' }: { className?: string }) {
  return (
    <div className={`flex gap-1 items-center ${className}`}>
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-2 h-2 bg-current rounded-full"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 1, 0.5]
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            delay: i * 0.2
          }}
        />
      ))}
    </div>
  )
}

// Ripple effect for buttons
export function Ripple({ x, y }: { x: number; y: number }) {
  return (
    <motion.span
      className="absolute rounded-full bg-white/30 pointer-events-none"
      style={{
        left: x - 10,
        top: y - 10,
        width: 20,
        height: 20
      }}
      initial={{ scale: 0, opacity: 1 }}
      animate={{ scale: 4, opacity: 0 }}
      transition={{ duration: 0.6 }}
    />
  )
}

// Shake animation for errors
export function ShakeWrapper({ children, trigger }: { children: React.ReactNode; trigger: boolean }) {
  return (
    <motion.div
      animate={trigger ? {
        x: [0, -10, 10, -10, 10, 0],
        transition: { duration: 0.4 }
      } : {}}
    >
      {children}
    </motion.div>
  )
}

// Pulse animation for notifications
export function PulseIndicator({ color = 'blue', className = '' }: { color?: string; className?: string }) {
  return (
    <div className={`relative ${className}`}>
      <motion.div
        className={`w-3 h-3 rounded-full bg-${color}-500`}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [1, 0.7, 1]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
      />
      <motion.div
        className={`absolute inset-0 w-3 h-3 rounded-full bg-${color}-400 opacity-75`}
        animate={{
          scale: [1, 1.5, 1],
          opacity: [0.75, 0, 0.75]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
      />
    </div>
  )
}

// Typing indicator
export function TypingIndicatorDots({ className = '' }: { className?: string }) {
  return (
    <div className={`flex gap-1 ${className}`}>
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full"
          animate={{
            y: [0, -8, 0]
          }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            delay: i * 0.15
          }}
        />
      ))}
    </div>
  )
}

// Progress bar
export function ProgressBar({ progress, className = '' }: { progress: number; className?: string }) {
  return (
    <div className={`w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden ${className}`}>
      <motion.div
        className="h-full bg-blue-500 rounded-full"
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      />
    </div>
  )
}

// Badge with pulse
export function PulseBadge({ children, pulse = true, className = '' }: { children: React.ReactNode; pulse?: boolean; className?: string }) {
  return (
    <motion.div
      className={className}
      animate={pulse ? {
        scale: [1, 1.05, 1],
        transition: { duration: 2, repeat: Infinity }
      } : {}}
    >
      {children}
    </motion.div>
  )
}

// Floating action button with pulse
export function FloatingPulse({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      className={className}
      animate={{
        y: [0, -5, 0],
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut'
      }}
    >
      {children}
    </motion.div>
  )
}

// Status indicator with icon
export function StatusIndicator({ 
  status, 
  size = 'md', 
  showLabel = false,
  className = '' 
}: { 
  status: 'success' | 'error' | 'warning' | 'info'
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  className?: string 
}) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  }

  const configs = {
    success: { icon: CheckCircleIcon, color: 'text-green-500', label: 'Success', bg: 'bg-green-100 dark:bg-green-900/20' },
    error: { icon: XCircleIcon, color: 'text-red-500', label: 'Error', bg: 'bg-red-100 dark:bg-red-900/20' },
    warning: { icon: ExclamationTriangleIcon, color: 'text-yellow-500', label: 'Warning', bg: 'bg-yellow-100 dark:bg-yellow-900/20' },
    info: { icon: InformationCircleIcon, color: 'text-blue-500', label: 'Info', bg: 'bg-blue-100 dark:bg-blue-900/20' }
  }

  const config = configs[status]
  const Icon = config.icon

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 15 }}
      className={`flex items-center gap-2 ${showLabel ? `px-3 py-1 rounded-full ${config.bg}` : ''} ${className}`}
    >
      <Icon className={`${sizeClasses[size]} ${config.color}`} />
      {showLabel && <span className={`text-sm font-medium ${config.color}`}>{config.label}</span>}
    </motion.div>
  )
}

// Skeleton loader with shimmer
export function SkeletonShimmer({ className = '', lines = 1 }: { className?: string; lines?: number }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <motion.div
          key={i}
          className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded"
          style={{
            backgroundSize: '200% 100%',
            width: `${100 - i * 10}%`
          }}
          animate={{
            backgroundPosition: ['200% 0', '-200% 0']
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'linear'
          }}
        />
      ))}
    </div>
  )
}

// Count-up animation
export function CountUp({ 
  value, 
  duration = 1, 
  className = '' 
}: { 
  value: number
  duration?: number
  className?: string 
}) {
  const [displayValue, setDisplayValue] = React.useState(0)

  React.useEffect(() => {
    const start = 0
    const end = value
    const increment = end / (duration * 60) // 60fps
    let current = start

    const timer = setInterval(() => {
      current += increment
      if (current >= end) {
        setDisplayValue(end)
        clearInterval(timer)
      } else {
        setDisplayValue(Math.floor(current))
      }
    }, 1000 / 60)

    return () => clearInterval(timer)
  }, [value, duration])

  return <span className={className}>{displayValue}</span>
}

