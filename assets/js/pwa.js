// PWA Registration and Install Prompt
// Handles Service Worker registration and "Add to Home Screen" prompt

let deferredPrompt;
let isInstalled = false;

// Check if app is already installed
if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true) {
    isInstalled = true;
    console.log('📱 PWA is already installed');
}

// Register Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then((registration) => {
                console.log('✅ Service Worker registered:', registration.scope);
                
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

// Listen for install prompt
window.addEventListener('beforeinstallprompt', (event) => {
    console.log('📱 Install prompt available');
    
    // Prevent default prompt
    event.preventDefault();
    
    // Store event for later use
    deferredPrompt = event;
    
    // Show custom install button
    showInstallButton();
});

// Show install button
function showInstallButton() {
    if (isInstalled) return;
    
    const installBtn = document.getElementById('pwa-install-btn');
    if (installBtn) {
        installBtn.style.display = 'block';
    } else {
        // Create floating install button
        createFloatingInstallButton();
    }
}

// Create floating install button
function createFloatingInstallButton() {
    // Check if button already exists
    if (document.getElementById('pwa-floating-install')) return;
    
    const button = document.createElement('button');
    button.id = 'pwa-floating-install';
    button.innerHTML = `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" fill="currentColor"/>
        </svg>
        <span>Install App</span>
    `;
    button.style.cssText = `
        position: fixed;
        bottom: 80px;
        right: 20px;
        background: linear-gradient(135deg, #d4af37, #f4e4a8);
        color: #1a1a2e;
        border: none;
        border-radius: 50px;
        padding: 12px 24px;
        font-size: 14px;
        font-weight: 700;
        cursor: pointer;
        box-shadow: 0 4px 20px rgba(212, 175, 55, 0.4);
        z-index: 999998;
        display: flex;
        align-items: center;
        gap: 8px;
        transition: all 0.3s ease;
        animation: slideInRight 0.5s ease;
    `;
    
    button.addEventListener('click', installApp);
    button.addEventListener('mouseenter', () => {
        button.style.transform = 'translateY(-2px)';
        button.style.boxShadow = '0 6px 25px rgba(212, 175, 55, 0.6)';
    });
    button.addEventListener('mouseleave', () => {
        button.style.transform = 'translateY(0)';
        button.style.boxShadow = '0 4px 20px rgba(212, 175, 55, 0.4)';
    });
    
    document.body.appendChild(button);
    
    // Add animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideInRight {
            from {
                transform: translateX(100px);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
    `;
    document.head.appendChild(style);
}

// Install app function
async function installApp() {
    if (!deferredPrompt) {
        console.log('No install prompt available');
        return;
    }
    
    // Show install prompt
    deferredPrompt.prompt();
    
    // Wait for user choice
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User choice: ${outcome}`);
    
    if (outcome === 'accepted') {
        console.log('✅ PWA installed successfully');
        
        // Track installation in analytics
        if (typeof BillionairsAnalytics !== 'undefined') {
            BillionairsAnalytics.trackPWAInstall();
        }
        
        // Remove install button
        const installBtn = document.getElementById('pwa-floating-install');
        if (installBtn) {
            installBtn.style.animation = 'slideOutRight 0.5s ease';
            setTimeout(() => installBtn.remove(), 500);
        }
    } else {
        console.log('❌ PWA installation declined');
    }
    
    // Clear deferred prompt
    deferredPrompt = null;
}

// Listen for successful installation
window.addEventListener('appinstalled', (event) => {
    console.log('✅ PWA installed successfully', event);
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
    console.log('🌐 Back online');
    
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
    console.log('📡 Offline mode');
    
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

console.log('📱 PWA initialized');
