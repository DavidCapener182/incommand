'use client'

import React from 'react'
import { motion } from 'framer-motion'

// Skeleton loading components for different UI elements
export function SkeletonBox({ className = '', height = 'h-4' }: { className?: string; height?: string }) {
  return (
    <div className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded ${height} ${className}`} />
  )
}

export function SkeletonText({ lines = 1, className = '' }: { lines?: number; className?: string }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonBox key={i} height={i === lines - 1 && lines > 1 ? 'h-3' : 'h-4'} />
      ))}
    </div>
  )
}

export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 ${className}`}>
      <div className="space-y-3">
        <SkeletonBox height="h-4" className="w-3/4" />
        <SkeletonText lines={2} />
        <div className="flex gap-2">
          <SkeletonBox height="h-6" className="w-16" />
          <SkeletonBox height="h-6" className="w-20" />
        </div>
      </div>
    </div>
  )
}

export function SkeletonTable({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {Array.from({ length: columns }).map((_, i) => (
          <SkeletonBox key={`header-${i}`} height="h-4" className="w-3/4" />
        ))}
      </div>
      
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={`row-${rowIndex}`} className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {Array.from({ length: columns }).map((_, colIndex) => (
            <SkeletonBox key={`cell-${rowIndex}-${colIndex}`} height="h-4" />
          ))}
        </div>
      ))}
    </div>
  )
}

export function SkeletonIncidentCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4"
    >
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <SkeletonBox height="h-5" className="w-24" />
          <SkeletonBox height="h-6" className="w-16 rounded-full" />
        </div>
        
        {/* Content */}
        <div className="space-y-2">
          <SkeletonBox height="h-4" className="w-full" />
          <SkeletonBox height="h-4" className="w-5/6" />
        </div>
        
        {/* Footer */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex gap-2">
            <SkeletonBox height="h-5" className="w-12" />
            <SkeletonBox height="h-5" className="w-16" />
          </div>
          <SkeletonBox height="h-4" className="w-20" />
        </div>
      </div>
    </motion.div>
  )
}

export function SkeletonIncidentTable({ rows = 8 }: { rows?: number }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="bg-gray-50 dark:bg-gray-700 px-6 py-3 border-b border-gray-200 dark:border-gray-600">
        <div className="grid grid-cols-6 gap-4">
          <SkeletonBox height="h-4" className="w-20" />
          <SkeletonBox height="h-4" className="w-16" />
          <SkeletonBox height="h-4" className="w-24" />
          <SkeletonBox height="h-4" className="w-32" />
          <SkeletonBox height="h-4" className="w-20" />
          <SkeletonBox height="h-4" className="w-16" />
        </div>
      </div>
      
      {/* Body */}
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {Array.from({ length: rows }).map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="px-6 py-4"
          >
            <div className="grid grid-cols-6 gap-4 items-center">
              <SkeletonBox height="h-4" className="w-16" />
              <SkeletonBox height="h-4" className="w-12" />
              <SkeletonBox height="h-4" className="w-20" />
              <SkeletonBox height="h-4" className="w-full" />
              <SkeletonBox height="h-6" className="w-16 rounded-full" />
              <SkeletonBox height="h-4" className="w-12" />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

export function SkeletonModal() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-2xl max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gray-50 dark:bg-gray-700 px-6 py-4 border-b border-gray-200 dark:border-gray-600">
          <SkeletonBox height="h-6" className="w-48" />
        </div>
        
        {/* Content */}
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <SkeletonBox height="h-4" className="w-20" />
              <SkeletonBox height="h-10" className="w-full" />
            </div>
            <div className="space-y-2">
              <SkeletonBox height="h-4" className="w-16" />
              <SkeletonBox height="h-10" className="w-full" />
            </div>
          </div>
          
          <div className="space-y-2">
            <SkeletonBox height="h-4" className="w-24" />
            <SkeletonBox height="h-24" className="w-full" />
          </div>
          
          <div className="space-y-2">
            <SkeletonBox height="h-4" className="w-32" />
            <SkeletonBox height="h-20" className="w-full" />
          </div>
        </div>
        
        {/* Footer */}
        <div className="bg-gray-50 dark:bg-gray-700 px-6 py-4 border-t border-gray-200 dark:border-gray-600 flex justify-end gap-3">
          <SkeletonBox height="h-10" className="w-20" />
          <SkeletonBox height="h-10" className="w-24" />
        </div>
      </motion.div>
    </motion.div>
  )
}

export function SkeletonForm() {
  return (
    <div className="space-y-6">
      {/* Form fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <SkeletonBox height="h-4" className="w-24" />
          <SkeletonBox height="h-10" className="w-full" />
        </div>
        <div className="space-y-2">
          <SkeletonBox height="h-4" className="w-20" />
          <SkeletonBox height="h-10" className="w-full" />
        </div>
      </div>
      
      <div className="space-y-2">
        <SkeletonBox height="h-4" className="w-32" />
        <SkeletonBox height="h-24" className="w-full" />
      </div>
      
      <div className="space-y-2">
        <SkeletonBox height="h-4" className="w-28" />
        <SkeletonBox height="h-20" className="w-full" />
      </div>
      
      {/* Buttons */}
      <div className="flex gap-3 pt-4">
        <SkeletonBox height="h-10" className="w-20" />
        <SkeletonBox height="h-10" className="w-24" />
      </div>
    </div>
  )
}

// Loading spinner with different sizes
export function LoadingSpinner({ size = 'md', className = '' }: { size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  }
  
  return (
    <div className={`animate-spin rounded-full border-2 border-gray-300 border-t-blue-600 ${sizeClasses[size]} ${className}`} />
  )
}

// Loading overlay for buttons and interactive elements
export function LoadingOverlay({ isLoading, children, className = '' }: { 
  isLoading: boolean; 
  children: React.ReactNode; 
  className?: string 
}) {
  return (
    <div className={`relative ${className}`}>
      {children}
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-white/80 dark:bg-gray-800/80 flex items-center justify-center rounded-lg"
        >
          <LoadingSpinner size="sm" />
        </motion.div>
      )}
    </div>
  )
}

// Progressive loading for lists
export function ProgressiveLoadingList({ 
  items, 
  renderItem, 
  loading = false, 
  skeletonCount = 5,
  className = ''
}: {
  items: any[];
  renderItem: (item: any, index: number) => React.ReactNode;
  loading?: boolean;
  skeletonCount?: number;
  className?: string;
}) {
  if (loading && items.length === 0) {
    return (
      <div className={`space-y-4 ${className}`}>
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <SkeletonIncidentCard key={i} />
        ))}
      </div>
    )
  }
  
  return (
    <div className={`space-y-4 ${className}`}>
      {items.map((item, index) => (
        <motion.div
          key={item.id || index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          {renderItem(item, index)}
        </motion.div>
      ))}
      
      {loading && items.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex justify-center py-4"
        >
          <LoadingSpinner />
        </motion.div>
      )}
    </div>
  )
}

// Error state component
export function ErrorState({ 
  title = 'Something went wrong', 
  message = 'Please try again later', 
  onRetry,
  className = ''
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center ${className}`}
    >
      <div className="text-red-600 dark:text-red-400 mb-4">
        <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">{title}</h3>
      <p className="text-red-600 dark:text-red-400 mb-4">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          Try Again
        </button>
      )}
    </motion.div>
  )
}

// Empty state component
export function EmptyState({ 
  title = 'No data found', 
  message = 'There are no items to display', 
  action,
  className = ''
}: {
  title?: string;
  message?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-8 text-center ${className}`}
    >
      <div className="text-gray-400 dark:text-gray-500 mb-4">
        <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{title}</h3>
      <p className="text-gray-600 dark:text-gray-400 mb-6">{message}</p>
      {action}
    </motion.div>
  )
}
