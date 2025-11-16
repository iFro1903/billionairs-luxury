/**
 * Modal Content Translation System
 * Translates FAQ, Legal, Privacy, Terms modals
 */

const modalTranslations = {
    de: {
        'FAQ': 'FAQ',
        'What is BILLIONAIRS?': 'Was ist BILLIONAIRS?',
        'Why the investment?': 'Warum die Investition?',
        'Who is this for?': 'Für wen ist das?',
        'Security & Privacy': 'Sicherheit & Datenschutz',
        'What you may gain': 'Was Sie gewinnen können',
        'How long does access take?': 'Wie lange dauert der Zugang?',
        'Can I see examples or testimonials?': 'Kann ich Beispiele oder Testimonials sehen?',
        'What if I change my mind?': 'Was ist, wenn ich meine Meinung ändere?',
        'Availability': 'Verfügbarkeit',
        'How do I know this is real?': 'Woher weiß ich, dass das echt ist?',
        'LEGAL NOTICE': 'RECHTLICHE HINWEISE',
        'PRIVACY POLICY': 'DATENSCHUTZ',
        'TERMS & CONDITIONS': 'AGB',
        'Entity': 'Unternehmen',
        'Contact': 'Kontakt',
        'Compliance': 'Compliance',
        'Disclaimer': 'Haftungsausschluss',
        'Data Protection': 'Datenschutz',
        'Your Rights': 'Ihre Rechte',
        'Cookies': 'Cookies',
        'Agreement': 'Vereinbarung',
        'Service': 'Service',
        'Payment': 'Zahlung',
        'Liability': 'Haftung',
        'Governing Law': 'Anwendbares Recht'
    },
    fr: {
        'FAQ': 'FAQ',
        'What is BILLIONAIRS?': 'Qu\'est-ce que BILLIONAIRS?',
        'Why the investment?': 'Pourquoi l\'investissement?',
        'Who is this for?': 'Pour qui est-ce?',
        'Security & Privacy': 'Sécurité et confidentialité',
        'What you may gain': 'Ce que vous pouvez gagner',
        'How long does access take?': 'Combien de temps faut-il pour accéder?',
        'Can I see examples or testimonials?': 'Puis-je voir des exemples ou des témoignages?',
        'What if I change my mind?': 'Et si je change d\'avis?',
        'Availability': 'Disponibilité',
        'How do I know this is real?': 'Comment puis-je savoir que c\'est réel?',
        'LEGAL NOTICE': 'MENTION LÉGALE',
        'PRIVACY POLICY': 'POLITIQUE DE CONFIDENTIALITÉ',
        'TERMS & CONDITIONS': 'CONDITIONS GÉNÉRALES',
        'Entity': 'Entité',
        'Contact': 'Contact',
        'Compliance': 'Conformité',
        'Disclaimer': 'Avertissement',
        'Data Protection': 'Protection des données',
        'Your Rights': 'Vos droits',
        'Cookies': 'Cookies',
        'Agreement': 'Accord',
        'Service': 'Service',
        'Payment': 'Paiement',
        'Liability': 'Responsabilité',
        'Governing Law': 'Loi applicable'
    }
};

// Translate modal titles when language changes
window.addEventListener('languageChanged', (event) => {
    const lang = event.detail.language;
    if (!modalTranslations[lang]) return; // No translations for this language
    
    const translations = modalTranslations[lang];
    
    // Translate all modal h2 and h3 titles
    document.querySelectorAll('.legal-modal h2, .legal-modal h3, .faq-modal-item h3, .legal-section h3').forEach(element => {
        const originalText = element.textContent.trim();
        if (translations[originalText]) {
            element.textContent = translations[originalText];
            console.log(`✅ Modal translated: "${originalText}" → "${translations[originalText]}"`);
        }
    });
});

console.log('✅ Modal i18n system loaded');
