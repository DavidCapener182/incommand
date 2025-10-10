/**
 * Performance Monitoring System
 * Tracks page load times, API calls, and user interactions
 */

export interface PerformanceMetric {
  id: string
  timestamp: Date
  type: 'pageLoad' | 'apiCall' | 'userInteraction' | 'render' | 'custom'
  name: string
  duration: number
  metadata?: Record<string, any>
  userId?: string
  sessionId?: string
}

export interface PerformanceReport {
  avgPageLoadTime: number
  avgApiCallTime: number
  avgRenderTime: number
  slowestOperations: Array<{ name: string; duration: number; type: string }>
  apiCallStats: Record<string, { count: number; avgDuration: number; errorRate: number }>
  pageLoadStats: Record<string, { count: number; avgDuration: number }>
  totalMetrics: number
  timeRange: { start: Date; end: Date }
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = []
  private maxMetrics = 500
  private observers: PerformanceObserver[] = []

  constructor() {
    this.setupPerformanceObservers()
  }

  /**
   * Set up performance observers for automatic tracking
   */
  private setupPerformanceObservers() {
    if (typeof window === 'undefined' || !window.PerformanceObserver) return

    try {
      // Observe navigation timing (page loads)
      const navObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'navigation') {
            const navEntry = entry as PerformanceNavigationTiming
            this.recordMetric({
              type: 'pageLoad',
              name: window.location.pathname,
              duration: navEntry.loadEventEnd - navEntry.fetchStart,
              metadata: {
                domContentLoaded: navEntry.domContentLoadedEventEnd - navEntry.fetchStart,
                domInteractive: navEntry.domInteractive - navEntry.fetchStart,
                transferSize: navEntry.transferSize
              }
            })
          }
        }
      })
      navObserver.observe({ entryTypes: ['navigation'] })
      this.observers.push(navObserver)

      // Observe resource timing (API calls, assets)
      const resourceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const resource = entry as PerformanceResourceTiming
          
          // Track API calls
          if (resource.name.includes('/api/')) {
            this.recordMetric({
              type: 'apiCall',
              name: this.extractApiEndpoint(resource.name),
              duration: resource.duration,
              metadata: {
                method: this.guessMethod(resource.name),
                transferSize: resource.transferSize,
                responseStatus: (resource as any).responseStatus
              }
            })
          }
        }
      })
      resourceObserver.observe({ entryTypes: ['resource'] })
      this.observers.push(resourceObserver)

      // Observe long tasks
      if ('PerformanceLongTaskTiming' in window) {
        const longTaskObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            this.recordMetric({
              type: 'render',
              name: 'Long Task',
              duration: entry.duration,
              metadata: { startTime: entry.startTime }
            })
          }
        })
        longTaskObserver.observe({ entryTypes: ['longtask'] })
        this.observers.push(longTaskObserver)
      }

      // Observe first input delay
      const fidObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.recordMetric({
            type: 'userInteraction',
            name: 'First Input Delay',
            duration: entry.processingStart - entry.startTime,
            metadata: { name: entry.name }
          })
        }
      })
      fidObserver.observe({ entryTypes: ['first-input'] })
      this.observers.push(fidObserver)

    } catch (error) {
      console.warn('Performance observer setup failed:', error)
    }
  }

  /**
   * Extract API endpoint from full URL
   */
  private extractApiEndpoint(url: string): string {
    try {
      const urlObj = new URL(url)
      return urlObj.pathname
    } catch {
      return url
    }
  }

  /**
   * Guess HTTP method from URL patterns
   */
  private guessMethod(url: string): string {
    if (url.includes('?') || url.includes('get')) return 'GET'
    if (url.includes('create') || url.includes('add')) return 'POST'
    if (url.includes('update') || url.includes('edit')) return 'PUT'
    if (url.includes('delete') || url.includes('remove')) return 'DELETE'
    return 'GET'
  }

  /**
   * Record a performance metric
   */
  recordMetric(metric: Partial<PerformanceMetric>) {
    const fullMetric: PerformanceMetric = {
      id: `perf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      type: metric.type || 'custom',
      name: metric.name || 'Unknown',
      duration: metric.duration || 0,
      metadata: metric.metadata,
      userId: this.getUserId(),
      sessionId: this.getSessionId()
    }

    this.metrics.unshift(fullMetric)

    // Trim to max size
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(0, this.maxMetrics)
    }

    // Persist to localStorage
    this.persistMetric(fullMetric)
  }

  /**
   * Persist metric to localStorage
   */
  private persistMetric(metric: PerformanceMetric) {
    if (typeof window === 'undefined') return

    try {
      const key = 'incommand_perf_metrics'
      const existing = localStorage.getItem(key)
      const metrics = existing ? JSON.parse(existing) : []
      
      metrics.unshift({
        ...metric,
        timestamp: metric.timestamp.toISOString()
      })

      const trimmed = metrics.slice(0, 200)
      localStorage.setItem(key, JSON.stringify(trimmed))
    } catch {
      // Silently fail
    }
  }

  /**
   * Get user ID
   */
  private getUserId(): string | undefined {
    if (typeof window === 'undefined') return undefined
    try {
      return localStorage.getItem('user_id') || undefined
    } catch {
      return undefined
    }
  }

  /**
   * Get session ID
   */
  private getSessionId(): string {
    if (typeof window === 'undefined') return 'server'
    
    try {
      let sessionId = sessionStorage.getItem('session_id')
      if (!sessionId) {
        sessionId = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        sessionStorage.setItem('session_id', sessionId)
      }
      return sessionId
    } catch {
      return 'unknown'
    }
  }

  /**
   * Get performance report
   */
  getReport(): PerformanceReport {
    const pageLoads = this.metrics.filter(m => m.type === 'pageLoad')
    const apiCalls = this.metrics.filter(m => m.type === 'apiCall')
    const renders = this.metrics.filter(m => m.type === 'render')

    // Calculate averages
    const avgPageLoadTime = pageLoads.length > 0
      ? pageLoads.reduce((sum, m) => sum + m.duration, 0) / pageLoads.length
      : 0

    const avgApiCallTime = apiCalls.length > 0
      ? apiCalls.reduce((sum, m) => sum + m.duration, 0) / apiCalls.length
      : 0

    const avgRenderTime = renders.length > 0
      ? renders.reduce((sum, m) => sum + m.duration, 0) / renders.length
      : 0

    // Get slowest operations
    const slowestOperations = [...this.metrics]
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 10)
      .map(m => ({ name: m.name, duration: m.duration, type: m.type }))

    // API call stats
    const apiCallStats: Record<string, { count: number; avgDuration: number; errorRate: number }> = {}
    apiCalls.forEach(call => {
      if (!apiCallStats[call.name]) {
        apiCallStats[call.name] = { count: 0, avgDuration: 0, errorRate: 0 }
      }
      apiCallStats[call.name].count++
      apiCallStats[call.name].avgDuration += call.duration
      if (call.metadata?.responseStatus && call.metadata.responseStatus >= 400) {
        apiCallStats[call.name].errorRate++
      }
    })

    Object.keys(apiCallStats).forEach(key => {
      apiCallStats[key].avgDuration /= apiCallStats[key].count
      apiCallStats[key].errorRate = (apiCallStats[key].errorRate / apiCallStats[key].count) * 100
    })

    // Page load stats
    const pageLoadStats: Record<string, { count: number; avgDuration: number }> = {}
    pageLoads.forEach(load => {
      if (!pageLoadStats[load.name]) {
        pageLoadStats[load.name] = { count: 0, avgDuration: 0 }
      }
      pageLoadStats[load.name].count++
      pageLoadStats[load.name].avgDuration += load.duration
    })

    Object.keys(pageLoadStats).forEach(key => {
      pageLoadStats[key].avgDuration /= pageLoadStats[key].count
    })

    const timestamps = this.metrics.map(m => new Date(m.timestamp).getTime())

    return {
      avgPageLoadTime,
      avgApiCallTime,
      avgRenderTime,
      slowestOperations,
      apiCallStats,
      pageLoadStats,
      totalMetrics: this.metrics.length,
      timeRange: {
        start: timestamps.length > 0 ? new Date(Math.min(...timestamps)) : new Date(),
        end: timestamps.length > 0 ? new Date(Math.max(...timestamps)) : new Date()
      }
    }
  }

  /**
   * Track a custom operation
   */
  trackOperation<T>(name: string, operation: () => T | Promise<T>, type: PerformanceMetric['type'] = 'custom'): T | Promise<T> {
    const start = performance.now()
    
    try {
      const result = operation()
      
      if (result instanceof Promise) {
        return result.finally(() => {
          const duration = performance.now() - start
          this.recordMetric({ type, name, duration })
        }) as any
      } else {
        const duration = performance.now() - start
        this.recordMetric({ type, name, duration })
        return result
      }
    } catch (error) {
      const duration = performance.now() - start
      this.recordMetric({ 
        type, 
        name, 
        duration,
        metadata: { error: error instanceof Error ? error.message : 'Unknown error' }
      })
      throw error
    }
  }

  /**
   * Clear all metrics
   */
  clearMetrics() {
    this.metrics = []
    if (typeof window !== 'undefined') {
      localStorage.removeItem('incommand_perf_metrics')
    }
  }

  /**
   * Export metrics for analysis
   */
  exportMetrics(): string {
    return JSON.stringify(this.metrics, null, 2)
  }

  /**
   * Cleanup observers
   */
  cleanup() {
    this.observers.forEach(observer => observer.disconnect())
    this.observers = []
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor()

/**
 * Convenience function for tracking operations
 */
export const trackPerformance = <T>(
  name: string,
  operation: () => T | Promise<T>,
  type?: PerformanceMetric['type']
) => {
  return performanceMonitor.trackOperation(name, operation, type)
}

