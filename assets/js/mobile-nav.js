// Mobile Navigation: hamburger menu, language dropdown, scroll hide/show
document.addEventListener('DOMContentLoaded', function() {
    const hamburger = document.getElementById('mobileHamburger');
    const overlay = document.getElementById('mobileOverlay');
    const innerCircleBtn = document.getElementById('mobileInnerCircle');
    const contactBtn = document.getElementById('mobileContact');
    const flagBtn = document.getElementById('mobileFlagBtn');
    const quickDropdown = document.getElementById('quickLangDropdown');
    const nav = document.querySelector('.premium-nav');
    
    // Flag mapping for languages
    const langFlags = {en:'EN', de:'DE', fr:'FR', es:'ES', it:'IT', ru:'RU', zh:'ZH', ja:'JA', ar:'AR'};
    
    // Mobile scroll detection - hide on scroll down, show on scroll up
    let lastScrollTop = 0;
    let scrollTimeout;
    
    function handleMobileScroll() {
        // Only apply on mobile
        if (window.innerWidth > 768) return;
        
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        // Don't hide nav when menu is open
        if (overlay.classList.contains('active')) return;
        
        if (scrollTop > lastScrollTop && scrollTop > 100) {
            // Scrolling down
            nav.classList.add('nav-hidden');
        } else {
            // Scrolling up
            nav.classList.remove('nav-hidden');
        }
        
        lastScrollTop = scrollTop;
    }
    
    window.addEventListener('scroll', function() {
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(handleMobileScroll, 10);
    }, { passive: true });
    
    // Set mobile flag button to current language on load
    const currentLang = localStorage.getItem('billionairs_lang') || 'en';
    if (flagBtn && langFlags[currentLang]) {
        flagBtn.querySelector('.flag-emoji').textContent = langFlags[currentLang];
    }

    // Touch feedback for buttons
    function addTouchFeedback(button) {
        button.addEventListener('touchstart', function() {
            this.style.transform = 'scale(0.97)';
        }, { passive: true });
        
        button.addEventListener('touchend', function() {
            setTimeout(() => {
                this.style.transform = '';
            }, 150);
        }, { passive: true });
    }

    // Add touch feedback to all mobile buttons
    [innerCircleBtn, contactBtn].forEach(btn => addTouchFeedback(btn));

    // Toggle menu
    hamburger.addEventListener('click', function() {
        hamburger.classList.toggle('active');
        overlay.classList.toggle('active');
        
        // Prevent scrolling when menu is open
        if (overlay.classList.contains('active')) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
    });

    // Close menu when clicking overlay background
    overlay.addEventListener('click', function(e) {
        if (e.target === overlay) {
            hamburger.classList.remove('active');
            overlay.classList.remove('active');
            document.body.style.overflow = '';
        }
    });

    // Inner Circle button
    innerCircleBtn.addEventListener('click', function() {
        const lang = localStorage.getItem('billionairs_lang') || 'en';
        window.location.href = '/login.html?lang=' + lang;
    });

    // Flag button - toggle quick language dropdown
    flagBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        const isOpen = flagBtn.classList.toggle('active');
        if (isOpen) {
            quickDropdown.style.display = 'flex';
            quickDropdown.classList.add('active');
        } else {
            quickDropdown.style.display = 'none';
            quickDropdown.classList.remove('active');
        }
        
        // Mark current language as active
        const curLang = localStorage.getItem('billionairs_lang') || 'en';
        quickDropdown.querySelectorAll('.quick-lang-option').forEach(opt => {
            opt.classList.toggle('active-lang', opt.getAttribute('data-lang') === curLang);
        });
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', function(e) {
        if (!flagBtn.contains(e.target) && !quickDropdown.contains(e.target)) {
            flagBtn.classList.remove('active');
            quickDropdown.classList.remove('active');
            quickDropdown.style.display = 'none';
        }
    });
    
    // Quick language option click handlers
    function setupQuickLangOptions() {
        quickDropdown.querySelectorAll('.quick-lang-option').forEach(option => {
            option.addEventListener('click', async function(e) {
                e.preventDefault();
                e.stopPropagation();
                const lang = this.getAttribute('data-lang');
                if (window.i18n) {
                    await window.i18n.switchLanguage(lang);
                    
                    // Translate footer links
                    if (typeof window.translateFooterLinks === 'function') {
                        window.translateFooterLinks(lang);
                    }
                    
                    // Trigger modal translation
                    if (typeof translateModals === 'function') {
                        setTimeout(translateModals, 300);
                    }
                    
                    // Update desktop button text
                    const desktopBtn = document.getElementById('langBtn');
                    if (desktopBtn) {
                        desktopBtn.textContent = lang.toUpperCase();
                    }
                    
                    // Update flag button emoji
                    if (langFlags[lang]) {
                        flagBtn.querySelector('.flag-emoji').textContent = langFlags[lang];
                    }
                    
                    // Mark active language
                    quickDropdown.querySelectorAll('.quick-lang-option').forEach(opt => {
                        opt.classList.toggle('active-lang', opt.getAttribute('data-lang') === lang);
                    });
                    
                    // Close dropdown
                    flagBtn.classList.remove('active');
                    quickDropdown.classList.remove('active');
                    quickDropdown.style.display = 'none';
                } else {
                    console.error('i18n not available');
                }
            });
        });
    }
    
    // Setup immediately if i18n is ready, otherwise wait for event
    if (window.i18n) {
        setupQuickLangOptions();
    } else {
        window.addEventListener('i18nReady', setupQuickLangOptions, { once: true });
    }

    // Contact button - trigger desktop contact button
    contactBtn.addEventListener('click', function() {
        // Close mobile menu first
        hamburger.classList.remove('active');
        overlay.classList.remove('active');
        document.body.style.overflow = '';
        
        // Wait for menu to close, then trigger contact popup
        setTimeout(function() {
            const desktopContactBtn = document.getElementById('contactBtn');
            if (desktopContactBtn) {
                desktopContactBtn.click();
            }
        }, 300);
    });

    // Mobile legal links - open modals
    const mobileLegalLinks = {
        'mobileFaqLink': 'faq',
        'mobileLegalLink': 'impressum',
        'mobilePrivacyLink': 'privacy',
        'mobileTermsLink': 'terms'
    };

    Object.entries(mobileLegalLinks).forEach(([id, modalName]) => {
        const link = document.getElementById(id);
        if (link) {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                // Close mobile menu
                hamburger.classList.remove('active');
                overlay.classList.remove('active');
                document.body.style.overflow = '';
                // Open the modal after menu closes
                setTimeout(function() {
                    if (typeof window.openModal === 'function') {
                        window.openModal(modalName);
                    }
                }, 300);
            });
        }
    });
});
