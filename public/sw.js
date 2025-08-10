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
    
    switch (event.action) {
      case 'view':
        event.waitUntil(
          clients.openWindow(event.notification.data.url)
        );
        break;
      case 'dismiss':
        // Notification already closed
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
  
  if (event.tag === 'offline-queue') {
    event.waitUntil(syncOfflineData());
  }
});

// Sync offline data
async function syncOfflineData() {
  try {
    // Get offline queue from IndexedDB
    const db = await openDB('incommand-offline', 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('offline-queue')) {
          db.createObjectStore('offline-queue', { keyPath: 'id', autoIncrement: true });
        }
      }
    });

    const tx = db.transaction('offline-queue', 'readonly');
    const store = tx.objectStore('offline-queue');
    const items = await store.getAll();

    for (const item of items) {
      try {
        // Attempt to sync each item
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
    console.error('[Service Worker] Background sync failed:', error);
  }
}

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

// Message event handler for communication with main thread
self.addEventListener('message', function(event) {
  console.log('[Service Worker] Message received:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: '1.0.0' });
  }
});

// Custom caching strategies for Supabase API
registerRoute(
  ({ url }) => url.origin === 'https://api.supabase.co',
  new NetworkFirst({
    cacheName: 'supabase-api',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 60 * 60 * 24, // 24 hours
      }),
    ],
  })
);

// Cache user content (photos, etc.)
registerRoute(
  ({ url }) => url.origin === 'https://api.supabase.co' && url.pathname.includes('/storage/'),
  new StaleWhileRevalidate({
    cacheName: 'user-content',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 200,
        maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
      }),
    ],
  })
);

// Offline fallback for critical routes
registerRoute(
  ({ request }) => request.mode === 'navigate',
  new NetworkFirst({
    cacheName: 'pages',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 60 * 60 * 24, // 24 hours
      }),
    ],
  })
);

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
