'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

interface PerformanceMetrics {
  renderTime: number
  memoryUsage: number
  networkLatency: number
  errorCount: number
  lastUpdate: Date
}

interface PerformanceThresholds {
  maxRenderTime: number // ms
  maxMemoryUsage: number // MB
  maxNetworkLatency: number // ms
  maxErrorCount: number
}

interface UsePerformanceMonitorOptions {
  enabled?: boolean
  thresholds?: Partial<PerformanceThresholds>
  onThresholdExceeded?: (metric: string, value: number, threshold: number) => void
  sampleRate?: number // 0-1, percentage of operations to monitor
}

const DEFAULT_THRESHOLDS: PerformanceThresholds = {
  maxRenderTime: 100, // 100ms
  maxMemoryUsage: 100, // 100MB
  maxNetworkLatency: 1000, // 1s
  maxErrorCount: 5
}

export function usePerformanceMonitor(options: UsePerformanceMonitorOptions = {}) {
  const {
    enabled = true,
    thresholds = {},
    onThresholdExceeded,
    sampleRate = 1.0
  } = options

  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    renderTime: 0,
    memoryUsage: 0,
    networkLatency: 0,
    errorCount: 0,
    lastUpdate: new Date()
  })

  const [isMonitoring, setIsMonitoring] = useState(enabled)
  const renderStartTime = useRef<number>(0)
  const performanceObserver = useRef<PerformanceObserver | null>(null)
  const errorCount = useRef(0)

  const finalThresholds = { ...DEFAULT_THRESHOLDS, ...thresholds }

  // Measure render time
  const startRenderMeasurement = useCallback(() => {
    if (!isMonitoring || Math.random() > sampleRate) return
    renderStartTime.current = performance.now()
  }, [isMonitoring, sampleRate])

  const endRenderMeasurement = useCallback((componentName?: string) => {
    if (!isMonitoring || !renderStartTime.current || Math.random() > sampleRate) return

    const renderTime = performance.now() - renderStartTime.current
    
    setMetrics(prev => {
      const newMetrics = { ...prev, renderTime, lastUpdate: new Date() }
      
      if (renderTime > finalThresholds.maxRenderTime) {
        onThresholdExceeded?.('renderTime', renderTime, finalThresholds.maxRenderTime)
        console.warn(`[Performance] ${componentName || 'Component'} render time exceeded threshold:`, {
          renderTime,
          threshold: finalThresholds.maxRenderTime
        })
      }
      
      return newMetrics
    })
  }, [isMonitoring, sampleRate, finalThresholds.maxRenderTime, onThresholdExceeded])

  // Measure memory usage
  const measureMemoryUsage = useCallback(() => {
    if (!isMonitoring || Math.random() > sampleRate) return

    if ('memory' in performance) {
      const memory = (performance as any).memory
      const memoryUsage = memory.usedJSHeapSize / 1024 / 1024 // Convert to MB
      
      setMetrics(prev => {
        const newMetrics = { ...prev, memoryUsage, lastUpdate: new Date() }
        
        if (memoryUsage > finalThresholds.maxMemoryUsage) {
          onThresholdExceeded?.('memoryUsage', memoryUsage, finalThresholds.maxMemoryUsage)
          console.warn('[Performance] Memory usage exceeded threshold:', {
            memoryUsage,
            threshold: finalThresholds.maxMemoryUsage,
            total: memory.totalJSHeapSize / 1024 / 1024,
            limit: memory.jsHeapSizeLimit / 1024 / 1024
          })
        }
        
        return newMetrics
      })
    }
  }, [isMonitoring, sampleRate, finalThresholds.maxMemoryUsage, onThresholdExceeded])

  // Measure network latency
  const measureNetworkLatency = useCallback(async (url: string) => {
    if (!isMonitoring || Math.random() > sampleRate) return Promise.resolve()

    const startTime = performance.now()
    
    try {
      const response = await fetch(url, { method: 'HEAD' })
      const latency = performance.now() - startTime
      
      setMetrics(prev => {
        const newMetrics = { ...prev, networkLatency: latency, lastUpdate: new Date() }
        
        if (latency > finalThresholds.maxNetworkLatency) {
          onThresholdExceeded?.('networkLatency', latency, finalThresholds.maxNetworkLatency)
          console.warn('[Performance] Network latency exceeded threshold:', {
            latency,
            threshold: finalThresholds.maxNetworkLatency,
            url
          })
        }
        
        return newMetrics
      })
      
      return latency
    } catch (error) {
      console.error('[Performance] Network latency measurement failed:', error)
      return null
    }
  }, [isMonitoring, sampleRate, finalThresholds.maxNetworkLatency, onThresholdExceeded])

  // Track errors
  const trackError = useCallback((error: Error, context?: string) => {
    if (!isMonitoring) return

    errorCount.current += 1
    
    setMetrics(prev => {
      const newMetrics = { ...prev, errorCount: errorCount.current, lastUpdate: new Date() }
      
      if (errorCount.current > finalThresholds.maxErrorCount) {
        onThresholdExceeded?.('errorCount', errorCount.current, finalThresholds.maxErrorCount)
        console.warn('[Performance] Error count exceeded threshold:', {
          errorCount: errorCount.current,
          threshold: finalThresholds.maxErrorCount,
          context,
          error: error.message
        })
      }
      
      return newMetrics
    })
  }, [isMonitoring, finalThresholds.maxErrorCount, onThresholdExceeded])

  // Monitor long tasks
  useEffect(() => {
    if (!isMonitoring) return

    try {
      performanceObserver.current = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        
        entries.forEach((entry) => {
          if (entry.entryType === 'longtask') {
            console.warn('[Performance] Long task detected:', {
              duration: entry.duration,
              startTime: entry.startTime,
              name: entry.name
            })
            
            if (entry.duration > finalThresholds.maxRenderTime) {
              onThresholdExceeded?.('longTask', entry.duration, finalThresholds.maxRenderTime)
            }
          }
        })
      })

      performanceObserver.current.observe({ entryTypes: ['longtask'] })
    } catch (error) {
      console.warn('[Performance] Long task monitoring not supported:', error)
    }

    return () => {
      if (performanceObserver.current) {
        performanceObserver.current.disconnect()
      }
    }
  }, [isMonitoring, finalThresholds.maxRenderTime, onThresholdExceeded])

  // Monitor memory usage periodically
  useEffect(() => {
    if (!isMonitoring) return

    const interval = setInterval(measureMemoryUsage, 5000) // Every 5 seconds
    return () => clearInterval(interval)
  }, [isMonitoring, measureMemoryUsage])

  // Monitor errors globally
  useEffect(() => {
    if (!isMonitoring) return

    const handleError = (event: ErrorEvent) => {
      trackError(new Error(event.message), 'Global error handler')
    }

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      trackError(
        event.reason instanceof Error ? event.reason : new Error(String(event.reason)),
        'Unhandled promise rejection'
      )
    }

    window.addEventListener('error', handleError)
    window.addEventListener('unhandledrejection', handleUnhandledRejection)

    return () => {
      window.removeEventListener('error', handleError)
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
    }
  }, [isMonitoring, trackError])

  // Performance report
  const getPerformanceReport = useCallback(() => {
    const report = {
      ...metrics,
      thresholds: finalThresholds,
      isHealthy: {
        renderTime: metrics.renderTime <= finalThresholds.maxRenderTime,
        memoryUsage: metrics.memoryUsage <= finalThresholds.maxMemoryUsage,
        networkLatency: metrics.networkLatency <= finalThresholds.maxNetworkLatency,
        errorCount: metrics.errorCount <= finalThresholds.maxErrorCount
      },
      recommendations: []
    }

    // Generate recommendations
    if (!report.isHealthy.renderTime) {
      report.recommendations.push('Consider optimizing component rendering or reducing complexity')
    }
    if (!report.isHealthy.memoryUsage) {
      report.recommendations.push('Check for memory leaks or excessive object creation')
    }
    if (!report.isHealthy.networkLatency) {
      report.recommendations.push('Optimize network requests or implement caching')
    }
    if (!report.isHealthy.errorCount) {
      report.recommendations.push('Review error handling and fix underlying issues')
    }

    return report
  }, [metrics, finalThresholds])

  // Reset metrics
  const resetMetrics = useCallback(() => {
    setMetrics({
      renderTime: 0,
      memoryUsage: 0,
      networkLatency: 0,
      errorCount: 0,
      lastUpdate: new Date()
    })
    errorCount.current = 0
  }, [])

  // Toggle monitoring
  const toggleMonitoring = useCallback(() => {
    setIsMonitoring(prev => !prev)
  }, [])

  return {
    metrics,
    isMonitoring,
    startRenderMeasurement,
    endRenderMeasurement,
    measureMemoryUsage,
    measureNetworkLatency,
    trackError,
    getPerformanceReport,
    resetMetrics,
    toggleMonitoring
  }
}

// Hook for measuring component render performance
export function useRenderPerformance(componentName?: string, options?: UsePerformanceMonitorOptions) {
  const performanceMonitor = usePerformanceMonitor(options)
  
  useEffect(() => {
    performanceMonitor.startRenderMeasurement()
    
    return () => {
      performanceMonitor.endRenderMeasurement(componentName)
    }
  }, [performanceMonitor, componentName])

  return performanceMonitor
}

// Hook for measuring async operations
export function useAsyncPerformance(options?: UsePerformanceMonitorOptions) {
  const performanceMonitor = usePerformanceMonitor(options)
  
  const measureAsync = useCallback(async <T>(
    asyncFn: () => Promise<T>,
    operationName?: string
  ): Promise<T> => {
    const startTime = performance.now()
    
    try {
      const result = await asyncFn()
      const duration = performance.now() - startTime
      
      if (duration > (options?.thresholds?.maxRenderTime || DEFAULT_THRESHOLDS.maxRenderTime)) {
        console.warn(`[Performance] Async operation ${operationName || 'unknown'} took ${duration}ms`)
      }
      
      return result
    } catch (error) {
      performanceMonitor.trackError(error instanceof Error ? error : new Error(String(error)), operationName)
      throw error
    }
  }, [performanceMonitor, options])

  return {
    measureAsync,
    ...performanceMonitor
  }
}