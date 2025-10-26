/**
 * Simple Language Dropdown
 * Standalone implementation without dependencies
 */

document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Simple Language Dropdown Loading...');
    
    const langBtn = document.getElementById('langBtn');
    
    if (!langBtn) {
        console.error('❌ Language button #langBtn not found!');
        return;
    }
    
    console.log('✅ Language button found:', langBtn);
    
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
        option.addEventListener('click', (e) => {
            e.preventDefault();
            const lang = option.getAttribute('data-lang');
            console.log('🌐 Language selected:', lang);
            
            // Call i18n switchLanguage if available
            if (window.i18n && typeof window.i18n.switchLanguage === 'function') {
                window.i18n.switchLanguage(lang);
            } else {
                console.warn('⚠️ i18n not available, just changing button text');
                langBtn.textContent = lang.toUpperCase();
            }
            
            dropdown.classList.remove('show');
        });
    });
    
    console.log('✅ Simple Language Dropdown Ready!');
});
