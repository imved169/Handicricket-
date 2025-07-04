const CACHE_NAME = 'handicricket-v1.0.0';
const urlsToCache = [
  '/',
  '/index.html',
  '/playing11.html',
  '/toss.html',
  '/game.html',
  '/spectator.html',
  '/scoreboard.html',
  '/ai-game.html',
  '/history.html',
  '/css/styles.css',
  '/css/responsive.css',
  '/css/animations.css',
  '/js/firebase.js',
  '/js/utils.js',
  '/js/game-logic.js',
  '/js/ai-opponent.js',
  '/js/spectator.js',
  '/manifest.json',
  // External resources
  'https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js',
  'https://www.gstatic.com/firebasejs/9.15.0/firebase-database.js',
  'https://cdn.jsdelivr.net/npm/feather-icons@4.28.0/icons/target.svg',
  'https://cdn.jsdelivr.net/npm/feather-icons@4.28.0/icons/zap.svg',
  'https://cdn.jsdelivr.net/npm/feather-icons@4.28.0/icons/cpu.svg',
  'https://cdn.jsdelivr.net/npm/feather-icons@4.28.0/icons/eye.svg'
];

// Install event - cache resources
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
      .catch(error => {
        console.error('Error caching resources:', error);
      })
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      })
      .catch(error => {
        console.error('Fetch failed:', error);
        
        // Provide offline fallback for navigation requests
        if (event.request.destination === 'document') {
          return caches.match('/index.html');
        }
        
        // Provide offline fallback for other requests
        return new Response('Offline - Please check your internet connection', {
          status: 503,
          statusText: 'Service Unavailable',
          headers: new Headers({
            'Content-Type': 'text/plain'
          })
        });
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Background sync for offline actions
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  // Handle any queued actions when back online
  try {
    const queuedActions = await getQueuedActions();
    for (const action of queuedActions) {
      await processAction(action);
    }
    await clearQueuedActions();
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

async function getQueuedActions() {
  // Retrieve queued actions from IndexedDB or localStorage
  try {
    const cache = await caches.open(CACHE_NAME);
    const response = await cache.match('/offline-actions');
    if (response) {
      return await response.json();
    }
  } catch (error) {
    console.error('Error retrieving queued actions:', error);
  }
  return [];
}

async function processAction(action) {
  // Process individual queued actions
  switch (action.type) {
    case 'GAME_MOVE':
      await syncGameMove(action.data);
      break;
    case 'CHAT_MESSAGE':
      await syncChatMessage(action.data);
      break;
    case 'SPECTATOR_REACTION':
      await syncSpectatorReaction(action.data);
      break;
    default:
      console.warn('Unknown action type:', action.type);
  }
}

async function syncGameMove(data) {
  // Sync game moves when back online
  try {
    const response = await fetch('/api/game/move', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      throw new Error('Failed to sync game move');
    }
  } catch (error) {
    console.error('Error syncing game move:', error);
  }
}

async function syncChatMessage(data) {
  // Sync chat messages when back online
  try {
    const response = await fetch('/api/chat/message', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      throw new Error('Failed to sync chat message');
    }
  } catch (error) {
    console.error('Error syncing chat message:', error);
  }
}

async function syncSpectatorReaction(data) {
  // Sync spectator reactions when back online
  try {
    const response = await fetch('/api/spectator/reaction', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      throw new Error('Failed to sync spectator reaction');
    }
  } catch (error) {
    console.error('Error syncing spectator reaction:', error);
  }
}

async function clearQueuedActions() {
  // Clear queued actions after successful sync
  try {
    const cache = await caches.open(CACHE_NAME);
    await cache.delete('/offline-actions');
  } catch (error) {
    console.error('Error clearing queued actions:', error);
  }
}

// Push notifications
self.addEventListener('push', event => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: data.icon || '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: data.primaryKey
      },
      actions: [
        {
          action: 'explore',
          title: 'Open Game',
          icon: '/icons/checkmark.png'
        },
        {
          action: 'close',
          title: 'Close',
          icon: '/icons/xmark.png'
        }
      ]
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

// Notification click handling
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  if (event.action === 'explore') {
    // Handle explore action
    event.waitUntil(
      clients.openWindow('/')
    );
  } else if (event.action === 'close') {
    // Handle close action
    event.notification.close();
  } else {
    // Handle default click
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Message handling from main thread
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Periodic background sync
self.addEventListener('periodicsync', event => {
  if (event.tag === 'game-sync') {
    event.waitUntil(periodicSync());
  }
});

async function periodicSync() {
  // Perform periodic sync operations
  try {
    // Sync game state
    await syncGameState();
    
    // Clean up old data
    await cleanupOldData();
    
    // Update cache
    await updateCache();
    
  } catch (error) {
    console.error('Periodic sync failed:', error);
  }
}

async function syncGameState() {
  // Sync current game state
  try {
    const response = await fetch('/api/game/state', {
      method: 'GET'
    });
    
    if (response.ok) {
      const gameState = await response.json();
      // Update local cache with latest game state
      const cache = await caches.open(CACHE_NAME);
      await cache.put('/game-state', new Response(JSON.stringify(gameState)));
    }
  } catch (error) {
    console.error('Error syncing game state:', error);
  }
}

async function cleanupOldData() {
  // Clean up old cached data
  try {
    const cache = await caches.open(CACHE_NAME);
    const keys = await cache.keys();
    
    for (const key of keys) {
      const response = await cache.match(key);
      if (response) {
        const date = new Date(response.headers.get('date'));
        const now = new Date();
        const daysDiff = (now - date) / (1000 * 60 * 60 * 24);
        
        // Remove entries older than 7 days
        if (daysDiff > 7) {
          await cache.delete(key);
        }
      }
    }
  } catch (error) {
    console.error('Error cleaning up old data:', error);
  }
}

async function updateCache() {
  // Update cache with latest resources
  try {
    const cache = await caches.open(CACHE_NAME);
    
    // Update critical resources
    const criticalResources = [
      '/',
      '/index.html',
      '/css/styles.css',
      '/js/firebase.js',
      '/js/utils.js'
    ];
    
    for (const resource of criticalResources) {
      try {
        const response = await fetch(resource);
        if (response.ok) {
          await cache.put(resource, response);
        }
      } catch (error) {
        console.warn('Failed to update cache for:', resource, error);
      }
    }
  } catch (error) {
    console.error('Error updating cache:', error);
  }
}

// Error handling
self.addEventListener('error', event => {
  console.error('Service Worker error:', event.error);
});

self.addEventListener('unhandledrejection', event => {
  console.error('Unhandled promise rejection in SW:', event.reason);
});

console.log('HandiCricket Service Worker loaded');
