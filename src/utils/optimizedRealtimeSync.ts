/**
 * Optimized Real-time Sync Manager
 * Efficiently manages Supabase real-time subscriptions with batching and throttling
 */

import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

interface SubscriptionConfig {
  table: string
  event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*'
  filter?: string
  schema?: string
}

interface SubscriptionCallbacks {
  onInsert?: (payload: RealtimePostgresChangesPayload<any>) => void
  onUpdate?: (payload: RealtimePostgresChangesPayload<any>) => void
  onDelete?: (payload: RealtimePostgresChangesPayload<any>) => void
}

interface BatchUpdate {
  type: 'INSERT' | 'UPDATE' | 'DELETE'
  payload: RealtimePostgresChangesPayload<any>
  timestamp: number
}

class OptimizedRealtimeSync {
  private channels: Map<string, RealtimeChannel>
  private batchQueues: Map<string, BatchUpdate[]>
  private batchTimers: Map<string, NodeJS.Timeout>
  private readonly BATCH_DELAY = 100 // ms
  private readonly BATCH_SIZE = 10

  constructor() {
    this.channels = new Map()
    this.batchQueues = new Map()
    this.batchTimers = new Map()
  }

  /**
   * Subscribe to table changes with optimized batching
   */
  subscribe(
    config: SubscriptionConfig,
    callbacks: SubscriptionCallbacks,
    options: {
      enableBatching?: boolean
      batchDelay?: number
      batchSize?: number
    } = {}
  ): string {
    const {
      enableBatching = true,
      batchDelay = this.BATCH_DELAY,
      batchSize = this.BATCH_SIZE
    } = options

    const channelId = this.generateChannelId(config)

    // Don't recreate if already exists
    if (this.channels.has(channelId)) {
      console.warn(`Channel ${channelId} already exists`)
      return channelId
    }

    const channel = supabase
      .channel(channelId)
      .on(
        'postgres_changes',
        {
          event: config.event || '*',
          schema: config.schema || 'public',
          table: config.table,
          filter: config.filter
        },
        (payload) => {
          if (enableBatching) {
            this.addToBatch(channelId, payload, callbacks, batchDelay, batchSize)
          } else {
            this.handlePayload(payload, callbacks)
          }
        }
      )
      .subscribe()

    this.channels.set(channelId, channel)
    this.batchQueues.set(channelId, [])

    return channelId
  }

  /**
   * Unsubscribe from channel
   */
  async unsubscribe(channelId: string): Promise<void> {
    const channel = this.channels.get(channelId)
    
    if (!channel) {
      console.warn(`Channel ${channelId} not found`)
      return
    }

    // Process remaining batch
    this.processBatch(channelId)

    // Clear timer
    const timer = this.batchTimers.get(channelId)
    if (timer) {
      clearTimeout(timer)
      this.batchTimers.delete(channelId)
    }

    // Unsubscribe channel
    await supabase.removeChannel(channel)
    
    // Cleanup
    this.channels.delete(channelId)
    this.batchQueues.delete(channelId)
  }

  /**
   * Unsubscribe all channels
   */
  async unsubscribeAll(): Promise<void> {
    const channelIds = Array.from(this.channels.keys())
    await Promise.all(channelIds.map(id => this.unsubscribe(id)))
  }

  /**
   * Get active subscription count
   */
  getActiveSubscriptions(): number {
    return this.channels.size
  }

  /**
   * Get subscription stats
   */
  getStats() {
    return {
      activeSubscriptions: this.channels.size,
      pendingBatches: Array.from(this.batchQueues.values()).reduce(
        (sum, queue) => sum + queue.length,
        0
      )
    }
  }

  /**
   * Add payload to batch queue
   */
  private addToBatch(
    channelId: string,
    payload: RealtimePostgresChangesPayload<any>,
    callbacks: SubscriptionCallbacks,
    batchDelay: number,
    batchSize: number
  ): void {
    const queue = this.batchQueues.get(channelId) || []
    
    queue.push({
      type: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
      payload,
      timestamp: Date.now()
    })

    this.batchQueues.set(channelId, queue)

    // Process immediately if batch size reached
    if (queue.length >= batchSize) {
      this.processBatch(channelId, callbacks)
      return
    }

    // Schedule batch processing
    const existingTimer = this.batchTimers.get(channelId)
    if (existingTimer) {
      clearTimeout(existingTimer)
    }

    const timer = setTimeout(() => {
      this.processBatch(channelId, callbacks)
    }, batchDelay)

    this.batchTimers.set(channelId, timer)
  }

  /**
   * Process batched updates
   */
  private processBatch(channelId: string, callbacks?: SubscriptionCallbacks): void {
    const queue = this.batchQueues.get(channelId)
    
    if (!queue || queue.length === 0) return

    // Group by event type
    const grouped = {
      INSERT: queue.filter(u => u.type === 'INSERT'),
      UPDATE: queue.filter(u => u.type === 'UPDATE'),
      DELETE: queue.filter(u => u.type === 'DELETE')
    }

    // Process each type
    if (callbacks) {
      grouped.INSERT.forEach(update => {
        callbacks.onInsert?.(update.payload)
      })
      grouped.UPDATE.forEach(update => {
        callbacks.onUpdate?.(update.payload)
      })
      grouped.DELETE.forEach(update => {
        callbacks.onDelete?.(update.payload)
      })
    }

    // Clear queue
    this.batchQueues.set(channelId, [])
    
    // Clear timer
    const timer = this.batchTimers.get(channelId)
    if (timer) {
      clearTimeout(timer)
      this.batchTimers.delete(channelId)
    }
  }

  /**
   * Handle individual payload
   */
  private handlePayload(
    payload: RealtimePostgresChangesPayload<any>,
    callbacks: SubscriptionCallbacks
  ): void {
    switch (payload.eventType) {
      case 'INSERT':
        callbacks.onInsert?.(payload)
        break
      case 'UPDATE':
        callbacks.onUpdate?.(payload)
        break
      case 'DELETE':
        callbacks.onDelete?.(payload)
        break
    }
  }

  /**
   * Generate unique channel ID
   */
  private generateChannelId(config: SubscriptionConfig): string {
    return `${config.schema || 'public'}:${config.table}:${config.event || '*'}:${config.filter || 'all'}`
  }
}

// Create singleton instance
export const realtimeSync = new OptimizedRealtimeSync()

// React hook for optimized real-time sync
export function useOptimizedRealtime() {
  return {
    subscribe: realtimeSync.subscribe.bind(realtimeSync),
    unsubscribe: realtimeSync.unsubscribe.bind(realtimeSync),
    unsubscribeAll: realtimeSync.unsubscribeAll.bind(realtimeSync),
    getStats: realtimeSync.getStats.bind(realtimeSync)
  }
}

// Throttled real-time hook
export function useThrottledRealtime<T>(
  fetchData: () => Promise<T>,
  dependencies: any[] = [],
  throttleMs = 1000
) {
  const lastFetch = useRef<number>(0)
  const timeoutRef = useRef<NodeJS.Timeout>()

  const throttledFetch = useCallback(async () => {
    const now = Date.now()
    const timeSinceLastFetch = now - lastFetch.current

    if (timeSinceLastFetch < throttleMs) {
      // Schedule fetch after throttle period
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      
      timeoutRef.current = setTimeout(() => {
        throttledFetch()
      }, throttleMs - timeSinceLastFetch)
      
      return
    }

    lastFetch.current = now
    await fetchData()
  }, [fetchData, throttleMs])

  return throttledFetch
}

// Cleanup helper
export function cleanupRealtimeSubscriptions() {
  return realtimeSync.unsubscribeAll()
}

// Import useRef and useCallback for the hook
import { useRef, useCallback } from 'react'
