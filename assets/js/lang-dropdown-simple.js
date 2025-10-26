/**/**

 * Simple Language Dropdown * Simple Language Dropdown - Ultra Simple Version

 * Waits for i18n to be ready before initializing */

 */

console.log('📦 lang-dropdown-simple.js LOADED');

console.log('📦 lang-dropdown-simple.js LOADED');

// Wait for i18n to be ready

// Wait for i18n to be readywindow.addEventListener('i18nReady', () => {

window.addEventListener('i18nReady', () => {    console.log('🚀 i18nReady event received!');

    console.log('🚀 i18nReady event received!');    console.log('🔍 window.i18n:', window.i18n);

    console.log('🔍 window.i18n:', window.i18n);    

        const langBtn = document.getElementById('langBtn');

    const langBtn = document.getElementById('langBtn');    

        if (!langBtn) {

    if (!langBtn) {        console.error('❌ #langBtn not found!');

        console.error('❌ #langBtn not found!');        return;

        return;    }

    }    

        console.log('✅ Button found, creating dropdown...');

    console.log('✅ Button found, creating dropdown...');        

            // Create dropdown

    // Create dropdown        const dropdown = document.createElement('div');

    const dropdown = document.createElement('div');        dropdown.id = 'langDropdownSimple';

    dropdown.id = 'langDropdownSimple';        dropdown.className = 'language-dropdown';

    dropdown.className = 'language-dropdown';        dropdown.innerHTML = `

    dropdown.innerHTML = `            <a href="#" data-lang="de">🇩🇪 Deutsch</a>

        <a href="#" data-lang="de">🇩🇪 Deutsch</a>            <a href="#" data-lang="en">🇬🇧 English</a>

        <a href="#" data-lang="en">🇬🇧 English</a>            <a href="#" data-lang="fr">🇫🇷 Français</a>

        <a href="#" data-lang="fr">🇫🇷 Français</a>            <a href="#" data-lang="es">🇪🇸 Español</a>

        <a href="#" data-lang="es">🇪🇸 Español</a>            <a href="#" data-lang="zh">🇨🇳 中文</a>

        <a href="#" data-lang="zh">🇨🇳 中文</a>            <a href="#" data-lang="ar">🇦🇪 العربية</a>

        <a href="#" data-lang="ar">🇦🇪 العربية</a>            <a href="#" data-lang="it">🇮🇹 Italiano</a>

        <a href="#" data-lang="it">🇮🇹 Italiano</a>            <a href="#" data-lang="ru">🇷🇺 Русский</a>

        <a href="#" data-lang="ru">🇷🇺 Русский</a>            <a href="#" data-lang="ja">🇯🇵 日本語</a>

        <a href="#" data-lang="ja">🇯🇵 日本語</a>        `;

    `;        

            // Add to page

    // Add to page        langBtn.parentElement.appendChild(dropdown);

    langBtn.parentElement.appendChild(dropdown);        console.log('✅ Dropdown added to DOM');

    console.log('✅ Dropdown added to DOM');        

            // Button click

    // Button click - toggle dropdown        langBtn.addEventListener('click', (e) => {

    langBtn.addEventListener('click', (e) => {            e.preventDefault();

        e.preventDefault();            e.stopPropagation();

        e.stopPropagation();            dropdown.classList.toggle('show');

        dropdown.classList.toggle('show');            console.log('� Dropdown toggled, classes:', dropdown.className);

        console.log('🔄 Dropdown toggled, classes:', dropdown.className);        });

    });        

            // Close on outside click

    // Close on outside click        document.addEventListener('click', (e) => {

    document.addEventListener('click', (e) => {            if (!langBtn.contains(e.target) && !dropdown.contains(e.target)) {

        if (!langBtn.contains(e.target) && !dropdown.contains(e.target)) {                dropdown.classList.remove('show');

            dropdown.classList.remove('show');            }

        }        });

    });        

            // Language clicks

    // Language selection clicks        dropdown.querySelectorAll('[data-lang]').forEach(link => {

    dropdown.querySelectorAll('[data-lang]').forEach(link => {            link.addEventListener('click', async (e) => {

        link.addEventListener('click', async (e) => {                e.preventDefault();

            e.preventDefault();                const lang = link.getAttribute('data-lang');

            const lang = link.getAttribute('data-lang');                console.log('🌐 Language clicked:', lang);

            console.log('🌐 Language clicked:', lang);                console.log('🔍 i18n available?', !!window.i18n);

            console.log('🔍 i18n available?', !!window.i18n);                console.log('🔍 switchLanguage available?', !!(window.i18n && window.i18n.switchLanguage));

            console.log('🔍 switchLanguage available?', !!(window.i18n && window.i18n.switchLanguage));                

                            if (window.i18n && typeof window.i18n.switchLanguage === 'function') {

            if (window.i18n && typeof window.i18n.switchLanguage === 'function') {                    console.log('✅ Calling switchLanguage...');

                console.log('✅ Calling switchLanguage...');                    try {

                try {                        await window.i18n.switchLanguage(lang);

                    await window.i18n.switchLanguage(lang);                        console.log('✅ Language switched to:', lang);

                    console.log('✅ Language switched to:', lang);                        langBtn.textContent = lang.toUpperCase();

                    langBtn.textContent = lang.toUpperCase();                    } catch (error) {

                } catch (error) {                        console.error('❌ Error switching language:', error);

                    console.error('❌ Error switching language:', error);                    }

                }                } else {

            } else {                    console.error('❌ i18n.switchLanguage not available!');

                console.error('❌ i18n.switchLanguage not available!');                    console.log('window.i18n:', window.i18n);

                console.log('window.i18n:', window.i18n);                }

            }                

                            dropdown.classList.remove('show');

            dropdown.classList.remove('show');            });

        });        });

    });        

            console.log('✅ Language dropdown ready!');

    console.log('✅ Language dropdown ready!');});

});
