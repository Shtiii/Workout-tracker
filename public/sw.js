/**
 * Service Worker for Workout Tracker Application
 * Provides offline capabilities, background sync, and cache management
 */

// Import constants (Note: Can't use ES6 imports in service worker)
const CACHE_CONFIG = {
  CACHE_NAME: 'workout-tracker-v1',
  STATIC_CACHE: 'workout-tracker-static-v1',
  DYNAMIC_CACHE: 'workout-tracker-dynamic-v1',
  MAX_CACHE_SIZE: 50 * 1024 * 1024, // 50MB
  MAX_STATIC_CACHE_SIZE: 20 * 1024 * 1024, // 20MB
  MAX_DYNAMIC_CACHE_SIZE: 30 * 1024 * 1024, // 30MB
  CACHE_TTL: 7 * 24 * 60 * 60 * 1000, // 7 days
  MAX_CACHED_ITEMS: 100
};

const SW_CONFIG = {
  WORKOUT_SYNC_TAG: 'workout-sync',
  PROGRAM_SYNC_TAG: 'program-sync',
  MAX_RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 5000,
  NETWORK_TIMEOUT: 10000
};

const STORAGE_CONFIG = {
  OFFLINE_WORKOUTS_KEY: 'offline-workouts',
  OFFLINE_PROGRAMS_KEY: 'offline-programs',
  MAX_OFFLINE_WORKOUTS: 50
};

// URLs to cache on install
const urlsToCache = [
  '/',
  '/dashboard',
  '/workout',
  '/programs',
  '/analytics',
  '/goals-records',
  '/manifest.json',
  '/workout-icon-192.svg',
  '/workout-icon-512.svg'
];

// Cache Management Utilities
class CacheManager {
  /**
   * Get cache size in bytes
   */
  static async getCacheSize(cacheName) {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    let totalSize = 0;

    for (const request of keys) {
      const response = await cache.match(request);
      if (response) {
        const blob = await response.blob();
        totalSize += blob.size;
      }
    }

    return totalSize;
  }

  /**
   * Clean up old cache entries to stay within size limits
   */
  static async cleanupCache(cacheName, maxSize, maxItems) {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();

    // If we're over the item limit, remove oldest entries
    if (keys.length > maxItems) {
      const itemsToRemove = keys.length - maxItems;
      for (let i = 0; i < itemsToRemove; i++) {
        await cache.delete(keys[i]);
      }
    }

    // Check size and remove entries if over limit
    const currentSize = await this.getCacheSize(cacheName);
    if (currentSize > maxSize) {
      const remainingKeys = await cache.keys();
      // Remove oldest entries until under size limit
      for (const key of remainingKeys) {
        await cache.delete(key);
        const newSize = await this.getCacheSize(cacheName);
        if (newSize <= maxSize * 0.8) break; // Leave some headroom
      }
    }
  }

  /**
   * Add timestamp metadata to cached responses
   */
  static createCacheResponse(response) {
    const headers = new Headers(response.headers);
    headers.set('sw-cache-timestamp', Date.now().toString());

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: headers
    });
  }

  /**
   * Check if cached response is still fresh
   */
  static isCacheFresh(response, ttl = CACHE_CONFIG.CACHE_TTL) {
    const timestamp = response.headers.get('sw-cache-timestamp');
    if (!timestamp) return false;

    const age = Date.now() - parseInt(timestamp);
    return age < ttl;
  }
}

// Background Sync Manager
class BackgroundSyncManager {
  /**
   * Sync offline workouts with server
   */
  static async syncWorkouts() {
    try {
      console.log('SW: Starting workout sync...');
      const workoutData = await this.getStoredWorkoutData();

      if (!workoutData || workoutData.length === 0) {
        console.log('SW: No offline workouts to sync');
        return { success: true, synced: 0 };
      }

      let synced = 0;
      let failed = 0;

      for (const workout of workoutData) {
        try {
          const success = await this.syncWorkoutToServer(workout);
          if (success) {
            await this.removeStoredWorkoutData(workout.offlineId || workout.id);
            synced++;
          } else {
            failed++;
          }
        } catch (error) {
          console.error('SW: Failed to sync workout:', error);
          failed++;
        }

        // Respect rate limits
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      console.log(`SW: Sync complete. Synced: ${synced}, Failed: ${failed}`);
      return { success: true, synced, failed };

    } catch (error) {
      console.error('SW: Background sync failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get stored workout data from localStorage
   */
  static async getStoredWorkoutData() {
    try {
      // Use clients.matchAll to communicate with pages
      const clients = await self.clients.matchAll();
      if (clients.length > 0) {
        // Ask the main thread for offline data
        return new Promise((resolve) => {
          const channel = new MessageChannel();
          channel.port1.onmessage = (event) => {
            resolve(event.data);
          };

          clients[0].postMessage({
            type: 'GET_OFFLINE_WORKOUTS'
          }, [channel.port2]);
        });
      }

      // Fallback: try to access localStorage directly (may not work in all browsers)
      const stored = self.localStorage?.getItem(STORAGE_CONFIG.OFFLINE_WORKOUTS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('SW: Failed to get stored workout data:', error);
      return [];
    }
  }

  /**
   * Remove synced workout from storage
   */
  static async removeStoredWorkoutData(workoutId) {
    try {
      const clients = await self.clients.matchAll();
      if (clients.length > 0) {
        clients[0].postMessage({
          type: 'REMOVE_OFFLINE_WORKOUT',
          workoutId: workoutId
        });
      }
    } catch (error) {
      console.error('SW: Failed to remove stored workout:', error);
    }
  }

  /**
   * Sync individual workout to server
   */
  static async syncWorkoutToServer(workout) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), SW_CONFIG.NETWORK_TIMEOUT);

      const response = await fetch('/api/sync-workout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(workout),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        console.log('SW: Successfully synced workout:', workout.id);
        return true;
      } else {
        console.error('SW: Server rejected workout sync:', response.status);
        return false;
      }
    } catch (error) {
      console.error('SW: Network error during workout sync:', error);
      return false;
    }
  }
}

// Storage Quota Manager
class StorageQuotaManager {
  /**
   * Check storage quota and usage
   */
  static async checkStorageQuota() {
    try {
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        const usageInMB = (estimate.usage || 0) / (1024 * 1024);
        const quotaInMB = (estimate.quota || 0) / (1024 * 1024);
        const usagePercentage = (usageInMB / quotaInMB) * 100;

        console.log(`SW: Storage usage: ${usageInMB.toFixed(2)}MB / ${quotaInMB.toFixed(2)}MB (${usagePercentage.toFixed(1)}%)`);

        // Warning threshold at 80%
        if (usagePercentage > 80) {
          await this.cleanupStorageSpace();
        }

        return {
          usage: usageInMB,
          quota: quotaInMB,
          percentage: usagePercentage
        };
      }
    } catch (error) {
      console.error('SW: Failed to check storage quota:', error);
    }
    return null;
  }

  /**
   * Clean up storage space when approaching quota
   */
  static async cleanupStorageSpace() {
    console.log('SW: Cleaning up storage space...');

    // Clean up dynamic cache first
    await CacheManager.cleanupCache(
      CACHE_CONFIG.DYNAMIC_CACHE,
      CACHE_CONFIG.MAX_DYNAMIC_CACHE_SIZE * 0.7, // Use only 70% of limit
      CACHE_CONFIG.MAX_CACHED_ITEMS * 0.7
    );

    // Clean up old static cache if needed
    const staticCacheSize = await CacheManager.getCacheSize(CACHE_CONFIG.STATIC_CACHE);
    if (staticCacheSize > CACHE_CONFIG.MAX_STATIC_CACHE_SIZE) {
      await CacheManager.cleanupCache(
        CACHE_CONFIG.STATIC_CACHE,
        CACHE_CONFIG.MAX_STATIC_CACHE_SIZE * 0.8,
        50
      );
    }
  }
}

// Install event - cache resources
self.addEventListener('install', (event) => {
  console.log('SW: Installing service worker...');

  event.waitUntil(
    Promise.all([
      // Cache static resources
      caches.open(CACHE_CONFIG.STATIC_CACHE).then((cache) => {
        console.log('SW: Caching static files');
        return cache.addAll(urlsToCache);
      }),

      // Initialize dynamic cache
      caches.open(CACHE_CONFIG.DYNAMIC_CACHE),

      // Skip waiting to activate immediately
      self.skipWaiting()
    ]).then(() => {
      console.log('SW: Installation complete');
    }).catch((error) => {
      console.error('SW: Installation failed:', error);
    })
  );
});

// Activate event - clean up old caches and claim clients
self.addEventListener('activate', (event) => {
  console.log('SW: Activating service worker...');

  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_CONFIG.STATIC_CACHE &&
                cacheName !== CACHE_CONFIG.DYNAMIC_CACHE &&
                cacheName !== CACHE_CONFIG.CACHE_NAME) {
              console.log('SW: Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),

      // Claim all clients
      self.clients.claim(),

      // Check storage quota
      StorageQuotaManager.checkStorageQuota()
    ]).then(() => {
      console.log('SW: Activation complete');
    })
  );
});

// Fetch event - advanced caching strategies
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip external requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  const url = new URL(event.request.url);

  // Different strategies based on request type
  if (urlsToCache.includes(url.pathname)) {
    // Static resources: Cache First with refresh
    event.respondWith(handleStaticRequest(event.request));
  } else if (url.pathname.startsWith('/api/')) {
    // API requests: Network First with cache fallback
    event.respondWith(handleApiRequest(event.request));
  } else {
    // Dynamic content: Stale While Revalidate
    event.respondWith(handleDynamicRequest(event.request));
  }
});

/**
 * Handle static resource requests (Cache First strategy)
 */
async function handleStaticRequest(request) {
  try {
    const cache = await caches.open(CACHE_CONFIG.STATIC_CACHE);
    const cachedResponse = await cache.match(request);

    if (cachedResponse && CacheManager.isCacheFresh(cachedResponse, CACHE_CONFIG.CACHE_TTL)) {
      console.log('SW: Serving fresh static content from cache:', request.url);
      return cachedResponse;
    }

    // Try to fetch fresh version
    try {
      const networkResponse = await fetch(request);
      if (networkResponse.ok) {
        const responseToCache = CacheManager.createCacheResponse(networkResponse.clone());
        await cache.put(request, responseToCache);
        console.log('SW: Updated static cache:', request.url);
        return networkResponse;
      }
    } catch (networkError) {
      console.log('SW: Network failed, using stale cache:', request.url);
    }

    // Return stale cache if available
    if (cachedResponse) {
      return cachedResponse;
    }

    // No cache available
    throw new Error('No cached version available');

  } catch (error) {
    console.error('SW: Static request failed:', error);

    // Return offline fallback for navigation requests
    if (request.mode === 'navigate') {
      const cache = await caches.open(CACHE_CONFIG.STATIC_CACHE);
      return cache.match('/dashboard') || cache.match('/');
    }

    return new Response('Offline', { status: 503 });
  }
}

/**
 * Handle API requests (Network First strategy)
 */
async function handleApiRequest(request) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), SW_CONFIG.NETWORK_TIMEOUT);

    const networkResponse = await fetch(request, {
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (networkResponse.ok) {
      // Cache successful API responses for offline access
      const cache = await caches.open(CACHE_CONFIG.DYNAMIC_CACHE);
      const responseToCache = CacheManager.createCacheResponse(networkResponse.clone());
      await cache.put(request, responseToCache);

      // Clean up cache periodically
      await CacheManager.cleanupCache(
        CACHE_CONFIG.DYNAMIC_CACHE,
        CACHE_CONFIG.MAX_DYNAMIC_CACHE_SIZE,
        CACHE_CONFIG.MAX_CACHED_ITEMS
      );
    }

    return networkResponse;

  } catch (error) {
    console.log('SW: API network failed, trying cache:', request.url);

    // Try to serve from cache
    const cache = await caches.open(CACHE_CONFIG.DYNAMIC_CACHE);
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
      console.log('SW: Serving API response from cache:', request.url);
      return cachedResponse;
    }

    return new Response(JSON.stringify({
      error: 'Service unavailable',
      offline: true
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * Handle dynamic content requests (Stale While Revalidate strategy)
 */
async function handleDynamicRequest(request) {
  const cache = await caches.open(CACHE_CONFIG.DYNAMIC_CACHE);
  const cachedResponse = await cache.match(request);

  // Serve from cache immediately if available
  const cachePromise = cachedResponse ? Promise.resolve(cachedResponse) : null;

  // Update cache in background
  const networkPromise = fetch(request).then(async (networkResponse) => {
    if (networkResponse.ok) {
      const responseToCache = CacheManager.createCacheResponse(networkResponse.clone());
      await cache.put(request, responseToCache);
    }
    return networkResponse;
  }).catch(() => null);

  // Return cached version immediately, or wait for network
  return cachePromise || networkPromise || new Response('Offline', { status: 503 });
}

// Background sync for workout data
self.addEventListener('sync', (event) => {
  console.log('SW: Background sync triggered:', event.tag);

  if (event.tag === SW_CONFIG.WORKOUT_SYNC_TAG) {
    event.waitUntil(BackgroundSyncManager.syncWorkouts());
  } else if (event.tag === SW_CONFIG.PROGRAM_SYNC_TAG) {
    event.waitUntil(BackgroundSyncManager.syncPrograms());
  }
});

// Message handling for communication with main thread
self.addEventListener('message', (event) => {
  const { type, data } = event.data;

  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;

    case 'CHECK_STORAGE':
      StorageQuotaManager.checkStorageQuota().then((quota) => {
        event.ports[0]?.postMessage(quota);
      });
      break;

    case 'CLEANUP_CACHE':
      Promise.all([
        CacheManager.cleanupCache(
          CACHE_CONFIG.DYNAMIC_CACHE,
          CACHE_CONFIG.MAX_DYNAMIC_CACHE_SIZE,
          CACHE_CONFIG.MAX_CACHED_ITEMS
        ),
        StorageQuotaManager.cleanupStorageSpace()
      ]).then(() => {
        event.ports[0]?.postMessage({ success: true });
      });
      break;

    case 'FORCE_SYNC':
      BackgroundSyncManager.syncWorkouts().then((result) => {
        event.ports[0]?.postMessage(result);
      });
      break;
  }
});

// Periodic cleanup (runs every hour when SW is active)
setInterval(async () => {
  await StorageQuotaManager.checkStorageQuota();
}, 60 * 60 * 1000);

console.log('SW: Service worker script loaded');