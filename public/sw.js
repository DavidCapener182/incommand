importScripts('https://storage.googleapis.com/workbox-cdn/releases/7.0.0/workbox-sw.js');

// Import Workbox modules
const { registerRoute } = workbox.routing;
const { NetworkFirst, CacheFirst, StaleWhileRevalidate } = workbox.strategies;
const { ExpirationPlugin } = workbox.expiration;
const { BackgroundSyncPlugin } = workbox.backgroundSync;
const { precacheAndRoute } = workbox.precaching;

// Precache static assets
precacheAndRoute(self.__WB_MANIFEST);

// Background sync for offline operations
const bgSyncPlugin = new BackgroundSyncPlugin('offline-queue', {
  maxRetentionTime: 24 * 60, // Retry for up to 24 hours
});

// Cache configuration
const CACHE_CONFIG = {
  STATIC: 'incommand-static-v1.0.0',
  DYNAMIC: 'incommand-dynamic-v1.0.0',
  API: 'incommand-api-v1.0.0',
  PAGES: 'incommand-pages-v1.0.0',
  USER_CONTENT: 'incommand-user-content-v1.0.0'
};

// Static files to cache immediately
const STATIC_FILES = [
  '/',
  '/offline',
  '/manifest.json',
  '/icon.png',
  '/apple-touch-icon.png',
  '/inCommand.png'
];

// Install event - cache static files
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  event.waitUntil(
    caches.open(CACHE_CONFIG.STATIC)
      .then((cache) => {
        console.log('[Service Worker] Caching static files');
        return cache.addAll(STATIC_FILES);
      })
      .then(() => {
        console.log('[Service Worker] Static files cached');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[Service Worker] Error caching static files', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (!Object.values(CACHE_CONFIG).includes(cacheName)) {
              console.log('[Service Worker] Deleting old cache', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[Service Worker] Activated');
        return self.clients.claim();
      })
  );
});

// Enhanced caching strategies with Workbox
// API routes - Network first with background sync
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new NetworkFirst({
    cacheName: CACHE_CONFIG.API,
    plugins: [
      bgSyncPlugin,
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 60 * 60, // 1 hour
      }),
    ],
  })
);

// Supabase API - Network first with longer cache
registerRoute(
  ({ url }) => url.origin === 'https://api.supabase.co',
  new NetworkFirst({
    cacheName: CACHE_CONFIG.API,
    plugins: [
      new ExpirationPlugin({
        maxEntries: 200,
        maxAgeSeconds: 60 * 60 * 24, // 24 hours
      }),
    ],
  })
);

// User content (photos, etc.) - Stale while revalidate
registerRoute(
  ({ url }) => url.origin === 'https://api.supabase.co' && url.pathname.includes('/storage/'),
  new StaleWhileRevalidate({
    cacheName: CACHE_CONFIG.USER_CONTENT,
    plugins: [
      new ExpirationPlugin({
        maxEntries: 300,
        maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
      }),
    ],
  })
);

// Static assets - Cache first
registerRoute(
  ({ request }) => isStaticAsset(request.url),
  new CacheFirst({
    cacheName: CACHE_CONFIG.STATIC,
    plugins: [
      new ExpirationPlugin({
        maxEntries: 500,
        maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
      }),
    ],
  })
);

// Navigation requests - Network first with offline fallback
registerRoute(
  ({ request }) => request.mode === 'navigate',
  new NetworkFirst({
    cacheName: CACHE_CONFIG.PAGES,
    plugins: [
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 60 * 60 * 24, // 24 hours
      }),
    ],
  })
);

// Enhanced push notification handling
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push event received', event);
  
  let notificationData = {
    title: 'InCommand',
    body: 'You have a new notification',
    icon: '/icon.png',
    badge: '/icon.png',
    vibrate: [200, 100, 200],
    data: {
      url: '/',
      timestamp: Date.now()
    },
    actions: [
      {
        action: 'view',
        title: 'View',
        icon: '/icon.png'
      },
      {
        action: 'dismiss',
        title: 'Dismiss'
      }
    ],
    requireInteraction: false,
    tag: 'incommand-notification',
    renotify: false
  };

  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = {
        ...notificationData,
        ...data,
        actions: data.actions || notificationData.actions,
        requireInteraction: data.requireInteraction || false,
        tag: data.tag || 'incommand-notification',
        renotify: data.renotify || false
      };
    } catch (error) {
      console.error('[Service Worker] Error parsing push data:', error);
    }
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, notificationData)
  );
});

// Enhanced notification click handling
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification clicked', event);
  
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if there's already a window/tab open with the target URL
        for (const client of clientList) {
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        
        // If no window/tab is open, open a new one
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Background sync for offline operations
self.addEventListener('sync', (event) => {
  console.log('[Service Worker] Background sync triggered:', event.tag);
  
  if (event.tag === 'offline-queue') {
    event.waitUntil(syncOfflineData());
  }
  
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

// Enhanced background sync function
async function doBackgroundSync() {
  try {
    console.log('[Service Worker] Performing background sync');
    
    // Sync offline data
    const offlineData = await getOfflineData();
    if (offlineData.length > 0) {
      await syncOfflineData(offlineData);
    }
    
    // Sync any pending notifications
    await syncPendingNotifications();
    
  } catch (error) {
    console.error('[Service Worker] Background sync failed', error);
  }
}

// Get offline data from IndexedDB
async function getOfflineData() {
  try {
    const db = await openDB('incommand-offline', 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('offline-queue')) {
          db.createObjectStore('offline-queue', { keyPath: 'id', autoIncrement: true });
        }
        if (!db.objectStoreNames.contains('pending-notifications')) {
          db.createObjectStore('pending-notifications', { keyPath: 'id', autoIncrement: true });
        }
      }
    });

    const tx = db.transaction('offline-queue', 'readonly');
    const store = tx.objectStore('offline-queue');
    return await store.getAll();
  } catch (error) {
    console.error('[Service Worker] Error getting offline data:', error);
    return [];
  }
}

// Sync offline data with server
async function syncOfflineData(data) {
  console.log('[Service Worker] Syncing offline data', data);
  
  try {
    const db = await openDB('incommand-offline', 1);
    
    for (const item of data) {
      try {
        const response = await fetch(item.url, {
          method: item.method,
          headers: item.headers,
          body: item.body
        });

        if (response.ok) {
          // Remove from queue if successful
          const deleteTx = db.transaction('offline-queue', 'readwrite');
          const deleteStore = deleteTx.objectStore('offline-queue');
          await deleteStore.delete(item.id);
        }
      } catch (error) {
        console.error('[Service Worker] Failed to sync item:', error);
      }
    }
  } catch (error) {
    console.error('[Service Worker] Error syncing offline data:', error);
  }
}

// Sync pending notifications
async function syncPendingNotifications() {
  try {
    const db = await openDB('incommand-offline', 1);
    const tx = db.transaction('pending-notifications', 'readonly');
    const store = tx.objectStore('pending-notifications');
    const notifications = await store.getAll();
    
    for (const notification of notifications) {
      try {
        // Attempt to send notification
        await self.registration.showNotification(notification.title, notification.options);
        
        // Remove from pending queue
        const deleteTx = db.transaction('pending-notifications', 'readwrite');
        const deleteStore = deleteTx.objectStore('pending-notifications');
        await deleteStore.delete(notification.id);
      } catch (error) {
        console.error('[Service Worker] Failed to sync notification:', error);
      }
    }
  } catch (error) {
    console.error('[Service Worker] Error syncing notifications:', error);
  }
}

// Enhanced message handling for communication with main thread
self.addEventListener('message', (event) => {
  console.log('[Service Worker] Message received:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: '1.0.0' });
  }
  
  if (event.data && event.data.type === 'CACHE_URL') {
    event.waitUntil(cacheUrl(event.data.url));
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(clearCache(event.data.cacheName));
  }
});

// Cache a specific URL
async function cacheUrl(url) {
  try {
    const cache = await caches.open(CACHE_CONFIG.DYNAMIC);
    const response = await fetch(url);
    if (response.ok) {
      await cache.put(url, response);
      console.log('[Service Worker] Cached URL:', url);
    }
  } catch (error) {
    console.error('[Service Worker] Error caching URL:', error);
  }
}

// Clear specific cache
async function clearCache(cacheName) {
  try {
    await caches.delete(cacheName);
    console.log('[Service Worker] Cleared cache:', cacheName);
  } catch (error) {
    console.error('[Service Worker] Error clearing cache:', error);
  }
}

// Error handling
self.addEventListener('error', (event) => {
  console.error('[Service Worker] Error:', event);
});

self.addEventListener('unhandledrejection', (event) => {
  console.error('[Service Worker] Unhandled rejection:', event);
});

// Helper function to check if URL is a static asset
function isStaticAsset(url) {
  const staticExtensions = [
    '.js', '.css', '.png', '.jpg', '.jpeg', '.gif', '.svg', 
    '.woff', '.woff2', '.ttf', '.eot', '.ico', '.webp'
  ];
  
  const urlObj = new URL(url);
  return staticExtensions.some(ext => urlObj.pathname.endsWith(ext)) ||
         urlObj.pathname.startsWith('/_next/') ||
         urlObj.pathname.startsWith('/static/');
}

// Helper function to open IndexedDB
function openDB(name, version, options) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(name, version);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (options && options.upgrade) {
        options.upgrade(db);
      }
    };
  });
}
