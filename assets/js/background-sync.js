/**
 * Background Sync Manager
 * Handles offline data persistence and synchronization
 */

class BackgroundSyncManager {
    constructor() {
        this.dbName = 'billionairs-sync';
        this.dbVersion = 1;
        this.db = null;
        this.init();
    }

    /**
     * Initialize IndexedDB
     */
    async init() {
        try {
            this.db = await this.openDB();
        } catch (err) {
            console.error('❌ Failed to initialize Background Sync DB:', err);
        }
    }

    /**
     * Open IndexedDB connection
     */
    openDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // Create object stores if they don't exist
                if (!db.objectStoreNames.contains('pendingMessages')) {
                    const messageStore = db.createObjectStore('pendingMessages', { 
                        keyPath: 'id', 
                        autoIncrement: true 
                    });
                    messageStore.createIndex('timestamp', 'timestamp', { unique: false });
                    messageStore.createIndex('userEmail', 'userEmail', { unique: false });
                }

                if (!db.objectStoreNames.contains('pendingPayments')) {
                    const paymentStore = db.createObjectStore('pendingPayments', { 
                        keyPath: 'id', 
                        autoIncrement: true 
                    });
                    paymentStore.createIndex('timestamp', 'timestamp', { unique: false });
                    paymentStore.createIndex('userEmail', 'userEmail', { unique: false });
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

    /**
     * Save pending message for sync
     */
    async savePendingMessage(messageData) {
        try {
            if (!this.db) await this.init();

            const transaction = this.db.transaction(['pendingMessages'], 'readwrite');
            const store = transaction.objectStore('pendingMessages');

            const message = {
                ...messageData,
                timestamp: Date.now(),
                synced: false
            };

            const id = await new Promise((resolve, reject) => {
                const request = store.add(message);
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });

            // Register sync event
            await this.registerSync('sync-messages');

            return id;
        } catch (err) {
            console.error('❌ Failed to save pending message:', err);
            throw err;
        }
    }

    /**
     * Save pending payment for sync
     */
    async savePendingPayment(paymentData) {
        try {
            if (!this.db) await this.init();

            const transaction = this.db.transaction(['pendingPayments'], 'readwrite');
            const store = transaction.objectStore('pendingPayments');

            const payment = {
                ...paymentData,
                timestamp: Date.now(),
                synced: false
            };

            const id = await new Promise((resolve, reject) => {
                const request = store.add(payment);
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });

            // Register sync event
            await this.registerSync('sync-payments');

            return id;
        } catch (err) {
            console.error('❌ Failed to save pending payment:', err);
            throw err;
        }
    }

    /**
     * Save pending action for sync
     */
    async savePendingAction(actionType, actionData) {
        try {
            if (!this.db) await this.init();

            const transaction = this.db.transaction(['pendingActions'], 'readwrite');
            const store = transaction.objectStore('pendingActions');

            const action = {
                type: actionType,
                data: actionData,
                timestamp: Date.now(),
                synced: false
            };

            const id = await new Promise((resolve, reject) => {
                const request = store.add(action);
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });

            // Register sync event
            await this.registerSync('sync-actions');

            return id;
        } catch (err) {
            console.error('❌ Failed to save pending action:', err);
            throw err;
        }
    }

    /**
     * Get all pending messages
     */
    async getPendingMessages() {
        try {
            if (!this.db) await this.init();

            const transaction = this.db.transaction(['pendingMessages'], 'readonly');
            const store = transaction.objectStore('pendingMessages');

            return await new Promise((resolve, reject) => {
                const request = store.getAll();
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });
        } catch (err) {
            console.error('❌ Failed to get pending messages:', err);
            return [];
        }
    }

    /**
     * Get all pending payments
     */
    async getPendingPayments() {
        try {
            if (!this.db) await this.init();

            const transaction = this.db.transaction(['pendingPayments'], 'readonly');
            const store = transaction.objectStore('pendingPayments');

            return await new Promise((resolve, reject) => {
                const request = store.getAll();
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });
        } catch (err) {
            console.error('❌ Failed to get pending payments:', err);
            return [];
        }
    }

    /**
     * Get all pending actions
     */
    async getPendingActions() {
        try {
            if (!this.db) await this.init();

            const transaction = this.db.transaction(['pendingActions'], 'readonly');
            const store = transaction.objectStore('pendingActions');

            return await new Promise((resolve, reject) => {
                const request = store.getAll();
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });
        } catch (err) {
            console.error('❌ Failed to get pending actions:', err);
            return [];
        }
    }

    /**
     * Remove synced message
     */
    async removePendingMessage(id) {
        try {
            if (!this.db) await this.init();

            const transaction = this.db.transaction(['pendingMessages'], 'readwrite');
            const store = transaction.objectStore('pendingMessages');

            await new Promise((resolve, reject) => {
                const request = store.delete(id);
                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            });

        } catch (err) {
            console.error('❌ Failed to remove pending message:', err);
        }
    }

    /**
     * Remove synced payment
     */
    async removePendingPayment(id) {
        try {
            if (!this.db) await this.init();

            const transaction = this.db.transaction(['pendingPayments'], 'readwrite');
            const store = transaction.objectStore('pendingPayments');

            await new Promise((resolve, reject) => {
                const request = store.delete(id);
                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            });

        } catch (err) {
            console.error('❌ Failed to remove pending payment:', err);
        }
    }

    /**
     * Remove synced action
     */
    async removePendingAction(id) {
        try {
            if (!this.db) await this.init();

            const transaction = this.db.transaction(['pendingActions'], 'readwrite');
            const store = transaction.objectStore('pendingActions');

            await new Promise((resolve, reject) => {
                const request = store.delete(id);
                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            });

        } catch (err) {
            console.error('❌ Failed to remove pending action:', err);
        }
    }

    /**
     * Register background sync with Service Worker
     */
    async registerSync(tag) {
        try {
            if (!('serviceWorker' in navigator) || !('SyncManager' in window)) {
                    return false;
            }

            const registration = await navigator.serviceWorker.ready;
            await registration.sync.register(tag);
            return true;
        } catch (err) {
            console.error('❌ Failed to register background sync:', err);
            return false;
        }
    }

    /**
     * Manually trigger sync (for browsers without Background Sync API)
     */
    async manualSync() {
        let syncedCount = 0;

        // Sync messages
        const messages = await this.getPendingMessages();
        for (const message of messages) {
            try {
                const response = await fetch('/api/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(message.data)
                });

                if (response.ok) {
                    await this.removePendingMessage(message.id);
                    syncedCount++;
                }
            } catch (err) {
                console.error('❌ Failed to sync message:', err);
            }
        }

        // Sync payments
        const payments = await this.getPendingPayments();
        for (const payment of payments) {
            try {
                const response = await fetch('/api/payment', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payment.data)
                });

                if (response.ok) {
                    await this.removePendingPayment(payment.id);
                    syncedCount++;
                }
            } catch (err) {
                console.error('❌ Failed to sync payment:', err);
            }
        }

        // Sync actions
        const actions = await this.getPendingActions();
        for (const action of actions) {
            try {
                const response = await fetch(`/api/${action.type}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(action.data)
                });

                if (response.ok) {
                    await this.removePendingAction(action.id);
                    syncedCount++;
                }
            } catch (err) {
                console.error('❌ Failed to sync action:', err);
            }
        }

        return syncedCount;
    }

    /**
     * Get sync status
     */
    async getSyncStatus() {
        const messages = await this.getPendingMessages();
        const payments = await this.getPendingPayments();
        const actions = await this.getPendingActions();

        return {
            hasPendingItems: messages.length > 0 || payments.length > 0 || actions.length > 0,
            pendingMessages: messages.length,
            pendingPayments: payments.length,
            pendingActions: actions.length,
            totalPending: messages.length + payments.length + actions.length
        };
    }

    /**
     * Clear all pending data (use with caution!)
     */
    async clearAllPending() {
        try {
            if (!this.db) await this.init();

            const transaction = this.db.transaction(
                ['pendingMessages', 'pendingPayments', 'pendingActions'], 
                'readwrite'
            );

            await Promise.all([
                new Promise((resolve, reject) => {
                    const request = transaction.objectStore('pendingMessages').clear();
                    request.onsuccess = () => resolve();
                    request.onerror = () => reject(request.error);
                }),
                new Promise((resolve, reject) => {
                    const request = transaction.objectStore('pendingPayments').clear();
                    request.onsuccess = () => resolve();
                    request.onerror = () => reject(request.error);
                }),
                new Promise((resolve, reject) => {
                    const request = transaction.objectStore('pendingActions').clear();
                    request.onsuccess = () => resolve();
                    request.onerror = () => reject(request.error);
                })
            ]);

        } catch (err) {
            console.error('❌ Failed to clear pending data:', err);
        }
    }
}

// Initialize global instance
const backgroundSync = new BackgroundSyncManager();

// Auto-sync when coming back online
window.addEventListener('online', async () => {
    const syncedCount = await backgroundSync.manualSync();
    
    if (syncedCount > 0) {
        // Show notification to user
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('BILLIONAIRS - Sync Complete', {
                body: `${syncedCount} items successfully synchronized`,
                icon: '/assets/images/icon-192x192.png'
            });
        }
    }
});

// Export for use in other scripts
window.backgroundSync = backgroundSync;
