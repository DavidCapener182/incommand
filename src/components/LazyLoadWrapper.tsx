'use client'

import React, { Suspense, lazy, ComponentType } from 'react'
import { motion } from 'framer-motion'

interface LazyLoadWrapperProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  minHeight?: string | number
}

// Loading skeleton component
export function LoadingSkeleton({ minHeight = '200px' }: { minHeight?: string | number }) {
  return (
    <div 
      className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded-xl"
      style={{ minHeight }}
    >
      <div className="p-6 space-y-4">
        <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
        <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
        <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-5/6"></div>
      </div>
    </div>
  )
}

// Card skeleton
export function CardSkeleton({ count = 1 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
          </div>
        </div>
      ))}
    </>
  )
}

// Table skeleton
export function TableSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {Array.from({ length: columns }).map((_, index) => (
            <div key={index} className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="border-b border-gray-100 dark:border-gray-700 p-4">
          <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
            {Array.from({ length: columns }).map((_, colIndex) => (
              <div key={colIndex} className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// Chart skeleton
export function ChartSkeleton({ height = 200 }: { height?: number }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
      <div className="animate-pulse space-y-4">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
        <div 
          className="bg-gray-100 dark:bg-gray-700 rounded"
          style={{ height: `${height}px` }}
        >
          <div className="flex items-end justify-around h-full p-4">
            {Array.from({ length: 7 }).map((_, index) => (
              <div
                key={index}
                className="bg-gray-200 dark:bg-gray-600 rounded-t w-8"
                style={{ height: `${Math.random() * 80 + 20}%` }}
              ></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// Main lazy load wrapper
export default function LazyLoadWrapper({ 
  children, 
  fallback,
  minHeight = '200px'
}: LazyLoadWrapperProps) {
  return (
    <Suspense fallback={fallback || <LoadingSkeleton minHeight={minHeight} />}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {children}
      </motion.div>
    </Suspense>
  )
}

// Higher-order component for lazy loading
export function withLazyLoad<P extends object>(
  importFunc: () => Promise<{ default: ComponentType<P> }>,
  fallback?: React.ReactNode
) {
  const LazyComponent = lazy(importFunc)
  
  return function LazyLoadedComponent(props: P) {
    const Component = LazyComponent as unknown as React.ComponentType<P>
    return (
      <Suspense fallback={fallback || <LoadingSkeleton />}>
        <Component {...props} />
      </Suspense>
    )
  }
}

// Intersection Observer based lazy loading
interface IntersectionLazyLoadProps {
  children: React.ReactNode
  onVisible?: () => void
  threshold?: number
  rootMargin?: string
  fallback?: React.ReactNode
}

export function IntersectionLazyLoad({
  children,
  onVisible,
  threshold = 0.1,
  rootMargin = '50px',
  fallback
}: IntersectionLazyLoadProps) {
  const [isVisible, setIsVisible] = React.useState(false)
  const ref = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          onVisible?.()
          observer.disconnect()
        }
      },
      { threshold, rootMargin }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => observer.disconnect()
  }, [threshold, rootMargin, onVisible])

  return (
    <div ref={ref}>
      {isVisible ? children : (fallback || <LoadingSkeleton />)}
    </div>
  )
}
