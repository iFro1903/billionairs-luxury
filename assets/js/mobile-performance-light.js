// ============================================================================
// MOBILE PERFORMANCE BOOST - LIGHT VERSION (NUR PERFORMANCE)
// Keine Design-Änderungen, nur Speed-Optimierungen
// ============================================================================

(function() {
    'use strict';

    // ===== LAZY LOADING FÜR SECTIONS =====
    const observerOptions = {
        root: null,
        rootMargin: '400px', // Erhöht von 50px - lädt Inhalte früher beim Scrollen
        threshold: 0.01 // Reduziert von 0.1 - reagiert schneller
    };

    const sectionObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                sectionObserver.unobserve(entry.target);
            }
        });
    }, observerOptions);

    function initLazyLoading() {
        const sections = document.querySelectorAll('section');
        sections.forEach(section => {
            // Hero Section NICHT lazy loaden - sofort anzeigen
            if (section.classList.contains('hero') || section.id === 'heroSection') {
                section.classList.add('visible');
                return;
            }
            
            // Alle anderen Sections lazy loaden
            section.classList.add('fade-in-section');
            sectionObserver.observe(section);
        });
    }

    // ===== PASSIVE EVENT LISTENERS =====
    function addPassiveListeners() {
        document.addEventListener('touchstart', function() {}, { passive: true });
        document.addEventListener('touchmove', function() {}, { passive: true });
        document.addEventListener('touchend', function() {}, { passive: true });
        document.addEventListener('wheel', function() {}, { passive: true });
    }

    // ===== PRELOAD CRITICAL RESOURCES =====
    function preloadCritical() {
        // Logo sofort preloaden
        const logoLink = document.createElement('link');
        logoLink.rel = 'preload';
        logoLink.as = 'image';
        logoLink.href = 'assets/images/logo.png';
        document.head.appendChild(logoLink);
        
        // Kritische CSS für Buttons preloaden
        const stylesheets = ['styles.css', 'mobile-nav.css'];
        stylesheets.forEach(css => {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.as = 'style';
            link.href = `assets/css/${css}`;
            document.head.appendChild(link);
        });
    }

    // ===== REQUEST IDLE CALLBACK =====
    function scheduleIdleTasks() {
        if ('requestIdleCallback' in window) {
            requestIdleCallback(() => {
                initLazyLoading();
            });
        } else {
            setTimeout(initLazyLoading, 1);
        }
    }

    // ===== IMAGE LAZY LOADING =====
    function lazyLoadImages() {
        if ('loading' in HTMLImageElement.prototype) {
            const images = document.querySelectorAll('img[data-src]');
            images.forEach(img => {
                img.src = img.dataset.src;
                img.loading = 'lazy';
            });
        }
    }

    // ===== INIT =====
    function init() {
        preloadCritical();
        addPassiveListeners();

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                scheduleIdleTasks();
                lazyLoadImages();
            });
        } else {
            scheduleIdleTasks();
            lazyLoadImages();
        }
    }

    init();
    console.log('🚀 Mobile Performance: ACTIVE (Light Mode)');
})();
