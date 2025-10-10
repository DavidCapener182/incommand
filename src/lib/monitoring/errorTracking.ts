/**
 * Advanced Error Tracking & Logging System
 * Provides centralized error handling, logging, and monitoring
 */

export interface ErrorLog {
  id: string
  timestamp: Date
  level: 'error' | 'warning' | 'info' | 'debug'
  message: string
  stack?: string
  context?: Record<string, any>
  userId?: string
  sessionId?: string
  userAgent?: string
  url?: string
  component?: string
  action?: string
}

export interface ErrorMetrics {
  totalErrors: number
  errorsByLevel: Record<string, number>
  errorsByComponent: Record<string, number>
  errorsByType: Record<string, number>
  recentErrors: ErrorLog[]
  errorRate: number // errors per minute
  topErrors: Array<{ message: string; count: number }>
}

class ErrorTracker {
  private errorLogs: ErrorLog[] = []
  private maxLogs = 1000
  private errorListeners: Array<(error: ErrorLog) => void> = []

  constructor() {
    this.setupGlobalErrorHandlers()
  }

  /**
   * Set up global error handlers for unhandled errors
   */
  private setupGlobalErrorHandlers() {
    if (typeof window !== 'undefined') {
      // Handle unhandled promise rejections
      window.addEventListener('unhandledrejection', (event) => {
        this.logError({
          message: event.reason?.message || 'Unhandled Promise Rejection',
          stack: event.reason?.stack,
          level: 'error',
          context: { type: 'unhandledRejection', reason: event.reason }
        })
      })

      // Handle global errors
      window.addEventListener('error', (event) => {
        this.logError({
          message: event.message || 'Global Error',
          stack: event.error?.stack,
          level: 'error',
          context: {
            type: 'globalError',
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno
          }
        })
      })

      // Handle React error boundaries
      const originalConsoleError = console.error
      console.error = (...args) => {
        const message = args.join(' ')
        if (message.includes('Error:') || message.includes('Warning:')) {
          this.logError({
            message,
            level: message.includes('Warning:') ? 'warning' : 'error',
            context: { source: 'console.error', args }
          })
        }
        originalConsoleError.apply(console, args)
      }
    }
  }

  /**
   * Log an error with full context
   */
  logError(error: Partial<ErrorLog>) {
    const errorLog: ErrorLog = {
      id: `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      level: error.level || 'error',
      message: error.message || 'Unknown error',
      stack: error.stack,
      context: error.context,
      userId: this.getUserId(),
      sessionId: this.getSessionId(),
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      component: error.component,
      action: error.action
    }

    // Add to logs
    this.errorLogs.unshift(errorLog)

    // Trim to max size
    if (this.errorLogs.length > this.maxLogs) {
      this.errorLogs = this.errorLogs.slice(0, this.maxLogs)
    }

    // Persist to localStorage
    this.persistError(errorLog)

    // Notify listeners
    this.errorListeners.forEach(listener => listener(errorLog))

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.group(`🔴 ${errorLog.level.toUpperCase()}: ${errorLog.message}`)
      if (errorLog.stack) console.log('Stack:', errorLog.stack)
      if (errorLog.context) console.log('Context:', errorLog.context)
      if (errorLog.component) console.log('Component:', errorLog.component)
      console.groupEnd()
    }

    return errorLog
  }

  /**
   * Persist error to localStorage for offline tracking
   */
  private persistError(error: ErrorLog) {
    if (typeof window === 'undefined') return

    try {
      const key = 'incommand_error_logs'
      const existing = localStorage.getItem(key)
      const logs = existing ? JSON.parse(existing) : []
      
      logs.unshift({
        ...error,
        timestamp: error.timestamp.toISOString()
      })

      // Keep only last 100 errors in localStorage
      const trimmed = logs.slice(0, 100)
      localStorage.setItem(key, JSON.stringify(trimmed))
    } catch (err) {
      // Silently fail if localStorage is full or unavailable
    }
  }

  /**
   * Get user ID from session/localStorage
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
   * Get or create session ID
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
   * Get error metrics and analytics
   */
  getMetrics(): ErrorMetrics {
    const now = Date.now()
    const oneMinuteAgo = now - 60000
    const recentErrors = this.errorLogs.filter(
      err => new Date(err.timestamp).getTime() > oneMinuteAgo
    )

    const errorsByLevel: Record<string, number> = {}
    const errorsByComponent: Record<string, number> = {}
    const errorsByType: Record<string, number> = {}
    const errorCounts: Record<string, number> = {}

    this.errorLogs.forEach(err => {
      // By level
      errorsByLevel[err.level] = (errorsByLevel[err.level] || 0) + 1

      // By component
      if (err.component) {
        errorsByComponent[err.component] = (errorsByComponent[err.component] || 0) + 1
      }

      // By type (extracted from message)
      const type = err.message.split(':')[0] || 'Unknown'
      errorsByType[type] = (errorsByType[type] || 0) + 1

      // Count identical messages
      errorCounts[err.message] = (errorCounts[err.message] || 0) + 1
    })

    const topErrors = Object.entries(errorCounts)
      .map(([message, count]) => ({ message, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    return {
      totalErrors: this.errorLogs.length,
      errorsByLevel,
      errorsByComponent,
      errorsByType,
      recentErrors: this.errorLogs.slice(0, 20),
      errorRate: recentErrors.length,
      topErrors
    }
  }

  /**
   * Subscribe to error events
   */
  onError(callback: (error: ErrorLog) => void) {
    this.errorListeners.push(callback)
    return () => {
      this.errorListeners = this.errorListeners.filter(l => l !== callback)
    }
  }

  /**
   * Clear all error logs
   */
  clearLogs() {
    this.errorLogs = []
    if (typeof window !== 'undefined') {
      localStorage.removeItem('incommand_error_logs')
    }
  }

  /**
   * Export error logs for analysis
   */
  exportLogs(): string {
    return JSON.stringify(this.errorLogs, null, 2)
  }

  /**
   * Get errors filtered by criteria
   */
  getErrors(filter?: {
    level?: ErrorLog['level']
    component?: string
    since?: Date
  }): ErrorLog[] {
    let filtered = [...this.errorLogs]

    if (filter?.level) {
      filtered = filtered.filter(err => err.level === filter.level)
    }

    if (filter?.component) {
      filtered = filtered.filter(err => err.component === filter.component)
    }

    if (filter?.since) {
      filtered = filtered.filter(
        err => new Date(err.timestamp) >= filter.since!
      )
    }

    return filtered
  }
}

// Singleton instance
export const errorTracker = new ErrorTracker()

/**
 * Convenience functions for logging
 */
export const logError = (message: string, context?: Record<string, any>) => {
  return errorTracker.logError({ message, level: 'error', context })
}

export const logWarning = (message: string, context?: Record<string, any>) => {
  return errorTracker.logError({ message, level: 'warning', context })
}

export const logInfo = (message: string, context?: Record<string, any>) => {
  return errorTracker.logError({ message, level: 'info', context })
}

export const logDebug = (message: string, context?: Record<string, any>) => {
  if (process.env.NODE_ENV === 'development') {
    return errorTracker.logError({ message, level: 'debug', context })
  }
}

/**
 * React Error Boundary helper
 */
export const logComponentError = (
  error: Error,
  errorInfo: { componentStack: string },
  component: string
) => {
  return errorTracker.logError({
    message: error.message,
    stack: error.stack,
    level: 'error',
    component,
    context: {
      componentStack: errorInfo.componentStack
    }
  })
}

