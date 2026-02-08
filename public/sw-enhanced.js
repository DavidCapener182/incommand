/**
 * Enhanced Service Worker for inCommand
 * Provides offline support, caching strategies, and background sync
 */

const CACHE_VERSION = 'v1.0.3'
const CACHE_NAME = `incommand-${CACHE_VERSION}`
const DATA_CACHE_NAME = `incommand-data-${CACHE_VERSION}`
const IMAGE_CACHE_NAME = `incommand-images-${CACHE_VERSION}`

// Assets to cache immediately on install
const PRECACHE_ASSETS = [
  '/',
  '/offline-fallback.html',
  '/dashboard',
  '/incidents',
  '/staff',
  '/analytics',
  '/settings',
  '/offline',
  '/manifest.json',
  '/icon.png',
  '/apple-touch-icon.png'
]

// API routes to cache with network-first strategy
const API_ROUTES = [
  '/api/incidents',
  '/api/events',
  '/api/staff',
  '/api/analytics'
]

// Install event - precache essential assets
self.addEventListener('install', (event) => {
  console.log('[ServiceWorker] Installing...')
  
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[ServiceWorker] Precaching app shell')
      return cache.addAll(PRECACHE_ASSETS)
    }).then(() => {
      console.log('[ServiceWorker] Skip waiting')
      return self.skipWaiting()
    })
  )
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[ServiceWorker] Activating...')
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && 
              cacheName !== DATA_CACHE_NAME && 
              cacheName !== IMAGE_CACHE_NAME) {
            console.log('[ServiceWorker] Removing old cache:', cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    }).then(() => {
      console.log('[ServiceWorker] Claiming clients')
      return self.clients.claim()
    })
  )
})

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-http(s) requests
  if (!request.url.startsWith('http')) {
    return
  }

  // Handle API requests with network-first strategy
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirstStrategy(request, DATA_CACHE_NAME))
    return
  }

  // Handle images with cache-first strategy
  if (request.destination === 'image') {
    event.respondWith(cacheFirstStrategy(request, IMAGE_CACHE_NAME))
    return
  }

  // Never cache Next.js build assets - always fetch fresh
  if (url.pathname.startsWith('/_next/')) {
    event.respondWith(fetch(request))
    return
  }

  // Ensure critical assets (JS/CSS) always refresh
  if (request.destination === 'style' || request.destination === 'script' || request.destination === 'worker') {
    event.respondWith(fetch(request))
    return
  }

  // Handle navigation requests: network first, then offline page, then static fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => {
        return caches.match(request.url).then((cached) => {
          if (cached) return cached
          return caches.match('/offline').then((offlinePage) => {
            if (offlinePage) return offlinePage
            return caches.match('/offline-fallback.html')
          })
        })
      })
    )
    return
  }

  // Handle other requests with cache-first strategy
  event.respondWith(cacheFirstStrategy(request, CACHE_NAME))
})

/**
 * Network-first strategy
 * Try network first, fallback to cache if offline
 */
async function networkFirstStrategy(request, cacheName) {
  try {
    const response = await fetch(request)
    
    // Cache successful responses
    if (response.ok) {
      const cache = await caches.open(cacheName)
      cache.put(request, response.clone())
    }
    
    return response
  } catch (error) {
    // Network failed, try cache
    const cached = await caches.match(request)
    if (cached) {
      console.log('[ServiceWorker] Serving from cache:', request.url)
      return cached
    }
    
    throw error
  }
}

/**
 * Cache-first strategy
 * Try cache first, fallback to network
 */
async function cacheFirstStrategy(request, cacheName) {
  const cached = await caches.match(request)
  
  if (cached) {
    console.log('[ServiceWorker] Serving from cache:', request.url)
    return cached
  }
  
  try {
    const response = await fetch(request)
    
    // Cache successful responses
    if (response.ok) {
      const cache = await caches.open(cacheName)
      cache.put(request, response.clone())
    }
    
    return response
  } catch (error) {
    console.error('[ServiceWorker] Fetch failed:', error)
    throw error
  }
}

// Background Sync - for offline incident creation
self.addEventListener('sync', (event) => {
  console.log('[ServiceWorker] Background sync:', event.tag)
  
  if (event.tag === 'sync-incidents') {
    event.waitUntil(syncIncidents())
  } else if (event.tag === 'sync-logs') {
    event.waitUntil(syncLogs())
  }
})

/**
 * Sync offline incidents when connection is restored
 */
async function syncIncidents() {
  console.log('[ServiceWorker] Syncing incidents...')
  
  try {
    // Get pending incidents from IndexedDB
    const db = await openDB()
    const tx = db.transaction('pendingIncidents', 'readonly')
    const store = tx.objectStore('pendingIncidents')
    const incidents = await store.getAll()
    
    // Send each incident to server
    for (const incident of incidents) {
      const response = await fetch('/api/incidents/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(incident.data)
      })
      
      if (response.ok) {
        // Remove from pending queue
        const deleteTx = db.transaction('pendingIncidents', 'readwrite')
        const deleteStore = deleteTx.objectStore('pendingIncidents')
        await deleteStore.delete(incident.id)
        
        // Notify client
        await notifyClient({
          type: 'incident-synced',
          data: { id: incident.id, success: true }
        })
      }
    }
    
    console.log('[ServiceWorker] Incidents synced successfully')
  } catch (error) {
    console.error('[ServiceWorker] Sync failed:', error)
    throw error
  }
}

/**
 * Sync offline logs when connection is restored
 */
async function syncLogs() {
  console.log('[ServiceWorker] Syncing logs...')
  
  try {
    const db = await openDB()
    const tx = db.transaction('pendingLogs', 'readonly')
    const store = tx.objectStore('pendingLogs')
    const logs = await store.getAll()
    
    for (const log of logs) {
      const response = await fetch('/api/logs/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(log.data)
      })
      
      if (response.ok) {
        const deleteTx = db.transaction('pendingLogs', 'readwrite')
        const deleteStore = deleteTx.objectStore('pendingLogs')
        await deleteStore.delete(log.id)
        
        await notifyClient({
          type: 'log-synced',
          data: { id: log.id, success: true }
        })
      }
    }
    
    console.log('[ServiceWorker] Logs synced successfully')
  } catch (error) {
    console.error('[ServiceWorker] Sync failed:', error)
    throw error
  }
}

/**
 * Open IndexedDB for offline storage
 */
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('incommand-offline', 1)
    
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
    
    request.onupgradeneeded = (event) => {
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

/**
 * Notify client about sync results
 */
async function notifyClient(message) {
  const clients = await self.clients.matchAll()
  clients.forEach(client => {
    client.postMessage(message)
  })
}

// Push notification handler
self.addEventListener('push', (event) => {
  console.log('[ServiceWorker] Push received:', event)
  
  const data = event.data ? event.data.json() : {}
  const title = data.title || 'inCommand Notification'
  const options = {
    body: data.body || 'You have a new notification',
    icon: '/icon.png',
    badge: '/icon.png',
    vibrate: [200, 100, 200],
    data: data,
    actions: data.actions || []
  }
  
  event.waitUntil(
    self.registration.showNotification(title, options)
  )
})

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('[ServiceWorker] Notification click:', event)
  
  event.notification.close()
  
  const urlToOpen = event.notification.data?.url || '/dashboard'
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if a window is already open
      for (const client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus()
        }
      }
      
      // Open new window if none exists
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen)
      }
    })
  )
})

// Message handler for client communication
self.addEventListener('message', (event) => {
  console.log('[ServiceWorker] Message received:', event.data)
  
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  } else if (event.data.type === 'CACHE_URLS') {
    event.waitUntil(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.addAll(event.data.urls)
      })
    )
  } else if (event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => caches.delete(cacheName))
        )
      })
    )
  }
})

console.log('[ServiceWorker] Loaded')
