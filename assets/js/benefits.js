// benefits.js - show more details for each trust benefit
const benefits = {
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
            showBenefit(key);
        });
        card.addEventListener('keypress', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                const key = this.getAttribute('data-benefit');
                showBenefit(key);
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

function showBenefit(key) {
    const b = benefits[key];
    if (!b) return;
    benefitTitle.textContent = b.title;
    benefitSubtitle.textContent = b.subtitle;
    benefitText.textContent = b.text;

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

    // Translate modal content into current language if i18n is available
    if (window.i18n && typeof window.i18n.translateElement === 'function') {
        try {
            window.i18n.translateElement(benefitModal);
        } catch (e) {
            console.warn('Failed to translate benefit modal:', e);
        }
    }
}

function closeBenefitModal() {
    benefitModal.classList.remove('active');
    document.body.style.overflow = '';
}
