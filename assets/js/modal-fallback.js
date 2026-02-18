// CRITICAL FALLBACK: Ensure modals work even if faq.js fails to load
window.addEventListener('load', function() {
    // Only activate fallback if faq.js didn't create openModal
    setTimeout(function() {
        if (typeof window.openModal === 'function') return;

        var modals = {
            faq: document.getElementById('faqModal'),
            impressum: document.getElementById('impressumModal'),
            privacy: document.getElementById('privacyModal'),
            terms: document.getElementById('termsModal')
        };

        function fallbackOpenModal(name) {
            var modal = modals[name];
            if (modal) {
                modal.classList.add('active');
                document.body.style.overflow = 'hidden';
            }
        }

        function fallbackCloseModal(modal) {
            if (modal) {
                modal.classList.remove('active');
                document.body.style.overflow = 'auto';
            }
        }

        window.openModal = fallbackOpenModal;

        // Wire footer links
        var linkMap = {faqLink:'faq', legalLink:'impressum', privacyLink:'privacy', termsLink:'terms'};
        var heroMap = {faqLinkHero:'faq', legalLinkHero:'impressum', privacyLinkHero:'privacy', termsLinkHero:'terms'};

        function wireLinks(map) {
            for (var id in map) {
                (function(linkId, modalName) {
                    var el = document.getElementById(linkId);
                    if (el) {
                        el.addEventListener('click', function(e) {
                            e.preventDefault();
                            fallbackOpenModal(modalName);
                        });
                    }
                })(id, map[id]);
            }
        }

        wireLinks(linkMap);
        wireLinks(heroMap);

        // Wire close buttons and backdrop
        for (var key in modals) {
            (function(modal) {
                if (!modal) return;
                var closeBtn = modal.querySelector('.modal-close');
                if (closeBtn) {
                    closeBtn.addEventListener('click', function() { fallbackCloseModal(modal); });
                }
                modal.addEventListener('click', function(e) {
                    if (e.target === modal) fallbackCloseModal(modal);
                });
            })(modals[key]);
        }

        // ESC to close
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                for (var k in modals) {
                    if (modals[k] && modals[k].classList.contains('active')) {
                        fallbackCloseModal(modals[k]);
                    }
                }
            }
        });

        console.warn('[BILLIONAIRS] Modal fallback activated - faq.js may not have loaded');
    }, 2000);
});
