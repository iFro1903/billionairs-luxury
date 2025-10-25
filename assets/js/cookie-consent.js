// GDPR Cookie Consent with Google Consent Mode v2
// Compliant with EU GDPR regulations

class CookieConsent {
    constructor() {
        this.consentKey = 'billionairs_cookie_consent';
        this.consentExpiry = 365; // Days
        this.init();
    }

    init() {
        // Set default consent state (denied) BEFORE gtag initialization
        this.setDefaultConsent();
        
        // Check if user has already given consent
        const savedConsent = this.getConsentStatus();
        
        if (savedConsent) {
            // User has made a choice - update consent
            this.updateConsent(savedConsent);
        } else {
            // Show consent banner
            this.showConsentBanner();
        }
    }

    setDefaultConsent() {
        // Initialize gtag with default denied state
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        
        // Set default consent to denied for all features
        gtag('consent', 'default', {
            'ad_storage': 'denied',
            'ad_user_data': 'denied',
            'ad_personalization': 'denied',
            'analytics_storage': 'denied',
            'functionality_storage': 'denied',
            'personalization_storage': 'denied',
            'security_storage': 'granted', // Always granted for security
            'wait_for_update': 500 // Wait 500ms for consent update
        });

        // Region-specific defaults (stricter for EEA)
        gtag('consent', 'default', {
            'ad_storage': 'denied',
            'analytics_storage': 'denied',
            'region': ['AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE', 'GB', 'CH', 'NO', 'IS', 'LI']
        });
    }

    updateConsent(consent) {
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        
        gtag('consent', 'update', {
            'ad_storage': consent.marketing ? 'granted' : 'denied',
            'ad_user_data': consent.marketing ? 'granted' : 'denied',
            'ad_personalization': consent.marketing ? 'granted' : 'denied',
            'analytics_storage': consent.analytics ? 'granted' : 'denied',
            'functionality_storage': consent.functional ? 'granted' : 'denied',
            'personalization_storage': consent.functional ? 'granted' : 'denied'
        });

        // Track consent decision in GA
        if (typeof gtag !== 'undefined') {
            gtag('event', 'cookie_consent', {
                'analytics': consent.analytics ? 'granted' : 'denied',
                'marketing': consent.marketing ? 'granted' : 'denied',
                'functional': consent.functional ? 'granted' : 'denied'
            });
        }
    }

    showConsentBanner() {
        const banner = document.createElement('div');
        banner.id = 'cookieConsentBanner';
        banner.innerHTML = `
            <div class="cookie-consent-overlay">
                <div class="cookie-consent-container">
                    <div class="cookie-consent-header">
                        <h3>🍪 Wir respektieren Ihre Privatsphäre</h3>
                    </div>
                    <div class="cookie-consent-body">
                        <p>Wir verwenden Cookies und ähnliche Technologien, um Ihre Erfahrung zu verbessern, unsere Website zu analysieren und Ihnen personalisierte Inhalte anzubieten.</p>
                        
                        <div class="cookie-options">
                            <div class="cookie-category">
                                <div class="cookie-category-header">
                                    <label class="cookie-switch">
                                        <input type="checkbox" id="consent-essential" checked disabled>
                                        <span class="cookie-slider"></span>
                                    </label>
                                    <strong>Notwendige Cookies</strong>
                                </div>
                                <p class="cookie-description">Erforderlich für grundlegende Funktionen wie Sicherheit und Zugangsverwaltung.</p>
                            </div>

                            <div class="cookie-category">
                                <div class="cookie-category-header">
                                    <label class="cookie-switch">
                                        <input type="checkbox" id="consent-analytics" checked>
                                        <span class="cookie-slider"></span>
                                    </label>
                                    <strong>Analyse Cookies</strong>
                                </div>
                                <p class="cookie-description">Helfen uns zu verstehen, wie Besucher mit unserer Website interagieren (Google Analytics).</p>
                            </div>

                            <div class="cookie-category">
                                <div class="cookie-category-header">
                                    <label class="cookie-switch">
                                        <input type="checkbox" id="consent-marketing">
                                        <span class="cookie-slider"></span>
                                    </label>
                                    <strong>Marketing Cookies</strong>
                                </div>
                                <p class="cookie-description">Ermöglichen personalisierte Werbung und Marketing-Kommunikation.</p>
                            </div>

                            <div class="cookie-category">
                                <div class="cookie-category-header">
                                    <label class="cookie-switch">
                                        <input type="checkbox" id="consent-functional" checked>
                                        <span class="cookie-slider"></span>
                                    </label>
                                    <strong>Funktionale Cookies</strong>
                                </div>
                                <p class="cookie-description">Speichern Ihre Präferenzen für ein besseres Nutzererlebnis.</p>
                            </div>
                        </div>

                        <div class="cookie-links">
                            <a href="/privacy-policy.html" target="_blank">Datenschutzerklärung</a>
                            <a href="/cookie-policy.html" target="_blank">Cookie-Richtlinie</a>
                        </div>
                    </div>
                    <div class="cookie-consent-footer">
                        <button id="acceptAllCookies" class="cookie-btn cookie-btn-accept">Alle akzeptieren</button>
                        <button id="acceptSelectedCookies" class="cookie-btn cookie-btn-selected">Auswahl speichern</button>
                        <button id="rejectAllCookies" class="cookie-btn cookie-btn-reject">Nur notwendige</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(banner);

        // Event Listeners
        document.getElementById('acceptAllCookies').addEventListener('click', () => this.acceptAll());
        document.getElementById('acceptSelectedCookies').addEventListener('click', () => this.acceptSelected());
        document.getElementById('rejectAllCookies').addEventListener('click', () => this.rejectAll());
    }

    acceptAll() {
        const consent = {
            analytics: true,
            marketing: true,
            functional: true,
            essential: true,
            timestamp: new Date().toISOString()
        };
        this.saveConsent(consent);
        this.updateConsent(consent);
        this.hideConsentBanner();
    }

    acceptSelected() {
        const consent = {
            analytics: document.getElementById('consent-analytics').checked,
            marketing: document.getElementById('consent-marketing').checked,
            functional: document.getElementById('consent-functional').checked,
            essential: true,
            timestamp: new Date().toISOString()
        };
        this.saveConsent(consent);
        this.updateConsent(consent);
        this.hideConsentBanner();
    }

    rejectAll() {
        const consent = {
            analytics: false,
            marketing: false,
            functional: false,
            essential: true,
            timestamp: new Date().toISOString()
        };
        this.saveConsent(consent);
        this.updateConsent(consent);
        this.hideConsentBanner();
    }

    saveConsent(consent) {
        const consentData = {
            ...consent,
            version: '1.0',
            expiryDate: new Date(Date.now() + this.consentExpiry * 24 * 60 * 60 * 1000).toISOString()
        };
        localStorage.setItem(this.consentKey, JSON.stringify(consentData));
        
        // Also set a cookie for server-side detection
        document.cookie = `cookie_consent=granted; max-age=${this.consentExpiry * 24 * 60 * 60}; path=/; SameSite=Lax; Secure`;
    }

    getConsentStatus() {
        try {
            const saved = localStorage.getItem(this.consentKey);
            if (!saved) return null;
            
            const consent = JSON.parse(saved);
            
            // Check if consent has expired
            if (new Date(consent.expiryDate) < new Date()) {
                localStorage.removeItem(this.consentKey);
                return null;
            }
            
            return consent;
        } catch (error) {
            console.error('Error reading consent status:', error);
            return null;
        }
    }

    hideConsentBanner() {
        const banner = document.getElementById('cookieConsentBanner');
        if (banner) {
            banner.style.opacity = '0';
            setTimeout(() => banner.remove(), 300);
        }
    }

    // Public method to show settings again (for "Cookie Settings" link)
    showSettings() {
        this.showConsentBanner();
    }

    // Public method to revoke consent
    revokeConsent() {
        localStorage.removeItem(this.consentKey);
        document.cookie = 'cookie_consent=; max-age=0; path=/';
        
        // Reset to default denied state
        this.setDefaultConsent();
        
        // Reload page to apply changes
        window.location.reload();
    }
}

// Initialize Cookie Consent
const cookieConsent = new CookieConsent();

// Make it globally accessible
window.cookieConsent = cookieConsent;

console.log('🍪 GDPR Cookie Consent initialized with Google Consent Mode v2');
