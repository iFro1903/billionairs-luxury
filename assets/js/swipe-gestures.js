/**
 * Professional Swipe Gestures for Mobile (iOS/Android)
 * Provides native-like swipe navigation and interactions
 */

class SwipeGestures {
    constructor() {
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.touchEndX = 0;
        this.touchEndY = 0;
        this.minSwipeDistance = 50; // Minimum distance for swipe to register
        this.edgeThreshold = 50; // Distance from edge for back gesture
        this.isSwipeActive = false;
        this.swipeIndicator = null;
        
        this.init();
    }

    init() {
        // Only activate on touch devices
        if (!('ontouchstart' in window)) return;

        // Add touch event listeners
        document.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
        document.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
        document.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });

        // Create visual swipe indicator
        this.createSwipeIndicator();

        console.log('🔄 Swipe Gestures Activated (iOS/Android)');
    }

    createSwipeIndicator() {
        this.swipeIndicator = document.createElement('div');
        this.swipeIndicator.className = 'swipe-back-indicator';
        this.swipeIndicator.innerHTML = `
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
        `;
        document.body.appendChild(this.swipeIndicator);
    }

    handleTouchStart(e) {
        this.touchStartX = e.changedTouches[0].screenX;
        this.touchStartY = e.changedTouches[0].screenY;
        
        // Check if swipe starts from left edge (for back gesture)
        if (this.touchStartX < this.edgeThreshold && window.history.length > 1) {
            this.isSwipeActive = true;
            document.body.classList.add('swipe-active');
        }
    }

    handleTouchMove(e) {
        if (!this.isSwipeActive) return;

        this.touchEndX = e.changedTouches[0].screenX;
        this.touchEndY = e.changedTouches[0].screenY;

        const swipeDistance = this.touchEndX - this.touchStartX;
        const verticalDistance = Math.abs(this.touchEndY - this.touchStartY);

        // Only show indicator if mostly horizontal swipe
        if (verticalDistance < 50 && swipeDistance > 0) {
            const progress = Math.min(swipeDistance / 150, 1);
            
            // Update indicator position and opacity
            if (this.swipeIndicator) {
                this.swipeIndicator.style.opacity = progress;
                this.swipeIndicator.style.transform = `translateX(${swipeDistance / 3}px) scale(${0.8 + (progress * 0.2)})`;
            }

            // Add haptic feedback on iOS (if available)
            if (progress > 0.7 && window.navigator.vibrate) {
                window.navigator.vibrate(10);
            }
        }
    }

    handleTouchEnd(e) {
        if (!this.isSwipeActive) return;

        this.touchEndX = e.changedTouches[0].screenX;
        this.touchEndY = e.changedTouches[0].screenY;

        const swipeDistance = this.touchEndX - this.touchStartX;
        const verticalDistance = Math.abs(this.touchEndY - this.touchStartY);

        // Reset indicator
        if (this.swipeIndicator) {
            this.swipeIndicator.style.opacity = '0';
            this.swipeIndicator.style.transform = 'translateX(0) scale(0.8)';
        }

        document.body.classList.remove('swipe-active');

        // Execute swipe action if conditions met
        if (swipeDistance > this.minSwipeDistance && verticalDistance < 50) {
            this.handleSwipeRight();
        }

        this.isSwipeActive = false;
    }

    handleSwipeRight() {
        // iOS-like back navigation
        console.log('👈 Swipe Right detected - Going back');

        // Add smooth transition
        document.body.style.transition = 'transform 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)';
        document.body.style.transform = 'translateX(100vw)';

        // Haptic feedback
        if (window.navigator.vibrate) {
            window.navigator.vibrate(15);
        }

        // Navigate back after animation
        setTimeout(() => {
            window.history.back();
            // Reset transform after navigation
            setTimeout(() => {
                document.body.style.transition = '';
                document.body.style.transform = '';
            }, 100);
        }, 300);
    }

    // Additional gesture: Pull down to refresh (optional)
    handlePullToRefresh(distance) {
        if (distance > 100 && window.scrollY === 0) {
            console.log('🔄 Pull to refresh detected');
            // Add your refresh logic here
            window.location.reload();
        }
    }

    // Swipe up gesture for modals/menus (optional)
    handleSwipeUp() {
        console.log('👆 Swipe Up detected');
        // Can be used to open modals, menus, etc.
    }

    // Swipe down gesture to close modals (optional)
    handleSwipeDown() {
        console.log('👇 Swipe Down detected');
        // Can be used to close modals, dropdown menus, etc.
    }
}

// Initialize swipe gestures when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new SwipeGestures();
    });
} else {
    new SwipeGestures();
}
