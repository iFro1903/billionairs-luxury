/**
 * Simple Language Dropdown
 * Waits for i18n to be ready before initializing
 */

console.log(' lang-dropdown-simple.js LOADED');

// Wait for i18n to be ready
window.addEventListener('i18nReady', () => {
    console.log(' i18nReady event received!');
    console.log(' window.i18n:', window.i18n);
    
    const langBtn = document.getElementById('langBtn');
    
    if (!langBtn) {
        console.error(' #langBtn not found!');
        return;
    }
    
    console.log(' Button found, creating dropdown...');
    
    // Create dropdown
    const dropdown = document.createElement('div');
    dropdown.id = 'langDropdownSimple';
    dropdown.className = 'language-dropdown';
    dropdown.innerHTML = `
        <a href="#" data-lang="en"> English</a>
        <a href="#" data-lang="de"> Deutsch</a>
        <a href="#" data-lang="fr"> Français</a>
        <a href="#" data-lang="es"> Español</a>
        <a href="#" data-lang="zh"> 中文</a>
        <a href="#" data-lang="ar"> العربية</a>
        <a href="#" data-lang="it"> Italiano</a>
        <a href="#" data-lang="ru"> Русский</a>
        <a href="#" data-lang="ja"> 日本語</a>
    `;
    
    // Add to page
    langBtn.parentElement.appendChild(dropdown);
    console.log(' Dropdown added to DOM');
    
    // Button click - toggle dropdown
    langBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropdown.classList.toggle('show');
        console.log(' Dropdown toggled, classes:', dropdown.className);
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
            const lang = link.getAttribute('data-lang');
            console.log(' Language clicked:', lang);
            console.log(' i18n available?', !!window.i18n);
            console.log(' switchLanguage available?', !!(window.i18n && window.i18n.switchLanguage));
            
            if (window.i18n && typeof window.i18n.switchLanguage === 'function') {
                console.log(' Calling switchLanguage...');
                try {
                    await window.i18n.switchLanguage(lang);
                    console.log(' Language switched to:', lang);
                    langBtn.textContent = lang.toUpperCase();
                } catch (error) {
                    console.error(' Error switching language:', error);
                }
            } else {
                console.error(' i18n.switchLanguage not available!');
                console.log('window.i18n:', window.i18n);
            }
            
            dropdown.classList.remove('show');
        });
    });
    
    console.log(' Language dropdown ready!');
});