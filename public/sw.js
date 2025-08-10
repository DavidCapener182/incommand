importScripts('https://storage.googleapis.com/workbox-cdn/releases/7.0.0/workbox-sw.js');

// Import Workbox modules
const { registerRoute } = workbox.routing;
const { NetworkFirst, CacheFirst, StaleWhileRevalidate } = workbox.strategies;
const { ExpirationPlugin } = workbox.expiration;
const { CacheableResponsePlugin } = workbox.cacheableResponse;
const { BackgroundSyncPlugin } = workbox.backgroundSync;
const { precacheAndRoute } = workbox.precaching;

// Precache static assets
precacheAndRoute(self.__WB_MANIFEST);

// Background sync for offline operations
const bgSyncPlugin = new BackgroundSyncPlugin('offlineQueue', {
  maxRetentionTime: 24 * 60, // Retry for up to 24 hours
});

// Push notification event handler
self.addEventListener('push', function(event) {
  console.log('[Service Worker] Push Received.');
  
  let notificationData = {
    title: 'InCommand Notification',
    body: 'You have a new notification',
    icon: '/icon.png',
    badge: '/icon.png',
    data: {
      url: '/',
      timestamp: Date.now()
    }
  };

  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = {
        ...notificationData,
        ...data,
        actions: data.actions || [],
        requireInteraction: data.requireInteraction || false,
        tag: data.tag || 'default',
        renotify: data.renotify || false
      };
    } catch (error) {
      console.error('[Service Worker] Error parsing push data:', error);
    }
  }

  const promiseChain = self.registration.showNotification(
    notificationData.title,
    notificationData
  );

  event.waitUntil(promiseChain);
});

// Notification click handler
self.addEventListener('notificationclick', function(event) {
  console.log('[Service Worker] Notification click Received.');

  event.notification.close();

  if (event.action) {
    // Handle notification actions
    console.log('[Service Worker] Action clicked:', event.action);
    
    // Handle specific actions
    switch (event.action) {
      case 'view':
        event.waitUntil(
          clients.openWindow(event.notification.data.url)
        );
        break;
      case 'dismiss':
        // Just close the notification
        break;
      default:
        // Handle custom actions
        break;
    }
  } else {
    // Default click behavior
    event.waitUntil(
      clients.openWindow(event.notification.data.url || '/')
    );
  }
});

// Background sync event handler
self.addEventListener('sync', function(event) {
  console.log('[Service Worker] Background sync triggered:', event.tag);
  
  if (event.tag === 'offlineQueue') {
    event.waitUntil(syncOfflineData());
  }
});

// Sync offline data
async function syncOfflineData() {
  try {
    // Get offline queue from IndexedDB
    const db = await openDB('incommand-offline', 1);
    const offlineQueue = await db.getAll('offlineOperations');
    
    if (offlineQueue.length === 0) {
      console.log('[Service Worker] No offline operations to sync');
      return;
    }

    console.log(`[Service Worker] Syncing ${offlineQueue.length} offline operations`);

    // Process each offline operation
    for (const operation of offlineQueue) {
      try {
        await processOfflineOperation(operation);
        await db.delete('offlineOperations', operation.id);
      } catch (error) {
        console.error('[Service Worker] Failed to sync operation:', error);
        // Keep failed operations for retry
      }
    }

    // Notify clients of sync completion
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'SYNC_COMPLETE',
        count: offlineQueue.length
      });
    });

  } catch (error) {
    console.error('[Service Worker] Sync error:', error);
  }
}

// Process individual offline operation
async function processOfflineOperation(operation) {
  const { type, data, url, method = 'POST' } = operation;
  
  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...data.headers
    },
    body: method !== 'GET' ? JSON.stringify(data.body) : undefined
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

// IndexedDB helper
function openDB(name, version) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(name, version);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      // Create offline operations store
      if (!db.objectStoreNames.contains('offlineOperations')) {
        const store = db.createObjectStore('offlineOperations', { keyPath: 'id', autoIncrement: true });
        store.createIndex('type', 'type', { unique: false });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
  });
}

// Message handling from main thread
self.addEventListener('message', function(event) {
  console.log('[Service Worker] Message received:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: '1.0.0' });
  }
});

// Install event
self.addEventListener('install', function(event) {
  console.log('[Service Worker] Install');
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', function(event) {
  console.log('[Service Worker] Activate');
  event.waitUntil(self.clients.claim());
});

// Cache strategies for different types of requests
registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: 'images',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 200,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
      }),
    ],
  })
);

registerRoute(
  ({ request }) => request.destination === 'script' || request.destination === 'style',
  new StaleWhileRevalidate({
    cacheName: 'static-resources',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
      }),
    ],
  })
);

registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new NetworkFirst({
    cacheName: 'api-cache',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 5 * 60, // 5 minutes
      }),
    ],
  })
);

// Offline fallback
registerRoute(
  ({ request }) => request.mode === 'navigate',
  new NetworkFirst({
    cacheName: 'pages',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
    ],
  })
);
