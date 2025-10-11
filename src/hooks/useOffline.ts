/**
 * Offline Support Hook
 * Manages offline detection, service worker, and data sync
 */

import { useState, useEffect, useCallback } from 'react'

export interface OfflineState {
  isOnline: boolean
  isServiceWorkerReady: boolean
  hasPendingSync: boolean
  syncStatus: 'idle' | 'syncing' | 'success' | 'error'
  lastSyncTime: Date | null
}

export function useOffline() {
  const [state, setState] = useState<OfflineState>({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    isServiceWorkerReady: false,
    hasPendingSync: false,
    syncStatus: 'idle',
    lastSyncTime: null
  })

  // Initialize service worker
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw-enhanced.js')
        .then((registration) => {
          console.log('Service Worker registered:', registration)
          setState(prev => ({ ...prev, isServiceWorkerReady: true }))

          // Listen for updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  console.log('New service worker available')
                  // Prompt user to reload
                  if (confirm('New version available! Reload to update?')) {
                    newWorker.postMessage({ type: 'SKIP_WAITING' })
                    window.location.reload()
                  }
                }
              })
            }
          })
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error)
        })

      // Listen for service worker messages
      navigator.serviceWorker.addEventListener('message', (event) => {
        handleServiceWorkerMessage(event.data)
      })
    }
  }, [])

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      console.log('Connection restored')
      setState(prev => ({ ...prev, isOnline: true }))
      
      // Trigger background sync when connection is restored
      if ('serviceWorker' in navigator && 'sync' in navigator.serviceWorker) {
        navigator.serviceWorker.ready.then((registration: any) => {
          registration.sync.register('sync-incidents')
          registration.sync.register('sync-logs')
        }).catch((error: any) => {
          console.error('Background sync registration failed:', error)
        })
      }
    }

    const handleOffline = () => {
      console.log('Connection lost')
      setState(prev => ({ ...prev, isOnline: false }))
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Handle service worker messages
  const handleServiceWorkerMessage = useCallback((message: any) => {
    console.log('Service worker message:', message)

    if (message.type === 'incident-synced' || message.type === 'log-synced') {
      setState(prev => ({
        ...prev,
        hasPendingSync: false,
        syncStatus: message.data.success ? 'success' : 'error',
        lastSyncTime: new Date()
      }))

      // Reset sync status after 3 seconds
      setTimeout(() => {
        setState(prev => ({ ...prev, syncStatus: 'idle' }))
      }, 3000)
    }
  }, [])

  // Save data for offline use
  const saveOfflineData = useCallback(async (type: 'incident' | 'log', data: any) => {
    try {
      const db = await openIndexedDB()
      const storeName = type === 'incident' ? 'pendingIncidents' : 'pendingLogs'
      const tx = db.transaction(storeName, 'readwrite')
      const store = tx.objectStore(storeName)
      
      const item = {
        data,
        timestamp: new Date().toISOString(),
        synced: false
      }
      
      await store.add(item)
      
      setState(prev => ({ ...prev, hasPendingSync: true }))
      
      console.log(`${type} saved for offline sync`)
      return true
    } catch (error) {
      console.error('Error saving offline data:', error)
      return false
    }
  }, [])

  const countStoreItems = (store: IDBObjectStore) => new Promise<number>((resolve, reject) => {
    const request = store.count()
    request.onsuccess = () => resolve(request.result || 0)
    request.onerror = () => reject(request.error)
  })

  const getAllStoreItems = <T>(store: IDBObjectStore) => new Promise<T[]>((resolve, reject) => {
    const request = store.getAll()
    request.onsuccess = () => resolve((request.result || []) as T[])
    request.onerror = () => reject(request.error)
  })

  // Get pending sync items count
  const getPendingSyncCount = useCallback(async () => {
    try {
      const db = await openIndexedDB()
      
      const incidentsTx = db.transaction('pendingIncidents', 'readonly')
      const incidentsStore = incidentsTx.objectStore('pendingIncidents')
      const incidentsCount = await countStoreItems(incidentsStore)
      
      const logsTx = db.transaction('pendingLogs', 'readonly')
      const logsStore = logsTx.objectStore('pendingLogs')
      const logsCount = await countStoreItems(logsStore)
      
      return incidentsCount + logsCount
    } catch (error) {
      console.error('Error getting pending sync count:', error)
      return 0
    }
  }, [])

  // Manually trigger sync
  const triggerSync = useCallback(async () => {
    if (!state.isOnline) {
      console.warn('Cannot sync while offline')
      return false
    }

    setState(prev => ({ ...prev, syncStatus: 'syncing' }))

    try {
      if ('serviceWorker' in navigator && 'sync' in navigator.serviceWorker) {
        const registration: any = await navigator.serviceWorker.ready
        await registration.sync.register('sync-incidents')
        await registration.sync.register('sync-logs')
        console.log('Sync triggered successfully')
        return true
      } else {
        // Fallback for browsers without background sync
        await manualSync()
        return true
      }
    } catch (error) {
      console.error('Sync failed:', error)
      setState(prev => ({ ...prev, syncStatus: 'error' }))
      return false
    }
  }, [state.isOnline])

  // Manual sync fallback
  const manualSync = async () => {
    try {
      const db = await openIndexedDB()
      
      // Sync incidents
      const incidentsTx = db.transaction('pendingIncidents', 'readwrite')
      const incidentsStore = incidentsTx.objectStore('pendingIncidents')
      const incidents = await getAllStoreItems<any>(incidentsStore)
      
      for (const incident of incidents) {
        const response = await fetch('/api/incidents/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(incident.data)
        })
        
        if (response.ok) {
          await incidentsStore.delete(incident.id)
        }
      }
      
      // Sync logs
      const logsTx = db.transaction('pendingLogs', 'readwrite')
      const logsStore = logsTx.objectStore('pendingLogs')
      const logs = await getAllStoreItems<any>(logsStore)
      
      for (const log of logs) {
        const response = await fetch('/api/logs/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(log.data)
        })
        
        if (response.ok) {
          await logsStore.delete(log.id)
        }
      }
      
      setState(prev => ({
        ...prev,
        hasPendingSync: false,
        syncStatus: 'success',
        lastSyncTime: new Date()
      }))
      
      setTimeout(() => {
        setState(prev => ({ ...prev, syncStatus: 'idle' }))
      }, 3000)
    } catch (error) {
      console.error('Manual sync failed:', error)
      setState(prev => ({ ...prev, syncStatus: 'error' }))
      throw error
    }
  }

  // Clear cache
  const clearCache = useCallback(async () => {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: 'CLEAR_CACHE' })
      console.log('Cache clear requested')
      return true
    }
    return false
  }, [])

  return {
    ...state,
    saveOfflineData,
    getPendingSyncCount,
    triggerSync,
    clearCache
  }
}

/**
 * Open IndexedDB for offline storage
 */
function openIndexedDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('incommand-offline', 1)
    
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
    
    request.onupgradeneeded = (event: any) => {
      const db = event.target.result
      
      if (!db.objectStoreNames.contains('pendingIncidents')) {
        db.createObjectStore('pendingIncidents', { keyPath: 'id', autoIncrement: true })
      }
      
      if (!db.objectStoreNames.contains('pendingLogs')) {
        db.createObjectStore('pendingLogs', { keyPath: 'id', autoIncrement: true })
      }
    }
  })
}
