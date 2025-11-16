/**
 * Simple Language Dropdown
 * Waits for i18n to be ready before initializing
 */

console.log('🌐 lang-dropdown-simple.js LOADED');

// Function to initialize dropdown
function initLanguageDropdown() {
    console.log('🔧 Initializing language dropdown...');
    
    const langBtn = document.getElementById('langBtn');
    
    if (!langBtn) {
        console.error('❌ #langBtn not found!');
        return;
    }
    
    console.log('✅ Button found:', langBtn);
    
    // Check if dropdown already exists
    const existingDropdown = document.getElementById('langDropdownSimple');
    if (existingDropdown) {
        console.log('⚠️ Dropdown already exists, removing...');
        existingDropdown.remove();
    }
    
    // Create dropdown
    const dropdown = document.createElement('div');
    dropdown.id = 'langDropdownSimple';
    dropdown.className = 'language-dropdown'; // Fixed: was 'lang-dropdown'
    dropdown.innerHTML = `
        <a href="#" class="lang-option" data-lang="en">🇬🇧 English</a>
        <a href="#" class="lang-option" data-lang="de">🇩🇪 Deutsch</a>
        <a href="#" class="lang-option" data-lang="fr">🇫🇷 Français</a>
        <a href="#" class="lang-option" data-lang="es">🇪🇸 Español</a>
        <a href="#" class="lang-option" data-lang="zh">🇨🇳 中文</a>
        <a href="#" class="lang-option" data-lang="ar">🇸🇦 العربية</a>
        <a href="#" class="lang-option" data-lang="it">🇮🇹 Italiano</a>
        <a href="#" class="lang-option" data-lang="ru">🇷🇺 Русский</a>
        <a href="#" class="lang-option" data-lang="ja">🇯🇵 日本語</a>
    `;
    
    // Add to page
    document.body.appendChild(dropdown);
    console.log('✅ Dropdown added to body');
    
    // Position dropdown relative to button
    function positionDropdown() {
        const rect = langBtn.getBoundingClientRect();
        dropdown.style.position = 'fixed';
        dropdown.style.top = (rect.bottom + 10) + 'px';
        dropdown.style.right = (window.innerWidth - rect.right) + 'px';
    }
    
    // Button click - toggle dropdown
    langBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('🖱️ Button clicked');
        
        positionDropdown();
        dropdown.classList.toggle('show');
        console.log('📋 Dropdown classes:', dropdown.className);
    });
    
    // Reposition on scroll/resize
    window.addEventListener('scroll', () => {
        if (dropdown.classList.contains('show')) {
            positionDropdown();
        }
    });
    
    window.addEventListener('resize', () => {
        if (dropdown.classList.contains('show')) {
            positionDropdown();
        }
    });
    
    // Close on outside click
    document.addEventListener('click', (e) => {
        if (!langBtn.contains(e.target) && !dropdown.contains(e.target)) {
            dropdown.classList.remove('show');
        }
    });
    
    // Language selection clicks
    dropdown.querySelectorAll('[data-lang]').forEach(link => {
        link.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            const lang = link.getAttribute('data-lang');
            console.log('🌍 Language clicked:', lang);
            
            if (window.i18n && typeof window.i18n.switchLanguage === 'function') {
                console.log('🔄 Switching language...');
                try {
                    await window.i18n.switchLanguage(lang);
                    console.log('✅ Language switched to:', lang);
                    langBtn.textContent = lang.toUpperCase();
                    dropdown.classList.remove('show');
                } catch (error) {
                    console.error('❌ Error switching language:', error);
                }
            } else {
                console.error('❌ window.i18n.switchLanguage not available!');
            }
        });
    });
    
    console.log('✅ Language dropdown ready!');
}

// Wait for i18n to be ready
if (window.i18n) {
    console.log('✅ i18n already loaded, initializing immediately');
    initLanguageDropdown();
} else {
    console.log('⏳ Waiting for i18nReady event...');
    window.addEventListener('i18nReady', () => {
        console.log('✅ i18nReady event received!');
        initLanguageDropdown();
    });
}

// Also try after DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('✅ DOM ready');
    if (window.i18n && !document.getElementById('langDropdownSimple')) {
        console.log('🔧 Initializing via DOMContentLoaded');
        setTimeout(initLanguageDropdown, 100);
    }
});
