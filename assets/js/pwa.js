// PWA Registration and Install Prompt - DISABLED
// Install button removed per user request

let deferredPrompt;
let isInstalled = false;

// Check if app is already installed
if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true) {
    isInstalled = true;
}

// Register Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then((registration) => {
                
                // Check for updates every hour
                setInterval(() => {
                    registration.update();
                }, 60 * 60 * 1000);
            })
            .catch((error) => {
                console.error('❌ Service Worker registration failed:', error);
            });
    });
}

// DISABLED: Install prompt and button functionality
// User requested removal of "Install App" button

// All install prompt code commented out below:
// window.addEventListener('beforeinstallprompt', ...) - DISABLED
// showInstallButton() - DISABLED  
// createFloatingInstallButton() - DISABLED
// installApp() - DISABLED

// Listen for successful installation
window.addEventListener('appinstalled', (event) => {
    isInstalled = true;
    
    // Track in analytics
    if (typeof BillionairsAnalytics !== 'undefined') {
        BillionairsAnalytics.trackPWAInstall();
    }
    
    // Remove install button
    const installBtn = document.getElementById('pwa-floating-install');
    if (installBtn) {
        installBtn.remove();
    }
});

// Add PWA install tracking to analytics
if (typeof BillionairsAnalytics !== 'undefined') {
    BillionairsAnalytics.trackPWAInstall = function() {
        if (typeof gtag !== 'undefined') {
            gtag('event', 'pwa_install', {
                event_category: 'PWA',
                event_label: 'App Installed'
            });
        }
    };
}

// Listen for online/offline events
window.addEventListener('online', () => {
    
    // Show notification
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
            type: 'ONLINE'
        });
    }
    
    // Optional: Show toast notification
    showToast('✓ Connection restored', 'success');
});

window.addEventListener('offline', () => {
    
    // Show notification
    showToast('⚠ You are offline. Some features may be limited.', 'warning');
});

// Simple toast notification
function showToast(message, type = 'info') {
    // Remove existing toast
    const existingToast = document.getElementById('pwa-toast');
    if (existingToast) {
        existingToast.remove();
    }
    
    const toast = document.createElement('div');
    toast.id = 'pwa-toast';
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#00cc00' : type === 'warning' ? '#ff9900' : '#0066cc'};
        color: white;
        padding: 15px 25px;
        border-radius: 10px;
        font-size: 14px;
        font-weight: 600;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
        z-index: 999999;
        animation: slideInDown 0.3s ease;
    `;
    
    document.body.appendChild(toast);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        toast.style.animation = 'slideOutUp 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
    
    // Add animations
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideInDown {
            from { transform: translateY(-100px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }
        @keyframes slideOutUp {
            from { transform: translateY(0); opacity: 1; }
            to { transform: translateY(-100px); opacity: 0; }
        }
        @keyframes slideOutRight {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100px); opacity: 0; }
        }
    `;
    if (!document.getElementById('pwa-animations')) {
        style.id = 'pwa-animations';
        document.head.appendChild(style);
    }
}
