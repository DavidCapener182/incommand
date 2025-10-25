/**
 * Enhanced Offline Sync Manager
 * Manages offline data synchronization with conflict resolution
 */

import { supabase } from '../lib/supabase'

interface QueuedOperation {
  id: string
  type: 'INSERT' | 'UPDATE' | 'DELETE'
  table: string
  data: any
  timestamp: number
  retryCount: number
  priority: 'high' | 'medium' | 'low'
}

interface SyncStats {
  queueSize: number
  failedOperations: number
  successfulOperations: number
  lastSyncTime: number | null
  isOnline: boolean
}

class EnhancedOfflineSync {
  private queue: QueuedOperation[]
  private failedOperations: QueuedOperation[]
  private stats: SyncStats
  private readonly MAX_RETRIES = 3
  private readonly SYNC_INTERVAL = 5000 // 5 seconds
  private syncTimer: NodeJS.Timeout | null = null
  private isSyncing = false

  constructor() {
    this.queue = []
    this.failedOperations = []
    const isBrowser = typeof window !== 'undefined'

    this.stats = {
      queueSize: 0,
      failedOperations: 0,
      successfulOperations: 0,
      lastSyncTime: null,
      isOnline: isBrowser && typeof navigator !== 'undefined' ? navigator.onLine : true
    }

    if (isBrowser) {
      this.loadQueue()
      this.setupOnlineListener()
      this.startAutoSync()
    }
  }

  /**
   * Queue an operation for offline sync
   */
  queueOperation(
    type: QueuedOperation['type'],
    table: string,
    data: any,
    priority: QueuedOperation['priority'] = 'medium'
  ): string {
    const operation: QueuedOperation = {
      id: this.generateId(),
      type,
      table,
      data,
      timestamp: Date.now(),
      retryCount: 0,
      priority
    }

    this.queue.push(operation)
    this.sortQueueByPriority()
    this.saveQueue()
    this.updateStats()

    // Try to sync immediately if online
    if (this.stats.isOnline) {
      this.syncQueue()
    }

    return operation.id
  }

  /**
   * Sync queued operations
   */
  async syncQueue(): Promise<void> {
    if (!this.stats.isOnline || this.isSyncing || this.queue.length === 0) {
      return
    }

    this.isSyncing = true

    const operations = [...this.queue]
    const results: { success: string[]; failed: string[] } = {
      success: [],
      failed: []
    }

    for (const operation of operations) {
      try {
        await this.executeOperation(operation)
        results.success.push(operation.id)
        this.stats.successfulOperations++
      } catch (error) {
        console.error(`Failed to sync operation ${operation.id}:`, error)
        
        operation.retryCount++
        
        if (operation.retryCount >= this.MAX_RETRIES) {
          // Move to failed operations
          this.failedOperations.push(operation)
          this.stats.failedOperations++
          results.failed.push(operation.id)
        } else {
          // Keep in queue for retry
          continue
        }
      }
    }

    // Remove successful operations from queue
    this.queue = this.queue.filter(op => !results.success.includes(op.id))
    
    // Remove failed operations that exceeded retries
    this.queue = this.queue.filter(op => !results.failed.includes(op.id))

    this.stats.lastSyncTime = Date.now()
    this.isSyncing = false

    this.saveQueue()
    this.updateStats()

    // Dispatch sync complete event
    this.dispatchSyncEvent(results)
  }

  /**
   * Execute a queued operation
   */
  private async executeOperation(operation: QueuedOperation): Promise<void> {
    switch (operation.type) {
      case 'INSERT':
        const { error: insertError } = await supabase
          .from(operation.table as any)
          .insert(operation.data)
        if (insertError) throw insertError
        break

      case 'UPDATE':
        const { error: updateError } = await supabase
          .from(operation.table as any)
          .update(operation.data)
          .eq('id', operation.data.id)
        if (updateError) throw updateError
        break

      case 'DELETE':
        const { error: deleteError } = await supabase
          .from(operation.table as any)
          .delete()
          .eq('id', operation.data.id)
        if (deleteError) throw deleteError
        break
    }
  }

  /**
   * Get sync statistics
   */
  getStats(): SyncStats {
    return { ...this.stats }
  }

  /**
   * Get failed operations
   */
  getFailedOperations(): QueuedOperation[] {
    return [...this.failedOperations]
  }

  /**
   * Retry failed operations
   */
  retryFailedOperations(): void {
    this.failedOperations.forEach(op => {
      op.retryCount = 0
      this.queue.push(op)
    })
    
    this.failedOperations = []
    this.sortQueueByPriority()
    this.saveQueue()
    this.updateStats()

    if (this.stats.isOnline) {
      this.syncQueue()
    }
  }

  /**
   * Clear failed operations
   */
  clearFailedOperations(): void {
    this.failedOperations = []
    this.stats.failedOperations = 0
    this.updateStats()
  }

  /**
   * Sort queue by priority
   */
  private sortQueueByPriority(): void {
    const priorityOrder = { high: 0, medium: 1, low: 2 }
    this.queue.sort((a, b) => {
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority]
      if (priorityDiff !== 0) return priorityDiff
      return a.timestamp - b.timestamp // Older first within same priority
    })
  }

  /**
   * Setup online/offline listener
   */
  private setupOnlineListener(): void {
    if (typeof window === 'undefined') return

    window.addEventListener('online', () => {
      this.stats.isOnline = true
      this.updateStats()
      this.syncQueue()
    })

    window.addEventListener('offline', () => {
      this.stats.isOnline = false
      this.updateStats()
    })
  }

  /**
   * Start automatic sync
   */
  private startAutoSync(): void {
    if (this.syncTimer) return

    this.syncTimer = setInterval(() => {
      if (this.stats.isOnline && this.queue.length > 0) {
        this.syncQueue()
      }
    }, this.SYNC_INTERVAL)
  }

  /**
   * Stop automatic sync
   */
  stopAutoSync(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer)
      this.syncTimer = null
    }
  }

  /**
   * Save queue to localStorage
   */
  private saveQueue(): void {
    if (typeof window === 'undefined') return

    try {
      localStorage.setItem('offlineQueue', JSON.stringify(this.queue))
      localStorage.setItem('failedOperations', JSON.stringify(this.failedOperations))
    } catch (e) {
      console.error('Failed to save offline queue:', e)
    }
  }

  /**
   * Load queue from localStorage
   */
  private loadQueue(): void {
    if (typeof window === 'undefined') return

    try {
      const savedQueue = localStorage.getItem('offlineQueue')
      const savedFailed = localStorage.getItem('failedOperations')
      
      if (savedQueue) {
        this.queue = JSON.parse(savedQueue)
      }
      
      if (savedFailed) {
        this.failedOperations = JSON.parse(savedFailed)
      }

      this.updateStats()
    } catch (e) {
      console.error('Failed to load offline queue:', e)
    }
  }

  /**
   * Update statistics
   */
  private updateStats(): void {
    this.stats.queueSize = this.queue.length
    this.stats.failedOperations = this.failedOperations.length
  }

  /**
   * Dispatch sync event
   */
  private dispatchSyncEvent(results: { success: string[]; failed: string[] }): void {
    if (typeof window === 'undefined') return

    const event = new CustomEvent('offlineSyncComplete', {
      detail: {
        successCount: results.success.length,
        failedCount: results.failed.length,
        stats: this.getStats()
      }
    })

    window.dispatchEvent(event)
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }
}

// Create singleton instance
export const offlineSync = new EnhancedOfflineSync()

// React hook for enhanced offline sync
export function useEnhancedOfflineSync() {
  return {
    queueOperation: offlineSync.queueOperation.bind(offlineSync),
    syncQueue: offlineSync.syncQueue.bind(offlineSync),
    getStats: offlineSync.getStats.bind(offlineSync),
    getFailedOperations: offlineSync.getFailedOperations.bind(offlineSync),
    retryFailedOperations: offlineSync.retryFailedOperations.bind(offlineSync),
    clearFailedOperations: offlineSync.clearFailedOperations.bind(offlineSync)
  }
}

// Cleanup helper
export function stopOfflineSync() {
  offlineSync.stopAutoSync()
}
