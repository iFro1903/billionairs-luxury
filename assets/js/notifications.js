// BILLIONAIRS Push Notification System
class NotificationManager {
    constructor() {
        this.permission = 'default';
        this.init();
    }

    async init() {
        // Check if notifications are supported
        if (!('Notification' in window)) {
            return;
        }

        // Check current permission
        this.permission = Notification.permission;

        // If already granted, we're good
        if (this.permission === 'granted') {
            return;
        }

        // If not denied, we can ask (but don't ask immediately)
        if (this.permission !== 'denied') {
            // We'll ask when user first interacts with the site
            this.setupPermissionRequest();
        }
    }

    setupPermissionRequest() {
        // Ask for permission after user's first meaningful interaction
        let hasAsked = sessionStorage.getItem('notificationAsked');
        
        if (!hasAsked) {
            // Wait for user to interact with the page
            const events = ['click', 'touchstart', 'keydown'];
            const askPermission = async () => {
                events.forEach(e => document.removeEventListener(e, askPermission));
                
                // Small delay for better UX
                await new Promise(resolve => setTimeout(resolve, 2000));
                
                this.requestPermission();
                sessionStorage.setItem('notificationAsked', 'true');
            };

            events.forEach(e => document.addEventListener(e, askPermission, { once: true }));
        }
    }

    async requestPermission() {
        try {
            const permission = await Notification.requestPermission();
            this.permission = permission;
            
            if (permission === 'granted') {
                this.showWelcomeNotification();
            }
        } catch (error) {
            console.error('Error requesting notification permission:', error);
        }
    }

    showWelcomeNotification() {
        this.show({
            title: '🔔 BILLIONAIRS',
            body: 'Notifications enabled. You\'ll be notified of important updates.',
            icon: '/favicon.ico'
        });
    }

    show(options) {
        if (this.permission !== 'granted') {
            return;
        }

        const notification = new Notification(options.title, {
            body: options.body,
            icon: options.icon || '/favicon.ico',
            badge: '/favicon.ico',
            tag: options.tag || 'billionairs-notification',
            requireInteraction: options.requireInteraction || false,
            silent: options.silent || false
        });

        // Auto-close after 5 seconds unless requireInteraction is true
        if (!options.requireInteraction) {
            setTimeout(() => notification.close(), 5000);
        }

        // Handle click
        notification.onclick = () => {
            window.focus();
            if (options.onClick) {
                options.onClick();
            }
            notification.close();
        };

        return notification;
    }

    // Notification types
    notifyNewChatMessage(username) {
        this.show({
            title: '💬 New Message',
            body: `${username} sent a message in The Inner Circle`,
            tag: 'chat-message',
            onClick: () => {
                // Open chat if closed
                if (window.luxuryChat && !window.luxuryChat.isOpen) {
                    window.luxuryChat.open();
                }
            }
        });
    }

    notifyEasterEggUnlocked(phase) {
        const messages = {
            pyramid: '🔓 Pyramid Unlocked! Your journey begins...',
            eye: '👁️ The Eye is now watching. Click to continue.',
            chat: '💬 The Inner Circle awaits. Welcome, Titan.'
        };

        this.show({
            title: '✨ BILLIONAIRS',
            body: messages[phase] || 'A new phase has been unlocked!',
            tag: 'easter-egg',
            requireInteraction: true
        });
    }

    notifyPaymentSuccess() {
        this.show({
            title: '✅ Payment Confirmed',
            body: 'Welcome to BILLIONAIRS. Your exclusive experience begins now.',
            tag: 'payment',
            requireInteraction: true
        });
    }

    notifySystemUpdate(message) {
        this.show({
            title: '📢 BILLIONAIRS Update',
            body: message,
            tag: 'system-update'
        });
    }
}

// Initialize globally
window.notificationManager = new NotificationManager();
