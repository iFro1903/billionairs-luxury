/**
 * Push Notifications Manager
 * Handles Web Push subscription and notification permissions
 */

class PushNotificationManager {
    constructor() {
        this.vapidPublicKey = 'BImYUR7FiZgYywJNjKzSiIkDPdotF5OX5E1h023JBKk4Yr6nSnIzq6OD5PDNKLSl-UK1xxoFFY4uWWPyNAJaoGs';
        this.subscription = null;
    }

    /**
     * Check if Push Notifications are supported
     */
    isSupported() {
        return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
    }

    /**
     * Get current permission status
     */
    getPermissionStatus() {
        if (!this.isSupported()) {
            return 'unsupported';
        }
        return Notification.permission;
    }

    /**
     * Request notification permission
     */
    async requestPermission() {
        if (!this.isSupported()) {
            console.warn('Push notifications not supported');
            return false;
        }

        if (Notification.permission === 'granted') {
            return true;
        }

        if (Notification.permission === 'denied') {
            console.warn('❌ Notification permission denied');
            return false;
        }

        try {
            const permission = await Notification.requestPermission();
            return permission === 'granted';
        } catch (err) {
            console.error('Error requesting notification permission:', err);
            return false;
        }
    }

    /**
     * Convert VAPID public key to Uint8Array
     */
    urlBase64ToUint8Array(base64String) {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding)
            .replace(/\-/g, '+')
            .replace(/_/g, '/');

        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);

        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    }

    /**
     * Subscribe to push notifications
     */
    async subscribe() {
        if (!this.isSupported()) {
            throw new Error('Push notifications not supported');
        }

        try {
            // Request permission first
            const hasPermission = await this.requestPermission();
            if (!hasPermission) {
                throw new Error('Notification permission denied');
            }

            // Get service worker registration
            const registration = await navigator.serviceWorker.ready;

            // Check if already subscribed
            let subscription = await registration.pushManager.getSubscription();
            
            if (!subscription) {
                // Create new subscription
                subscription = await registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: this.urlBase64ToUint8Array(this.vapidPublicKey)
                });
            }

            this.subscription = subscription;

            // Send subscription to server
            await this.sendSubscriptionToServer(subscription);

            return subscription;
        } catch (err) {
            console.error('❌ Failed to subscribe:', err);
            throw err;
        }
    }

    /**
     * Send subscription to server
     */
    async sendSubscriptionToServer(subscription) {
        try {
            // Get user email from session/localStorage
            const userEmail = sessionStorage.getItem('userEmail') || 
                              localStorage.getItem('userEmail') || null;
            
            const headers = {
                'Content-Type': 'application/json'
            };
            if (userEmail) {
                headers['x-user-email'] = userEmail;
            }
            
            const response = await fetch('/api/push-subscribe', {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({
                    subscription: subscription.toJSON(),
                    userAgent: navigator.userAgent,
                    email: userEmail
                })
            });

            if (!response.ok) {
                throw new Error(`Server responded with ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (err) {
            console.error('❌ Failed to send subscription to server:', err);
            throw err;
        }
    }

    /**
     * Unsubscribe from push notifications
     */
    async unsubscribe() {
        try {
            if (!this.subscription) {
                const registration = await navigator.serviceWorker.ready;
                this.subscription = await registration.pushManager.getSubscription();
            }

            if (this.subscription) {
                await this.subscription.unsubscribe();
                this.subscription = null;
                return true;
            }

            return false;
        } catch (err) {
            console.error('❌ Failed to unsubscribe:', err);
            throw err;
        }
    }

    /**
     * Get current subscription
     */
    async getSubscription() {
        try {
            const registration = await navigator.serviceWorker.ready;
            this.subscription = await registration.pushManager.getSubscription();
            return this.subscription;
        } catch (err) {
            console.error('Error getting subscription:', err);
            return null;
        }
    }

    /**
     * Show notification (for testing)
     */
    async showTestNotification() {
        if (!this.isSupported()) {
            window.toast.info('Push notifications are not supported in this browser.', { title: 'Not Supported' });
            return;
        }

        if (Notification.permission !== 'granted') {
            await this.requestPermission();
        }

        if (Notification.permission === 'granted') {
            const registration = await navigator.serviceWorker.ready;
            registration.showNotification('🎉 Test Notification', {
                body: 'This is a test notification from BILLIONAIRS',
                icon: '/assets/images/icon-192x192.png',
                badge: '/assets/images/icon-72x72.png',
                tag: 'test-notification',
                vibrate: [200, 100, 200]
            });
        }
    }
}

// Global instance
window.pushManager = new PushNotificationManager();

// Auto-subscribe after login (optional)
// Uncomment to enable automatic subscription
// if (window.pushManager.isSupported()) {
//     window.addEventListener('load', async () => {
//         // Check if user is logged in
//         const isLoggedIn = sessionStorage.getItem('adminToken') || localStorage.getItem('userLoggedIn');
//         
//         if (isLoggedIn && Notification.permission === 'default') {
//             // Show custom prompt
//             const shouldSubscribe = confirm('🔔 Stay updated! Enable notifications to receive exclusive updates?');
//             if (shouldSubscribe) {
//                 try {
//                     await window.pushManager.subscribe();
//                     console.log('✅ Push notifications enabled');
//                 } catch (err) {
//                     console.error('Failed to enable notifications:', err);
//                 }
//             }
//         }
//     });
// }
