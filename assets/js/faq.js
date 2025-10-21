// ==================== PARTICLES INIT FOR MODALS ====================
function initModalParticles(elementId) {
    particlesJS(elementId, {
        particles: {
            number: { value: 80, density: { enable: true, value_area: 800 } },
            color: { value: '#E8B4A0' },
            shape: { type: 'circle' },
            opacity: { value: 0.5, random: true },
            size: { value: 3, random: true },
            line_linked: {
                enable: true,
                distance: 150,
                color: '#E8B4A0',
                opacity: 0.35,
                width: 1
            },
            move: {
                enable: true,
                speed: 1,
                direction: 'none',
                random: true,
                straight: false,
                out_mode: 'out',
                bounce: false
            }
        },
        interactivity: {
            detect_on: 'canvas',
            events: {
                onhover: { enable: false },
                onclick: { enable: false },
                resize: true
            }
        },
        retina_detect: true
    });
}

// ==================== MODAL FUNCTIONALITY ====================
document.addEventListener('DOMContentLoaded', () => {
    // Modal elements
    const modals = {
        faq: document.getElementById('faqModal'),
        impressum: document.getElementById('impressumModal'),
        privacy: document.getElementById('privacyModal'),
        terms: document.getElementById('termsModal')
    };
    
    // Link elements
    const links = {
        faq: document.getElementById('faqLink'),
        impressum: document.getElementById('impressumLink'),
        privacy: document.getElementById('privacyLink'),
        terms: document.getElementById('termsLink')
    };
    
    // Initialize particles for each modal
    let particlesInitialized = {
        faq: false,
        impressum: false,
        privacy: false,
        terms: false
    };
    
    // Contact Popup
    const contactBtn = document.getElementById('contactBtn');
    const contactPopup = document.getElementById('contactPopup');
    const popupClose = contactPopup?.querySelector('.popup-close');
    const copyBtn = document.getElementById('copyBtn');
    const emailText = document.getElementById('emailText');
    
    if (contactBtn && contactPopup) {
        contactBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            contactPopup.classList.toggle('active');
        });
        
        popupClose?.addEventListener('click', (e) => {
            e.stopPropagation();
            contactPopup.classList.remove('active');
        });
        
        // Close when clicking outside
        document.addEventListener('click', (e) => {
            if (!contactPopup.contains(e.target) && !contactBtn.contains(e.target)) {
                contactPopup.classList.remove('active');
            }
        });
        
        // Prevent popup from closing when clicking inside
        contactPopup.addEventListener('click', (e) => {
            e.stopPropagation();
        });
        
        // Copy to clipboard functionality
        if (copyBtn && emailText) {
            copyBtn.addEventListener('click', async () => {
                try {
                    const email = emailText.textContent;
                    await navigator.clipboard.writeText(email);
                    
                    // Visual feedback
                    const copyIcon = copyBtn.querySelector('.copy-icon');
                    const copyText = copyBtn.querySelector('.copy-text');
                    
                    copyBtn.classList.add('copied');
                    if (copyIcon) copyIcon.textContent = '✓';
                    if (copyText) copyText.textContent = 'Copied!';
                    
                    // Reset after 2 seconds
                    setTimeout(() => {
                        copyBtn.classList.remove('copied');
                        if (copyIcon) copyIcon.textContent = '📋';
                        if (copyText) copyText.textContent = 'Copy';
                    }, 2000);
                    
                } catch (err) {
                    console.error('Failed to copy:', err);
                    // Fallback: select text for manual copy
                    const range = document.createRange();
                    range.selectNodeContents(emailText);
                    const selection = window.getSelection();
                    selection.removeAllRanges();
                    selection.addRange(range);
                }
            });
        }
    }
    
    // Open modal function
    function openModal(modalName) {
        const modal = modals[modalName];
        if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
            
            // Initialize particles only once per modal
            if (!particlesInitialized[modalName]) {
                const particleIds = {
                    faq: 'particles-faq',
                    impressum: 'particles-impressum',
                    privacy: 'particles-privacy',
                    terms: 'particles-terms'
                };
                
                setTimeout(() => {
                    initModalParticles(particleIds[modalName]);
                    particlesInitialized[modalName] = true;
                }, 100);
            }
        }
    }
    
    // Close modal function
    function closeModal(modal) {
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
    }
    
    // Attach click events to links
    Object.keys(links).forEach(key => {
        const link = links[key];
        if (link) {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                openModal(key);
            });
        }
    });
    
    // Attach close button events
    Object.values(modals).forEach(modal => {
        if (modal) {
            const closeBtn = modal.querySelector('.modal-close');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => closeModal(modal));
            }
            
            // Close on backdrop click
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    closeModal(modal);
                }
            });
        }
    });
    
    // ESC key to close any active modal
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            Object.values(modals).forEach(modal => {
                if (modal && modal.classList.contains('active')) {
                    closeModal(modal);
                }
            });
        }
    });
});
