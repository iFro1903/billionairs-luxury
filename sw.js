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

// ============================================================================
// Background Sync
// ============================================================================

/**
 * Background Sync Event Handler
 * Triggers when connection is restored or sync is registered
 */
self.addEventListener('sync', (event) => {
    console.log('[Service Worker] Background sync triggered:', event.tag);
    
    switch (event.tag) {
        case 'sync-messages':
            event.waitUntil(syncMessages());
            break;
        
        case 'sync-payments':
            event.waitUntil(syncPayments());
            break;
        
        case 'sync-actions':
            event.waitUntil(syncActions());
            break;
        
        default:
            console.log('[Service Worker] Unknown sync tag:', event.tag);
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

/**
 * Sync pending messages from IndexedDB
 */
async function syncMessages() {
    try {
        console.log('[Service Worker] Syncing messages...');
        
        const pendingMessages = await getPendingMessages();
        console.log(`[Service Worker] Found ${pendingMessages.length} pending messages`);
        
        let syncedCount = 0;
        const errors = [];
        
        for (const message of pendingMessages) {
            try {
                const response = await fetch('/api/chat', {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(message)
                });
                
                if (response.ok) {
                    await removePendingMessage(message.id);
                    syncedCount++;
                    console.log(`[Service Worker] Message synced: ${message.id}`);
                } else {
                    errors.push({ id: message.id, status: response.status });
                }
            } catch (error) {
                console.error('[Service Worker] Failed to sync message:', error);
                errors.push({ id: message.id, error: error.message });
            }
        }
        
        console.log(`[Service Worker] Messages sync complete: ${syncedCount}/${pendingMessages.length} synced`);
        
        // Show notification if there were messages synced
        if (syncedCount > 0) {
            await self.registration.showNotification('BILLIONAIRS - Messages Synced', {
                body: `${syncedCount} message${syncedCount > 1 ? 's' : ''} synchronized`,
                icon: '/assets/images/icon-192x192.png',
                badge: '/assets/images/icon-72x72.png',
                tag: 'sync-complete',
                requireInteraction: false
            });
        }
        
        return { syncedCount, errors };
    } catch (error) {
        console.error('[Service Worker] Message sync failed:', error);
        throw error;
    }
}

/**
 * Sync pending payments from IndexedDB
 */
async function syncPayments() {
    try {
        console.log('[Service Worker] Syncing payments...');
        
        const pendingPayments = await getPendingPayments();
        console.log(`[Service Worker] Found ${pendingPayments.length} pending payments`);
        
        let syncedCount = 0;
        const errors = [];
        
        for (const payment of pendingPayments) {
            try {
                const response = await fetch('/api/payment', {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(payment)
                });
                
                if (response.ok) {
                    await removePendingPayment(payment.id);
                    syncedCount++;
                    console.log(`[Service Worker] Payment synced: ${payment.id}`);
                } else {
                    errors.push({ id: payment.id, status: response.status });
                }
            } catch (error) {
                console.error('[Service Worker] Failed to sync payment:', error);
                errors.push({ id: payment.id, error: error.message });
            }
        }
        
        console.log(`[Service Worker] Payments sync complete: ${syncedCount}/${pendingPayments.length} synced`);
        
        if (syncedCount > 0) {
            await self.registration.showNotification('BILLIONAIRS - Payments Synced', {
                body: `${syncedCount} payment${syncedCount > 1 ? 's' : ''} synchronized`,
                icon: '/assets/images/icon-192x192.png',
                badge: '/assets/images/icon-72x72.png',
                tag: 'sync-complete',
                requireInteraction: false
            });
        }
        
        return { syncedCount, errors };
    } catch (error) {
        console.error('[Service Worker] Payment sync failed:', error);
        throw error;
    }
}

/**
 * Sync pending actions from IndexedDB
 */
async function syncActions() {
    try {
        console.log('[Service Worker] Syncing actions...');
        
        const pendingActions = await getPendingActions();
        console.log(`[Service Worker] Found ${pendingActions.length} pending actions`);
        
        let syncedCount = 0;
        const errors = [];
        
        for (const action of pendingActions) {
            try {
                const response = await fetch(`/api/${action.type}`, {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(action.data)
                });
                
                if (response.ok) {
                    await removePendingAction(action.id);
                    syncedCount++;
                    console.log(`[Service Worker] Action synced: ${action.id} (${action.type})`);
                } else {
                    errors.push({ id: action.id, type: action.type, status: response.status });
                }
            } catch (error) {
                console.error('[Service Worker] Failed to sync action:', error);
                errors.push({ id: action.id, type: action.type, error: error.message });
            }
        }
        
        console.log(`[Service Worker] Actions sync complete: ${syncedCount}/${pendingActions.length} synced`);
        
        if (syncedCount > 0) {
            await self.registration.showNotification('BILLIONAIRS - Actions Synced', {
                body: `${syncedCount} action${syncedCount > 1 ? 's' : ''} synchronized`,
                icon: '/assets/images/icon-192x192.png',
                badge: '/assets/images/icon-72x72.png',
                tag: 'sync-complete',
                requireInteraction: false
            });
        }
        
        return { syncedCount, errors };
    } catch (error) {
        console.error('[Service Worker] Action sync failed:', error);
        throw error;
    }
}

/**
 * Get pending messages from IndexedDB
 */
async function getPendingMessages() {
    try {
        const db = await openIndexedDB();
        
        return await new Promise((resolve, reject) => {
            const transaction = db.transaction(['pendingMessages'], 'readonly');
            const store = transaction.objectStore('pendingMessages');
            const request = store.getAll();
            
            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => reject(request.error);
        });
    } catch (error) {
        console.error('[Service Worker] Failed to get pending messages:', error);
        return [];
    }
}

/**
 * Get pending payments from IndexedDB
 */
async function getPendingPayments() {
    try {
        const db = await openIndexedDB();
        
        return await new Promise((resolve, reject) => {
            const transaction = db.transaction(['pendingPayments'], 'readonly');
            const store = transaction.objectStore('pendingPayments');
            const request = store.getAll();
            
            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => reject(request.error);
        });
    } catch (error) {
        console.error('[Service Worker] Failed to get pending payments:', error);
        return [];
    }
}

/**
 * Get pending actions from IndexedDB
 */
async function getPendingActions() {
    try {
        const db = await openIndexedDB();
        
        return await new Promise((resolve, reject) => {
            const transaction = db.transaction(['pendingActions'], 'readonly');
            const store = transaction.objectStore('pendingActions');
            const request = store.getAll();
            
            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => reject(request.error);
        });
    } catch (error) {
        console.error('[Service Worker] Failed to get pending actions:', error);
        return [];
    }
}

/**
 * Remove synced message from IndexedDB
 */
async function removePendingMessage(id) {
    try {
        const db = await openIndexedDB();
        
        return await new Promise((resolve, reject) => {
            const transaction = db.transaction(['pendingMessages'], 'readwrite');
            const store = transaction.objectStore('pendingMessages');
            const request = store.delete(id);
            
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    } catch (error) {
        console.error('[Service Worker] Failed to remove pending message:', error);
    }
}

/**
 * Remove synced payment from IndexedDB
 */
async function removePendingPayment(id) {
    try {
        const db = await openIndexedDB();
        
        return await new Promise((resolve, reject) => {
            const transaction = db.transaction(['pendingPayments'], 'readwrite');
            const store = transaction.objectStore('pendingPayments');
            const request = store.delete(id);
            
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    } catch (error) {
        console.error('[Service Worker] Failed to remove pending payment:', error);
    }
}

/**
 * Remove synced action from IndexedDB
 */
async function removePendingAction(id) {
    try {
        const db = await openIndexedDB();
        
        return await new Promise((resolve, reject) => {
            const transaction = db.transaction(['pendingActions'], 'readwrite');
            const store = transaction.objectStore('pendingActions');
            const request = store.delete(id);
            
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    } catch (error) {
        console.error('[Service Worker] Failed to remove pending action:', error);
    }
}

/**
 * Open IndexedDB connection
 */
function openIndexedDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('billionairs-sync', 1);
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
        
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            
            if (!db.objectStoreNames.contains('pendingMessages')) {
                const messageStore = db.createObjectStore('pendingMessages', { 
                    keyPath: 'id', 
                    autoIncrement: true 
                });
                messageStore.createIndex('timestamp', 'timestamp', { unique: false });
            }
            
            if (!db.objectStoreNames.contains('pendingPayments')) {
                const paymentStore = db.createObjectStore('pendingPayments', { 
                    keyPath: 'id', 
                    autoIncrement: true 
                });
                paymentStore.createIndex('timestamp', 'timestamp', { unique: false });
            }
            
            if (!db.objectStoreNames.contains('pendingActions')) {
                const actionStore = db.createObjectStore('pendingActions', { 
                    keyPath: 'id', 
                    autoIncrement: true 
                });
                actionStore.createIndex('timestamp', 'timestamp', { unique: false });
                actionStore.createIndex('type', 'type', { unique: false });
            }
        };
    });
}

// ============================================================================
// Push Notifications
// ============================================================================

/**
 * Handle incoming Push Notifications
 */
self.addEventListener('push', (event) => {
    console.log('[Service Worker] Push notification received');
    
    let notificationData = {
        title: 'BILLIONAIRS',
        body: 'You have a new notification',
        icon: '/assets/images/icon-192x192.png',
        badge: '/assets/images/icon-72x72.png',
        data: {
            url: '/'
        }
    };

    // Parse notification data if available
    if (event.data) {
        try {
            const data = event.data.json();
            notificationData = {
                title: data.title || notificationData.title,
                body: data.message || data.body || notificationData.body,
                icon: data.icon || notificationData.icon,
                badge: data.badge || notificationData.badge,
                image: data.image,
                tag: data.tag || 'billionairs-notification',
                requireInteraction: data.requireInteraction || false,
                actions: data.actions || [],
                data: {
                    url: data.url || '/',
                    ...data.data
                }
            };
        } catch (err) {
            console.error('[Service Worker] Error parsing push data:', err);
        }
    }

    // Show notification
    event.waitUntil(
        self.registration.showNotification(notificationData.title, {
            body: notificationData.body,
            icon: notificationData.icon,
            badge: notificationData.badge,
            image: notificationData.image,
            tag: notificationData.tag,
            requireInteraction: notificationData.requireInteraction,
            actions: notificationData.actions,
            data: notificationData.data,
            vibrate: [200, 100, 200],
            timestamp: Date.now()
        })
    );
});

/**
 * Handle notification click
 */
self.addEventListener('notificationclick', (event) => {
    console.log('[Service Worker] Notification clicked');
    
    event.notification.close();

    // Get URL from notification data
    const urlToOpen = event.notification.data?.url || '/';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then((clientList) => {
                // Check if there's already a window open
                for (const client of clientList) {
                    if (client.url === urlToOpen && 'focus' in client) {
                        return client.focus();
                    }
                }
                
                // Open new window if none found
                if (clients.openWindow) {
                    return clients.openWindow(urlToOpen);
                }
            })
    );
});

/**
 * Handle notification close
 */
self.addEventListener('notificationclose', (event) => {
    console.log('[Service Worker] Notification closed', event.notification.tag);
    
    // Optional: Send analytics event that notification was dismissed
    // event.waitUntil(
    //     fetch('/api/analytics', {
    //         method: 'POST',
    //         body: JSON.stringify({
    //             event: 'notification_dismissed',
    //             tag: event.notification.tag
    //         })
    //     })
    // );
});

console.log('[Service Worker] Loaded successfully ✓');

