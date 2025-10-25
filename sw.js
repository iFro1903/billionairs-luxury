// Service Worker for BILLIONAIRS PWA
// Provides offline support and caching

const CACHE_NAME = 'billionairs-v1.0.0';
const RUNTIME_CACHE = 'billionairs-runtime';

// Resources to cache immediately on install
const PRECACHE_URLS = [
    '/',
    '/index.html',
    '/dashboard.html',
    '/login.html',
    '/create-account.html',
    '/assets/css/styles.css',
    '/assets/css/easter-egg.css',
    '/assets/css/admin.css',
    '/assets/css/cookie-consent.css',
    '/assets/js/analytics.js',
    '/assets/js/cookie-consent.js',
    '/assets/images/logo.png',
    '/manifest.json'
];

// Install event - cache core resources
self.addEventListener('install', (event) => {
    console.log('[Service Worker] Installing...');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[Service Worker] Pre-caching core resources');
                return cache.addAll(PRECACHE_URLS);
            })
            .then(() => {
                console.log('[Service Worker] Installed successfully');
                return self.skipWaiting(); // Activate immediately
            })
            .catch((error) => {
                console.error('[Service Worker] Pre-caching failed:', error);
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('[Service Worker] Activating...');
    
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE) {
                        console.log('[Service Worker] Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            console.log('[Service Worker] Activated successfully');
            return self.clients.claim(); // Take control immediately
        })
    );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip cross-origin requests
    if (url.origin !== location.origin) {
        return;
    }

    // Skip API requests (always go to network)
    if (url.pathname.startsWith('/api/')) {
        return;
    }

    // Network-first strategy for HTML pages (always get fresh content)
    if (request.headers.get('accept')?.includes('text/html')) {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    // Cache the response
                    const responseClone = response.clone();
                    caches.open(RUNTIME_CACHE).then((cache) => {
                        cache.put(request, responseClone);
                    });
                    return response;
                })
                .catch(() => {
                    // Fallback to cache if network fails
                    return caches.match(request)
                        .then((cachedResponse) => {
                            if (cachedResponse) {
                                return cachedResponse;
                            }
                            // Return offline page if available
                            return caches.match('/offline.html');
                        });
                })
        );
        return;
    }

    // Cache-first strategy for assets (CSS, JS, images)
    event.respondWith(
        caches.match(request)
            .then((cachedResponse) => {
                if (cachedResponse) {
                    // Return cached version
                    return cachedResponse;
                }

                // Not in cache, fetch from network
                return fetch(request)
                    .then((response) => {
                        // Don't cache if not successful
                        if (!response || response.status !== 200 || response.type === 'error') {
                            return response;
                        }

                        // Cache the fetched resource
                        const responseClone = response.clone();
                        caches.open(RUNTIME_CACHE).then((cache) => {
                            cache.put(request, responseClone);
                        });

                        return response;
                    })
                    .catch((error) => {
                        console.error('[Service Worker] Fetch failed:', error);
                        
                        // Return placeholder for images if offline
                        if (request.destination === 'image') {
                            return new Response(
                                '<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg"><rect fill="#1a1a2e" width="200" height="200"/><text fill="#d4af37" x="50%" y="50%" text-anchor="middle" dy=".3em" font-family="Arial" font-size="16">Offline</text></svg>',
                                { headers: { 'Content-Type': 'image/svg+xml' } }
                            );
                        }
                        
                        throw error;
                    });
            })
    );
});

// Background Sync - for offline actions
self.addEventListener('sync', (event) => {
    console.log('[Service Worker] Background sync:', event.tag);
    
    if (event.tag === 'sync-messages') {
        event.waitUntil(syncMessages());
    }
});

// Push Notifications (future feature)
self.addEventListener('push', (event) => {
    console.log('[Service Worker] Push received:', event);
    
    const data = event.data ? event.data.json() : {};
    const title = data.title || 'BILLIONAIRS';
    const options = {
        body: data.body || 'New notification',
        icon: '/assets/images/icon-192x192.png',
        badge: '/assets/images/icon-72x72.png',
        vibrate: [200, 100, 200],
        tag: 'billionairs-notification',
        data: data,
        actions: [
            {
                action: 'open',
                title: 'Open',
                icon: '/assets/images/icon-72x72.png'
            },
            {
                action: 'close',
                title: 'Close',
                icon: '/assets/images/icon-72x72.png'
            }
        ]
    };

    event.waitUntil(
        self.registration.showNotification(title, options)
    );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
    console.log('[Service Worker] Notification clicked:', event.action);
    
    event.notification.close();

    if (event.action === 'open' || !event.action) {
        event.waitUntil(
            clients.openWindow(event.notification.data?.url || '/dashboard')
        );
    }
});

// Helper function for background sync
async function syncMessages() {
    try {
        // Get pending messages from IndexedDB
        const pendingMessages = await getPendingMessages();
        
        for (const message of pendingMessages) {
            try {
                const response = await fetch('/api/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(message)
                });
                
                if (response.ok) {
                    await removePendingMessage(message.id);
                }
            } catch (error) {
                console.error('[Service Worker] Sync failed for message:', error);
            }
        }
    } catch (error) {
        console.error('[Service Worker] Background sync failed:', error);
    }
}

// IndexedDB helpers (simplified)
async function getPendingMessages() {
    // TODO: Implement IndexedDB logic if needed
    return [];
}

async function removePendingMessage(id) {
    // TODO: Implement IndexedDB logic if needed
    return true;
}

console.log('[Service Worker] Loaded successfully ✓');
