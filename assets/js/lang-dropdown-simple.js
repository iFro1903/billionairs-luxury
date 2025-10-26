/**
 * Simple Language Dropdown - Ultra Simple Version
 */

console.log('📦 lang-dropdown-simple.js LOADED');

document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 DOMContentLoaded - Starting language dropdown init');
    
    // Wait a bit for i18n to initialize
    setTimeout(() => {
        const langBtn = document.getElementById('langBtn');
        
        if (!langBtn) {
            console.error('❌ #langBtn not found!');
            return;
        }
        
        console.log('✅ Button found, creating dropdown...');
        
        // Create dropdown
        const dropdown = document.createElement('div');
        dropdown.id = 'langDropdownSimple';
        dropdown.className = 'language-dropdown';
        dropdown.innerHTML = `
            <a href="#" data-lang="de">🇩🇪 Deutsch</a>
            <a href="#" data-lang="en">🇬🇧 English</a>
            <a href="#" data-lang="fr">🇫🇷 Français</a>
            <a href="#" data-lang="es">🇪🇸 Español</a>
            <a href="#" data-lang="zh">🇨🇳 中文</a>
            <a href="#" data-lang="ar">🇦🇪 العربية</a>
            <a href="#" data-lang="it">🇮🇹 Italiano</a>
            <a href="#" data-lang="ru">🇷🇺 Русский</a>
            <a href="#" data-lang="ja">🇯🇵 日本語</a>
        `;
        
        // Add to page
        langBtn.parentElement.appendChild(dropdown);
        console.log('✅ Dropdown added to DOM');
        
        // Button click
        langBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropdown.classList.toggle('show');
            console.log('� Dropdown toggled, classes:', dropdown.className);
        });
        
        // Close on outside click
        document.addEventListener('click', (e) => {
            if (!langBtn.contains(e.target) && !dropdown.contains(e.target)) {
                dropdown.classList.remove('show');
            }
        });
        
        // Language clicks
        dropdown.querySelectorAll('[data-lang]').forEach(link => {
            link.addEventListener('click', async (e) => {
                e.preventDefault();
                const lang = link.getAttribute('data-lang');
                console.log('🌐 Selected:', lang);
                
                if (window.i18n && window.i18n.switchLanguage) {
                    await window.i18n.switchLanguage(lang);
                    langBtn.textContent = lang.toUpperCase();
                }
                
                dropdown.classList.remove('show');
            });
        });
        
        console.log('✅ Language dropdown ready!');
    }, 500); // Wait 500ms for i18n
});
