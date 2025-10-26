/**
 * Accessibility Manager
 * WCAG 2.1 AA Compliance Implementation
 */

class AccessibilityManager {
    constructor() {
        this.focusableElements = [];
        this.init();
    }

    /**
     * Initialize accessibility features
     */
    init() {
        console.log('♿ Initializing Accessibility Manager...');

        this.setupKeyboardNavigation();
        this.setupFocusManagement();
        this.setupARIALabels();
        this.setupScreenReaderSupport();
        this.setupSkipLinks();
        this.setupFocusIndicators();
        this.setupModalAccessibility();
        
        console.log('✅ Accessibility Manager initialized');
    }

    /**
     * Setup keyboard navigation for all interactive elements
     */
    setupKeyboardNavigation() {
        // Enable keyboard navigation for custom buttons
        document.addEventListener('keydown', (e) => {
            const target = e.target;

            // Enter/Space on buttons
            if ((e.key === 'Enter' || e.key === ' ') && target.tagName === 'BUTTON') {
                e.preventDefault();
                target.click();
            }

            // ESC to close modals
            if (e.key === 'Escape') {
                this.closeTopModal();
            }

            // Tab trap in modals
            if (e.key === 'Tab') {
                const modal = document.querySelector('.modal:not([style*="display: none"])');
                if (modal) {
                    this.trapFocusInModal(e, modal);
                }
            }
        });

        // Arrow key navigation for tabs
        const tabButtons = document.querySelectorAll('[role="tab"]');
        tabButtons.forEach((tab, index) => {
            tab.addEventListener('keydown', (e) => {
                if (e.key === 'ArrowRight') {
                    e.preventDefault();
                    const next = tabButtons[index + 1] || tabButtons[0];
                    next.focus();
                    next.click();
                } else if (e.key === 'ArrowLeft') {
                    e.preventDefault();
                    const prev = tabButtons[index - 1] || tabButtons[tabButtons.length - 1];
                    prev.focus();
                    prev.click();
                }
            });
        });

        console.log('✅ Keyboard navigation enabled');
    }

    /**
     * Setup focus management
     */
    setupFocusManagement() {
        // Store all focusable elements
        this.updateFocusableElements();

        // Re-scan on DOM changes
        const observer = new MutationObserver(() => {
            this.updateFocusableElements();
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        console.log('✅ Focus management enabled');
    }

    /**
     * Update list of focusable elements
     */
    updateFocusableElements() {
        const selector = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
        this.focusableElements = Array.from(document.querySelectorAll(selector));
    }

    /**
     * Setup ARIA labels for all interactive elements
     */
    setupARIALabels() {
        // Navigation buttons
        const memberBtn = document.getElementById('memberBtn');
        if (memberBtn && !memberBtn.hasAttribute('aria-label')) {
            memberBtn.setAttribute('aria-label', 'Access Inner Circle member login');
        }

        const langBtn = document.getElementById('langBtn');
        if (langBtn && !langBtn.hasAttribute('aria-label')) {
            langBtn.setAttribute('aria-label', 'Switch language between English and German');
        }

        const contactBtn = document.getElementById('contactBtn');
        if (contactBtn && !contactBtn.hasAttribute('aria-label')) {
            contactBtn.setAttribute('aria-label', 'Open contact information');
        }

        // Modal close buttons
        document.querySelectorAll('.modal-close, .popup-close, .close-modal').forEach(btn => {
            if (!btn.hasAttribute('aria-label')) {
                btn.setAttribute('aria-label', 'Close dialog');
                btn.setAttribute('aria-keyshortcuts', 'Escape');
            }
        });

        // Payment buttons
        const stripeBtn = document.getElementById('stripeCheckoutButton');
        if (stripeBtn && !stripeBtn.hasAttribute('aria-label')) {
            stripeBtn.setAttribute('aria-label', 'Pay 500,000 Swiss Francs via Stripe payment gateway');
        }

        // Copy buttons
        document.querySelectorAll('.copy-btn').forEach(btn => {
            if (!btn.hasAttribute('aria-label')) {
                btn.setAttribute('aria-label', 'Copy address to clipboard');
            }
        });

        // Form inputs - enhance with aria-describedby
        const emailInput = document.getElementById('customerEmail');
        if (emailInput && !emailInput.hasAttribute('aria-describedby')) {
            const helpText = document.createElement('span');
            helpText.id = 'email-help';
            helpText.className = 'sr-only';
            helpText.textContent = 'Enter your email address for account access';
            emailInput.parentNode.appendChild(helpText);
            emailInput.setAttribute('aria-describedby', 'email-help');
        }

        const passwordInput = document.getElementById('customerPassword');
        if (passwordInput && !passwordInput.hasAttribute('aria-describedby')) {
            const helpText = document.createElement('span');
            helpText.id = 'password-help';
            helpText.className = 'sr-only';
            helpText.textContent = 'Password must be at least 8 characters long with uppercase, lowercase, and numbers';
            passwordInput.parentNode.appendChild(helpText);
            passwordInput.setAttribute('aria-describedby', 'password-help');
        }

        console.log('✅ ARIA labels configured');
    }

    /**
     * Setup screen reader support
     */
    setupScreenReaderSupport() {
        // Add live region for notifications
        let liveRegion = document.getElementById('aria-live-region');
        if (!liveRegion) {
            liveRegion = document.createElement('div');
            liveRegion.id = 'aria-live-region';
            liveRegion.setAttribute('aria-live', 'polite');
            liveRegion.setAttribute('aria-atomic', 'true');
            liveRegion.className = 'sr-only';
            document.body.appendChild(liveRegion);
        }

        // Add landmarks
        const main = document.querySelector('main');
        if (main && !main.hasAttribute('role')) {
            main.setAttribute('role', 'main');
            main.setAttribute('aria-label', 'Main content');
        }

        const nav = document.querySelector('nav');
        if (nav && !nav.hasAttribute('role')) {
            nav.setAttribute('role', 'navigation');
            nav.setAttribute('aria-label', 'Main navigation');
        }

        const footer = document.querySelector('footer');
        if (footer && !footer.hasAttribute('role')) {
            footer.setAttribute('role', 'contentinfo');
            footer.setAttribute('aria-label', 'Footer');
        }

        console.log('✅ Screen reader support enabled');
    }

    /**
     * Announce message to screen readers
     */
    announce(message, priority = 'polite') {
        const liveRegion = document.getElementById('aria-live-region');
        if (liveRegion) {
            liveRegion.setAttribute('aria-live', priority);
            liveRegion.textContent = message;

            // Clear after 3 seconds
            setTimeout(() => {
                liveRegion.textContent = '';
            }, 3000);
        }
    }

    /**
     * Setup skip links - DISABLED per user request
     */
    setupSkipLinks() {
        // Skip link feature disabled
        console.log('⚠️ Skip links disabled');
    }

    /**
     * Setup enhanced focus indicators
     */
    setupFocusIndicators() {
        // Add focus-visible support for keyboard users only
        document.addEventListener('mousedown', () => {
            document.body.classList.add('using-mouse');
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                document.body.classList.remove('using-mouse');
            }
        });

        // Ensure all interactive elements have visible focus
        const style = document.createElement('style');
        style.textContent = `
            /* Screen Reader Only Content */
            .sr-only {
                position: absolute;
                width: 1px;
                height: 1px;
                padding: 0;
                margin: -1px;
                overflow: hidden;
                clip: rect(0, 0, 0, 0);
                white-space: nowrap;
                border-width: 0;
            }

            /* Skip Link */
            .skip-link {
                position: absolute;
                top: -40px;
                left: 0;
                background: #d4af37;
                color: #000;
                padding: 12px 20px;
                text-decoration: none;
                font-weight: bold;
                z-index: 10000;
                border-radius: 0 0 4px 0;
                transition: top 0.3s ease;
            }

            .skip-link:focus {
                top: 0;
                outline: 3px solid #fff;
                outline-offset: 2px;
            }

            /* Enhanced Focus Indicators */
            body:not(.using-mouse) *:focus {
                outline: 3px solid #d4af37 !important;
                outline-offset: 2px !important;
            }

            /* Button focus states */
            button:focus-visible,
            a:focus-visible,
            input:focus-visible,
            select:focus-visible,
            textarea:focus-visible {
                outline: 3px solid #d4af37;
                outline-offset: 2px;
                box-shadow: 0 0 0 5px rgba(212, 175, 55, 0.2);
            }

            /* High contrast mode support */
            @media (prefers-contrast: high) {
                button:focus,
                a:focus,
                input:focus {
                    outline-width: 4px;
                    outline-color: #fff;
                }
            }

            /* Reduced motion support */
            @media (prefers-reduced-motion: reduce) {
                *,
                *::before,
                *::after {
                    animation-duration: 0.01ms !important;
                    animation-iteration-count: 1 !important;
                    transition-duration: 0.01ms !important;
                }
            }
        `;
        document.head.appendChild(style);

        console.log('✅ Focus indicators configured');
    }

    /**
     * Setup modal accessibility
     */
    setupModalAccessibility() {
        // Find all modals and enhance them
        document.querySelectorAll('.modal, [role="dialog"]').forEach(modal => {
            if (!modal.hasAttribute('role')) {
                modal.setAttribute('role', 'dialog');
            }

            if (!modal.hasAttribute('aria-modal')) {
                modal.setAttribute('aria-modal', 'true');
            }

            // Add aria-labelledby if modal has a title
            const title = modal.querySelector('h1, h2, h3, .modal-title');
            if (title && !title.id) {
                title.id = `modal-title-${Math.random().toString(36).substr(2, 9)}`;
                modal.setAttribute('aria-labelledby', title.id);
            }

            // Setup focus trap
            modal.addEventListener('keydown', (e) => {
                if (e.key === 'Tab') {
                    this.trapFocusInModal(e, modal);
                }
            });
        });

        console.log('✅ Modal accessibility configured');
    }

    /**
     * Trap focus within modal
     */
    trapFocusInModal(event, modal) {
        const focusableElements = modal.querySelectorAll(
            'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );

        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (event.shiftKey) {
            if (document.activeElement === firstElement) {
                event.preventDefault();
                lastElement.focus();
            }
        } else {
            if (document.activeElement === lastElement) {
                event.preventDefault();
                firstElement.focus();
            }
        }
    }

    /**
     * Close topmost modal with ESC key
     */
    closeTopModal() {
        const visibleModals = Array.from(document.querySelectorAll('.modal, [role="dialog"]'))
            .filter(modal => {
                const style = window.getComputedStyle(modal);
                return style.display !== 'none' && style.visibility !== 'hidden';
            });

        if (visibleModals.length > 0) {
            const topModal = visibleModals[visibleModals.length - 1];
            const closeButton = topModal.querySelector('.modal-close, .popup-close, .close-modal, [aria-label*="Close"]');
            
            if (closeButton) {
                closeButton.click();
                this.announce('Dialog closed');
            }
        }
    }

    /**
     * Make element accessible with proper attributes
     */
    makeAccessible(element, options = {}) {
        const {
            role = null,
            label = null,
            description = null,
            keyshortcut = null,
            expanded = null,
            controls = null,
            live = null
        } = options;

        if (role) element.setAttribute('role', role);
        if (label) element.setAttribute('aria-label', label);
        if (description) element.setAttribute('aria-describedby', description);
        if (keyshortcut) element.setAttribute('aria-keyshortcuts', keyshortcut);
        if (expanded !== null) element.setAttribute('aria-expanded', expanded.toString());
        if (controls) element.setAttribute('aria-controls', controls);
        if (live) element.setAttribute('aria-live', live);

        return element;
    }

    /**
     * Check if user prefers reduced motion
     */
    prefersReducedMotion() {
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }

    /**
     * Check if user prefers high contrast
     */
    prefersHighContrast() {
        return window.matchMedia('(prefers-contrast: high)').matches;
    }

    /**
     * Check if dark mode is preferred
     */
    prefersDarkMode() {
        return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }

    /**
     * Get accessibility report
     */
    getAccessibilityReport() {
        const report = {
            focusableElements: this.focusableElements.length,
            elementsWithARIA: document.querySelectorAll('[aria-label], [aria-labelledby], [aria-describedby]').length,
            landmarks: {
                main: document.querySelectorAll('[role="main"], main').length,
                navigation: document.querySelectorAll('[role="navigation"], nav').length,
                contentinfo: document.querySelectorAll('[role="contentinfo"], footer').length
            },
            images: {
                total: document.querySelectorAll('img').length,
                withAlt: document.querySelectorAll('img[alt]').length,
                decorative: document.querySelectorAll('img[alt=""], img[role="presentation"]').length
            },
            forms: {
                total: document.querySelectorAll('form').length,
                inputsWithLabels: document.querySelectorAll('input[id]').length
            },
            userPreferences: {
                reducedMotion: this.prefersReducedMotion(),
                highContrast: this.prefersHighContrast(),
                darkMode: this.prefersDarkMode()
            }
        };

        console.log('♿ Accessibility Report:', report);
        return report;
    }
}

// Initialize on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.a11y = new AccessibilityManager();
    });
} else {
    window.a11y = new AccessibilityManager();
}

// Export for use in other scripts
window.AccessibilityManager = AccessibilityManager;

console.log('✅ Accessibility Manager loaded');
