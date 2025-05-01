// DeltaVision Service Worker
// Provides offline caching capabilities for the web interface

const CACHE_NAME = 'deltavision-cache-v1';
const APP_SHELL = [
  '/',
  '/index.html',
  '/css/main.css',
  '/js/main.js',
  '/js/bundle.js',
  '/assets/logo.png',
  '/assets/favicon.ico'
];

// Install event - cache the app shell
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing Service Worker...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Caching App Shell');
      return cache.addAll(APP_SHELL);
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating Service Worker...');
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(keyList.map((key) => {
        if (key !== CACHE_NAME) {
          console.log('[Service Worker] Removing old cache', key);
          return caches.delete(key);
        }
      }));
    })
  );
  return self.clients.claim();
});

// Fetch event - provide offline capability
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Cache hit - return the response from the cached version
      if (response) {
        return response;
      }
      
      // Not in cache - return the result from the live server
      // Use a clone of the request because requests are streams and can only be consumed once
      const fetchRequest = event.request.clone();
      
      return fetch(fetchRequest)
        .then((response) => {
          // Check if we received a valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          
          // Clone the response because it's a stream and can only be consumed once
          const responseToCache = response.clone();
          
          // Don't cache API responses
          if (!event.request.url.includes('/api/')) {
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });
          }
          
          return response;
        })
        .catch((error) => {
          // If fetch fails (e.g. network offline)
          console.log('[Service Worker] Fetch failed; returning offline page', error);
          
          // If the request is for an API, return an empty response
          if (event.request.url.includes('/api/')) {
            return new Response(JSON.stringify({ 
              error: 'You are offline. DeltaVision is running in offline mode.' 
            }), {
              headers: { 'Content-Type': 'application/json' }
            });
          }
        });
    })
  );
});

// Add offline sync capabilities
let syncPending = false;

// Listen for sync event (when coming back online)
self.addEventListener('sync', (event) => {
  console.log('[Service Worker] Background Syncing', event);
  if (event.tag === 'deltavision-sync') {
    event.waitUntil(
      syncWithServer()
    );
  }
});

// Function to sync with server when back online
function syncWithServer() {
  return new Promise((resolve, reject) => {
    // Here you would implement logic to sync any changes made while offline
    console.log('[Service Worker] Syncing with server...');
    // For now, we just log the sync attempt
    syncPending = false;
    resolve();
  });
}

// Listen for messages from the client
self.addEventListener('message', (event) => {
  console.log('[Service Worker] Message received:', event.data);
  
  if (event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
});

console.log('[Service Worker] Service Worker registered');
