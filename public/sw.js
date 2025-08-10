// Custom Service Worker with Push Notification Support
// This imports the auto-generated service worker and adds custom functionality

// Import the auto-generated service worker
importScripts('./workbox-87b8d583.js');

// Import the fallback script
importScripts('fallback-Q-Ci7kHVrKIgeO492Xg99.js');

// Initialize Workbox
self.skipWaiting();
workbox.clientsClaim();

// Cache configuration
workbox.precacheAndRoute([
  {url:"/_next/app-build-manifest.json",revision:"f2bb365202288ee2a7e127783feba4a1"},
  {url:"/_next/static/Q-Ci7kHVrKIgeO492Xg99/_buildManifest.js",revision:"2b54d7db375d2b4c0e6af318090bebea"},
  {url:"/_next/static/Q-Ci7kHVrKIgeO492Xg99/_ssgManifest.js",revision:"b6652df95db52feb4daf4eca35380933"},
  {url:"/_next/static/chunks/164f4fb6-438dc90fbdaa8303.js",revision:"Q-Ci7kHVrKIgeO492Xg99"},
  {url:"/_next/static/chunks/2295-6d9ae1ddc32be530.js",revision:"Q-Ci7kHVrKIgeO492Xg99"},
  {url:"/_next/static/chunks/27d0ae69-62e2b632761f6af9.js",revision:"Q-Ci7kHVrKIgeO492Xg99"},
  {url:"/_next/static/chunks/2864-c0fbbf71fe5579b4.js",revision:"Q-Ci7kHVrKIgeO492Xg99"},
  {url:"/_next/static/chunks/3663-0d781fef94c61662.js",revision:"Q-Ci7kHVrKIgeO492Xg99"},
  {url:"/_next/static/chunks/4670-08ffb9cce4a09d86.js",revision:"Q-Ci7kHVrKIgeO492Xg99"},
  {url:"/_next/static/chunks/4685-9ea41fa0fd75dbd9.js",revision:"Q-Ci7kHVrKIgeO492Xg99"},
  {url:"/_next/static/chunks/5910-1a3c4bbb9e42341f.js",revision:"Q-Ci7kHVrKIgeO492Xg99"},
  {url:"/_next/static/chunks/621-dd9c0c99e551d6e8.js",revision:"Q-Ci7kHVrKIgeO492Xg99"},
  {url:"/_next/static/chunks/703-edc92039db242ba0.js",revision:"Q-Ci7kHVrKIgeO492Xg99"},
  {url:"/_next/static/chunks/7176-a6856ae58e96b9fe.js",revision:"Q-Ci7kHVrKIgeO492Xg99"},
  {url:"/_next/static/chunks/8069-141a9878e74d3184.js",revision:"Q-Ci7kHVrKIgeO492Xg99"},
  {url:"/_next/static/chunks/8091-323ac424a22838c4.js",revision:"Q-Ci7kHVrKIgeO492Xg99"},
  {url:"/_next/static/chunks/8682-4deaae392b3143fd.js",revision:"Q-Ci7kHVrKIgeO492Xg99"},
  {url:"/_next/static/chunks/8865-712a4ae47e7249e0.js",revision:"Q-Ci7kHVrKIgeO492Xg99"},
  {url:"/_next/static/chunks/8922.454d3f7bb6576f9c.js",revision:"454d3f7bb6576f9c"},
  {url:"/_next/static/chunks/8e1d74a4-94ecfca0bb08a80b.js",revision:"Q-Ci7kHVrKIgeO492Xg99"},
  {url:"/_next/static/chunks/901-6232edbbd38e1337.js",revision:"Q-Ci7kHVrKIgeO492Xg99"},
  {url:"/_next/static/chunks/9036.a989df4bbc00d2bb.js",revision:"a989df4bbc00d2bb"},
  {url:"/_next/static/chunks/9161.40e540509d5bddc9.js",revision:"40e540509d5bddc9"},
  {url:"/_next/static/chunks/9902-bf1d6c3b1f597d83.js",revision:"Q-Ci7kHVrKIgeO492Xg99"},
  {url:"/_next/static/chunks/ad2866b8-b13756726d088e8a.js",revision:"Q-Ci7kHVrKIgeO492Xg99"},
  {url:"/_next/static/chunks/app/_not-found-885d332bc47a5a98.js",revision:"Q-Ci7kHVrKIgeO492Xg99"},
  {url:"/_next/static/chunks/app/admin/page-38dd080e5d89ce23.js",revision:"Q-Ci7kHVrKIgeO492Xg99"},
  {url:"/_next/static/chunks/app/analytics/page-d718238d32e81d07.js",revision:"Q-Ci7kHVrKIgeO492Xg99"},
  {url:"/_next/static/chunks/app/callsign-assignment/page-bc50eec2a527e9d8.js",revision:"Q-Ci7kHVrKIgeO492Xg99"},
  {url:"/_next/static/chunks/app/collect-name/page-a4a999d0beb2fc50.js",revision:"Q-Ci7kHVrKIgeO492Xg99"},
  {url:"/_next/static/chunks/app/dashboard/page-8dfddb851e014d41.js",revision:"Q-Ci7kHVrKIgeO492Xg99"},
  {url:"/_next/static/chunks/app/help/page-5cd85071184afb4d.js",revision:"Q-Ci7kHVrKIgeO492Xg99"},
  {url:"/_next/static/chunks/app/incidents/page-18c6413ee5ac510f.js",revision:"Q-Ci7kHVrKIgeO492Xg99"},
  {url:"/_next/static/chunks/app/layout-dc269040e435cefd.js",revision:"Q-Ci7kHVrKIgeO492Xg99"},
  {url:"/_next/static/chunks/app/login/page-f627ad16c9a7f6ed.js",revision:"Q-Ci7kHVrKIgeO492Xg99"},
  {url:"/_next/static/chunks/app/offline/page-c0101a3f95db7f49.js",revision:"Q-Ci7kHVrKIgeO492Xg99"},
  {url:"/_next/static/chunks/app/page-a717f0baae05c1ce.js",revision:"Q-Ci7kHVrKIgeO492Xg99"},
  {url:"/_next/static/chunks/app/profile/page-b4279b05334f903e.js",revision:"Q-Ci7kHVrKIgeO492Xg99"},
  {url:"/_next/static/chunks/app/radio-sign-out/page-13ca4f1037827338.js",revision:"Q-Ci7kHVrKIgeO492Xg99"},
  {url:"/_next/static/chunks/app/reports/page-6ddca8436513237e.js",revision:"Q-Ci7kHVrKIgeO492Xg99"},
  {url:"/_next/static/chunks/app/settings/ai-usage/page-7ebee715ba03d19f.js",revision:"Q-Ci7kHVrKIgeO492Xg99"},
  {url:"/_next/static/chunks/app/settings/events/page-f26a5c46cdd94d9c.js",revision:"Q-Ci7kHVrKIgeO492Xg99"},
  {url:"/_next/static/chunks/app/settings/layout-0f41d5f4cdfd7803.js",revision:"Q-Ci7kHVrKIgeO492Xg99"},
  {url:"/_next/static/chunks/app/settings/notifications/page-c6e5ca74228e274a.js",revision:"Q-Ci7kHVrKIgeO492Xg99"},
  {url:"/_next/static/chunks/app/settings/page-97cdb5ba09d371d1.js",revision:"Q-Ci7kHVrKIgeO492Xg99"},
  {url:"/_next/static/chunks/app/settings/support/page-8e668a5453c50105.js",revision:"Q-Ci7kHVrKIgeO492Xg99"},
  {url:"/_next/static/chunks/app/signup/page-d440b9c4d00e0e89.js",revision:"Q-Ci7kHVrKIgeO492Xg99"},
  {url:"/_next/static/chunks/app/staff/page-bd8534c8c9ebbfd8.js",revision:"Q-Ci7kHVrKIgeO492Xg99"},
  {url:"/_next/static/chunks/bc98253f.361c54445ccffab1.js",revision:"361c54445ccffab1"},
  {url:"/_next/static/chunks/c16f53c3-fe02696ed065f674.js",revision:"Q-Ci7kHVrKIgeO492Xg99"},
  {url:"/_next/static/chunks/ca377847-6f54851d9f863f7e.js",revision:"Q-Ci7kHVrKIgeO492Xg99"},
  {url:"/_next/static/chunks/eeac573e-ac816fdaddca49be.js",revision:"Q-Ci7kHVrKIgeO492Xg99"},
  {url:"/_next/static/chunks/fd9d1056-8afc2b9fc07f07bf.js",revision:"Q-Ci7kHVrKIgeO492Xg99"},
  {url:"/_next/static/chunks/framework-8e0e0f4a6b83a956.js",revision:"Q-Ci7kHVrKIgeO492Xg99"},
  {url:"/_next/static/chunks/main-45e92d3c849af9a7.js",revision:"Q-Ci7kHVrKIgeO492Xg99"},
  {url:"/_next/static/chunks/main-app-c4086c14b8b4d890.js",revision:"Q-Ci7kHVrKIgeO492Xg99"},
  {url:"/_next/static/chunks/pages/_app-57bdff7978360b1c.js",revision:"Q-Ci7kHVrKIgeO492Xg99"},
  {url:"/_next/static/chunks/pages/_error-29037c284dd0eec6.js",revision:"Q-Ci7kHVrKIgeO492Xg99"},
  {url:"/_next/static/chunks/polyfills-c67a75d1b6f99dc8.js",revision:"837c0df77fd5009c9e46d446188ecfd0"},
  {url:"/_next/static/chunks/webpack-8e0a15c84bf5fce5.js",revision:"Q-Ci7kHVrKIgeO492Xg99"},
  {url:"/_next/static/css/2bceb288dfbd5bae.css",revision:"2bceb288dfbd5bae"},
  {url:"/_next/static/css/9b59646bc38414ce.css",revision:"9b59646bc38414ce"},
  {url:"/_next/static/media/26a46d62cd723877-s.woff2",revision:"befd9c0fdfa3d8a645d5f95717ed6420"},
  {url:"/_next/static/media/55c55f0601d81cf3-s.woff2",revision:"43828e14271c77b87e3ed582dbff9f74"},
  {url:"/_next/static/media/581909926a08bbc8-s.woff2",revision:"f0b86e7c24f455280b8df606b89af891"},
  {url:"/_next/static/media/8e9860b6e62d6359-s.woff2",revision:"01ba6c2a184b8cba08b0d57167664d75"},
  {url:"/_next/static/media/97e0cb1ae144a2a9-s.woff2",revision:"e360c61c5bd8d90639fd4503c829c2dc"},
  {url:"/_next/static/media/df0a9ae256c0569c-s.woff2",revision:"d54db44de5ccb18886ece2fda72bdfe0"},
  {url:"/_next/static/media/e4af272ccee01ff0-s.p.woff2",revision:"65850a373e258f1c897a2b3d75eb74de"},
  {url:"/apple-touch-icon.png",revision:"18d78f37586e887da291657ac6729785"},
  {url:"/favicon.ico",revision:"18d78f37586e887da291657ac6729785"},
  {url:"/icon.png",revision:"18d78f37586e887da291657ac6729785"},
  {url:"/inCommand.png",revision:"c63ee064a9f9ca191a1c3932145f73fd"},
  {url:"/manifest.json",revision:"eb351be6e310550b654d178269bea140"},
  {url:"/offline",revision:"Q-Ci7kHVrKIgeO492Xg99"},
  {url:"/w3w.png",revision:"39045deaf87ecbbf82858de36b03f2d1"}
], {ignoreURLParametersMatching: []});

// Clean up outdated caches
workbox.cleanupOutdatedCaches();

// Register routes
workbox.registerRoute("/", new workbox.NetworkFirst({
  cacheName: "start-url",
  plugins: [
    {
      cacheWillUpdate: async ({request, response, event, state}) => {
        if (response && response.type === "opaqueredirect") {
          return new Response(response.body, {
            status: 200,
            statusText: "OK",
            headers: response.headers
          });
        }
        return response;
      },
      handlerDidError: async ({request}) => {
        return self.fallback(request);
      }
    }
  ]
}), "GET");

workbox.registerRoute(/^https:\/\/api\.supabase\.co\/.*$/, new workbox.NetworkFirst({
  cacheName: "supabase-api",
  plugins: [
    new workbox.ExpirationPlugin({
      maxEntries: 100,
      maxAgeSeconds: 86400
    }),
    new workbox.CacheableResponsePlugin({
      statuses: [0, 200]
    }),
    {
      handlerDidError: async ({request}) => {
        return self.fallback(request);
      }
    }
  ]
}), "GET");

workbox.registerRoute(/^https:\/\/.*\.(?:png|jpg|jpeg|svg|gif|webp)$/, new workbox.CacheFirst({
  cacheName: "images",
  plugins: [
    new workbox.ExpirationPlugin({
      maxEntries: 200,
      maxAgeSeconds: 2592000
    }),
    {
      handlerDidError: async ({request}) => {
        return self.fallback(request);
      }
    }
  ]
}), "GET");

workbox.registerRoute(/^https:\/\/.*\.(?:js|css)$/, new workbox.StaleWhileRevalidate({
  cacheName: "static-resources",
  plugins: [
    new workbox.ExpirationPlugin({
      maxEntries: 100,
      maxAgeSeconds: 604800
    }),
    {
      handlerDidError: async ({request}) => {
        return self.fallback(request);
      }
    }
  ]
}), "GET");

workbox.registerRoute(/^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/, new workbox.CacheFirst({
  cacheName: "google-fonts",
  plugins: [
    new workbox.ExpirationPlugin({
      maxEntries: 10,
      maxAgeSeconds: 31536000
    }),
    {
      handlerDidError: async ({request}) => {
        return self.fallback(request);
      }
    }
  ]
}), "GET");

// ===== PUSH NOTIFICATION HANDLERS =====

// Handle push events
self.addEventListener('push', function(event) {
  console.log('Push event received:', event);
  
  if (event.data) {
    try {
      const payload = event.data.json();
      console.log('Push payload:', payload);
      
      const options = {
        body: payload.body || 'New notification from InCommand',
        icon: payload.icon || '/icon.png',
        badge: payload.badge || '/icon.png',
        image: payload.image,
        tag: payload.tag || 'default',
        data: payload.data || {},
        actions: payload.actions || [],
        requireInteraction: payload.requireInteraction || false,
        renotify: payload.renotify || false,
        silent: payload.silent || false,
        vibrate: payload.vibrate || [200, 100, 200],
        timestamp: Date.now()
      };

      event.waitUntil(
        self.registration.showNotification(payload.title || 'InCommand', options)
      );
    } catch (error) {
      console.error('Error parsing push data:', error);
      
      // Fallback notification
      const options = {
        body: 'New notification from InCommand',
        icon: '/icon.png',
        badge: '/icon.png',
        tag: 'default',
        data: {},
        timestamp: Date.now()
      };

      event.waitUntil(
        self.registration.showNotification('InCommand', options)
      );
    }
  } else {
    // No data payload
    const options = {
      body: 'New notification from InCommand',
      icon: '/icon.png',
      badge: '/icon.png',
      tag: 'default',
      data: {},
      timestamp: Date.now()
    };

    event.waitUntil(
      self.registration.showNotification('InCommand', options)
    );
  }
});

// Handle notification click events
self.addEventListener('notificationclick', function(event) {
  console.log('Notification clicked:', event);
  
  event.notification.close();
  
  // Handle notification actions
  if (event.action) {
    console.log('Notification action clicked:', event.action);
    
    // Handle specific actions
    switch (event.action) {
      case 'view':
        // Open the main app
        event.waitUntil(
          clients.openWindow('/dashboard')
        );
        break;
      case 'dismiss':
        // Just close the notification
        break;
      default:
        // Handle custom actions
        if (event.notification.data && event.notification.data.url) {
          event.waitUntil(
            clients.openWindow(event.notification.data.url)
          );
        } else {
          event.waitUntil(
            clients.openWindow('/dashboard')
          );
        }
    }
  } else {
    // Default click behavior
    const urlToOpen = event.notification.data?.url || '/dashboard';
    
    event.waitUntil(
      clients.matchAll({
        type: 'window',
        includeUncontrolled: true
      }).then(function(clientList) {
        // Check if there's already a window/tab open with the target URL
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
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
  }
});

// Handle notification close events
self.addEventListener('notificationclose', function(event) {
  console.log('Notification closed:', event);
  
  // You can send analytics data here if needed
  if (event.notification.data && event.notification.data.analytics) {
    // Send analytics data
    console.log('Notification analytics:', event.notification.data.analytics);
  }
});

// ===== BACKGROUND SYNC HANDLERS =====

// Handle background sync events
self.addEventListener('sync', function(event) {
  console.log('Background sync event:', event);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // Handle background sync tasks
      handleBackgroundSync()
    );
  }
});

// Background sync handler
async function handleBackgroundSync() {
  try {
    console.log('Processing background sync tasks...');
    
    // Check for queued incidents
    const queuedIncidents = await getQueuedIncidents();
    
    for (const incident of queuedIncidents) {
      try {
        await syncIncident(incident);
        await removeQueuedIncident(incident.id);
        console.log('Synced incident:', incident.id);
      } catch (error) {
        console.error('Failed to sync incident:', incident.id, error);
      }
    }
    
    console.log('Background sync completed');
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

// Get queued incidents from IndexedDB
async function getQueuedIncidents() {
  // This would typically use IndexedDB to get queued data
  // For now, return empty array
  return [];
}

// Sync incident to server
async function syncIncident(incident) {
  // This would sync the incident to the server
  // Implementation depends on your API
}

// Remove queued incident from IndexedDB
async function removeQueuedIncident(id) {
  // This would remove the incident from IndexedDB
  // Implementation depends on your storage strategy
}

// ===== MESSAGE HANDLERS =====

// Handle messages from the main thread
self.addEventListener('message', function(event) {
  console.log('Service worker message received:', event);
  
  if (event.data && event.data.type) {
    switch (event.data.type) {
      case 'SKIP_WAITING':
        self.skipWaiting();
        break;
      case 'GET_VERSION':
        event.ports[0].postMessage({ version: '1.0.0' });
        break;
      case 'CACHE_URLS':
        event.waitUntil(
          caches.open('dynamic-cache').then(function(cache) {
            return cache.addAll(event.data.urls);
          })
        );
        break;
      default:
        console.log('Unknown message type:', event.data.type);
    }
  }
});

// ===== INSTALL AND ACTIVATE HANDLERS =====

// Handle service worker installation
self.addEventListener('install', function(event) {
  console.log('Service worker installing...');
  
  // Skip waiting to activate immediately
  self.skipWaiting();
});

// Handle service worker activation
self.addEventListener('activate', function(event) {
  console.log('Service worker activating...');
  
  // Claim all clients immediately
  event.waitUntil(
    clients.claim().then(function() {
      console.log('Service worker activated and claiming clients');
    })
  );
});

// ===== UTILITY FUNCTIONS =====

// Fallback function for failed requests
self.fallback = function(request) {
  return caches.match('/offline').then(function(response) {
    if (response) {
      return response;
    }
    return new Response('Offline', {
      status: 503,
      statusText: 'Service Unavailable',
      headers: new Headers({
        'Content-Type': 'text/plain'
      })
    });
  });
};
