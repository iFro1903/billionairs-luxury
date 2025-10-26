/**
 * Simple Language Dropdown
 * Standalone implementation without dependencies
 */

// Wait for both DOM and i18n to be ready
function initLanguageDropdown() {
    console.log('🚀 Simple Language Dropdown Loading...');
    
    const langBtn = document.getElementById('langBtn');
    
    if (!langBtn) {
        console.error('❌ Language button #langBtn not found!');
        return;
    }
    
    console.log('✅ Language button found:', langBtn);
    
    // Check if i18n is available and ready
    if (!window.i18n) {
        console.warn('⚠️ window.i18n not available, waiting for i18nReady event...');
        
        // Wait for i18n ready event
        window.addEventListener('i18nReady', () => {
            console.log('📢 i18nReady event received, retrying initialization...');
            setupDropdown(langBtn);
        }, { once: true });
        return;
    }
    
    // i18n exists, set up dropdown immediately
    console.log('✅ i18n available:', window.i18n);
    setupDropdown(langBtn);
}

function setupDropdown(langBtn) {
    console.log('🔧 Setting up dropdown...');
    
    // Create dropdown HTML
    const dropdownHTML = `
        <div id="langDropdownSimple" class="language-dropdown">
            <a href="#" class="lang-option" data-lang="de">
                <span class="lang-flag">🇩🇪</span>
                <span class="lang-name">Deutsch</span>
            </a>
            <a href="#" class="lang-option" data-lang="en">
                <span class="lang-flag">🇬🇧</span>
                <span class="lang-name">English</span>
            </a>
            <a href="#" class="lang-option" data-lang="fr">
                <span class="lang-flag">🇫🇷</span>
                <span class="lang-name">Français</span>
            </a>
            <a href="#" class="lang-option" data-lang="es">
                <span class="lang-flag">🇪🇸</span>
                <span class="lang-name">Español</span>
            </a>
            <a href="#" class="lang-option" data-lang="zh">
                <span class="lang-flag">🇨🇳</span>
                <span class="lang-name">中文</span>
            </a>
            <a href="#" class="lang-option" data-lang="ar">
                <span class="lang-flag">🇦🇪</span>
                <span class="lang-name">العربية</span>
            </a>
            <a href="#" class="lang-option" data-lang="it">
                <span class="lang-flag">🇮🇹</span>
                <span class="lang-name">Italiano</span>
            </a>
            <a href="#" class="lang-option" data-lang="ru">
                <span class="lang-flag">🇷🇺</span>
                <span class="lang-name">Русский</span>
            </a>
            <a href="#" class="lang-option" data-lang="ja">
                <span class="lang-flag">🇯🇵</span>
                <span class="lang-name">日本語</span>
            </a>
        </div>
    `;
    
    // Insert dropdown after button
    langBtn.insertAdjacentHTML('afterend', dropdownHTML);
    
    const dropdown = document.getElementById('langDropdownSimple');
    console.log('✅ Dropdown created:', dropdown);
    
    // Toggle dropdown on button click
    langBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        const isShown = dropdown.classList.toggle('show');
        console.log('🔄 Dropdown toggled:', isShown ? 'SHOWN ✅' : 'HIDDEN ❌');
        console.log('📍 Dropdown classes:', dropdown.className);
        console.log('📍 Dropdown computed display:', window.getComputedStyle(dropdown).display);
        console.log('📍 Dropdown computed opacity:', window.getComputedStyle(dropdown).opacity);
        console.log('📍 Dropdown computed visibility:', window.getComputedStyle(dropdown).visibility);
    });
    
    // Close on outside click
    document.addEventListener('click', (e) => {
        if (!langBtn.contains(e.target) && !dropdown.contains(e.target)) {
            dropdown.classList.remove('show');
        }
    });
    
    // Language selection
    dropdown.querySelectorAll('.lang-option').forEach(option => {
        option.addEventListener('click', async (e) => {
            e.preventDefault();
            const lang = option.getAttribute('data-lang');
            console.log('🌐 Language selected:', lang);
            
            // Call i18n switchLanguage if available
            if (window.i18n && typeof window.i18n.switchLanguage === 'function') {
                console.log('✅ Calling i18n.switchLanguage...');
                await window.i18n.switchLanguage(lang);
                console.log('✅ Language switched successfully!');
                
                // Update button text
                const flags = {
                    'de': '🇩🇪', 'en': '🇬🇧', 'fr': '🇫🇷', 'es': '🇪🇸',
                    'zh': '🇨🇳', 'ar': '🇦🇪', 'it': '🇮🇹', 'ru': '🇷🇺', 'ja': '🇯🇵'
                };
                langBtn.innerHTML = `${flags[lang]} ${lang.toUpperCase()}`;
                
                // Update active state in dropdown
                dropdown.querySelectorAll('.lang-option').forEach(opt => {
                    opt.classList.remove('active');
                });
                option.classList.add('active');
            } else {
                console.warn('⚠️ i18n not available, just changing button text');
                langBtn.textContent = lang.toUpperCase();
            }
            
            dropdown.classList.remove('show');
        });
    });
    
    console.log('✅ Simple Language Dropdown Ready!');
}

// Start initialization when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    initLanguageDropdown();
});
