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
        console.log('🌍 Initializing i18n system...');
        
        // CRITICAL: Wait for next render frame to ensure ALL DOM elements are ready
        await new Promise(resolve => {
            requestAnimationFrame(() => {
                requestAnimationFrame(resolve);
            });
        });
        
        // Start with English to capture original texts
        this.currentLang = 'en';

        // Load translation files
        await this.loadTranslations();
        console.log('✅ Translations loaded:', Object.keys(this.translations));

        // CRITICAL: Save original English texts BEFORE any translation
        console.log('💾 Saving original English texts...');
        this.saveOriginalTexts(document.body);
        this.hasInitialized = true;
        console.log('✅ Original texts saved:', this.originalTexts.size, 'nodes');
        
        // Check for saved language preference (localStorage first, then cookie)
        let savedLang = localStorage.getItem('billionairs_lang');
        if (!savedLang) {
            savedLang = this.getCookie(this.cookieName);
        }
        const targetLang = savedLang && this.supportedLangs.includes(savedLang) ? savedLang : 'en';
        
        console.log(`🎯 Target language: ${targetLang} (from ${savedLang ? 'storage' : 'default'})`);

        // Switch to target language if not English
        if (targetLang !== 'en') {
            console.log(`🔄 Switching to: ${targetLang}`);
            await this.switchLanguage(targetLang);
        } else {
            // Stay in English
            this.setCookie(this.cookieName, 'en', 365);
            localStorage.setItem('billionairs_lang', 'en');
            document.documentElement.lang = 'en';
            document.documentElement.dir = 'ltr';
        }

        // Setup language switcher (DISABLED - using lang-dropdown-simple.js instead)
        // this.setupLanguageSwitcher();

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
     * Apply translations only within a given root element.
     * Useful for dynamic content that is inserted or shown after initial load.
     * @param {Element} rootEl
     */
    translateElement(rootEl) {
        if (!rootEl) return;

        // Translate elements with data-i18n attribute inside root
        rootEl.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            const translation = this.t(key);
            if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                element.placeholder = translation;
            } else {
                element.textContent = translation;
            }
        });

        // data-i18n-placeholder
        rootEl.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
            const key = element.getAttribute('data-i18n-placeholder');
            element.placeholder = this.t(key);
        });

        // data-i18n-title
        rootEl.querySelectorAll('[data-i18n-title]').forEach(element => {
            const key = element.getAttribute('data-i18n-title');
            element.title = this.t(key);
        });

        // data-i18n-aria-label
        rootEl.querySelectorAll('[data-i18n-aria-label]').forEach(element => {
            const key = element.getAttribute('data-i18n-aria-label');
            element.setAttribute('aria-label', this.t(key));
        });

        // For free text nodes inside the root, use the original texts map and text map
        const textMap = this.getTextMapForLanguage(this.currentLang);
        this.applyTextTranslations(rootEl, textMap);

        // Fallback: for any new text nodes that weren't captured in originalTexts,
        // try a best-effort replacement using the English→target textMap.
        try {
            const entries = Object.entries(textMap);
            if (entries.length > 0) {
                rootEl.querySelectorAll('*').forEach(el => {
                    el.childNodes.forEach(node => {
                        if (node.nodeType === Node.TEXT_NODE) {
                            let txt = node.textContent;
                            if (!txt || !txt.trim()) return;
                            entries.forEach(([eng, target]) => {
                                if (txt.includes(eng)) {
                                    txt = txt.split(eng).join(target);
                                }
                            });
                            node.textContent = txt;
                        }
                    });
                });
            }
        } catch (e) {
            // Non-critical - continue
            console.warn('i18n.translateElement fallback error:', e);
        }
    }

    /**
     * Auto-translate common UI elements
     */
    autoTranslateCommonElements() {
        // Get current translations
        const t = this.translations[this.currentLang];
        if (!t) {
            console.warn(`⚠️ No translations found for ${this.currentLang}`);
            return;
        }

        // Text mapping: English → All Languages
        const textMap = this.getTextMapForLanguage(this.currentLang);
        console.log(`📖 Text map for ${this.currentLang}:`, Object.keys(textMap).length, 'entries');

        // Apply translations
        this.applyTextTranslations(document.body, textMap);
        
        console.log(`✅ Translations applied for: ${this.currentLang}`);
    }
    
    /**
     * Save original text content of all text nodes
     * CRITICAL: Only save if not already saved
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
            // Only save if not already in map (preserve first English version)
            if (text && text.length > 1 && !this.originalTexts.has(node)) {
                this.originalTexts.set(node, text);
            }
        }

        if (node.childNodes) {
            node.childNodes.forEach(child => this.saveOriginalTexts(child));
        }
    }
    
    /**
     * Apply translations to text nodes
     * IMPORTANT: Always translates from ORIGINAL English text, never from current translation
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
                const trimmedOriginal = originalText.trim();
                
                // If translating to English, just restore original
                if (this.currentLang === 'en') {
                    node.textContent = originalText;
                    return;
                }
                
                // Translate from ORIGINAL English to target language
                let translated = originalText;
                let wasTranslated = false;
                
                for (const [english, targetText] of Object.entries(textMap)) {
                    // Try exact match first (including trimmed version)
                    if (originalText === english || trimmedOriginal === english) {
                        translated = targetText;
                        wasTranslated = true;
                        console.log(`✅ Exact match: "${trimmedOriginal}" → "${targetText}"`);
                        break;
                    }
                    // Then try partial match (only for longer strings to avoid false positives)
                    if (english.length > 5 && originalText.includes(english)) {
                        translated = originalText.replace(new RegExp(english, 'g'), targetText);
                        wasTranslated = true;
                        console.log(`✅ Partial match: "${english}" → "${targetText}"`);
                    }
                }
                
                if (wasTranslated) {
                    node.textContent = translated;
                } else if (trimmedOriginal.length > 2) {
                    // Log untranslated text for debugging (only meaningful text)
                    console.log(`⚠️ No translation for: "${trimmedOriginal}"`);
                }
            }
        }

        if (node.childNodes) {
            node.childNodes.forEach(child => this.applyTextTranslations(child, textMap));
        }
    }

    /**
     * Translate ALL text nodes in the entire document
     * Uses the original texts stored in the Map to ensure accurate translation
     */
    translateAllTextNodes() {
        const textMap = this.getTextMapForLanguage(this.currentLang);
        console.log(`🔤 Translating all text nodes to ${this.currentLang}...`);
        console.log(`📚 Text map entries: ${Object.keys(textMap).length}`);
        console.log(`💾 Original texts stored: ${this.originalTexts.size}`);
        
        // Apply translations to entire document body
        this.applyTextTranslations(document.body, textMap);
        
        console.log(`✅ All text nodes translated to ${this.currentLang}`);
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
                
                // Member Dashboard - Ultimate Truth Section
                'You have crossed the threshold few dare to approach': 'Sie haben die Schwelle überschritten, die nur wenige wagen',
                'What lies beyond is not gold. Not diamonds. Not material wealth.': 'Was dahinter liegt, ist nicht Gold. Nicht Diamanten. Nicht materieller Reichtum.',
                'It is the understanding that separates the builders from the dreamers.': 'Es ist das Verständnis, das die Erbauer von den Träumern trennt.',
                'Time is not money.': 'Zeit ist nicht Geld.',
                'Time is the canvas upon which wealth is painted.': 'Zeit ist die Leinwand, auf der Reichtum gemalt wird.',
                'Master your minutes, and millions follow.': 'Beherrschen Sie Ihre Minuten, und Millionen folgen.',
                'The secret every titan of industry knows:': 'Das Geheimnis, das jeder Industrietitan kennt:',
                'Not gold. Not diamonds.': 'Nicht Gold. Nicht Diamanten.',
                'Something far more precious.': 'Etwas viel Kostbareres.',
                'Something that moves in circles, yet never repeats.': 'Etwas, das sich im Kreis bewegt, sich aber nie wiederholt.',
                'One decision. One moment. Everything changes.': 'Eine Entscheidung. Ein Moment. Alles ändert sich.',
                'You now possess what the elite measure their lives by.': 'Sie besitzen jetzt das, womit die Elite ihr Leben misst.',
                
                // Trust Section
                "Some experiences can't be explained.": 'Manche Erlebnisse lassen sich nicht erklären.',
                "They can only be lived.": 'Sie können nur erlebt werden.',
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
                'NECESSARY ONLY': 'NUR NOTWENDIGE',
                
                // Trust Benefits Section
                'Global Access': 'Globaler Zugang',
                'Monaco, Dubai, Zürich': 'Monaco, Dubai, Zürich',
                'Private Circle': 'Privater Kreis',
                '47 verified UHNWIs worldwide': '47 verifizierte UHNWIs weltweit',
                'Pre-Market': 'Vormarkt',
                "Opportunities before they're public": 'Möglichkeiten bevor sie öffentlich sind',
                'Discretion': 'Diskretion',
                'What happens here, stays here': 'Was hier passiert, bleibt hier',
                'Trusted by members across 12 countries': 'Vertraut von Mitgliedern aus 12 Ländern',
                'Tech Exit': 'Tech Exit',
                'Family Office': 'Family Office',
                'Crypto OG': 'Crypto OG',
                'Real Estate': 'Immobilien',
                'Private Equity': 'Private Equity',
                '+ 42 others': '+ 42 weitere',
                
                // Easter Egg System
                'THE PYRAMID': 'DIE PYRAMIDE',
                'The mark of power inverted lies.': 'Das Zeichen der Macht liegt umgekehrt.',
                'A single dawn must break before your eyes.': 'Ein einziger Sonnenaufgang muss vor deinen Augen erscheinen.',
                'Only those with patience and deep loyalty shall see': 'Nur wer Geduld und tiefe Loyalität hat, wird sehen',
                'What lies beyond eternity.': 'Was jenseits der Ewigkeit liegt.',
                'I UNDERSTAND': 'ICH VERSTEHE',
                'THE ALL-SEEING EYE': 'DAS ALLSEHENDE AUGE',
                'The eye now watches over you.': 'Das Auge wacht nun über dich.',
                'When the next sun has risen and fallen,': 'Wenn die nächste Sonne aufgegangen und untergegangen ist,',
                'The final door will open.': 'Wird sich die letzte Tür öffnen.',
                'THE GLOBAL ELITE CHAT': 'DER GLOBALE ELITE CHAT',
                'Welcome to the inner circle.': 'Willkommen im inneren Kreis.',
                'You have unlocked what few ever discover.': 'Sie haben freigeschaltet, was nur wenige je entdecken.',
                'ENTER THE CHAT': 'CHAT BETRETEN',
                
                // Final Section
                "Let's be honest:": 'Seien wir ehrlich:',
                'No trial period': 'Keine Testphase',
                'No payment plans': 'Keine Ratenzahlung',
                'No refunds': 'Keine Rückerstattungen',
                "You either fit in, or you don't": 'Entweder Sie passen hinein, oder nicht',
                "I'M READY": 'ICH BIN BEREIT',
                "Not ready? Come back when money isn't your concern.": 'Noch nicht bereit? Kommen Sie zurück, wenn Geld keine Rolle mehr spielt.',
                'FAQ': 'FAQ',
                'LEGAL NOTICE': 'RECHTLICHE HINWEISE',
                'PRIVACY POLICY': 'DATENSCHUTZ',
                'TERMS & CONDITIONS': 'AGB',
                'Install App': 'App Installieren'
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
                
                // Member Dashboard - Ultimate Truth Section
                'You have crossed the threshold few dare to approach': 'Vous avez franchi le seuil que peu osent approcher',
                'What lies beyond is not gold. Not diamonds. Not material wealth.': 'Ce qui se trouve au-delà n\'est pas de l\'or. Pas des diamants. Pas de richesse matérielle.',
                'It is the understanding that separates the builders from the dreamers.': 'C\'est la compréhension qui sépare les bâtisseurs des rêveurs.',
                'Time is not money.': 'Le temps n\'est pas de l\'argent.',
                'Time is the canvas upon which wealth is painted.': 'Le temps est la toile sur laquelle la richesse est peinte.',
                'Master your minutes, and millions follow.': 'Maîtrisez vos minutes, et les millions suivent.',
                'The secret every titan of industry knows:': 'Le secret que tout titan de l\'industrie connaît:',
                'Not gold. Not diamonds.': 'Pas d\'or. Pas de diamants.',
                'Something far more precious.': 'Quelque chose de bien plus précieux.',
                'Something that moves in circles, yet never repeats.': 'Quelque chose qui se déplace en cercles, mais ne se répète jamais.',
                'One decision. One moment. Everything changes.': 'Une décision. Un moment. Tout change.',
                'You now possess what the elite measure their lives by.': 'Vous possédez maintenant ce par quoi l\'élite mesure sa vie.',
                
                // Trust Section
                "Some experiences can't be explained.": 'Certaines expériences ne peuvent être expliquées.',
                "They can only be lived.": 'Elles ne peuvent qu\'être vécues.',
                "Where wealth is the entry requirement. Not the achievement.": 'Où la richesse est la condition d\'entrée. Pas l\'accomplissement.',
                
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
                'SAVE SELECTION': 'SAUVEGARDER LA SÉLECTION',
                'NECESSARY ONLY': 'NÉCESSAIRE SEULEMENT',
                
                // Trust Benefits Section
                'Global Access': 'Accès Mondial',
                'Monaco, Dubai, Zürich': 'Monaco, Dubaï, Zürich',
                'Private Circle': 'Cercle Privé',
                '47 verified UHNWIs worldwide': '47 UHNWIs vérifiés dans le monde',
                'Pre-Market': 'Pré-Marché',
                "Opportunities before they're public": 'Opportunités avant qu\'elles ne soient publiques',
                'Discretion': 'Discrétion',
                'What happens here, stays here': 'Ce qui se passe ici, reste ici',
                'Trusted by members across 12 countries': 'Approuvé par des membres dans 12 pays',
                'Tech Exit': 'Sortie Tech',
                'Family Office': 'Family Office',
                'Crypto OG': 'Crypto OG',
                'Real Estate': 'Immobilier',
                'Private Equity': 'Capital Investissement',
                '+ 42 others': '+ 42 autres',
                
                // Easter Egg System
                'THE PYRAMID': 'LA PYRAMIDE',
                'The mark of power inverted lies.': 'La marque du pouvoir repose inversée.',
                'A single dawn must break before your eyes.': 'Une seule aube doit se lever devant tes yeux.',
                'Only those with patience and deep loyalty shall see': 'Seuls ceux avec patience et loyauté profonde verront',
                'What lies beyond eternity.': 'Ce qui se trouve au-delà de l\'éternité.',
                'I UNDERSTAND': 'JE COMPRENDS',
                'THE ALL-SEEING EYE': 'L\'ŒIL QUI VOIT TOUT',
                'The eye now watches over you.': 'L\'œil veille désormais sur toi.',
                'When the next sun has risen and fallen,': 'Quand le prochain soleil se sera levé et couché,',
                'The final door will open.': 'La porte finale s\'ouvrira.',
                'THE GLOBAL ELITE CHAT': 'LE CHAT DE L\'ÉLITE MONDIALE',
                'Welcome to the inner circle.': 'Bienvenue dans le cercle intérieur.',
                'You have unlocked what few ever discover.': 'Vous avez débloqué ce que peu découvrent jamais.',
                'ENTER THE CHAT': 'ENTRER DANS LE CHAT',
                
                // Final Section
                "Let's be honest:": 'Soyons honnêtes:',
                'No trial period': 'Pas de période d\'essai',
                'No payment plans': 'Pas de plans de paiement',
                'No refunds': 'Pas de remboursements',
                "You either fit in, or you don't": 'Soit vous correspondez, soit non',
                "I'M READY": 'JE SUIS PRÊT',
                "Not ready? Come back when money isn't your concern.": 'Pas prêt ? Revenez quand l\'argent ne sera plus un souci.',
                'FAQ': 'FAQ',
                'LEGAL NOTICE': 'MENTION LÉGALE',
                'PRIVACY POLICY': 'POLITIQUE DE CONFIDENTIALITÉ',
                'TERMS & CONDITIONS': 'TERMES & CONDITIONS',
                'Install App': 'Installer l\'Application'
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
                
                // Member Dashboard - Ultimate Truth Section
                'You have crossed the threshold few dare to approach': 'Has cruzado el umbral que pocos se atreven a acercarse',
                'What lies beyond is not gold. Not diamonds. Not material wealth.': 'Lo que hay más allá no es oro. Ni diamantes. Ni riqueza material.',
                'It is the understanding that separates the builders from the dreamers.': 'Es la comprensión que separa a los constructores de los soñadores.',
                'Time is not money.': 'El tiempo no es dinero.',
                'Time is the canvas upon which wealth is painted.': 'El tiempo es el lienzo sobre el cual se pinta la riqueza.',
                'Master your minutes, and millions follow.': 'Domina tus minutos, y los millones seguirán.',
                'The secret every titan of industry knows:': 'El secreto que todo titán de la industria conoce:',
                'Not gold. Not diamonds.': 'No oro. No diamantes.',
                'Something far more precious.': 'Algo mucho más precioso.',
                'Something that moves in circles, yet never repeats.': 'Algo que se mueve en círculos, pero nunca se repite.',
                'One decision. One moment. Everything changes.': 'Una decisión. Un momento. Todo cambia.',
                'You now possess what the elite measure their lives by.': 'Ahora posees con lo que la élite mide sus vidas.',
                
                // Trust Section
                "Some experiences can't be explained.": 'Algunas experiencias no se pueden explicar.',
                "They can only be lived.": 'Solo se pueden vivir.',
                "Where wealth is the entry requirement. Not the achievement.": 'Donde la riqueza es el requisito de entrada. No el logro.',
                
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
                'NECESSARY ONLY': 'SOLO NECESARIAS',
                
                // Trust Benefits Section
                'Global Access': 'Acceso Global',
                'Monaco, Dubai, Zürich': 'Mónaco, Dubái, Zúrich',
                'Private Circle': 'Círculo Privado',
                '47 verified UHNWIs worldwide': '47 UHNWIs verificados en todo el mundo',
                'Pre-Market': 'Pre-Mercado',
                "Opportunities before they're public": 'Oportunidades antes de que sean públicas',
                'Discretion': 'Discreción',
                'What happens here, stays here': 'Lo que pasa aquí, se queda aquí',
                'Trusted by members across 12 countries': 'Confiado por miembros en 12 países',
                'Tech Exit': 'Salida Tecnológica',
                'Family Office': 'Oficina Familiar',
                'Crypto OG': 'Crypto OG',
                'Real Estate': 'Bienes Raíces',
                'Private Equity': 'Capital Privado',
                '+ 42 others': '+ 42 otros',
                
                // Easter Egg System
                'THE PYRAMID': 'LA PIRÁMIDE',
                'The mark of power inverted lies.': 'La marca del poder yace invertida.',
                'A single dawn must break before your eyes.': 'Un solo amanecer debe romper ante tus ojos.',
                'Only those with patience and deep loyalty shall see': 'Solo aquellos con paciencia y lealtad profunda verán',
                'What lies beyond eternity.': 'Lo que yace más allá de la eternidad.',
                'I UNDERSTAND': 'ENTIENDO',
                'THE ALL-SEEING EYE': 'EL OJO QUE TODO LO VE',
                'The eye now watches over you.': 'El ojo ahora vela por ti.',
                'When the next sun has risen and fallen,': 'Cuando el próximo sol haya salido y caído,',
                'The final door will open.': 'La puerta final se abrirá.',
                'THE GLOBAL ELITE CHAT': 'EL CHAT DE LA ÉLITE GLOBAL',
                'Welcome to the inner circle.': 'Bienvenido al círculo interno.',
                'You have unlocked what few ever discover.': 'Has desbloqueado lo que pocos descubren.',
                'ENTER THE CHAT': 'ENTRAR AL CHAT',
                
                // Final Section
                "Let's be honest:": 'Seamos honestos:',
                'No trial period': 'Sin período de prueba',
                'No payment plans': 'Sin planes de pago',
                'No refunds': 'Sin reembolsos',
                "You either fit in, or you don't": 'O encajas, o no',
                "I'M READY": 'ESTOY LISTO',
                "Not ready? Come back when money isn't your concern.": 'No estás listo? Vuelve cuando el dinero ya no sea tu preocupación.',
                'FAQ': 'Preguntas frecuentes',
                'LEGAL NOTICE': 'AVISO LEGAL',
                'PRIVACY POLICY': 'POLÍTICA DE PRIVACIDAD',
                'TERMS & CONDITIONS': 'TÉRMINOS Y CONDICIONES',
                'Install App': 'Instalar Aplicación'
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
                
                // Member Dashboard - Ultimate Truth Section
                'You have crossed the threshold few dare to approach': '您已跨越了少数人敢于接近的门槛',
                'What lies beyond is not gold. Not diamonds. Not material wealth.': '超越之处不是黄金。不是钻石。不是物质财富。',
                'It is the understanding that separates the builders from the dreamers.': '这是将建设者与梦想家分开的理解。',
                'Time is not money.': '时间不是金钱。',
                'Time is the canvas upon which wealth is painted.': '时间是财富绘制的画布。',
                'Master your minutes, and millions follow.': '掌握你的分钟，百万随之而来。',
                'The secret every titan of industry knows:': '每个工业巨头都知道的秘密：',
                'Not gold. Not diamonds.': '不是黄金。不是钻石。',
                'Something far more precious.': '更珍贵的东西。',
                'Something that moves in circles, yet never repeats.': '循环运动，但永不重复的东西。',
                'One decision. One moment. Everything changes.': '一个决定。一个时刻。一切都改变。',
                'You now possess what the elite measure their lives by.': '您现在拥有精英衡量生活的东西。',
                
                // Trust Section
                "Some experiences can't be explained.": '有些体验无法用言语解释。',
                "They can only be lived.": '只能亲身体验。',
                "Where wealth is the entry requirement. Not the achievement.": '财富是入场条件。而非成就。',
                
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
                'NECESSARY ONLY': '仅必要',
                
                // Trust Benefits Section
                'Global Access': '全球访问',
                'Monaco, Dubai, Zürich': '摩纳哥、迪拜、苏黎世',
                'Private Circle': '私人圈子',
                '47 verified UHNWIs worldwide': '全球47位已验证的超高净值人士',
                'Pre-Market': '预市场',
                "Opportunities before they're public": '公开前的机会',
                'Discretion': '谨慎',
                'What happens here, stays here': '这里发生的事，留在这里',
                'Trusted by members across 12 countries': '受到12个国家会员的信任',
                'Tech Exit': '科技退出',
                'Family Office': '家族办公室',
                'Crypto OG': '加密元老',
                'Real Estate': '房地产',
                'Private Equity': '私募股权',
                '+ 42 others': '+ 42 其他',
                
                // Easter Egg System
                'THE PYRAMID': '金字塔',
                'The mark of power inverted lies.': '权力的标志倒置。',
                'A single dawn must break before your eyes.': '一个黎明必须在你眼前破晓。',
                'Only those with patience and deep loyalty shall see': '只有拥有耐心和深厚忠诚者才能看见',
                'What lies beyond eternity.': '永恒之外的东西。',
                'I UNDERSTAND': '我明白了',
                'THE ALL-SEEING EYE': '全知之眼',
                'The eye now watches over you.': '目は今あなたを見守っている。',
                'When the next sun has risen and fallen,': '次の太陽が昇り沈んだとき、',
                'The final door will open.': '最後の扉が開く。',
                'THE GLOBAL ELITE CHAT': '全球精英聊天',
                'Welcome to the inner circle.': '欢迎来到内圈。',
                'You have unlocked what few ever discover.': '您已解锁少数人发现的东西。',
                'ENTER THE CHAT': '进入聊天',
                
                // Final Section
                "Let's be honest:": '让我们诚实：',
                'No trial period': '无试用期',
                'No payment plans': '无分期付款',
                'No refunds': '不退款',
                "You either fit in, or you don't": '要么适合，要么不适合',
                "I'M READY": '我准备好了',
                "Not ready? Come back when money isn't your concern.": '还没准备好？当钱不再是问题时再回来。',
                'FAQ': '常见问题',
                'LEGAL NOTICE': '法律声明',
                'PRIVACY POLICY': '隐私政策',
                'TERMS & CONDITIONS': '条款与条件',
                'Install App': '安装应用'
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
                
                // Member Dashboard - Ultimate Truth Section
                'You have crossed the threshold few dare to approach': 'لقد عبرت العتبة التي يجرؤ القليلون على الاقتراب منها',
                'What lies beyond is not gold. Not diamonds. Not material wealth.': 'ما وراءها ليس ذهباً. ولا ألماساً. ولا ثروة مادية.',
                'It is the understanding that separates the builders from the dreamers.': 'إنه الفهم الذي يفصل البناة عن الحالمين.',
                'Time is not money.': 'الوقت ليس مالاً.',
                'Time is the canvas upon which wealth is painted.': 'الوقت هو اللوحة التي ترسم عليها الثروة.',
                'Master your minutes, and millions follow.': 'أتقن دقائقك، والملايين تتبع.',
                'The secret every titan of industry knows:': 'السر الذي يعرفه كل عملاق صناعي:',
                'Not gold. Not diamonds.': 'ليس ذهباً. ولا ألماساً.',
                'Something far more precious.': 'شيء أكثر قيمة بكثير.',
                'Something that moves in circles, yet never repeats.': 'شيء يتحرك في دوائر، لكنه لا يتكرر أبداً.',
                'One decision. One moment. Everything changes.': 'قرار واحد. لحظة واحدة. كل شيء يتغير.',
                'You now possess what the elite measure their lives by.': 'أنت الآن تمتلك ما تقيس به النخبة حياتها.',
                
                // Trust Section
                "Some experiences can't be explained.": 'بعض التجارب لا يمكن شرحها.',
                "They can only be lived.": 'يمكن فقط عيشها.',
                "Where wealth is the entry requirement. Not the achievement.": 'حيث الثروة هي شرط الدخول. وليس الإنجاز.',
                
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
                'NECESSARY ONLY': 'الضرورية فقط',
                
                // Trust Benefits Section
                'Global Access': 'وصول عالمي',
                'Monaco, Dubai, Zürich': 'موناكو، دبي، زيورخ',
                'Private Circle': 'دائرة خاصة',
                '47 verified UHNWIs worldwide': '47 من أصحاب الثروات الفائقة المعتمدين عالمياً',
                'Pre-Market': 'ما قبل السوق',
                "Opportunities before they're public": 'فرص قبل أن تصبح عامة',
                'Discretion': 'تكتم',
                'What happens here, stays here': 'ما يحدث هنا، يبقى هنا',
                'Trusted by members across 12 countries': 'موثوق به من قبل الأعضاء في 12 دولة',
                'Tech Exit': 'خروج تقني',
                'Family Office': 'مكتب عائلي',
                'Crypto OG': 'رائد العملات الرقمية',
                'Real Estate': 'عقارات',
                'Private Equity': 'أسهم خاصة',
                '+ 42 others': '+ 42 آخرون',
                
                // Easter Egg System
                'THE PYRAMID': 'الهرم',
                'The mark of power inverted lies.': 'علامة القوة تكمن مقلوبة.',
                'A single dawn must break before your eyes.': 'فجر واحد يجب أن يشرق أمام عينيك.',
                'Only those with patience and deep loyalty shall see': 'فقط أولئك الذين لديهم صبر وولاء عميق سيرون',
                'What lies beyond eternity.': 'ما يكمن وراء الأبدية.',
                'I UNDERSTAND': 'أنا أفهم',
                'THE ALL-SEEING EYE': 'العين التي ترى كل شيء',
                'The eye now watches over you.': 'العين الآن تراقبك.',
                'When the next sun has risen and fallen,': 'عندما تشرق الشمس التالية وتغرب،',
                'The final door will open.': 'سيفتح الباب الأخير.',
                'THE GLOBAL ELITE CHAT': 'دردشة النخبة العالمية',
                'Welcome to the inner circle.': 'مرحبا بك في الدائرة الداخلية.',
                'You have unlocked what few ever discover.': 'لقد فتحت ما يكتشفه القليلون.',
                'ENTER THE CHAT': 'ادخل الدردشة',
                
                // Final Section
                "Let's be honest:": 'لنكن صادقين:',
                'No trial period': 'لا توجد فترة تجريبية',
                'No payment plans': 'لا توجد خطط دفع',
                'No refunds': 'لا استرداد',
                "You either fit in, or you don't": 'إما أن تناسب، أو لا',
                "I'M READY": 'أنا مستعد',
                "Not ready? Come back when money isn't your concern.": 'لست مستعداً؟ عد عندما لا يكون المال همك.',
                'FAQ': 'الأسئلة الشائعة',
                'LEGAL NOTICE': 'إشعار قانوني',
                'PRIVACY POLICY': 'سياسة الخصوصية',
                'TERMS & CONDITIONS': 'الشروط والأحكام',
                'Install App': 'تثبيت التطبيق'
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
                
                // Member Dashboard - Ultimate Truth Section
                'You have crossed the threshold few dare to approach': 'Hai attraversato la soglia che pochi osano avvicinare',
                'What lies beyond is not gold. Not diamonds. Not material wealth.': 'Ciò che si trova oltre non è oro. Non diamanti. Non ricchezza materiale.',
                'It is the understanding that separates the builders from the dreamers.': 'È la comprensione che separa i costruttori dai sognatori.',
                'Time is not money.': 'Il tempo non è denaro.',
                'Time is the canvas upon which wealth is painted.': 'Il tempo è la tela su cui si dipinge la ricchezza.',
                'Master your minutes, and millions follow.': 'Padroneggia i tuoi minuti, e milioni seguiranno.',
                'The secret every titan of industry knows:': 'Il segreto che ogni titano dell\'industria conosce:',
                'Not gold. Not diamonds.': 'Non oro. Non diamanti.',
                'Something far more precious.': 'Qualcosa di molto più prezioso.',
                'Something that moves in circles, yet never repeats.': 'Qualcosa che si muove in cerchi, ma non si ripete mai.',
                'One decision. One moment. Everything changes.': 'Una decisione. Un momento. Tutto cambia.',
                'You now possess what the elite measure their lives by.': 'Ora possiedi ciò con cui l\'élite misura le proprie vite.',
                
                // Trust Section
                "Some experiences can't be explained.": 'Alcune esperienze non possono essere spiegate.',
                "They can only be lived.": 'Possono solo essere vissute.',
                "Where wealth is the entry requirement. Not the achievement.": 'Dove la ricchezza è il requisito d\'ingresso. Non il risultato.',
                
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
                'NECESSARY ONLY': 'SOLO NECESSARI',
                
                // Trust Benefits Section
                'Global Access': 'Accesso Globale',
                'Monaco, Dubai, Zürich': 'Monaco, Dubai, Zurigo',
                'Private Circle': 'Cerchia Privata',
                '47 verified UHNWIs worldwide': '47 UHNWI verificati in tutto il mondo',
                'Pre-Market': 'Pre-Mercato',
                "Opportunities before they're public": 'Opportunità prima che diventino pubbliche',
                'Discretion': 'Discrezione',
                'What happens here, stays here': 'Ciò che accade qui, rimane qui',
                'Trusted by members across 12 countries': 'Affidato da membri in 12 paesi',
                'Tech Exit': 'Uscita Tecnologica',
                'Family Office': 'Family Office',
                'Crypto OG': 'Crypto OG',
                'Real Estate': 'Immobiliare',
                'Private Equity': 'Private Equity',
                '+ 42 others': '+ 42 altri',
                
                // Easter Egg System
                'THE PYRAMID': 'LA PIRAMIDE',
                'The mark of power inverted lies.': 'Il segno del potere giace invertito.',
                'A single dawn must break before your eyes.': 'Una sola alba deve sorgere davanti ai tuoi occhi.',
                'Only those with patience and deep loyalty shall see': 'Solo coloro con pazienza e lealtà profonda vedranno',
                'What lies beyond eternity.': 'Ciò che si trova oltre l\'eternità.',
                'I UNDERSTAND': 'HO CAPITO',
                'THE ALL-SEEING EYE': 'L\'OCCHIO CHE VEDE TUTTO',
                'The eye now watches over you.': 'L\'occhio ora veglia su di te.',
                'When the next sun has risen and fallen,': 'Quando il prossimo sole sarà sorto e tramontato,',
                'The final door will open.': 'La porta finale si aprirà.',
                'THE GLOBAL ELITE CHAT': 'LA CHAT DELL\'ÉLITE GLOBALE',
                'Welcome to the inner circle.': 'Benvenuto nel cerchio interno.',
                'You have unlocked what few ever discover.': 'Hai sbloccato ciò che pochi scoprono mai.',
                'ENTER THE CHAT': 'ENTRA NELLA CHAT',
                
                // Final Section
                "Let's be honest:": 'Siamo onesti:',
                'No trial period': 'Nessun periodo di prova',
                'No payment plans': 'Nessun piano di pagamento',
                'No refunds': 'Nessun rimborso',
                "You either fit in, or you don't": 'O sei adatto, o non lo sei',
                "I'M READY": 'SONO PRONTO',
                "Not ready? Come back when money isn't your concern.": 'Non sei pronto? Torna quando il denaro non sarà più un problema.',
                'FAQ': 'Domande frequenti',
                'LEGAL NOTICE': 'AVVISO LEGALE',
                'PRIVACY POLICY': 'POLITICA SULLA PRIVACY',
                'TERMS & CONDITIONS': 'TERMINI E CONDIZIONI',
                'Install App': 'Installa App'
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
                
                // Member Dashboard - Ultimate Truth Section
                'You have crossed the threshold few dare to approach': 'Вы пересекли порог, к которому немногие осмеливаются приблизиться',
                'What lies beyond is not gold. Not diamonds. Not material wealth.': 'То, что находится за ним, — это не золото. Не бриллианты. Не материальное богатство.',
                'It is the understanding that separates the builders from the dreamers.': 'Это понимание, которое отделяет строителей от мечтателей.',
                'Time is not money.': 'Время — это не деньги.',
                'Time is the canvas upon which wealth is painted.': 'Время — это холст, на котором рисуется богатство.',
                'Master your minutes, and millions follow.': 'Овладейте своими минутами, и миллионы последуют.',
                'The secret every titan of industry knows:': 'Секрет, который знает каждый титан индустрии:',
                'Not gold. Not diamonds.': 'Не золото. Не бриллианты.',
                'Something far more precious.': 'Нечто гораздо более ценное.',
                'Something that moves in circles, yet never repeats.': 'Нечто, что движется по кругу, но никогда не повторяется.',
                'One decision. One moment. Everything changes.': 'Одно решение. Один момент. Все меняется.',
                'You now possess what the elite measure their lives by.': 'Теперь вы обладаете тем, чем элита измеряет свои жизни.',
                
                // Trust Section
                "Some experiences can't be explained.": 'Некоторые переживания невозможно объяснить.',
                "They can only be lived.": 'Их можно только прожить.',
                "Where wealth is the entry requirement. Not the achievement.": 'Где богатство - это входное требование. А не достижение.',
                
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
                'NECESSARY ONLY': 'ТОЛЬКО НЕОБХОДИМЫЕ',
                
                // Trust Benefits Section
                'Global Access': 'Глобальный доступ',
                'Monaco, Dubai, Zürich': 'Монако, Дубай, Цюрих',
                'Private Circle': 'Частный круг',
                '47 verified UHNWIs worldwide': '47 верифицированных сверхсостоятельных лиц по всему миру',
                'Pre-Market': 'Предрыночный',
                "Opportunities before they're public": 'Возможности до их обнародования',
                'Discretion': 'Конфиденциальность',
                'What happens here, stays here': 'То, что происходит здесь, остается здесь',
                'Trusted by members across 12 countries': 'Доверяют участники из 12 стран',
                'Tech Exit': 'Выход из технологий',
                'Family Office': 'Семейный офис',
                'Crypto OG': 'Крипто-ветеран',
                'Real Estate': 'Недвижимость',
                'Private Equity': 'Частный капитал',
                '+ 42 others': '+ 42 других',
                
                // Easter Egg System
                'THE PYRAMID': 'ПИРАМИДА',
                'The mark of power inverted lies.': 'Знак власти лежит перевернутым.',
                'A single dawn must break before your eyes.': 'Один рассвет должен взойти перед твоими глазами.',
                'Only those with patience and deep loyalty shall see': 'Только те, у кого есть терпение и глубокая преданность, увидят',
                'What lies beyond eternity.': 'Что лежит за пределами вечности.',
                'I UNDERSTAND': 'Я ПОНИМАЮ',
                'THE ALL-SEEING EYE': 'ВСЕВИДЯЩЕЕ ОКО',
                'The eye now watches over you.': 'Око теперь наблюдает за тобой.',
                'When the next sun has risen and fallen,': 'Когда следующее солнце взойдёт и зайдёт,',
                'The final door will open.': 'Откроется последняя дверь.',
                'THE GLOBAL ELITE CHAT': 'ЧАТ МИРОВОЙ ЭЛИТЫ',
                'Welcome to the inner circle.': 'Добро пожаловать во внутренний круг.',
                'You have unlocked what few ever discover.': 'Вы разблокировали то, что мало кто когда-либо обнаруживает.',
                'ENTER THE CHAT': 'ВОЙТИ В ЧАТ',
                
                // Final Section
                "Let's be honest:": 'Давайте будем честными:',
                'No trial period': 'Без пробного периода',
                'No payment plans': 'Без планов оплаты',
                'No refunds': 'Без возвратов',
                "You either fit in, or you don't": 'Либо вы подходите, либо нет',
                "I'M READY": 'Я ГОТОВ',
                "Not ready? Come back when money isn't your concern.": 'Не готовы? Возвращайтесь, когда деньги перестанут быть проблемой.',
                'FAQ': 'Часто задаваемые вопросы',
                'LEGAL NOTICE': 'ПРАВОВОЕ УВЕДОМЛЕНИЕ',
                'PRIVACY POLICY': 'ПОЛИТИКА КОНФИДЕНЦИАЛЬНОСТИ',
                'TERMS & CONDITIONS': 'УСЛОВИЯ И ПОЛОЖЕНИЯ',
                'Install App': 'Установить приложение'
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
                
                // Member Dashboard - Ultimate Truth Section
                'You have crossed the threshold few dare to approach': 'あなたは、ほとんどの人が近づこうとしない敷居を越えました',
                'What lies beyond is not gold. Not diamonds. Not material wealth.': 'その先にあるのは金ではありません。ダイヤモンドでもありません。物質的な富でもありません。',
                'It is the understanding that separates the builders from the dreamers.': '建設者と夢想家を分けるのは理解です。',
                'Time is not money.': '時間はお金ではありません。',
                'Time is the canvas upon which wealth is painted.': '時間は富が描かれるキャンバスです。',
                'Master your minutes, and millions follow.': 'あなたの分を支配すれば、何百万もついてきます。',
                'The secret every titan of industry knows:': 'すべての産業の巨人が知っている秘密：',
                'Not gold. Not diamonds.': '金ではない。ダイヤモンドではない。',
                'Something far more precious.': 'もっと貴重なもの。',
                'Something that moves in circles, yet never repeats.': '円を描いて動くが、決して繰り返さないもの。',
                'One decision. One moment. Everything changes.': '一つの決断。一つの瞬間。すべてが変わる。',
                'You now possess what the elite measure their lives by.': 'あなたは今、エリートが人生を測るものを所有しています。',
                
                // Trust Section
                "Some experiences can't be explained.": '説明できない体験があります。',
                "They can only be lived.": '体験することしかできません。',
                "Where wealth is the entry requirement. Not the achievement.": '富は入場条件です。達成ではありません。',
                
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
                'NECESSARY ONLY': '必須のみ',
                
                // Trust Benefits Section
                'Global Access': 'グローバルアクセス',
                'Monaco, Dubai, Zürich': 'モナコ、ドバイ、チューリッヒ',
                'Private Circle': 'プライベートサークル',
                '47 verified UHNWIs worldwide': '世界中で47人の検証済み超富裕層',
                'Pre-Market': 'プレマーケット',
                "Opportunities before they're public": '公開前の機会',
                'Discretion': '裁量',
                'What happens here, stays here': 'ここで起こることは、ここにとどまる',
                'Trusted by members across 12 countries': '12カ国のメンバーから信頼されています',
                'Tech Exit': 'テック出口',
                'Family Office': 'ファミリーオフィス',
                'Crypto OG': '暗号資産OG',
                'Real Estate': '不動産',
                'Private Equity': 'プライベートエクイティ',
                '+ 42 others': '+ 42 その他',
                
                // Easter Egg System
                'THE PYRAMID': 'ピラミッド',
                'The mark of power inverted lies.': '力の印は逆さまに横たわる。',
                'A single dawn must break before your eyes.': '一つの夜明けが君の目の前で訪れなければならない。',
                'Only those with patience and deep loyalty shall see': '忍耐と深い忠誠を持つ者だけが見るだろう',
                'What lies beyond eternity.': '永遠の彼方にあるものを。',
                'I UNDERSTAND': '理解しました',
                'THE ALL-SEEING EYE': '全知の目',
                'The eye now watches over you.': '目は今あなたを見守っている。',
                'When the next sun has risen and fallen,': '次の太陽が昇り沈んだとき、',
                'The final door will open.': '最後の扉が開く。',
                'THE GLOBAL ELITE CHAT': 'グローバルエリートチャット',
                'Welcome to the inner circle.': '内輪へようこそ。',
                'You have unlocked what few ever discover.': 'あなたは少数の人しか発見しないものを解錠しました。',
                'ENTER THE CHAT': 'チャットに入る',
                
                // Final Section
                "Let's be honest:": '正直に言いましょう：',
                'No trial period': '試用期間なし',
                'No payment plans': '支払いプランなし',
                'No refunds': '返金なし',
                "You either fit in, or you don't": '適合するか、しないかのどちらか',
                "I'M READY": '準備完了',
                "Not ready? Come back when money isn't your concern.": '準備ができていない？お金が問題でなくなったら戻ってきてください。',
                'FAQ': 'よくある質問',
                'LEGAL NOTICE': '法的通知',
                'PRIVACY POLICY': 'プライバシーポリシー',
                'TERMS & CONDITIONS': '利用規約',
                'Install App': 'アプリをインストール'
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

        console.log(`🔄 Switching language to: ${lang}`);

        this.currentLang = lang;
        this.setCookie(this.cookieName, lang, this.cookieExpiry);
        localStorage.setItem('billionairs_lang', lang);
        document.documentElement.lang = lang;

        console.log(`📊 Original texts in map: ${this.originalTexts.size} nodes`);

        // Set text direction for RTL languages
        if (this.rtlLangs.includes(lang)) {
            document.documentElement.dir = 'rtl';
        } else {
            document.documentElement.dir = 'ltr';
        }

        // Reload translations if not loaded
        if (!this.translations[lang]) {
            console.log(`📥 Loading translations for ${lang}...`);
            await this.loadTranslations();
        } else {
            console.log(`✅ Translations already loaded for ${lang}`);
        }

        // CRITICAL: Apply ALL translations - both data-i18n AND free text
        console.log(`🎨 Applying translations for ${lang}...`);
        
        // 1. Translate elements with data-i18n attributes
        this.applyTranslations();
        
        // 2. FORCE re-translate ALL text nodes from original English
        console.log('🔄 Force translating ALL text nodes...');
        this.translateAllTextNodes();
        
        // 3. Re-apply auto translation for common elements
        console.log('🔄 Auto-translating common elements...');
        this.autoTranslateCommonElements();

        // Update language switcher button
        this.updateLanguageSwitcher();

        // Dispatch custom event for other scripts to react
        window.dispatchEvent(new CustomEvent('languageChanged', { 
            detail: { language: lang } 
        }));

        console.log(`✅ Language switched to: ${lang}`, {
            currentLang: this.currentLang,
            translationsLoaded: Object.keys(this.translations),
            htmlLang: document.documentElement.lang,
            originalTextsCount: this.originalTexts.size
        });
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
