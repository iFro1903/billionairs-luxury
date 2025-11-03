/**
 * BILLIONAIRS LUXURY - Professional Language System
 * Simple, reliable, and elegant language switcher
 * Version: 2.0
 */

class LanguageSystem {
    constructor() {
        this.currentLang = 'en';
        this.cookieName = 'billionairs_lang';
        this.cookieExpiry = 365;
        
        this.languages = {
            'en': 'English',
            'de': 'Deutsch',
            'fr': 'Français',
            'es': 'Español',
            'zh': '中文',
            'ar': 'العربية',
            'it': 'Italiano',
            'ru': 'Русский',
            'ja': '日本語'
        };
        
        this.rtlLangs = ['ar'];
    }
    
    /**
     * Initialize language system
     */
    init() {
        console.log('🌍 Language System: Initializing...');
        
        // Load saved language or default to English
        const saved = this.getCookie(this.cookieName);
        this.currentLang = saved && this.languages[saved] ? saved : 'en';
        
        console.log(`✅ Language System: Current language is ${this.currentLang}`);
        
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setup());
        } else {
            this.setup();
        }
    }
    
    /**
     * Setup UI elements
     */
    setup() {
        const langBtn = document.getElementById('langBtn');
        
        if (!langBtn) {
            console.warn('⚠️ Language button not found');
            return;
        }
        
        // Set button text to current language
        langBtn.textContent = this.currentLang.toUpperCase();
        
        // Create dropdown if it doesn't exist
        let dropdown = document.getElementById('langDropdown');
        if (!dropdown) {
            dropdown = this.createDropdown();
            langBtn.parentElement.appendChild(dropdown);
        }
        
        // Toggle dropdown on button click
        langBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropdown.classList.toggle('show');
            console.log('🔽 Dropdown toggled');
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!langBtn.contains(e.target) && !dropdown.contains(e.target)) {
                dropdown.classList.remove('show');
            }
        });
        
        // Handle language selection
        dropdown.querySelectorAll('[data-lang]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const newLang = link.getAttribute('data-lang');
                this.switchLanguage(newLang);
                dropdown.classList.remove('show');
            });
        });
        
        console.log('✅ Language System: UI setup complete');
    }
    
    /**
     * Create dropdown HTML
     */
    createDropdown() {
        const dropdown = document.createElement('div');
        dropdown.id = 'langDropdown';
        dropdown.className = 'lang-dropdown';
        
        let html = '';
        for (const [code, name] of Object.entries(this.languages)) {
            html += `<a href="#" data-lang="${code}" class="lang-option">${name}</a>`;
        }
        
        dropdown.innerHTML = html;
        return dropdown;
    }
    
    /**
     * Switch to new language
     */
    async switchLanguage(lang) {
        if (!this.languages[lang]) {
            console.error('❌ Invalid language:', lang);
            return;
        }
        
        console.log(`🔄 Switching language to: ${lang}`);
        
        this.currentLang = lang;
        this.setCookie(this.cookieName, lang, this.cookieExpiry);
        
        // Update HTML lang attribute
        document.documentElement.lang = lang;
        
        // Update text direction for RTL languages
        document.documentElement.dir = this.rtlLangs.includes(lang) ? 'rtl' : 'ltr';
        
        // Update button text
        const langBtn = document.getElementById('langBtn');
        if (langBtn) {
            langBtn.textContent = lang.toUpperCase();
        }
        
        // Trigger i18n translation if available
        if (window.i18n && typeof window.i18n.switchLanguage === 'function') {
            await window.i18n.switchLanguage(lang);
        }
        
        console.log(`✅ Language switched to: ${lang}`);
    }
    
    /**
     * Cookie helpers
     */
    getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
        return null;
    }
    
    setCookie(name, value, days) {
        const expires = new Date(Date.now() + days * 864e5).toUTCString();
        document.cookie = `${name}=${value}; expires=${expires}; path=/; SameSite=Lax`;
    }
}

// Initialize on page load
const languageSystem = new LanguageSystem();
languageSystem.init();

// Make globally available
window.languageSystem = languageSystem;
