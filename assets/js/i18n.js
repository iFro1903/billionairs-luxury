/**
 * BILLIONAIRS i18n Manager
 * Multi-language support with cookie-based persistence
 * Supports: Deutsch (de), English (en), Français (fr), Español (es), 
 *           中文 (zh), العربية (ar), Italiano (it), Русский (ru), 日本語 (ja)
 */

class I18nManager {
    constructor() {
        this.currentLang = 'en'; // Default language (English)
        this.translations = {};
        this.fallbackLang = 'en'; // Fallback to English
        this.cookieName = 'billionairs_lang';
        this.cookieExpiry = 365; // Days
        this.supportedLangs = ['en', 'de', 'fr', 'es', 'zh', 'ar', 'it', 'ru', 'ja'];
        this.rtlLangs = ['ar']; // Right-to-left languages
        this.originalTexts = new Map(); // Store original English texts
        this.hasInitialized = false; // Track if we've saved original texts
    }

    /**
     * Initialize i18n system
     */
    async init() {
        // ALWAYS start with English - ignore saved language and browser language
        this.currentLang = 'en';
        
        // Clear any saved language preference to force English
        this.setCookie(this.cookieName, 'en', 365);

        // Load translation files
        await this.loadTranslations();

        // Apply translations to current page
        this.applyTranslations();

        // Setup language switcher (DISABLED - using lang-dropdown-simple.js instead)
        // this.setupLanguageSwitcher();

        // Add HTML lang attribute
        document.documentElement.lang = this.currentLang;

        // Set text direction for RTL languages
        if (this.rtlLangs.includes(this.currentLang)) {
            document.documentElement.dir = 'rtl';
        } else {
            document.documentElement.dir = 'ltr';
        }

        console.log(`✅ i18n initialized: ${this.currentLang}`);
        
        // Dispatch ready event for other scripts
        window.dispatchEvent(new CustomEvent('i18nReady', { 
            detail: { language: this.currentLang, i18n: this } 
        }));
    }

    /**
     * Load translation files
     */
    async loadTranslations() {
        try {
            // Load all supported language translations
            const loadPromises = this.supportedLangs.map(async (lang) => {
                const response = await fetch(`/translations/${lang}.json`);
                if (response.ok) {
                    this.translations[lang] = await response.json();
                    console.log(`✅ Loaded ${lang}.json`);
                } else {
                    console.warn(`⚠️ Could not load ${lang}.json`);
                }
            });

            await Promise.all(loadPromises);

            console.log('✅ Translations loaded:', Object.keys(this.translations));
        } catch (error) {
            console.error('❌ Error loading translations:', error);
        }
    }

    /**
     * Get translated text by key
     * @param {string} key - Translation key (e.g., 'nav.home', 'login.title')
     * @param {object} params - Optional parameters for dynamic text
     * @returns {string} Translated text
     */
    t(key, params = {}) {
        const keys = key.split('.');
        let value = this.translations[this.currentLang];

        // Navigate through nested object
        for (const k of keys) {
            if (value && typeof value === 'object' && k in value) {
                value = value[k];
            } else {
                // Fallback to default language
                value = this.translations[this.fallbackLang];
                for (const fk of keys) {
                    if (value && typeof value === 'object' && fk in value) {
                        value = value[fk];
                    } else {
                        console.warn(`⚠️ Translation key not found: ${key}`);
                        return key;
                    }
                }
                break;
            }
        }

        // Replace parameters in text
        if (typeof value === 'string' && Object.keys(params).length > 0) {
            Object.keys(params).forEach(param => {
                value = value.replace(`{${param}}`, params[param]);
            });
        }

        return value || key;
    }

    /**
     * Apply translations to all elements with data-i18n attribute
     */
    applyTranslations() {
        // Translate elements with data-i18n attribute
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            const translation = this.t(key);
            
            if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                // For input elements, translate placeholder
                element.placeholder = translation;
            } else {
                // For other elements, translate text content
                element.textContent = translation;
            }
        });

        // Translate elements with data-i18n-placeholder
        document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
            const key = element.getAttribute('data-i18n-placeholder');
            element.placeholder = this.t(key);
        });

        // Translate elements with data-i18n-title (tooltips)
        document.querySelectorAll('[data-i18n-title]').forEach(element => {
            const key = element.getAttribute('data-i18n-title');
            element.title = this.t(key);
        });

        // Translate elements with data-i18n-aria-label (accessibility)
        document.querySelectorAll('[data-i18n-aria-label]').forEach(element => {
            const key = element.getAttribute('data-i18n-aria-label');
            element.setAttribute('aria-label', this.t(key));
        });

        // Auto-translate common elements without data-i18n
        this.autoTranslateCommonElements();
    }

    /**
     * Auto-translate common UI elements
     */
    autoTranslateCommonElements() {
        // Get current translations
        const t = this.translations[this.currentLang];
        if (!t) return;

        // Save original texts on first run (always save, regardless of language)
        if (!this.hasInitialized) {
            this.saveOriginalTexts(document.body);
            this.hasInitialized = true;
            console.log('📝 Original texts saved:', this.originalTexts.size, 'nodes');
        }

        // Text mapping: English → All Languages
        const textMap = this.getTextMapForLanguage(this.currentLang);

        // Apply translations
        this.applyTextTranslations(document.body, textMap);
        
        console.log(`✅ Translations applied for: ${this.currentLang}`);
    }
    
    /**
     * Save original text content of all text nodes
     */
    saveOriginalTexts(node) {
        if (node.nodeType === Node.ELEMENT_NODE) {
            const tagName = node.tagName.toLowerCase();
            if (tagName === 'script' || tagName === 'style' || tagName === 'svg') {
                return;
            }
        }

        if (node.nodeType === Node.TEXT_NODE) {
            const text = node.textContent.trim();
            if (text && text.length > 1) {
                this.originalTexts.set(node, text);
            }
        }

        if (node.childNodes) {
            node.childNodes.forEach(child => this.saveOriginalTexts(child));
        }
    }
    
    /**
     * Apply translations to text nodes
     */
    applyTextTranslations(node, textMap) {
        if (node.nodeType === Node.ELEMENT_NODE) {
            const tagName = node.tagName.toLowerCase();
            if (tagName === 'script' || tagName === 'style' || tagName === 'svg') {
                return;
            }
        }

        if (node.nodeType === Node.TEXT_NODE) {
            const originalText = this.originalTexts.get(node);
            if (originalText) {
                // If translating to English, restore original
                if (this.currentLang === 'en') {
                    node.textContent = originalText;
                } else {
                    // Translate from original English to target language
                    let translated = originalText;
                    for (const [english, targetText] of Object.entries(textMap)) {
                        if (originalText === english) {
                            translated = targetText;
                            break;
                        } else if (originalText.includes(english)) {
                            translated = originalText.replace(english, targetText);
                            break;
                        }
                    }
                    node.textContent = translated;
                }
            }
        }

        if (node.childNodes) {
            node.childNodes.forEach(child => this.applyTextTranslations(child, textMap));
        }
    }

    /**
     * Get text translation map for specific language
     */
    getTextMapForLanguage(lang) {
        const maps = {
            'de': {
                // Navigation
                'CONTACT': 'KONTAKT',
                'Exclusive Inquiries': 'Exklusive Anfragen',
                'For access requests and private consultations': 'Für Zugriffsanfragen und private Beratungen',
                'Response time: 24-48 hours': 'Antwortzeit: 24-48 Stunden',
                'Copy': 'Kopieren',
                'Copied!': 'Kopiert!',
                'Swiss Secured': 'Swiss Gesichert',
                'Blockchain Verified': 'Blockchain Verifiziert',
                'Exclusive Access': 'Exklusiver Zugang',
                
                // Trust Section
                "Some experiences can't be explained.<br>They can only be lived.": 'Manche Erlebnisse lassen sich nicht erklären.<br>Sie können nur erlebt werden.',
                "Where wealth is the entry requirement. Not the achievement.": 'Wo Reichtum die Eintrittsbedingung ist. Nicht die Errungenschaft.',
                
                "What you're about to see can't be bought. Only accessed.": 'Was Sie gleich sehen, kann man nicht kaufen. Nur erleben.',
                'Beyond wealth. Beyond status.': 'Jenseits von Reichtum. Jenseits von Status.',
                'A moment that exists outside of time.': 'Ein Moment, der außerhalb der Zeit existiert.',
                'Where time bends to those who understand its true value.': 'Wo die Zeit sich für jene beugt, die ihren wahren Wert verstehen.',
                'I DESERVE THIS': 'ICH VERDIENE DIES',
                "I'M NOT THERE YET": 'NOCH NICHT BEREIT',
                'Discover what transcends everything you own': 'Entdecken Sie, was alles übertrifft, was Sie besitzen',
                'Perhaps another time, when you\'re ready': 'Vielleicht ein andermal, wenn Sie bereit sind',
                'THE FINAL COLLECTION': 'DIE FINALE KOLLEKTION',
                'Access Granted': 'Zugang Gewährt',
                'Your gateway to the extraordinary': 'Ihr Tor zum Außergewöhnlichen',
                'One-time exclusive access': 'Einmaliger exklusiver Zugang',
                'Lifetime membership': 'Lebenslange Mitgliedschaft',
                'Priority concierge service': 'Prioritärer Concierge-Service',
                'Invitation to private events': 'Einladung zu privaten Events',
                'SECURE YOUR ACCESS': 'SICHERN SIE IHREN ZUGANG',
                'Secured Payment by': 'Gesicherte Zahlung durch',
                'The Timepiece': 'Das Zeitstück',
                'A Moment Captured in Eternity': 'Ein Moment, eingefangen in der Ewigkeit',
                'This is not a watch. This is a philosophy.': 'Dies ist keine Uhr. Dies ist eine Philosophie.',
                'Crafted in the hidden workshops of time itself, this piece exists in only 7 dimensions.': 'Gefertigt in den verborgenen Werkstätten der Zeit selbst, existiert dieses Stück nur in 7 Dimensionen.',
                'WORLD TIME': 'WELTZEIT',
                'SECURED BY SWISS BANKING STANDARDS': 'GESICHERT NACH SCHWEIZER BANKENSTANDARDS',
                'ENCRYPTED INFRASTRUCTURE': 'VERSCHLÜSSELTE INFRASTRUKTUR',
                '© 2025 The Final Collection': '© 2025 Die Finale Kollektion',
                'We Respect Your Privacy': 'Wir respektieren Ihre Privatsphäre',
                'ACCEPT ALL': 'ALLE AKZEPTIEREN',
                'SAVE SELECTION': 'AUSWAHL SPEICHERN',
                'NECESSARY ONLY': 'NUR NOTWENDIGE'
            },
            'fr': {
                'CONTACT': 'CONTACT',
                'Exclusive Inquiries': 'Demandes exclusives',
                'For access requests and private consultations': 'Pour les demandes d\'accès et les consultations privées',
                'Response time: 24-48 hours': 'Temps de réponse: 24-48 heures',
                'Copy': 'Copier',
                'Copied!': 'Copié!',
                'Swiss Secured': 'Sécurisé Suisse',
                'Blockchain Verified': 'Vérifié Blockchain',
                'Exclusive Access': 'Accès Exclusif',
                "What you're about to see can't be bought. Only accessed.": 'Ce que vous êtes sur le point de voir ne peut pas être acheté. Seulement accédé.',
                'Beyond wealth. Beyond status.': 'Au-delà de la richesse. Au-delà du statut.',
                'A moment that exists outside of time.': 'Un moment qui existe en dehors du temps.',
                'Where time bends to those who understand its true value.': 'Où le temps se plie pour ceux qui comprennent sa vraie valeur.',
                'I DESERVE THIS': 'JE LE MÉRITE',
                "I'M NOT THERE YET": 'PAS ENCORE PRÊT',
                'Discover what transcends everything you own': 'Découvrez ce qui transcende tout ce que vous possédez',
                'Perhaps another time, when you\'re ready': 'Peut-être une autre fois, quand vous serez prêt',
                'THE FINAL COLLECTION': 'LA COLLECTION FINALE',
                'Access Granted': 'Accès accordé',
                'Your gateway to the extraordinary': 'Votre porte vers l\'extraordinaire',
                'One-time exclusive access': 'Accès exclusif unique',
                'Lifetime membership': 'Adhésion à vie',
                'Priority concierge service': 'Service de conciergerie prioritaire',
                'Invitation to private events': 'Invitation à des événements privés',
                'SECURE YOUR ACCESS': 'SÉCURISER VOTRE ACCÈS',
                'Secured Payment by': 'Paiement sécurisé par',
                'The Timepiece': 'La Pièce d\'Horlogerie',
                'A Moment Captured in Eternity': 'Un moment capturé dans l\'éternité',
                'This is not a watch. This is a philosophy.': 'Ce n\'est pas une montre. C\'est une philosophie.',
                'Crafted in the hidden workshops of time itself, this piece exists in only 7 dimensions.': 'Fabriqué dans les ateliers cachés du temps lui-même, cette pièce n\'existe que dans 7 dimensions.',
                'WORLD TIME': 'HEURE MONDIALE',
                'SECURED BY SWISS BANKING STANDARDS': 'SÉCURISÉ PAR LES NORMES BANCAIRES SUISSES',
                'ENCRYPTED INFRASTRUCTURE': 'INFRASTRUCTURE CRYPTÉE',
                '© 2025 The Final Collection': '© 2025 La Collection Finale',
                'We Respect Your Privacy': 'Nous respectons votre vie privée',
                'ACCEPT ALL': 'TOUT ACCEPTER',
                'SAVE SELECTION': 'ENREGISTRER LA SÉLECTION',
                'NECESSARY ONLY': 'NÉCESSAIRE UNIQUEMENT'
            },
            'es': {
                'CONTACT': 'CONTACTO',
                'Exclusive Inquiries': 'Consultas exclusivas',
                'For access requests and private consultations': 'Para solicitudes de acceso y consultas privadas',
                'Response time: 24-48 hours': 'Tiempo de respuesta: 24-48 horas',
                'Copy': 'Copiar',
                'Copied!': '¡Copiado!',
                'Swiss Secured': 'Seguridad Suiza',
                'Blockchain Verified': 'Verificado Blockchain',
                'Exclusive Access': 'Acceso Exclusivo',
                "What you're about to see can't be bought. Only accessed.": 'Lo que está a punto de ver no se puede comprar. Solo acceder.',
                'Beyond wealth. Beyond status.': 'Más allá de la riqueza. Más allá del estatus.',
                'A moment that exists outside of time.': 'Un momento que existe fuera del tiempo.',
                'Where time bends to those who understand its true value.': 'Donde el tiempo se dobla para aquellos que entienden su verdadero valor.',
                'I DESERVE THIS': 'LO MEREZCO',
                "I'M NOT THERE YET": 'AÚN NO ESTOY LISTO',
                'Discover what transcends everything you own': 'Descubra lo que trasciende todo lo que posee',
                'Perhaps another time, when you\'re ready': 'Quizás en otro momento, cuando esté listo',
                'THE FINAL COLLECTION': 'LA COLECCIÓN FINAL',
                'Access Granted': 'Acceso concedido',
                'Your gateway to the extraordinary': 'Su puerta a lo extraordinario',
                'One-time exclusive access': 'Acceso exclusivo único',
                'Lifetime membership': 'Membresía de por vida',
                'Priority concierge service': 'Servicio de conserjería prioritario',
                'Invitation to private events': 'Invitación a eventos privados',
                'SECURE YOUR ACCESS': 'ASEGURAR SU ACCESO',
                'Secured Payment by': 'Pago seguro por',
                'The Timepiece': 'La Pieza del Tiempo',
                'A Moment Captured in Eternity': 'Un momento capturado en la eternidad',
                'This is not a watch. This is a philosophy.': 'Esto no es un reloj. Es una filosofía.',
                'Crafted in the hidden workshops of time itself, this piece exists in only 7 dimensions.': 'Elaborado en los talleres ocultos del tiempo mismo, esta pieza existe solo en 7 dimensiones.',
                'WORLD TIME': 'HORA MUNDIAL',
                'SECURED BY SWISS BANKING STANDARDS': 'ASEGURADO POR ESTÁNDARES BANCARIOS SUIZOS',
                'ENCRYPTED INFRASTRUCTURE': 'INFRAESTRUCTURA ENCRIPTADA',
                '© 2025 The Final Collection': '© 2025 La Colección Final',
                'We Respect Your Privacy': 'Respetamos su privacidad',
                'ACCEPT ALL': 'ACEPTAR TODO',
                'SAVE SELECTION': 'GUARDAR SELECCIÓN',
                'NECESSARY ONLY': 'SOLO NECESARIAS'
            },
            'zh': {
                'CONTACT': '联系方式',
                'Exclusive Inquiries': '专属咨询',
                'For access requests and private consultations': '用于访问请求和私人咨询',
                'Response time: 24-48 hours': '响应时间：24-48小时',
                'Copy': '复制',
                'Copied!': '已复制！',
                'Swiss Secured': '瑞士安全保障',
                'Blockchain Verified': '区块链验证',
                'Exclusive Access': '专属访问',
                "What you're about to see can't be bought. Only accessed.": '您即将看到的无法购买。只能访问。',
                'Beyond wealth. Beyond status.': '超越财富。超越地位。',
                'A moment that exists outside of time.': '存在于时间之外的时刻。',
                'Where time bends to those who understand its true value.': '时间为那些理解其真正价值的人而弯曲。',
                'I DESERVE THIS': '我值得拥有',
                "I'M NOT THERE YET": '我还没准备好',
                'Discover what transcends everything you own': '发现超越您所拥有一切的东西',
                'Perhaps another time, when you\'re ready': '也许下次，当您准备好时',
                'THE FINAL COLLECTION': '最终收藏',
                'Access Granted': '访问权限已授予',
                'Your gateway to the extraordinary': '您通往非凡的门户',
                'One-time exclusive access': '一次性专属访问',
                'Lifetime membership': '终身会员资格',
                'Priority concierge service': '优先礼宾服务',
                'Invitation to private events': '私人活动邀请',
                'SECURE YOUR ACCESS': '确保您的访问权限',
                'Secured Payment by': '安全支付由以下提供',
                'The Timepiece': '时计',
                'A Moment Captured in Eternity': '永恒中捕获的瞬间',
                'This is not a watch. This is a philosophy.': '这不是一块手表。这是一种哲学。',
                'Crafted in the hidden workshops of time itself, this piece exists in only 7 dimensions.': '在时间本身的隐秘工坊中制作，这件作品仅存在于7个维度中。',
                'WORLD TIME': '世界时间',
                'SECURED BY SWISS BANKING STANDARDS': '瑞士银行标准保障',
                'ENCRYPTED INFRASTRUCTURE': '加密基础设施',
                '© 2025 The Final Collection': '© 2025 最终收藏',
                'We Respect Your Privacy': '我们尊重您的隐私',
                'ACCEPT ALL': '全部接受',
                'SAVE SELECTION': '保存选择',
                'NECESSARY ONLY': '仅必要'
            },
            'ar': {
                'CONTACT': 'اتصل',
                'Exclusive Inquiries': 'استفسارات حصرية',
                'For access requests and private consultations': 'لطلبات الوصول والاستشارات الخاصة',
                'Response time: 24-48 hours': 'وقت الاستجابة: 24-48 ساعة',
                'Copy': 'نسخ',
                'Copied!': 'تم النسخ!',
                'Swiss Secured': 'مؤمن سويسري',
                'Blockchain Verified': 'مُصادق عليه بالبلوكشين',
                'Exclusive Access': 'وصول حصري',
                "What you're about to see can't be bought. Only accessed.": 'ما أنت على وشك رؤيته لا يمكن شراؤه. يمكن الوصول إليه فقط.',
                'Beyond wealth. Beyond status.': 'ما وراء الثروة. ما وراء المكانة.',
                'A moment that exists outside of time.': 'لحظة موجودة خارج الزمن.',
                'Where time bends to those who understand its true value.': 'حيث ينحني الزمن لمن يفهمون قيمته الحقيقية.',
                'I DESERVE THIS': 'أنا أستحق هذا',
                "I'M NOT THERE YET": 'لست جاهزاً بعد',
                'Discover what transcends everything you own': 'اكتشف ما يتجاوز كل ما تملك',
                'Perhaps another time, when you\'re ready': 'ربما في وقت آخر، عندما تكون جاهزاً',
                'THE FINAL COLLECTION': 'المجموعة النهائية',
                'Access Granted': 'تم منح الوصول',
                'Your gateway to the extraordinary': 'بوابتك إلى الاستثنائي',
                'One-time exclusive access': 'وصول حصري لمرة واحدة',
                'Lifetime membership': 'عضوية مدى الحياة',
                'Priority concierge service': 'خدمة كونسيرج ذات أولوية',
                'Invitation to private events': 'دعوة لفعاليات خاصة',
                'SECURE YOUR ACCESS': 'تأمين وصولك',
                'Secured Payment by': 'دفع آمن من',
                'The Timepiece': 'قطعة الوقت',
                'A Moment Captured in Eternity': 'لحظة محفوظة في الأبدية',
                'This is not a watch. This is a philosophy.': 'هذه ليست ساعة. إنها فلسفة.',
                'Crafted in the hidden workshops of time itself, this piece exists in only 7 dimensions.': 'صُنعت في ورش العمل المخفية للزمن نفسه، هذه القطعة موجودة فقط في 7 أبعاد.',
                'WORLD TIME': 'الوقت العالمي',
                'SECURED BY SWISS BANKING STANDARDS': 'مؤمن بمعايير البنوك السويسرية',
                'ENCRYPTED INFRASTRUCTURE': 'بنية تحتية مشفرة',
                '© 2025 The Final Collection': '© 2025 المجموعة النهائية',
                'We Respect Your Privacy': 'نحن نحترم خصوصيتك',
                'ACCEPT ALL': 'قبول الكل',
                'SAVE SELECTION': 'حفظ الاختيار',
                'NECESSARY ONLY': 'الضرورية فقط'
            },
            'it': {
                'CONTACT': 'CONTATTI',
                'Exclusive Inquiries': 'Richieste esclusive',
                'For access requests and private consultations': 'Per richieste di accesso e consultazioni private',
                'Response time: 24-48 hours': 'Tempo di risposta: 24-48 ore',
                'Copy': 'Copia',
                'Copied!': 'Copiato!',
                'Swiss Secured': 'Sicurezza Svizzera',
                'Blockchain Verified': 'Verificato Blockchain',
                'Exclusive Access': 'Accesso Esclusivo',
                "What you're about to see can't be bought. Only accessed.": 'Ciò che stai per vedere non può essere acquistato. Solo accessibile.',
                'Beyond wealth. Beyond status.': 'Oltre la ricchezza. Oltre lo status.',
                'A moment that exists outside of time.': 'Un momento che esiste fuori dal tempo.',
                'Where time bends to those who understand its true value.': 'Dove il tempo si piega per coloro che comprendono il suo vero valore.',
                'I DESERVE THIS': 'LO MERITO',
                "I'M NOT THERE YET": 'NON SONO ANCORA PRONTO',
                'Discover what transcends everything you own': 'Scopri ciò che trascende tutto ciò che possiedi',
                'Perhaps another time, when you\'re ready': 'Forse un\'altra volta, quando sarai pronto',
                'THE FINAL COLLECTION': 'LA COLLEZIONE FINALE',
                'Access Granted': 'Accesso concesso',
                'Your gateway to the extraordinary': 'La tua porta verso lo straordinario',
                'One-time exclusive access': 'Accesso esclusivo unico',
                'Lifetime membership': 'Membership a vita',
                'Priority concierge service': 'Servizio concierge prioritario',
                'Invitation to private events': 'Invito a eventi privati',
                'SECURE YOUR ACCESS': 'ASSICURA IL TUO ACCESSO',
                'Secured Payment by': 'Pagamento sicuro da',
                'The Timepiece': 'Il Segnatempo',
                'A Moment Captured in Eternity': 'Un momento catturato nell\'eternità',
                'This is not a watch. This is a philosophy.': 'Questo non è un orologio. È una filosofia.',
                'Crafted in the hidden workshops of time itself, this piece exists in only 7 dimensions.': 'Realizzato nei laboratori nascosti del tempo stesso, questo pezzo esiste solo in 7 dimensioni.',
                'WORLD TIME': 'ORA MONDIALE',
                'SECURED BY SWISS BANKING STANDARDS': 'GARANTITO DA STANDARD BANCARI SVIZZERI',
                'ENCRYPTED INFRASTRUCTURE': 'INFRASTRUTTURA CRITTOGRAFATA',
                '© 2025 The Final Collection': '© 2025 La Collezione Finale',
                'We Respect Your Privacy': 'Rispettiamo la tua privacy',
                'ACCEPT ALL': 'ACCETTA TUTTO',
                'SAVE SELECTION': 'SALVA SELEZIONE',
                'NECESSARY ONLY': 'SOLO NECESSARI'
            },
            'ru': {
                'CONTACT': 'КОНТАКТЫ',
                'Exclusive Inquiries': 'Эксклюзивные запросы',
                'For access requests and private consultations': 'Для запросов на доступ и частных консультаций',
                'Response time: 24-48 hours': 'Время ответа: 24-48 часов',
                'Copy': 'Копировать',
                'Copied!': 'Скопировано!',
                'Swiss Secured': 'Швейцарская безопасность',
                'Blockchain Verified': 'Верифицировано Blockchain',
                'Exclusive Access': 'Эксклюзивный доступ',
                "What you're about to see can't be bought. Only accessed.": 'То, что вы собираетесь увидеть, нельзя купить. Только получить доступ.',
                'Beyond wealth. Beyond status.': 'За пределами богатства. За пределами статуса.',
                'A moment that exists outside of time.': 'Момент, существующий вне времени.',
                'Where time bends to those who understand its true value.': 'Где время изгибается для тех, кто понимает его истинную ценность.',
                'I DESERVE THIS': 'Я ЭТОГО ДОСТОИН',
                "I'M NOT THERE YET": 'Я ЕЩЕ НЕ ГОТОВ',
                'Discover what transcends everything you own': 'Откройте то, что превосходит все, что у вас есть',
                'Perhaps another time, when you\'re ready': 'Возможно, в другой раз, когда вы будете готовы',
                'THE FINAL COLLECTION': 'ФИНАЛЬНАЯ КОЛЛЕКЦИЯ',
                'Access Granted': 'Доступ предоставлен',
                'Your gateway to the extraordinary': 'Ваши врата в исключительное',
                'One-time exclusive access': 'Единоразовый эксклюзивный доступ',
                'Lifetime membership': 'Пожизненное членство',
                'Priority concierge service': 'Приоритетный консьерж-сервис',
                'Invitation to private events': 'Приглашение на частные мероприятия',
                'SECURE YOUR ACCESS': 'ОБЕСПЕЧЬТЕ СВОЙ ДОСТУП',
                'Secured Payment by': 'Защищенный платеж от',
                'The Timepiece': 'Хронометр',
                'A Moment Captured in Eternity': 'Момент, запечатленный в вечности',
                'This is not a watch. This is a philosophy.': 'Это не часы. Это философия.',
                'Crafted in the hidden workshops of time itself, this piece exists in only 7 dimensions.': 'Созданный в скрытых мастерских самого времени, этот экземпляр существует только в 7 измерениях.',
                'WORLD TIME': 'МИРОВОЕ ВРЕМЯ',
                'SECURED BY SWISS BANKING STANDARDS': 'ЗАЩИЩЕНО ШВЕЙЦАРСКИМИ БАНКОВСКИМИ СТАНДАРТАМИ',
                'ENCRYPTED INFRASTRUCTURE': 'ЗАШИФРОВАННАЯ ИНФРАСТРУКТУРА',
                '© 2025 The Final Collection': '© 2025 Финальная Коллекция',
                'We Respect Your Privacy': 'Мы уважаем вашу конфиденциальность',
                'ACCEPT ALL': 'ПРИНЯТЬ ВСЕ',
                'SAVE SELECTION': 'СОХРАНИТЬ ВЫБОР',
                'NECESSARY ONLY': 'ТОЛЬКО НЕОБХОДИМЫЕ'
            },
            'ja': {
                'CONTACT': 'お問い合わせ',
                'Exclusive Inquiries': '限定お問い合わせ',
                'For access requests and private consultations': 'アクセスリクエストとプライベート相談用',
                'Response time: 24-48 hours': '応答時間：24〜48時間',
                'Copy': 'コピー',
                'Copied!': 'コピーされました！',
                'Swiss Secured': 'スイス認証済み',
                'Blockchain Verified': 'ブロックチェーン検証済み',
                'Exclusive Access': '限定アクセス',
                "What you're about to see can't be bought. Only accessed.": 'これからご覧になるものは購入できません。アクセスのみ可能です。',
                'Beyond wealth. Beyond status.': '富を超えて。ステータスを超えて。',
                'A moment that exists outside of time.': '時間の外に存在する瞬間。',
                'Where time bends to those who understand its true value.': 'その真の価値を理解する者のために時間が曲がる場所。',
                'I DESERVE THIS': '私はこれに値する',
                "I'M NOT THERE YET": 'まだ準備ができていない',
                'Discover what transcends everything you own': 'あなたが所有するすべてを超越するものを発見してください',
                'Perhaps another time, when you\'re ready': 'また別の機会に、準備ができたときに',
                'THE FINAL COLLECTION': '最終コレクション',
                'Access Granted': 'アクセス許可',
                'Your gateway to the extraordinary': '非凡への扉',
                'One-time exclusive access': '一度限りの限定アクセス',
                'Lifetime membership': '生涯会員資格',
                'Priority concierge service': '優先コンシェルジュサービス',
                'Invitation to private events': 'プライベートイベントへの招待',
                'SECURE YOUR ACCESS': 'アクセスを確保する',
                'Secured Payment by': '安全な支払い提供元',
                'The Timepiece': '時計',
                'A Moment Captured in Eternity': '永遠に捉えられた瞬間',
                'This is not a watch. This is a philosophy.': 'これは時計ではありません。哲学です。',
                'Crafted in the hidden workshops of time itself, this piece exists in only 7 dimensions.': '時間そのものの隠れた工房で作られたこの作品は、7つの次元にのみ存在します。',
                'WORLD TIME': '世界時間',
                'SECURED BY SWISS BANKING STANDARDS': 'スイス銀行基準により保護',
                'ENCRYPTED INFRASTRUCTURE': '暗号化されたインフラストラクチャ',
                '© 2025 The Final Collection': '© 2025 最終コレクション',
                'We Respect Your Privacy': 'お客様のプライバシーを尊重します',
                'ACCEPT ALL': 'すべて受け入れる',
                'SAVE SELECTION': '選択を保存',
                'NECESSARY ONLY': '必須のみ'
            }
        };

        // Return map for current language, fallback to empty if English
        return maps[lang] || {};
    }

    /**
     * Switch language
     * @param {string} lang - Language code (de/en/fr/es/zh/ar/it/ru/ja)
     */
    async switchLanguage(lang) {
        if (!this.supportedLangs.includes(lang)) {
            console.error('❌ Unsupported language:', lang);
            return;
        }

        this.currentLang = lang;
        this.setCookie(this.cookieName, lang, this.cookieExpiry);
        document.documentElement.lang = lang;

        // Set text direction for RTL languages
        if (this.rtlLangs.includes(lang)) {
            document.documentElement.dir = 'rtl';
        } else {
            document.documentElement.dir = 'ltr';
        }

        // Reload translations if not loaded
        if (!this.translations[lang]) {
            await this.loadTranslations();
        }

        // Apply new translations
        this.applyTranslations();

        // Update language switcher button
        this.updateLanguageSwitcher();

        // Dispatch custom event for other scripts to react
        window.dispatchEvent(new CustomEvent('languageChanged', { 
            detail: { language: lang } 
        }));

        console.log(`✅ Language switched to: ${lang}`);
    }

    /**
     * Setup language switcher dropdown
     */
    setupLanguageSwitcher() {
        const langBtn = document.getElementById('langBtn');
        if (!langBtn) {
            console.warn('⚠️ Language button not found');
            return;
        }

        console.log('🌍 Setting up language switcher...');

        try {
            // Create dropdown if it doesn't exist
            let dropdown = document.getElementById('langDropdown');
            if (!dropdown) {
                console.log('📝 Creating language dropdown...');
                dropdown = this.createLanguageDropdown();
                
                // Find parent element (nav-actions)
                const parent = langBtn.parentElement;
                if (!parent) {
                    throw new Error('Parent element not found');
                }
                
                parent.appendChild(dropdown);
                console.log('✅ Dropdown created with', dropdown.querySelectorAll('.lang-option').length, 'languages');
            } else {
                console.log('♻️ Dropdown already exists');
            }

            // Update button text
            this.updateLanguageSwitcher();

            // Add click event to toggle dropdown
            langBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const isShown = dropdown.classList.toggle('show');
                console.log('🔄 Dropdown toggled:', isShown ? 'SHOWN' : 'HIDDEN');
                console.log('📍 Dropdown classes:', dropdown.className);
                console.log('📍 Dropdown position:', dropdown.getBoundingClientRect());
            });

            // Close dropdown when clicking outside
            document.addEventListener('click', (e) => {
                if (!langBtn.contains(e.target) && !dropdown.contains(e.target)) {
                    dropdown.classList.remove('show');
                }
            });

            // Add click events to language options
            dropdown.querySelectorAll('.lang-option').forEach(option => {
                option.addEventListener('click', (e) => {
                    e.preventDefault();
                    const lang = option.getAttribute('data-lang');
                    console.log('🌐 Language selected:', lang);
                    this.switchLanguage(lang);
                    dropdown.classList.remove('show');
                });
            });
            
            console.log('✅ Language switcher setup complete!');
            
        } catch (error) {
            console.error('❌ Error setting up language dropdown:', error);
            console.log('⚠️ Falling back to simple toggle between EN/DE');
            
            // Fallback: Simple toggle between EN and DE
            langBtn.addEventListener('click', (e) => {
                e.preventDefault();
                const newLang = this.currentLang === 'en' ? 'de' : 'en';
                console.log('🔄 Toggling language to:', newLang);
                this.switchLanguage(newLang);
            });
        }
    }

    /**
     * Create language dropdown menu
     */
    createLanguageDropdown() {
        const dropdown = document.createElement('div');
        dropdown.id = 'langDropdown';
        dropdown.className = 'language-dropdown';

        const languages = [
            { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
            { code: 'en', name: 'English', flag: '🇬🇧' },
            { code: 'fr', name: 'Français', flag: '🇫🇷' },
            { code: 'es', name: 'Español', flag: '🇪🇸' },
            { code: 'zh', name: '中文', flag: '🇨🇳' },
            { code: 'ar', name: 'العربية', flag: '🇦🇪' },
            { code: 'it', name: 'Italiano', flag: '🇮🇹' },
            { code: 'ru', name: 'Русский', flag: '🇷🇺' },
            { code: 'ja', name: '日本語', flag: '🇯🇵' }
        ];

        languages.forEach(lang => {
            const option = document.createElement('a');
            option.href = '#';
            option.className = 'lang-option';
            option.setAttribute('data-lang', lang.code);
            option.innerHTML = `<span class="lang-flag">${lang.flag}</span> <span class="lang-name">${lang.name}</span>`;
            
            if (lang.code === this.currentLang) {
                option.classList.add('active');
            }
            
            dropdown.appendChild(option);
        });

        return dropdown;
    }

    /**
     * Update language switcher button text
     */
    updateLanguageSwitcher() {
        const langBtn = document.getElementById('langBtn');
        if (!langBtn) return;

        const languageFlags = {
            'de': '🇩🇪',
            'en': '🇬🇧',
            'fr': '🇫🇷',
            'es': '🇪🇸',
            'zh': '🇨🇳',
            'ar': '🇦🇪',
            'it': '🇮🇹',
            'ru': '🇷🇺',
            'ja': '🇯🇵'
        };

        const flag = languageFlags[this.currentLang] || '🌍';
        const langCode = this.currentLang.toUpperCase();
        
        langBtn.innerHTML = `<i class="fas fa-globe"></i> ${flag} ${langCode}`;
        langBtn.title = 'Change Language';

        // Update active state in dropdown
        const dropdown = document.getElementById('langDropdown');
        if (dropdown) {
            dropdown.querySelectorAll('.lang-option').forEach(option => {
                if (option.getAttribute('data-lang') === this.currentLang) {
                    option.classList.add('active');
                } else {
                    option.classList.remove('active');
                }
            });
        }
    }

    /**
     * Get current language
     * @returns {string} Current language code
     */
    getCurrentLanguage() {
        return this.currentLang;
    }

    /**
     * Get cookie value
     * @param {string} name - Cookie name
     * @returns {string|null} Cookie value
     */
    getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) {
            return parts.pop().split(';').shift();
        }
        return null;
    }

    /**
     * Set cookie
     * @param {string} name - Cookie name
     * @param {string} value - Cookie value
     * @param {number} days - Expiry in days
     */
    setCookie(name, value, days) {
        const date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        const expires = `expires=${date.toUTCString()}`;
        document.cookie = `${name}=${value};${expires};path=/;SameSite=Lax`;
    }

    /**
     * Delete cookie
     * @param {string} name - Cookie name
     */
    deleteCookie(name) {
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
    }

    /**
     * Format number according to current language
     * @param {number} number - Number to format
     * @param {object} options - Intl.NumberFormat options
     * @returns {string} Formatted number
     */
    formatNumber(number, options = {}) {
        const locale = this.currentLang === 'de' ? 'de-CH' : 'en-US';
        return new Intl.NumberFormat(locale, options).format(number);
    }

    /**
     * Format currency according to current language
     * @param {number} amount - Amount to format
     * @param {string} currency - Currency code (default: CHF)
     * @returns {string} Formatted currency
     */
    formatCurrency(amount, currency = 'CHF') {
        const locale = this.currentLang === 'de' ? 'de-CH' : 'en-US';
        return new Intl.NumberFormat(locale, {
            style: 'currency',
            currency: currency
        }).format(amount);
    }

    /**
     * Format date according to current language
     * @param {Date|string} date - Date to format
     * @param {object} options - Intl.DateTimeFormat options
     * @returns {string} Formatted date
     */
    formatDate(date, options = {}) {
        const locale = this.currentLang === 'de' ? 'de-CH' : 'en-US';
        const dateObj = typeof date === 'string' ? new Date(date) : date;
        
        const defaultOptions = {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            ...options
        };
        
        return new Intl.DateTimeFormat(locale, defaultOptions).format(dateObj);
    }

    /**
     * Format relative time (e.g., "2 hours ago")
     * @param {Date|string} date - Date to format
     * @returns {string} Relative time
     */
    formatRelativeTime(date) {
        const dateObj = typeof date === 'string' ? new Date(date) : date;
        const now = new Date();
        const diffMs = now - dateObj;
        const diffSec = Math.floor(diffMs / 1000);
        const diffMin = Math.floor(diffSec / 60);
        const diffHour = Math.floor(diffMin / 60);
        const diffDay = Math.floor(diffHour / 24);

        if (diffSec < 60) {
            return this.currentLang === 'de' 
                ? 'gerade eben' 
                : 'just now';
        } else if (diffMin < 60) {
            return this.currentLang === 'de'
                ? `vor ${diffMin} Minute${diffMin !== 1 ? 'n' : ''}`
                : `${diffMin} minute${diffMin !== 1 ? 's' : ''} ago`;
        } else if (diffHour < 24) {
            return this.currentLang === 'de'
                ? `vor ${diffHour} Stunde${diffHour !== 1 ? 'n' : ''}`
                : `${diffHour} hour${diffHour !== 1 ? 's' : ''} ago`;
        } else if (diffDay < 7) {
            return this.currentLang === 'de'
                ? `vor ${diffDay} Tag${diffDay !== 1 ? 'en' : ''}`
                : `${diffDay} day${diffDay !== 1 ? 's' : ''} ago`;
        } else {
            return this.formatDate(dateObj, { month: 'short', day: 'numeric' });
        }
    }
}

// Initialize i18n globally
const i18n = new I18nManager();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => i18n.init());
} else {
    i18n.init();
}

// Expose to window for global access
window.i18n = i18n;
