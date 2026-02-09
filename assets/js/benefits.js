// benefits.js - show more details for each trust benefit
const benefits = {
    rules: {
        title: 'Rules',
        subtitle: 'Respect and discretion are mandatory',
        text: `The circle operates on strict principles that ensure the integrity and exclusivity of the community:\n\n✗ Respect and discretion are mandatory\n✗ A leak costs membership - permanently\n✗ No names, no traces - complete anonymity\n✗ Rule violations result in immediate expulsion\n\nThese rules are non-negotiable and apply to all members equally.`,
    },
    global: {
        title: 'Global Access',
        subtitle: 'Select, invitation-only gatherings',
        text: `Quarterly intimate gatherings hosted in selected international venues. Events are invitation-only and limited to a small group of vetted members. These gatherings focus on curated conversations, cultural programming, and discreet networking. They are designed to showcase exceptional opportunities without public promotion.`,
    },
    circle: {
        title: 'Private Circle',
        subtitle: 'Careful selection & verified membership',
        text: `The circle is limited in size and includes founders, family offices, real estate investors and private equity professionals. Membership follows a vetting process to ensure alignment and long-term fit. Members are listed only by minimal, anonymous identifiers to protect privacy.`,
    },
    premarket: {
        title: 'Pre-Market',
        subtitle: 'Curated, non-guaranteed opportunities',
        text: `Members occasionally receive information about curated pre-market investment opportunities. These opportunities are carefully selected; participation depends on member interest and due diligence. Displaying these opportunities is not an endorsement nor a promise of outcomes.`,
    },
    discretion: {
        title: 'Discretion',
        subtitle: 'Strict privacy protocols',
        text: `Discretion is enforced across gatherings and communications. Members may be asked to sign NDAs for select sessions. No photos are shared publicly without explicit consent. Personal information is protected as part of the membership agreement.`,
    }
};

let benefitModal;
let benefitClose;
let benefitTitle;
let benefitSubtitle;
let benefitText;

// init function
document.addEventListener('DOMContentLoaded', function() {
    benefitModal = document.getElementById('benefitModal');
    benefitClose = document.querySelector('.benefit-close');
    benefitTitle = document.getElementById('benefitTitle');
    benefitSubtitle = document.getElementById('benefitSubtitle');
    benefitText = document.getElementById('benefitText');

    const cards = document.querySelectorAll('.benefit-card');
    cards.forEach(card => {
        card.addEventListener('click', function() {
            const key = this.getAttribute('data-benefit');
            showBenefit(key, this);
        });
        card.addEventListener('keypress', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                const key = this.getAttribute('data-benefit');
                showBenefit(key, this);
            }
        })
    });

    if (benefitClose) {
        benefitClose.addEventListener('click', closeBenefitModal);
    }

    if (benefitModal) {
        benefitModal.addEventListener('click', function(e) {
            if (e.target === benefitModal) {
                closeBenefitModal();
            }
        });
    }

    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && benefitModal.classList.contains('active')) {
            closeBenefitModal();
        }
    });
});

function showBenefit(key, sourceCard) {
    const b = benefits[key];
    if (!b) return;
    
    // Check if i18n is available and get translations
    if (window.i18n && window.i18n.translations && window.i18n.currentLang) {
        const lang = window.i18n.currentLang;
        const t = window.i18n.translations[lang];
        
        // Try to get translated benefit from translations
        if (t && t.benefits && t.benefits[key]) {
            const translatedBenefit = t.benefits[key];
            
            // Use translated content
            benefitTitle.textContent = translatedBenefit.title || b.title;
            benefitSubtitle.textContent = translatedBenefit.subtitle || b.subtitle;
            
            // Format text with proper HTML line breaks
            const formattedText = (translatedBenefit.text || b.text).replace(/\\n/g, '<br>');
            benefitText.innerHTML = formattedText;
        } else {
            // Fallback to English
            benefitTitle.textContent = b.title;
            benefitSubtitle.textContent = b.subtitle;
            const formattedText = b.text.replace(/\\n/g, '<br>');
            benefitText.innerHTML = formattedText;
        }
    } else {
        // i18n not available, use English
        benefitTitle.textContent = b.title;
        benefitSubtitle.textContent = b.subtitle;
        const formattedText = b.text.replace(/\\n/g, '<br>');
        benefitText.innerHTML = formattedText;
    }

    // Ensure modal is attached to document.body so fixed positioning centers
    // relative to the viewport (avoids issues when modal is inside a transformed
    // or scrollable container).
    if (benefitModal && benefitModal.parentNode !== document.body) {
        try {
            document.body.appendChild(benefitModal);
        } catch (e) {
            // ignore - fallback to existing behavior
        }
    }

    benefitModal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeBenefitModal() {
    benefitModal.classList.remove('active');
    document.body.style.overflow = '';
}
