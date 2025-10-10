/**
 * Usage Analytics System
 * Tracks user behavior, feature adoption, and engagement metrics
 */

import { createClient } from '@/lib/supabase'

export interface UsageEvent {
  id: string
  timestamp: Date
  userId?: string
  sessionId: string
  eventType: 'pageView' | 'click' | 'formSubmit' | 'featureUse' | 'custom'
  eventName: string
  properties?: Record<string, any>
  page?: string
  referrer?: string
  deviceType?: 'desktop' | 'tablet' | 'mobile'
  browser?: string
  os?: string
}

export interface UsageMetrics {
  totalEvents: number
  uniqueUsers: number
  activeSessions: number
  topPages: Array<{ page: string; views: number }>
  topFeatures: Array<{ feature: string; uses: number }>
  eventsByType: Record<string, number>
  deviceBreakdown: Record<string, number>
  browserBreakdown: Record<string, number>
  userEngagement: {
    avgSessionDuration: number
    avgEventsPerSession: number
    bounceRate: number
  }
}

class UsageAnalytics {
  private events: UsageEvent[] = []
  private maxEvents = 1000
  private sessionStart: number = Date.now()
  private eventBuffer: UsageEvent[] = []
  private flushInterval: NodeJS.Timeout | null = null

  constructor() {
    this.initializeTracking()
  }

  /**
   * Initialize tracking and auto-flush
   */
  private initializeTracking() {
    if (typeof window === 'undefined') return

    // Track page views automatically
    this.trackPageView()

    // Track navigation
    if ('addEventListener' in window) {
      window.addEventListener('popstate', () => this.trackPageView())
    }

    // Auto-flush events every 30 seconds
    this.flushInterval = setInterval(() => {
      this.flushEvents()
    }, 30000)

    // Flush on page unload
    window.addEventListener('beforeunload', () => {
      this.flushEvents()
    })

    // Track visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.flushEvents()
      }
    })
  }

  /**
   * Track a usage event
   */
  trackEvent(event: Partial<UsageEvent>) {
    const fullEvent: UsageEvent = {
      id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      userId: this.getUserId(),
      sessionId: this.getSessionId(),
      eventType: event.eventType || 'custom',
      eventName: event.eventName || 'Unknown Event',
      properties: event.properties,
      page: typeof window !== 'undefined' ? window.location.pathname : undefined,
      referrer: typeof document !== 'undefined' ? document.referrer : undefined,
      deviceType: this.getDeviceType(),
      browser: this.getBrowser(),
      os: this.getOS()
    }

    this.events.unshift(fullEvent)
    this.eventBuffer.push(fullEvent)

    // Trim to max size
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(0, this.maxEvents)
    }

    // Persist to localStorage
    this.persistEvent(fullEvent)

    return fullEvent
  }

  /**
   * Track page view
   */
  trackPageView(pagePath?: string) {
    const page = pagePath || (typeof window !== 'undefined' ? window.location.pathname : '/')
    
    return this.trackEvent({
      eventType: 'pageView',
      eventName: 'Page View',
      properties: {
        path: page,
        title: typeof document !== 'undefined' ? document.title : undefined,
        queryParams: typeof window !== 'undefined' ? window.location.search : undefined
      }
    })
  }

  /**
   * Track button/link click
   */
  trackClick(elementName: string, properties?: Record<string, any>) {
    return this.trackEvent({
      eventType: 'click',
      eventName: `Click: ${elementName}`,
      properties
    })
  }

  /**
   * Track form submission
   */
  trackFormSubmit(formName: string, properties?: Record<string, any>) {
    return this.trackEvent({
      eventType: 'formSubmit',
      eventName: `Form Submit: ${formName}`,
      properties
    })
  }

  /**
   * Track feature usage
   */
  trackFeatureUse(featureName: string, properties?: Record<string, any>) {
    return this.trackEvent({
      eventType: 'featureUse',
      eventName: `Feature: ${featureName}`,
      properties
    })
  }

  /**
   * Persist event to localStorage
   */
  private persistEvent(event: UsageEvent) {
    if (typeof window === 'undefined') return

    try {
      const key = 'incommand_usage_events'
      const existing = localStorage.getItem(key)
      const events = existing ? JSON.parse(existing) : []
      
      events.unshift({
        ...event,
        timestamp: event.timestamp.toISOString()
      })

      const trimmed = events.slice(0, 200)
      localStorage.setItem(key, JSON.stringify(trimmed))
    } catch {
      // Silently fail
    }
  }

  /**
   * Flush events to database
   */
  private async flushEvents() {
    if (this.eventBuffer.length === 0) return

    const eventsToFlush = [...this.eventBuffer]
    this.eventBuffer = []

    try {
      const supabase = createClient()
      
      // Store in usage_events table (needs to be created in migration)
      const { error } = await supabase
        .from('usage_events')
        .insert(eventsToFlush.map(e => ({
          event_id: e.id,
          timestamp: e.timestamp.toISOString(),
          user_id: e.userId,
          session_id: e.sessionId,
          event_type: e.eventType,
          event_name: e.eventName,
          properties: e.properties,
          page: e.page,
          referrer: e.referrer,
          device_type: e.deviceType,
          browser: e.browser,
          os: e.os
        })))

      if (error) {
        console.warn('Failed to flush usage events:', error)
        // Put them back in buffer to retry
        this.eventBuffer.unshift(...eventsToFlush)
      }
    } catch (error) {
      console.warn('Error flushing events:', error)
      this.eventBuffer.unshift(...eventsToFlush)
    }
  }

  /**
   * Get usage metrics
   */
  getMetrics(): UsageMetrics {
    const now = Date.now()
    const oneHourAgo = now - 3600000

    // Filter for recent events (last hour)
    const recentEvents = this.events.filter(
      e => new Date(e.timestamp).getTime() > oneHourAgo
    )

    // Unique users
    const uniqueUsers = new Set(this.events.map(e => e.userId).filter(Boolean)).size

    // Active sessions
    const activeSessions = new Set(
      recentEvents.map(e => e.sessionId)
    ).size

    // Top pages
    const pageViews: Record<string, number> = {}
    this.events.filter(e => e.eventType === 'pageView').forEach(e => {
      if (e.page) {
        pageViews[e.page] = (pageViews[e.page] || 0) + 1
      }
    })
    const topPages = Object.entries(pageViews)
      .map(([page, views]) => ({ page, views }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 10)

    // Top features
    const featureUses: Record<string, number> = {}
    this.events.filter(e => e.eventType === 'featureUse').forEach(e => {
      featureUses[e.eventName] = (featureUses[e.eventName] || 0) + 1
    })
    const topFeatures = Object.entries(featureUses)
      .map(([feature, uses]) => ({ feature, uses }))
      .sort((a, b) => b.uses - a.uses)
      .slice(0, 10)

    // Events by type
    const eventsByType: Record<string, number> = {}
    this.events.forEach(e => {
      eventsByType[e.eventType] = (eventsByType[e.eventType] || 0) + 1
    })

    // Device breakdown
    const deviceBreakdown: Record<string, number> = {}
    this.events.forEach(e => {
      if (e.deviceType) {
        deviceBreakdown[e.deviceType] = (deviceBreakdown[e.deviceType] || 0) + 1
      }
    })

    // Browser breakdown
    const browserBreakdown: Record<string, number> = {}
    this.events.forEach(e => {
      if (e.browser) {
        browserBreakdown[e.browser] = (browserBreakdown[e.browser] || 0) + 1
      }
    })

    // User engagement
    const sessionDuration = (now - this.sessionStart) / 1000 / 60 // minutes
    const eventsPerSession = this.events.length / Math.max(activeSessions, 1)
    const bounceRate = pageViews['/'] && Object.keys(pageViews).length === 1 ? 100 : 0

    return {
      totalEvents: this.events.length,
      uniqueUsers,
      activeSessions,
      topPages,
      topFeatures,
      eventsByType,
      deviceBreakdown,
      browserBreakdown,
      userEngagement: {
        avgSessionDuration: sessionDuration,
        avgEventsPerSession: eventsPerSession,
        bounceRate
      }
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
   * Detect device type
   */
  private getDeviceType(): 'desktop' | 'tablet' | 'mobile' {
    if (typeof window === 'undefined') return 'desktop'
    
    const width = window.innerWidth
    if (width < 768) return 'mobile'
    if (width < 1024) return 'tablet'
    return 'desktop'
  }

  /**
   * Detect browser
   */
  private getBrowser(): string {
    if (typeof window === 'undefined') return 'Unknown'
    
    const ua = navigator.userAgent
    if (ua.includes('Firefox')) return 'Firefox'
    if (ua.includes('Chrome') && !ua.includes('Edg')) return 'Chrome'
    if (ua.includes('Safari') && !ua.includes('Chrome')) return 'Safari'
    if (ua.includes('Edg')) return 'Edge'
    if (ua.includes('Opera') || ua.includes('OPR')) return 'Opera'
    return 'Other'
  }

  /**
   * Detect OS
   */
  private getOS(): string {
    if (typeof window === 'undefined') return 'Unknown'
    
    const ua = navigator.userAgent
    if (ua.includes('Win')) return 'Windows'
    if (ua.includes('Mac')) return 'macOS'
    if (ua.includes('Linux')) return 'Linux'
    if (ua.includes('Android')) return 'Android'
    if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad')) return 'iOS'
    return 'Other'
  }

  /**
   * Export events
   */
  exportEvents(): string {
    return JSON.stringify(this.events, null, 2)
  }

  /**
   * Clear events
   */
  clearEvents() {
    this.events = []
    this.eventBuffer = []
    if (typeof window !== 'undefined') {
      localStorage.removeItem('incommand_usage_events')
    }
  }

  /**
   * Cleanup
   */
  cleanup() {
    if (this.flushInterval) {
      clearInterval(this.flushInterval)
      this.flushInterval = null
    }
    this.flushEvents()
  }
}

// Singleton instance
export const usageAnalytics = new UsageAnalytics()

/**
 * Convenience functions
 */
export const trackPageView = (path?: string) => usageAnalytics.trackPageView(path)
export const trackClick = (element: string, props?: Record<string, any>) => 
  usageAnalytics.trackClick(element, props)
export const trackFormSubmit = (form: string, props?: Record<string, any>) => 
  usageAnalytics.trackFormSubmit(form, props)
export const trackFeatureUse = (feature: string, props?: Record<string, any>) => 
  usageAnalytics.trackFeatureUse(feature, props)

