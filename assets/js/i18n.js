/**
 * BILLIONAIRS i18n Manager
 * Multi-language support with cookie-based persistence
 * Supports: Deutsch (de), English (en)
 */

class I18nManager {
    constructor() {
        this.currentLang = 'de'; // Default language
        this.translations = {};
        this.fallbackLang = 'de';
        this.cookieName = 'billionairs_lang';
        this.cookieExpiry = 365; // Days
    }

    /**
     * Initialize i18n system
     */
    async init() {
        // Load saved language from cookie
        const savedLang = this.getCookie(this.cookieName);
        if (savedLang && (savedLang === 'de' || savedLang === 'en')) {
            this.currentLang = savedLang;
        } else {
            // Detect browser language
            const browserLang = navigator.language.toLowerCase();
            if (browserLang.startsWith('de')) {
                this.currentLang = 'de';
            } else if (browserLang.startsWith('en')) {
                this.currentLang = 'en';
            }
        }

        // Load translation files
        await this.loadTranslations();

        // Apply translations to current page
        this.applyTranslations();

        // Setup language switcher
        this.setupLanguageSwitcher();

        // Add HTML lang attribute
        document.documentElement.lang = this.currentLang;

        console.log(`✅ i18n initialized: ${this.currentLang}`);
    }

    /**
     * Load translation files
     */
    async loadTranslations() {
        try {
            // Load German translations
            const deResponse = await fetch('/translations/de.json');
            if (deResponse.ok) {
                this.translations.de = await deResponse.json();
            }

            // Load English translations
            const enResponse = await fetch('/translations/en.json');
            if (enResponse.ok) {
                this.translations.en = await enResponse.json();
            }

            console.log('✅ Translations loaded:', Object.keys(this.translations));
        } catch (error) {
            console.error('❌ Error loading translations:', error);
        }
    }

    /**
     * Get translated text by key
     * @param {string} key - Translation key (e.g., 'nav.home', 'login.title')
     * @param {object} params - Optional parameters for dynamic text
     * @returns {string} Translated text
     */
    t(key, params = {}) {
        const keys = key.split('.');
        let value = this.translations[this.currentLang];

        // Navigate through nested object
        for (const k of keys) {
            if (value && typeof value === 'object' && k in value) {
                value = value[k];
            } else {
                // Fallback to default language
                value = this.translations[this.fallbackLang];
                for (const fk of keys) {
                    if (value && typeof value === 'object' && fk in value) {
                        value = value[fk];
                    } else {
                        console.warn(`⚠️ Translation key not found: ${key}`);
                        return key;
                    }
                }
                break;
            }
        }

        // Replace parameters in text
        if (typeof value === 'string' && Object.keys(params).length > 0) {
            Object.keys(params).forEach(param => {
                value = value.replace(`{${param}}`, params[param]);
            });
        }

        return value || key;
    }

    /**
     * Apply translations to all elements with data-i18n attribute
     */
    applyTranslations() {
        // Translate elements with data-i18n attribute
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            const translation = this.t(key);
            
            if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                // For input elements, translate placeholder
                element.placeholder = translation;
            } else {
                // For other elements, translate text content
                element.textContent = translation;
            }
        });

        // Translate elements with data-i18n-placeholder
        document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
            const key = element.getAttribute('data-i18n-placeholder');
            element.placeholder = this.t(key);
        });

        // Translate elements with data-i18n-title (tooltips)
        document.querySelectorAll('[data-i18n-title]').forEach(element => {
            const key = element.getAttribute('data-i18n-title');
            element.title = this.t(key);
        });

        // Translate elements with data-i18n-aria-label (accessibility)
        document.querySelectorAll('[data-i18n-aria-label]').forEach(element => {
            const key = element.getAttribute('data-i18n-aria-label');
            element.setAttribute('aria-label', this.t(key));
        });

        // Auto-translate common elements without data-i18n
        this.autoTranslateCommonElements();
    }

    /**
     * Auto-translate common UI elements
     */
    autoTranslateCommonElements() {
        // Get current translations
        const t = this.translations[this.currentLang];
        if (!t) return;

        // Translate navigation buttons
        const memberBtn = document.getElementById('memberBtn');
        if (memberBtn && t.nav) {
            memberBtn.textContent = this.currentLang === 'de' ? 'INNER CIRCLE' : 'INNER CIRCLE';
        }

        const contactBtn = document.getElementById('contactBtn');
        if (contactBtn && t.nav) {
            contactBtn.textContent = this.currentLang === 'de' ? 'KONTAKT' : 'CONTACT';
        }

        // Translate popup titles
        const popupTitle = document.querySelector('.popup-title');
        if (popupTitle) {
            popupTitle.textContent = this.currentLang === 'de' ? 'Exklusive Anfragen' : 'Exclusive Inquiries';
        }

        const popupDescription = document.querySelector('.popup-description');
        if (popupDescription) {
            popupDescription.textContent = this.currentLang === 'de' 
                ? 'Für Zugriffsanfragen und private Beratungen' 
                : 'For access requests and private consultations';
        }

        const popupFooter = document.querySelector('.popup-footer');
        if (popupFooter) {
            popupFooter.textContent = this.currentLang === 'de' ? 'Antwortzeit: 24-48 Stunden' : 'Response time: 24-48 hours';
        }

        // Translate copy button
        const copyText = document.querySelector('.copy-text');
        if (copyText) {
            copyText.textContent = this.currentLang === 'de' ? 'Kopieren' : 'Copy';
        }

        // Translate trust badges
        const trustLabels = document.querySelectorAll('.trust-label');
        if (trustLabels.length >= 3) {
            trustLabels[0].textContent = this.currentLang === 'de' ? 'Swiss Gesichert' : 'Swiss Secured';
            trustLabels[1].textContent = this.currentLang === 'de' ? 'Blockchain Verifiziert' : 'Blockchain Verified';
            trustLabels[2].textContent = this.currentLang === 'de' ? 'Exklusiver Zugang' : 'Exclusive Access';
        }

        console.log(`✅ Auto-translation applied for: ${this.currentLang}`);
    }

    /**
     * Switch language
     * @param {string} lang - Language code (de/en)
     */
    async switchLanguage(lang) {
        if (lang !== 'de' && lang !== 'en') {
            console.error('❌ Unsupported language:', lang);
            return;
        }

        this.currentLang = lang;
        this.setCookie(this.cookieName, lang, this.cookieExpiry);
        document.documentElement.lang = lang;

        // Reload translations if not loaded
        if (!this.translations[lang]) {
            await this.loadTranslations();
        }

        // Apply new translations
        this.applyTranslations();

        // Update language switcher button
        this.updateLanguageSwitcher();

        // Dispatch custom event for other scripts to react
        window.dispatchEvent(new CustomEvent('languageChanged', { 
            detail: { language: lang } 
        }));

        console.log(`✅ Language switched to: ${lang}`);
    }

    /**
     * Setup language switcher button
     */
    setupLanguageSwitcher() {
        const langBtn = document.getElementById('langBtn');
        if (!langBtn) {
            console.warn('⚠️ Language button not found');
            return;
        }

        // Update button text
        this.updateLanguageSwitcher();

        // Add click event
        langBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const newLang = this.currentLang === 'de' ? 'en' : 'de';
            this.switchLanguage(newLang);
        });
    }

    /**
     * Update language switcher button text
     */
    updateLanguageSwitcher() {
        const langBtn = document.getElementById('langBtn');
        if (!langBtn) return;

        // Show current language or switch option
        if (this.currentLang === 'de') {
            langBtn.innerHTML = '<i class="fas fa-globe"></i> EN';
            langBtn.title = 'Switch to English';
        } else {
            langBtn.innerHTML = '<i class="fas fa-globe"></i> DE';
            langBtn.title = 'Zu Deutsch wechseln';
        }
    }

    /**
     * Get current language
     * @returns {string} Current language code
     */
    getCurrentLanguage() {
        return this.currentLang;
    }

    /**
     * Get cookie value
     * @param {string} name - Cookie name
     * @returns {string|null} Cookie value
     */
    getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) {
            return parts.pop().split(';').shift();
        }
        return null;
    }

    /**
     * Set cookie
     * @param {string} name - Cookie name
     * @param {string} value - Cookie value
     * @param {number} days - Expiry in days
     */
    setCookie(name, value, days) {
        const date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        const expires = `expires=${date.toUTCString()}`;
        document.cookie = `${name}=${value};${expires};path=/;SameSite=Lax`;
    }

    /**
     * Delete cookie
     * @param {string} name - Cookie name
     */
    deleteCookie(name) {
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
    }

    /**
     * Format number according to current language
     * @param {number} number - Number to format
     * @param {object} options - Intl.NumberFormat options
     * @returns {string} Formatted number
     */
    formatNumber(number, options = {}) {
        const locale = this.currentLang === 'de' ? 'de-CH' : 'en-US';
        return new Intl.NumberFormat(locale, options).format(number);
    }

    /**
     * Format currency according to current language
     * @param {number} amount - Amount to format
     * @param {string} currency - Currency code (default: CHF)
     * @returns {string} Formatted currency
     */
    formatCurrency(amount, currency = 'CHF') {
        const locale = this.currentLang === 'de' ? 'de-CH' : 'en-US';
        return new Intl.NumberFormat(locale, {
            style: 'currency',
            currency: currency
        }).format(amount);
    }

    /**
     * Format date according to current language
     * @param {Date|string} date - Date to format
     * @param {object} options - Intl.DateTimeFormat options
     * @returns {string} Formatted date
     */
    formatDate(date, options = {}) {
        const locale = this.currentLang === 'de' ? 'de-CH' : 'en-US';
        const dateObj = typeof date === 'string' ? new Date(date) : date;
        
        const defaultOptions = {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            ...options
        };
        
        return new Intl.DateTimeFormat(locale, defaultOptions).format(dateObj);
    }

    /**
     * Format relative time (e.g., "2 hours ago")
     * @param {Date|string} date - Date to format
     * @returns {string} Relative time
     */
    formatRelativeTime(date) {
        const dateObj = typeof date === 'string' ? new Date(date) : date;
        const now = new Date();
        const diffMs = now - dateObj;
        const diffSec = Math.floor(diffMs / 1000);
        const diffMin = Math.floor(diffSec / 60);
        const diffHour = Math.floor(diffMin / 60);
        const diffDay = Math.floor(diffHour / 24);

        if (diffSec < 60) {
            return this.currentLang === 'de' 
                ? 'gerade eben' 
                : 'just now';
        } else if (diffMin < 60) {
            return this.currentLang === 'de'
                ? `vor ${diffMin} Minute${diffMin !== 1 ? 'n' : ''}`
                : `${diffMin} minute${diffMin !== 1 ? 's' : ''} ago`;
        } else if (diffHour < 24) {
            return this.currentLang === 'de'
                ? `vor ${diffHour} Stunde${diffHour !== 1 ? 'n' : ''}`
                : `${diffHour} hour${diffHour !== 1 ? 's' : ''} ago`;
        } else if (diffDay < 7) {
            return this.currentLang === 'de'
                ? `vor ${diffDay} Tag${diffDay !== 1 ? 'en' : ''}`
                : `${diffDay} day${diffDay !== 1 ? 's' : ''} ago`;
        } else {
            return this.formatDate(dateObj, { month: 'short', day: 'numeric' });
        }
    }
}

// Initialize i18n globally
const i18n = new I18nManager();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => i18n.init());
} else {
    i18n.init();
}

// Expose to window for global access
window.i18n = i18n;
