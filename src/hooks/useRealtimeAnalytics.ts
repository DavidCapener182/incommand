/**
 * Real-time Analytics Hook
 * Provides live data streaming for analytics dashboards
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { logger } from '@/lib/logger'
import type { RealtimeChannel } from '@supabase/supabase-js'

export interface RealtimeAnalyticsData {
  // Incident metrics
  totalIncidents: number
  openIncidents: number
  closedIncidents: number
  highPriorityIncidents: number
  
  // Quality metrics
  averageQualityScore: number
  completenessRate: number
  factualLanguageRate: number
  
  // Compliance metrics
  complianceScore: number
  contemporaneousRate: number
  amendmentRate: number
  
  // Performance metrics
  averageResponseTime: number
  averageResolutionTime: number
  staffUtilization: number
  
  // Real-time updates
  lastUpdated: string
  updateCount: number
}

export interface RealtimeAlert {
  id: string
  type: 'threshold' | 'anomaly' | 'trend' | 'quality'
  severity: 'low' | 'medium' | 'high' | 'critical'
  title: string
  message: string
  timestamp: string
  value?: number
  threshold?: number
  dismissed?: boolean
}

export interface RealtimeSubscriptionOptions {
  eventId?: string
  updateInterval?: number // milliseconds
  enableAlerts?: boolean
  alertThresholds?: {
    incidentVolume?: number
    responseTime?: number
    qualityScore?: number
    complianceRate?: number
  }
}

const DEFAULT_THRESHOLDS = {
  incidentVolume: 10, // incidents per hour
  responseTime: 15, // minutes
  qualityScore: 70, // percentage
  complianceRate: 90 // percentage
}

export function useRealtimeAnalytics(options: RealtimeSubscriptionOptions = {}) {
  const [data, setData] = useState<RealtimeAnalyticsData>({
    totalIncidents: 0,
    openIncidents: 0,
    closedIncidents: 0,
    highPriorityIncidents: 0,
    averageQualityScore: 0,
    completenessRate: 0,
    factualLanguageRate: 0,
    complianceScore: 0,
    contemporaneousRate: 0,
    amendmentRate: 0,
    averageResponseTime: 0,
    averageResolutionTime: 0,
    staffUtilization: 0,
    lastUpdated: new Date().toISOString(),
    updateCount: 0
  })

  const [alerts, setAlerts] = useState<RealtimeAlert[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const channelRef = useRef<RealtimeChannel | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const previousDataRef = useRef<RealtimeAnalyticsData | null>(null)

  const {
    eventId,
    updateInterval = 30000, // 30 seconds
    enableAlerts = true,
    alertThresholds = DEFAULT_THRESHOLDS
  } = options

  // Fetch initial analytics data
  const fetchAnalyticsData = useCallback(async (): Promise<RealtimeAnalyticsData> => {
    try {
      if (!eventId) {
        throw new Error('Event ID is required for analytics')
      }

      // Fetch incidents data
      const { data: incidents, error: incidentsError } = await (supabase as any)
        .from('incident_logs')
        .select('*')
        .eq('event_id', eventId)
        .order('timestamp', { ascending: false })

      if (incidentsError) throw incidentsError

      // Calculate metrics
      const incidentsArray = (incidents || []) as any[];
      const totalIncidents = incidentsArray.length
      const openIncidents = incidentsArray.filter((i: any) => !i.is_closed).length
      const closedIncidents = incidentsArray.filter((i: any) => i.is_closed).length
      const highPriorityIncidents = incidentsArray.filter((i: any) => 
        i.priority === 'high' || i.priority === 'critical'
      ).length

      // Calculate quality metrics
      const qualityScores = incidentsArray.map((i: any) => {
        let score = 50 // Base score
        
        // Contemporaneous entries get higher scores
        if (i.entry_type === 'contemporaneous') score += 20
        
        // Non-amended entries get higher scores
        if (!i.is_amended) score += 15
        
        // Structured logging template usage
        if (i.headline && i.source && i.facts_observed) score += 15
        
        return Math.min(100, score)
      }) || []

      const averageQualityScore = qualityScores.length > 0 
        ? qualityScores.reduce((sum, score) => sum + score, 0) / qualityScores.length 
        : 0

      const completenessRate = incidentsArray.filter((i: any) => 
        i.occurrence && i.action_taken && i.incident_type
      ).length / Math.max(1, totalIncidents) * 100 || 0

      const factualLanguageRate = incidentsArray.filter((i: any) => 
        !i.occurrence?.toLowerCase().includes('very') &&
        !i.occurrence?.toLowerCase().includes('extremely') &&
        !i.occurrence?.toLowerCase().includes('amazing')
      ).length / Math.max(1, totalIncidents) * 100 || 0

      // Calculate compliance metrics
      const contemporaneousRate = incidentsArray.filter((i: any) => 
        i.entry_type === 'contemporaneous'
      ).length / Math.max(1, totalIncidents) * 100 || 0

      const amendmentRate = incidentsArray.filter((i: any) => 
        i.is_amended
      ).length / Math.max(1, totalIncidents) * 100 || 0

      const complianceScore = (contemporaneousRate * 0.4 + (100 - amendmentRate) * 0.3 + factualLanguageRate * 0.3)

      // Calculate performance metrics
      const responseTimes = incidentsArray
        .map((i: any) => {
          if (i.responded_at && i.timestamp) {
            const created = new Date(i.timestamp).getTime()
            const responded = new Date(i.responded_at).getTime()
            return (responded - created) / (1000 * 60) // minutes
          }
          return null
        })
        .filter((time): time is number => typeof time === 'number')

      const averageResponseTime = responseTimes.length > 0 
        ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length 
        : 0

      const resolutionTimes = incidentsArray
        .map((i: any) => {
          if (i.resolved_at && i.timestamp) {
            const created = new Date(i.timestamp).getTime()
            const resolved = new Date(i.resolved_at).getTime()
            return (resolved - created) / (1000 * 60) // minutes
          }
          return null
        })
        .filter((time): time is number => typeof time === 'number')

      const averageResolutionTime = resolutionTimes.length > 0 
        ? resolutionTimes.reduce((sum, time) => sum + time, 0) / resolutionTimes.length 
        : 0

      // Calculate staff utilization (simplified)
      const uniqueStaff = new Set(incidentsArray.map((i: any) => i.logged_by_callsign)).size
      const staffUtilization = Math.min(100, (totalIncidents / Math.max(1, uniqueStaff)) * 10)

      return {
        totalIncidents,
        openIncidents,
        closedIncidents,
        highPriorityIncidents,
        averageQualityScore,
        completenessRate,
        factualLanguageRate,
        complianceScore,
        contemporaneousRate,
        amendmentRate,
        averageResponseTime,
        averageResolutionTime,
        staffUtilization,
        lastUpdated: new Date().toISOString(),
        updateCount: data.updateCount + 1
      }
    } catch (error) {
      logger.error('Error fetching analytics data', error)
      throw error
    }
  }, [eventId, data.updateCount])

  // Generate alerts based on thresholds
  const generateAlerts = useCallback((newData: RealtimeAnalyticsData, previousData: RealtimeAnalyticsData | null) => {
    if (!enableAlerts || !previousData) return []

    const newAlerts: RealtimeAlert[] = []

    // Incident volume alert
    if (newData.totalIncidents > previousData.totalIncidents + alertThresholds.incidentVolume!) {
      newAlerts.push({
        id: `incident_volume_${Date.now()}`,
        type: 'threshold',
        severity: 'medium',
        title: 'High Incident Volume',
        message: `Incident volume increased by ${newData.totalIncidents - previousData.totalIncidents} in the last update`,
        timestamp: new Date().toISOString(),
        value: newData.totalIncidents - previousData.totalIncidents,
        threshold: alertThresholds.incidentVolume
      })
    }

    // Response time alert
    if (newData.averageResponseTime > alertThresholds.responseTime!) {
      newAlerts.push({
        id: `response_time_${Date.now()}`,
        type: 'threshold',
        severity: 'high',
        title: 'Slow Response Times',
        message: `Average response time is ${newData.averageResponseTime.toFixed(1)} minutes (threshold: ${alertThresholds.responseTime}min)`,
        timestamp: new Date().toISOString(),
        value: newData.averageResponseTime,
        threshold: alertThresholds.responseTime
      })
    }

    // Quality score alert - only show if there are actual incidents
    if (newData.totalIncidents > 0 && newData.averageQualityScore < alertThresholds.qualityScore!) {
      newAlerts.push({
        id: `quality_score_${Date.now()}`,
        type: 'quality',
        severity: 'medium',
        title: 'Quality Score Low',
        message: `Average quality score is ${newData.averageQualityScore.toFixed(1)}/100 (threshold: ${alertThresholds.qualityScore})`,
        timestamp: new Date().toISOString(),
        value: newData.averageQualityScore,
        threshold: alertThresholds.qualityScore
      })
    }

    // Compliance rate alert - only show if there are actual incidents
    if (newData.totalIncidents > 0 && newData.complianceScore < alertThresholds.complianceRate!) {
      newAlerts.push({
        id: `compliance_rate_${Date.now()}`,
        type: 'threshold',
        severity: 'high',
        title: 'Compliance Rate Low',
        message: `Compliance score is ${newData.complianceScore.toFixed(1)}% (threshold: ${alertThresholds.complianceRate}%)`,
        timestamp: new Date().toISOString(),
        value: newData.complianceScore,
        threshold: alertThresholds.complianceRate
      })
    }

    return newAlerts
  }, [enableAlerts, alertThresholds])

  // Update analytics data
  const updateData = useCallback(async () => {
    try {
      const newData = await fetchAnalyticsData()
      const newAlerts = generateAlerts(newData, previousDataRef.current)
      
      setData(newData)
      previousDataRef.current = newData
      
      // Clear existing compliance and quality alerts if there are no incidents
      if (newData.totalIncidents === 0) {
        setAlerts(prev => prev.filter(alert => 
          alert.title !== 'Compliance Rate Low' && 
          alert.title !== 'Quality Score Low'
        ))
      }
      
      if (newAlerts.length > 0) {
        setAlerts(prev => [...prev, ...newAlerts])
      }
      
      setIsConnected(true)
      setError(null)
    } catch (error) {
      logger.error('Error updating analytics data', error)
      setError(error instanceof Error ? error.message : 'Unknown error')
      setIsConnected(false)
    }
  }, [fetchAnalyticsData, generateAlerts])

  // Set up real-time subscription
  useEffect(() => {
    if (!eventId) return

    logger.debug('Setting up real-time analytics subscription', { eventId })

    // Set up interval-based updates
    intervalRef.current = setInterval(updateData, updateInterval)

    // Set up Supabase real-time subscription
    channelRef.current = supabase
      .channel(`analytics_${eventId}`)
      .on('postgres_changes', 
        {
          event: '*',
          schema: 'public',
          table: 'incident_logs',
          filter: `event_id=eq.${eventId}`
        },
        (payload) => {
          logger.debug('Real-time incident update received', payload)
          // Trigger data refresh on incident changes
          updateData()
        }
      )
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'incident_log_revisions',
          filter: `incident_log_id=in.(${eventId})`
        },
        (payload) => {
          logger.debug('Real-time revision update received', payload)
          // Trigger data refresh on revision changes
          updateData()
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          logger.debug('Real-time analytics subscription active', { eventId })
          setIsConnected(true)
          // Initial data fetch
          updateData()
        } else if (status === 'CHANNEL_ERROR') {
          logger.error('Real-time analytics subscription error', { eventId })
          setIsConnected(false)
          setError('Connection error')
        }
      })

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      if (channelRef.current) {
        channelRef.current.unsubscribe()
      }
    }
  }, [eventId, updateInterval, updateData])

  // Dismiss alert
  const dismissAlert = useCallback((alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, dismissed: true } : alert
    ))
  }, [])

  // Clear all alerts
  const clearAlerts = useCallback(() => {
    setAlerts([])
  }, [])

  // Clear compliance alerts when there are no incidents
  const clearComplianceAlerts = useCallback(() => {
    setAlerts(prev => prev.filter(alert => alert.title !== 'Compliance Rate Low'))
  }, [])

  // Clear quality alerts when there are no incidents
  const clearQualityAlerts = useCallback(() => {
    setAlerts(prev => prev.filter(alert => alert.title !== 'Quality Score Low'))
  }, [])

  // Manual refresh
  const refresh = useCallback(() => {
    updateData()
  }, [updateData])

  return {
    data,
    alerts: alerts.filter(alert => !alert.dismissed),
    isConnected,
    error,
    dismissAlert,
    clearAlerts,
    clearComplianceAlerts,
    clearQualityAlerts,
    refresh
  }
}
