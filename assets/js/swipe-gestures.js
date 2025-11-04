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
        this.minSwipeDistance = 80; // Minimum distance for swipe to register
        this.edgeThreshold = 80; // Distance from edge for back gesture (larger for easier activation)
        this.isSwipeActive = false;
        this.swipeIndicator = null;
        this.swipeOverlay = null;
        
        this.init();
    }

    init() {
        // Force activation - check multiple ways
        const isTouchDevice = ('ontouchstart' in window) || 
                            (navigator.maxTouchPoints > 0) || 
                            (navigator.msMaxTouchPoints > 0);
        
        console.log('📱 Touch device detected:', isTouchDevice);
        console.log('📱 User agent:', navigator.userAgent);

        // Add touch event listeners with passive: false to prevent default
        document.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
        document.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
        document.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });

        // Create visual swipe indicator and overlay
        this.createSwipeIndicator();
        this.createSwipeOverlay();

        console.log('🔄 Swipe Gestures Activated (iOS/Android)');
        console.log('👈 Try swiping from left edge to go back!');
    }

    createSwipeIndicator() {
        this.swipeIndicator = document.createElement('div');
        this.swipeIndicator.className = 'swipe-back-indicator';
        this.swipeIndicator.innerHTML = `
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
        `;
        document.body.appendChild(this.swipeIndicator);
    }

    createSwipeOverlay() {
        this.swipeOverlay = document.createElement('div');
        this.swipeOverlay.className = 'swipe-overlay';
        document.body.appendChild(this.swipeOverlay);
    }

    handleTouchStart(e) {
        this.touchStartX = e.touches[0].clientX;
        this.touchStartY = e.touches[0].clientY;
        
        console.log('👆 Touch start at X:', this.touchStartX);
        
        // Check if swipe starts from left edge (for back gesture)
        if (this.touchStartX < this.edgeThreshold) {
            this.isSwipeActive = true;
            document.body.classList.add('swipe-active');
            
            console.log('✅ Edge swipe activated! Swipe from:', this.touchStartX);
            
            // Show edge indicator
            if (this.swipeOverlay) {
                this.swipeOverlay.classList.add('active');
            }
        }
    }

    handleTouchMove(e) {
        if (!this.isSwipeActive) return;

        this.touchEndX = e.touches[0].clientX;
        this.touchEndY = e.touches[0].clientY;

        const swipeDistance = this.touchEndX - this.touchStartX;
        const verticalDistance = Math.abs(this.touchEndY - this.touchStartY);

        console.log('👉 Swipe distance:', swipeDistance);

        // Only show indicator if mostly horizontal swipe
        if (verticalDistance < 80 && swipeDistance > 0) {
            const progress = Math.min(swipeDistance / 200, 1);
            
            // Update indicator position and opacity
            if (this.swipeIndicator) {
                this.swipeIndicator.style.opacity = progress;
                this.swipeIndicator.style.left = `${20 + (swipeDistance / 4)}px`;
                this.swipeIndicator.style.transform = `translateY(-50%) scale(${0.8 + (progress * 0.4)})`;
            }

            // Update overlay opacity
            if (this.swipeOverlay) {
                this.swipeOverlay.style.opacity = progress * 0.3;
            }

            // Prevent default scrolling during swipe
            if (swipeDistance > 20) {
                e.preventDefault();
            }
        }
    }

    handleTouchEnd(e) {
        if (!this.isSwipeActive) return;

        this.touchEndX = e.changedTouches[0].clientX;
        this.touchEndY = e.changedTouches[0].clientY;

        const swipeDistance = this.touchEndX - this.touchStartX;
        const verticalDistance = Math.abs(this.touchEndY - this.touchStartY);

        console.log('🏁 Swipe ended. Distance:', swipeDistance);

        // Reset indicator
        if (this.swipeIndicator) {
            this.swipeIndicator.style.opacity = '0';
            this.swipeIndicator.style.left = '20px';
            this.swipeIndicator.style.transform = 'translateY(-50%) scale(0.8)';
        }

        if (this.swipeOverlay) {
            this.swipeOverlay.classList.remove('active');
            this.swipeOverlay.style.opacity = '0';
        }

        document.body.classList.remove('swipe-active');

        // Execute swipe action if conditions met
        if (swipeDistance > this.minSwipeDistance && verticalDistance < 100) {
            console.log('✅ SWIPE SUCCESSFUL - Going back!');
            this.handleSwipeRight();
        } else {
            console.log('❌ Swipe too short:', swipeDistance, 'Need:', this.minSwipeDistance);
        }

        this.isSwipeActive = false;
    }

    handleSwipeRight() {
        console.log('👈 Executing back navigation...');
        console.log('History length:', window.history.length);

        // Haptic feedback
        if (window.navigator.vibrate) {
            window.navigator.vibrate(20);
        }

        // Try multiple back navigation methods
        if (window.history.length > 1) {
            // Method 1: Standard history.back()
            console.log('📍 Using history.back()');
            window.history.back();
        } else if (document.referrer) {
            // Method 2: Go to referrer
            console.log('📍 Using referrer:', document.referrer);
            window.location.href = document.referrer;
        } else {
            // Method 3: Go to homepage
            console.log('📍 Fallback to homepage');
            window.location.href = '/';
        }
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
