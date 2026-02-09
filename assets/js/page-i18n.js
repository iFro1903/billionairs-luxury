/**
 * Page-wide i18n translations for all remaining elements
 * Ensures NOTHING stays in English when language changes
 */

const pageTranslations = {
    'de': {
        // Trust section
        'trust.members_title': 'Vertraut von Mitgliedern aus 12 Ländern',
        'trust.others': '+ 5 weitere',
        'trust.click_hint': 'Klicken Sie auf Mitglieder, um ihre Erfahrungen zu lesen',
        
        // Hero buttons
        'hero.not_ready': 'NOCH NICHT BEREIT',
        
        // Rejection screen
        'rejection.title': 'NOCH NICHT.',
        'rejection.message': 'Nicht jede Tür öffnet sich beim ersten Versuch.',
        'rejection.warning': 'Doch die Weisheit rät—',
        'rejection.truth1': '<strong>Manche Türen öffnen sich nur einmal.</strong>',
        'rejection.truth2': '<strong>Gewisse Momente existieren außerhalb der Zeit.</strong>',
        'rejection.truth3': '<strong>Wahrer Zugang wird niemals erzwungen.</strong>',
        'rejection.final': 'Wenn die Bereitschaft kommt, bleibt die Tür offen. Bis sie es nicht mehr tut.',
        'rejection.ready_now': 'ICH BIN JETZT BEREIT',
        'rejection.not_my_time': 'NICHT MEINE ZEIT',
        'rejection.reminder': 'Die Zeit wartet auf niemanden. Nicht mal auf uns.'
    },
    'fr': {
        'trust.members_title': 'Approuvé par des membres dans 12 pays',
        'trust.others': '+ 5 autres',
        'trust.click_hint': 'Cliquez sur les membres pour lire leur expérience',
        'hero.not_ready': 'PAS ENCORE PRÊT',
        'rejection.title': 'PAS ENCORE.',
        'rejection.message': 'Toutes les portes ne s\'ouvrent pas à la première approche.',
        'rejection.warning': 'Pourtant la sagesse suggère—',
        'rejection.truth1': '<strong>Certaines portes ne s\'ouvrent qu\'une fois.</strong>',
        'rejection.truth2': '<strong>Certains moments existent en dehors du temps.</strong>',
        'rejection.truth3': '<strong>Le véritable accès n\'est jamais forcé.</strong>',
        'rejection.final': 'Quand la préparation arrive, la porte reste ouverte. Jusqu\'à ce qu\'elle ne le soit plus.',
        'rejection.ready_now': 'JE SUIS PRÊT MAINTENANT',
        'rejection.not_my_time': 'PAS MON MOMENT',
        'rejection.reminder': 'Le temps n\'attend personne. Pas même nous.'
    },
    'es': {
        'trust.members_title': 'Confianza de miembros en 12 países',
        'trust.others': '+ 5 más',
        'trust.click_hint': 'Haga clic en los miembros para leer su experiencia',
        'hero.not_ready': 'AÚN NO ESTOY LISTO',
        'rejection.title': 'AÚN NO.',
        'rejection.message': 'No todas las puertas se abren en el primer intento.',
        'rejection.warning': 'Pero la sabiduría sugiere—',
        'rejection.truth1': '<strong>Algunas puertas se abren solo una vez.</strong>',
        'rejection.truth2': '<strong>Ciertos momentos existen fuera del tiempo.</strong>',
        'rejection.truth3': '<strong>El verdadero acceso nunca se fuerza.</strong>',
        'rejection.final': 'Cuando llegue la preparación, la puerta permanece. Hasta que ya no lo hace.',
        'rejection.ready_now': 'ESTOY LISTO AHORA',
        'rejection.not_my_time': 'NO ES MI MOMENTO',
        'rejection.reminder': 'El tiempo no espera a nadie. Ni siquiera a nosotros.'
    },
    'zh': {
        'trust.members_title': '受到12个国家会员的信赖',
        'trust.others': '+ 5 位其他人',
        'trust.click_hint': '点击会员阅读他们的体验',
        'hero.not_ready': '我还没准备好',
        'rejection.title': '还没有。',
        'rejection.message': '并非每扇门在第一次尝试时都会打开。',
        'rejection.warning': '然而智慧告诉我们—',
        'rejection.truth1': '<strong>有些门只会打开一次。</strong>',
        'rejection.truth2': '<strong>某些时刻存在于时间之外。</strong>',
        'rejection.truth3': '<strong>真正的访问永远不会被强迫。</strong>',
        'rejection.final': '当准备好时，门会保持打开。直到它不再打开。',
        'rejection.ready_now': '我现在准备好了',
        'rejection.not_my_time': '不是我的时候',
        'rejection.reminder': '时间不等人。甚至不等我们。'
    },
    'ar': {
        'trust.members_title': 'موثوق به من قبل الأعضاء في 12 دولة',
        'trust.others': '+ 5 آخرين',
        'trust.click_hint': 'انقر على الأعضاء لقراءة تجربتهم',
        'hero.not_ready': 'لست جاهزاً بعد',
        'rejection.title': 'ليس بعد.',
        'rejection.message': 'ليس كل باب يفتح في المحاولة الأولى.',
        'rejection.warning': 'لكن الحكمة تقترح—',
        'rejection.truth1': '<strong>بعض الأبواب تفتح مرة واحدة فقط.</strong>',
        'rejection.truth2': '<strong>بعض اللحظات موجودة خارج الزمن.</strong>',
        'rejection.truth3': '<strong>الوصول الحقيقي لا يُفرض أبداً.</strong>',
        'rejection.final': 'عندما يحين الاستعداد، يبقى الباب مفتوحاً. حتى لا يعود كذلك.',
        'rejection.ready_now': 'أنا مستعد الآن',
        'rejection.not_my_time': 'ليس وقتي',
        'rejection.reminder': 'الوقت لا ينتظر أحداً. حتى نحن.'
    },
    'it': {
        'trust.members_title': 'Fidato da membri in 12 paesi',
        'trust.others': '+ 5 altri',
        'trust.click_hint': 'Clicca sui membri per leggere la loro esperienza',
        'hero.not_ready': 'NON SONO ANCORA PRONTO',
        'rejection.title': 'NON ANCORA.',
        'rejection.message': 'Non ogni porta si apre al primo tentativo.',
        'rejection.warning': 'Eppure la saggezza suggerisce—',
        'rejection.truth1': '<strong>Alcune porte si aprono solo una volta.</strong>',
        'rejection.truth2': '<strong>Certi momenti esistono fuori dal tempo.</strong>',
        'rejection.truth3': '<strong>Il vero accesso non è mai forzato.</strong>',
        'rejection.final': 'Quando arriva la prontezza, la porta rimane aperta. Fino a quando non lo è più.',
        'rejection.ready_now': 'SONO PRONTO ORA',
        'rejection.not_my_time': 'NON È IL MIO MOMENTO',
        'rejection.reminder': 'Il tempo non aspetta nessuno. Nemmeno noi.'
    },
    'ru': {
        'trust.members_title': 'Доверие членов из 12 стран',
        'trust.others': '+ 5 других',
        'trust.click_hint': 'Нажмите на участников, чтобы прочитать их опыт',
        'hero.not_ready': 'Я ЕЩЕ НЕ ГОТОВ',
        'rejection.title': 'ЕЩЕ НЕТ.',
        'rejection.message': 'Не каждая дверь открывается с первого раза.',
        'rejection.warning': 'Но мудрость подсказывает—',
        'rejection.truth1': '<strong>Некоторые двери открываются только раз.</strong>',
        'rejection.truth2': '<strong>Определенные моменты существуют вне времени.</strong>',
        'rejection.truth3': '<strong>Истинный доступ никогда не форсируется.</strong>',
        'rejection.final': 'Когда приходит готовность, дверь остается открытой. Пока не перестанет.',
        'rejection.ready_now': 'Я ГОТОВ СЕЙЧАС',
        'rejection.not_my_time': 'НЕ МОЕ ВРЕМЯ',
        'rejection.reminder': 'Время не ждет никого. Даже нас.'
    },
    'ja': {
        'trust.members_title': '12か国の会員から信頼されています',
        'trust.others': '+ 5 名その他',
        'trust.click_hint': 'メンバーをクリックして体験を読む',
        'hero.not_ready': 'まだ準備ができていない',
        'rejection.title': 'まだです。',
        'rejection.message': 'すべてのドアが最初のアプローチで開くわけではありません。',
        'rejection.warning': 'しかし知恵は示唆している—',
        'rejection.truth1': '<strong>あるドアは一度しか開かない。</strong>',
        'rejection.truth2': '<strong>特定の瞬間は時間の外に存在する。</strong>',
        'rejection.truth3': '<strong>真のアクセスは決して強要されない。</strong>',
        'rejection.final': '準備が整えば、ドアは開いたままです。開かなくなるまで。',
        'rejection.ready_now': '今準備ができました',
        'rejection.not_my_time': '私の時間ではない',
        'rejection.reminder': '時間は誰も待たない。私たちでさえも。'
    },
    'en': {
        'trust.members_title': 'Trusted by members across 12 countries',
        'trust.others': '+ 5 others',
        'trust.click_hint': 'Click on members to read their experience',
        'hero.not_ready': 'I\'M NOT THERE YET',
        'rejection.title': 'NOT YET.',
        'rejection.message': 'Not every door opens on the first approach.',
        'rejection.warning': 'Yet wisdom suggests—',
        'rejection.truth1': '<strong>Some doors open only once.</strong>',
        'rejection.truth2': '<strong>Certain moments exist outside of time.</strong>',
        'rejection.truth3': '<strong>True access is never forced.</strong>',
        'rejection.final': 'When readiness arrives, the door remains. Until it doesn\'t.',
        'rejection.ready_now': 'I\'M READY NOW',
        'rejection.not_my_time': 'NOT MY TIME',
        'rejection.reminder': 'Time moves for no one. Not even us.'
    }
};

/**
 * Translate all elements with data-i18n-key attribute
 */
function translatePageElements() {
    const currentLang = window.i18n?.currentLang || 'en';
    const translations = pageTranslations[currentLang] || pageTranslations['en'];
    
    console.log('🔄 [PAGE-I18N] Translating page elements to:', currentLang);
    console.log('🔄 [PAGE-I18N] Available translations:', Object.keys(translations));
    
    // Find all elements with data-i18n-key
    const elements = document.querySelectorAll('[data-i18n-key]');
    console.log('🔄 [PAGE-I18N] Found elements with data-i18n-key:', elements.length);
    
    let translatedCount = 0;
    elements.forEach(element => {
        const key = element.getAttribute('data-i18n-key');
        console.log('🔍 [PAGE-I18N] Processing element with key:', key);
        
        if (translations[key]) {
            const oldText = element.innerHTML;
            const translation = translations[key];
            
            // Check if translation contains HTML tags
            if (translation.includes('<')) {
                element.innerHTML = translation; // Use innerHTML for HTML content
            } else {
                element.textContent = translation; // Use textContent for plain text
            }
            
            translatedCount++;
            console.log(`✓ [PAGE-I18N] Translated ${key}: "${oldText}" → "${translation}"`);
        } else {
            console.warn(`⚠️ [PAGE-I18N] Missing translation for key: ${key} in language ${currentLang}`);
        }
    });
    
    console.log(`✅ [PAGE-I18N] Translated ${translatedCount} page elements to ${currentLang}`);
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
