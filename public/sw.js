const CACHE_NAME = 'workout-tracker-v1';
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

// Install event - cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching files');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('Service Worker: Installed and cached files');
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Deleting old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('Service Worker: Activated');
      return self.clients.claim();
    })
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip external requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        if (response) {
          console.log('Service Worker: Serving from cache', event.request.url);
          return response;
        }

        console.log('Service Worker: Fetching from network', event.request.url);
        return fetch(event.request).then((response) => {
          // Don't cache if not a valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Clone the response as it can only be consumed once
          const responseToCache = response.clone();

          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });

          return response;
        });
      })
      .catch(() => {
        // Return offline page for navigation requests
        if (event.request.mode === 'navigate') {
          return caches.match('/dashboard');
        }
      })
  );
});

// Background sync for workout data
self.addEventListener('sync', (event) => {
  if (event.tag === 'workout-sync') {
    event.waitUntil(syncWorkoutData());
  }
});

async function syncWorkoutData() {
  try {
    // Get workout data from IndexedDB or localStorage
    const workoutData = await getStoredWorkoutData();

    if (workoutData && workoutData.length > 0) {
      // Sync with Firebase when online
      for (const workout of workoutData) {
        try {
          await syncWorkoutToFirebase(workout);
          await removeStoredWorkoutData(workout.id);
        } catch (error) {
          console.log('Failed to sync workout:', error);
        }
      }
    }
  } catch (error) {
    console.log('Background sync failed:', error);
  }
}

// Helper functions for offline storage
async function getStoredWorkoutData() {
  // This would integrate with the localStorage backup system
  const stored = localStorage.getItem('offline-workouts');
  return stored ? JSON.parse(stored) : [];
}

async function removeStoredWorkoutData(workoutId) {
  const stored = await getStoredWorkoutData();
  const updated = stored.filter(w => w.id !== workoutId);
  localStorage.setItem('offline-workouts', JSON.stringify(updated));
}

async function syncWorkoutToFirebase(workout) {
  // This would integrate with your Firebase sync logic
  return fetch('/api/sync-workout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(workout)
  });
}