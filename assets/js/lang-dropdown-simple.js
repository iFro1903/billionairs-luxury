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
    
    // Create dropdown with inline styles for immediate effect
    const dropdown = document.createElement('div');
    dropdown.id = 'langDropdownSimple';
    dropdown.className = 'language-dropdown';
    
    // Apply critical inline styles - NO SCROLLING, show all languages
    dropdown.style.cssText = `
        position: fixed;
        background: linear-gradient(145deg, rgba(15,15,20,0.98) 0%, rgba(25,20,30,0.98) 50%, rgba(20,15,25,0.98) 100%);
        border: 2px solid rgba(232,180,184,0.6);
        border-radius: 20px;
        width: 280px;
        max-width: 280px;
        overflow: hidden !important;
        box-shadow: 0 20px 60px rgba(0,0,0,0.8), 0 0 40px rgba(232,180,184,0.15);
        z-index: 99999;
        opacity: 0;
        visibility: hidden;
        transform: translateY(-20px) scale(0.9);
        transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        backdrop-filter: blur(20px) saturate(180%);
        -webkit-backdrop-filter: blur(20px) saturate(180%);
    `;
    
    // Force remove all scrolling capabilities
    const style = document.createElement('style');
    style.textContent = `
        #langDropdownSimple {
            overflow: hidden !important;
            overflow-x: hidden !important;
            overflow-y: hidden !important;
            max-height: none !important;
            -webkit-overflow-scrolling: auto !important;
        }
        #langDropdownSimple::-webkit-scrollbar {
            display: none !important;
            width: 0 !important;
            height: 0 !important;
        }
        .language-dropdown {
            overflow: hidden !important;
            overflow-x: hidden !important;
            overflow-y: hidden !important;
        }
    `;
    document.head.appendChild(style);
    
    dropdown.innerHTML = `
        <a href="#" class="lang-option" data-lang="en" style="display:flex; align-items:center; padding:16px 24px; color:rgba(255,255,255,0.9); text-decoration:none; font-family:'Montserrat','Playfair Display',serif; font-size:15px; letter-spacing:1.2px; border-bottom:1px solid rgba(232,180,184,0.08); transition:all 0.35s; cursor:pointer;">
            <span style="font-size:24px; margin-right:16px;">🇬🇧</span> English
        </a>
        <a href="#" class="lang-option" data-lang="de" style="display:flex; align-items:center; padding:16px 24px; color:rgba(255,255,255,0.9); text-decoration:none; font-family:'Montserrat','Playfair Display',serif; font-size:15px; letter-spacing:1.2px; border-bottom:1px solid rgba(232,180,184,0.08); transition:all 0.35s; cursor:pointer;">
            <span style="font-size:24px; margin-right:16px;">🇩🇪</span> Deutsch
        </a>
        <a href="#" class="lang-option" data-lang="fr" style="display:flex; align-items:center; padding:16px 24px; color:rgba(255,255,255,0.9); text-decoration:none; font-family:'Montserrat','Playfair Display',serif; font-size:15px; letter-spacing:1.2px; border-bottom:1px solid rgba(232,180,184,0.08); transition:all 0.35s; cursor:pointer;">
            <span style="font-size:24px; margin-right:16px;">🇫🇷</span> Français
        </a>
        <a href="#" class="lang-option" data-lang="es" style="display:flex; align-items:center; padding:16px 24px; color:rgba(255,255,255,0.9); text-decoration:none; font-family:'Montserrat','Playfair Display',serif; font-size:15px; letter-spacing:1.2px; border-bottom:1px solid rgba(232,180,184,0.08); transition:all 0.35s; cursor:pointer;">
            <span style="font-size:24px; margin-right:16px;">🇪🇸</span> Español
        </a>
        <a href="#" class="lang-option" data-lang="zh" style="display:flex; align-items:center; padding:16px 24px; color:rgba(255,255,255,0.9); text-decoration:none; font-family:'Montserrat','Playfair Display',serif; font-size:15px; letter-spacing:1.2px; border-bottom:1px solid rgba(232,180,184,0.08); transition:all 0.35s; cursor:pointer;">
            <span style="font-size:24px; margin-right:16px;">🇨🇳</span> 中文
        </a>
        <a href="#" class="lang-option" data-lang="ar" style="display:flex; align-items:center; padding:16px 24px; color:rgba(255,255,255,0.9); text-decoration:none; font-family:'Montserrat','Playfair Display',serif; font-size:15px; letter-spacing:1.2px; border-bottom:1px solid rgba(232,180,184,0.08); transition:all 0.35s; cursor:pointer;">
            <span style="font-size:24px; margin-right:16px;">🇸🇦</span> العربية
        </a>
        <a href="#" class="lang-option" data-lang="it" style="display:flex; align-items:center; padding:16px 24px; color:rgba(255,255,255,0.9); text-decoration:none; font-family:'Montserrat','Playfair Display',serif; font-size:15px; letter-spacing:1.2px; border-bottom:1px solid rgba(232,180,184,0.08); transition:all 0.35s; cursor:pointer;">
            <span style="font-size:24px; margin-right:16px;">🇮🇹</span> Italiano
        </a>
        <a href="#" class="lang-option" data-lang="ru" style="display:flex; align-items:center; padding:16px 24px; color:rgba(255,255,255,0.9); text-decoration:none; font-family:'Montserrat','Playfair Display',serif; font-size:15px; letter-spacing:1.2px; border-bottom:1px solid rgba(232,180,184,0.08); transition:all 0.35s; cursor:pointer;">
            <span style="font-size:24px; margin-right:16px;">🇷🇺</span> Русский
        </a>
        <a href="#" class="lang-option" data-lang="ja" style="display:flex; align-items:center; padding:16px 24px; color:rgba(255,255,255,0.9); text-decoration:none; font-family:'Montserrat','Playfair Display',serif; font-size:15px; letter-spacing:1.2px; border-bottom:1px solid rgba(232,180,184,0.08); transition:all 0.35s; cursor:pointer;">
            <span style="font-size:24px; margin-right:16px;">🇯🇵</span> 日本語
        </a>
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
        
        const isVisible = dropdown.style.opacity === '1';
        
        if (isVisible) {
            // Hide with animation
            dropdown.style.opacity = '0';
            dropdown.style.visibility = 'hidden';
            dropdown.style.transform = 'translateY(-20px) scale(0.9)';
        } else {
            // Show with luxury animation
            dropdown.style.opacity = '1';
            dropdown.style.visibility = 'visible';
            dropdown.style.transform = 'translateY(0) scale(1)';
        }
        
        console.log('📋 Dropdown visible:', !isVisible);
    });
    
    // Reposition on scroll/resize
    window.addEventListener('scroll', () => {
        if (dropdown.style.opacity === '1') {
            positionDropdown();
        }
    });
    
    window.addEventListener('resize', () => {
        if (dropdown.style.opacity === '1') {
            positionDropdown();
        }
    });
    
    // Close on outside click
    document.addEventListener('click', (e) => {
        if (!langBtn.contains(e.target) && !dropdown.contains(e.target)) {
            dropdown.style.opacity = '0';
            dropdown.style.visibility = 'hidden';
            dropdown.style.transform = 'translateY(-20px) scale(0.9)';
        }
    });
    
    // Language selection clicks with hover effects
    dropdown.querySelectorAll('[data-lang]').forEach(link => {
        // Add hover effects
        link.addEventListener('mouseenter', () => {
            link.style.background = 'linear-gradient(90deg, rgba(232,180,184,0.25), rgba(247,202,201,0.2))';
            link.style.paddingLeft = '32px';
            link.style.transform = 'translateX(4px)';
            link.style.textShadow = '0 0 20px rgba(232,180,184,0.4)';
            const flag = link.querySelector('span');
            if (flag) {
                flag.style.transform = 'scale(1.2) rotate(5deg)';
            }
        });
        
        link.addEventListener('mouseleave', () => {
            const isActive = link.classList.contains('active');
            if (!isActive) {
                link.style.background = '';
                link.style.paddingLeft = '24px';
                link.style.transform = '';
                link.style.textShadow = '';
            }
            const flag = link.querySelector('span');
            if (flag) {
                flag.style.transform = '';
            }
        });
        
        link.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            const lang = link.getAttribute('data-lang');
            console.log('🌍 Language clicked:', lang);
            
            // Close dropdown immediately
            dropdown.style.opacity = '0';
            dropdown.style.visibility = 'hidden';
            dropdown.style.transform = 'translateY(-20px) scale(0.9)';
            
            if (window.i18n && typeof window.i18n.switchLanguage === 'function') {
                console.log('🔄 Switching language...');
                try {
                    await window.i18n.switchLanguage(lang);
                    console.log('✅ Language switched to:', lang);
                    langBtn.textContent = lang.toUpperCase();
                    
                    // Force modal translation after language switch
                    if (typeof translateModals === 'function') {
                        console.log('🔄 Manually triggering modal translation...');
                        setTimeout(translateModals, 300);
                    }
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
