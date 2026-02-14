/**
 * BILLIONAIRS Luxury Toast Notification System
 * Replaces all browser alert() calls with elegant, on-brand notifications.
 */

class LuxuryToast {
    constructor() {
        this.container = null;
        this.queue = [];
        this.maxVisible = 3;
        this.init();
    }

    init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.createContainer());
        } else {
            this.createContainer();
        }
    }

    createContainer() {
        if (this.container) return;
        this.container = document.createElement('div');
        this.container.id = 'luxuryToastContainer';
        this.container.className = 'luxury-toast-container';
        document.body.appendChild(this.container);
    }

    /**
     * Show a toast notification
     * @param {string} message - The message to display
     * @param {'success'|'error'|'warning'|'info'} type - Toast type
     * @param {object} options - Optional settings
     * @param {number} options.duration - Auto-dismiss in ms (default: varies by type)
     * @param {string} options.title - Optional title override
     * @param {boolean} options.persistent - If true, won't auto-dismiss
     */
    show(message, type = 'info', options = {}) {
        if (!this.container) this.createContainer();

        const defaults = {
            success: { duration: 4000, icon: '✓', title: 'Success' },
            error:   { duration: 6000, icon: '✕', title: 'Error' },
            warning: { duration: 5000, icon: '⚠', title: 'Warning' },
            info:    { duration: 4000, icon: 'ℹ', title: 'Info' }
        };

        const config = defaults[type] || defaults.info;
        const duration = options.persistent ? 0 : (options.duration || config.duration);
        const title = options.title || config.title;

        const toast = document.createElement('div');
        toast.className = `luxury-toast luxury-toast--${type}`;
        toast.setAttribute('role', 'alert');
        toast.setAttribute('aria-live', 'assertive');

        // Support multi-line messages (replace \n with <br>)
        const formattedMessage = message.replace(/\n/g, '<br>');

        toast.innerHTML = `
            <div class="luxury-toast__icon">${config.icon}</div>
            <div class="luxury-toast__content">
                <div class="luxury-toast__title">${this.escapeHtml(title)}</div>
                <div class="luxury-toast__message">${formattedMessage}</div>
            </div>
            <button class="luxury-toast__close" aria-label="Close">&times;</button>
            ${duration > 0 ? '<div class="luxury-toast__progress"></div>' : ''}
        `;

        // Close button
        toast.querySelector('.luxury-toast__close').addEventListener('click', () => {
            this.dismiss(toast);
        });

        // Auto-dismiss
        if (duration > 0) {
            const progress = toast.querySelector('.luxury-toast__progress');
            if (progress) {
                progress.style.animationDuration = `${duration}ms`;
            }
            toast.autoTimer = setTimeout(() => this.dismiss(toast), duration);

            // Pause on hover
            toast.addEventListener('mouseenter', () => {
                clearTimeout(toast.autoTimer);
                const prog = toast.querySelector('.luxury-toast__progress');
                if (prog) prog.style.animationPlayState = 'paused';
            });
            toast.addEventListener('mouseleave', () => {
                const remaining = duration * 0.5; // Give half time after hover
                toast.autoTimer = setTimeout(() => this.dismiss(toast), remaining);
                const prog = toast.querySelector('.luxury-toast__progress');
                if (prog) prog.style.animationPlayState = 'running';
            });
        }

        // Swipe to dismiss on mobile
        this.addSwipeToDismiss(toast);

        this.container.appendChild(toast);

        // Trigger enter animation
        requestAnimationFrame(() => {
            toast.classList.add('luxury-toast--visible');
        });

        return toast;
    }

    dismiss(toast) {
        if (!toast || toast.classList.contains('luxury-toast--dismissed')) return;
        toast.classList.add('luxury-toast--dismissed');
        clearTimeout(toast.autoTimer);
        setTimeout(() => {
            if (toast.parentNode) toast.parentNode.removeChild(toast);
        }, 400);
    }

    addSwipeToDismiss(toast) {
        let startX = 0;
        let currentX = 0;

        toast.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
        }, { passive: true });

        toast.addEventListener('touchmove', (e) => {
            currentX = e.touches[0].clientX;
            const diff = currentX - startX;
            if (Math.abs(diff) > 10) {
                toast.style.transform = `translateX(${diff}px)`;
                toast.style.opacity = Math.max(0, 1 - Math.abs(diff) / 200);
            }
        }, { passive: true });

        toast.addEventListener('touchend', () => {
            const diff = currentX - startX;
            if (Math.abs(diff) > 80) {
                this.dismiss(toast);
            } else {
                toast.style.transform = '';
                toast.style.opacity = '';
            }
        });
    }

    // Convenience methods
    success(message, options = {}) { return this.show(message, 'success', options); }
    error(message, options = {})   { return this.show(message, 'error', options); }
    warning(message, options = {}) { return this.show(message, 'warning', options); }
    info(message, options = {})    { return this.show(message, 'info', options); }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Global instance
window.toast = new LuxuryToast();

// Override window.alert for legacy compatibility
window._originalAlert = window.alert;
window.alert = function(message) {
    if (window.toast && window.toast.container) {
        // Detect type from message content
        if (typeof message === 'string') {
            if (message.startsWith('✓') || message.includes('Success') || message.includes('Sent!')) {
                window.toast.success(message.replace(/^[✓✔]\s*/, ''), { duration: 6000 });
            } else if (message.startsWith('❌') || message.includes('Error') || message.includes('Failed') || message.includes('error')) {
                window.toast.error(message.replace(/^❌\s*/, ''));
            } else if (message.includes('Please') || message.includes('must') || message.includes('required')) {
                window.toast.warning(message);
            } else {
                window.toast.info(message);
            }
        } else {
            window.toast.info(String(message));
        }
    } else {
        window._originalAlert(message);
    }
};
