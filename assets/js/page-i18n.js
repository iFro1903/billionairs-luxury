/**
 * Page-wide i18n translations for all remaining elements
 * Ensures NOTHING stays in English when language changes
 */

const pageTranslations = {
    'de': {
        'trust.members_title': 'Vertraut von Mitgliedern aus 12 Ländern',
        'trust.others': '+ 42 weitere',
        'trust.click_hint': 'Klicken Sie auf Mitglieder, um ihre Erfahrungen zu lesen'
    },
    'fr': {
        'trust.members_title': 'Approuvé par des membres dans 12 pays',
        'trust.others': '+ 42 autres',
        'trust.click_hint': 'Cliquez sur les membres pour lire leur expérience'
    },
    'es': {
        'trust.members_title': 'Confianza de miembros en 12 países',
        'trust.others': '+ 42 más',
        'trust.click_hint': 'Haga clic en los miembros para leer su experiencia'
    },
    'zh': {
        'trust.members_title': '受到12个国家会员的信赖',
        'trust.others': '+ 42 位其他人',
        'trust.click_hint': '点击会员阅读他们的体验'
    },
    'ar': {
        'trust.members_title': 'موثوق به من قبل الأعضاء في 12 دولة',
        'trust.others': '+ 42 آخرين',
        'trust.click_hint': 'انقر على الأعضاء لقراءة تجربتهم'
    },
    'it': {
        'trust.members_title': 'Fidato da membri in 12 paesi',
        'trust.others': '+ 42 altri',
        'trust.click_hint': 'Clicca sui membri per leggere la loro esperienza'
    },
    'ru': {
        'trust.members_title': 'Доверие членов из 12 стран',
        'trust.others': '+ 42 других',
        'trust.click_hint': 'Нажмите на участников, чтобы прочитать их опыт'
    },
    'ja': {
        'trust.members_title': '12か国の会員から信頼されています',
        'trust.others': '+ 42 名その他',
        'trust.click_hint': 'メンバーをクリックして体験を読む'
    },
    'en': {
        'trust.members_title': 'Trusted by members across 12 countries',
        'trust.others': '+ 42 others',
        'trust.click_hint': 'Click on members to read their experience'
    }
};

/**
 * Translate all elements with data-i18n-key attribute
 */
function translatePageElements() {
    const currentLang = window.i18n?.currentLang || 'en';
    const translations = pageTranslations[currentLang] || pageTranslations['en'];
    
    console.log('🔄 Translating page elements to:', currentLang);
    
    // Find all elements with data-i18n-key
    const elements = document.querySelectorAll('[data-i18n-key]');
    
    let translatedCount = 0;
    elements.forEach(element => {
        const key = element.getAttribute('data-i18n-key');
        if (translations[key]) {
            element.textContent = translations[key];
            translatedCount++;
            console.log(`✓ Translated ${key}:`, translations[key]);
        } else {
            console.warn(`⚠️ Missing translation for key: ${key}`);
        }
    });
    
    console.log(`✅ Translated ${translatedCount} page elements`);
}

// Make function globally accessible
window.translatePageElements = translatePageElements;

// Listen for language changes
window.addEventListener('languageChanged', (event) => {
    console.log('🌍 Language changed - translating page elements:', event.detail.language);
    setTimeout(translatePageElements, 50);
});

window.addEventListener('i18nReady', () => {
    console.log('🌍 i18n ready - translating page elements');
    setTimeout(translatePageElements, 100);
});

// Initial translation when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(translatePageElements, 150);
    });
} else {
    setTimeout(translatePageElements, 150);
}
