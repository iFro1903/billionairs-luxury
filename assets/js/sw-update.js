// Service Worker Update Handler
// Automatically reload page when new version is available

(function() {
    'use strict';

    if ('serviceWorker' in navigator) {
        let refreshing = false;

        // Detect controller change and reload page
        navigator.serviceWorker.addEventListener('controllerchange', () => {
            if (refreshing) return;
            refreshing = true;
            window.location.reload();
        });

        // Check for updates on page load
        navigator.serviceWorker.register('/sw.js').then(registration => {

            // Check for updates
            registration.addEventListener('updatefound', () => {
                const newWorker = registration.installing;

                newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        // New version available - skip waiting
                        newWorker.postMessage({ type: 'SKIP_WAITING' });
                    }
                });
            });

            // Manual update check on visibility change (when user returns to tab)
            document.addEventListener('visibilitychange', () => {
                if (!document.hidden) {
                    registration.update();
                }
            });

        }).catch(error => {
            console.error('[SW Update] Registration failed:', error);
        });
    }
})();
