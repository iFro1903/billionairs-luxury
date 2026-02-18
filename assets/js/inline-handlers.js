// Inline Event Handlers - replaces onclick/oninput attributes from HTML (CSP-safe)
document.addEventListener('DOMContentLoaded', function() {
    // memberBtn: Inner Circle button → redirect to login
    var memberBtn = document.getElementById('memberBtn');
    if (memberBtn) {
        memberBtn.addEventListener('click', function() {
            var lang = localStorage.getItem('billionairs_lang') || 'en';
            window.location.href = '/login.html?lang=' + lang;
        });
    }

    // stripeCheckoutButton → handleStripeCheckout
    var checkoutBtn = document.getElementById('stripeCheckoutButton');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', function() {
            if (typeof window.handleStripeCheckout === 'function') {
                window.handleStripeCheckout();
            }
        });
    }

    // Clock feature buttons (IDs: clockStyleBtn, worldTimeBtn)
    var styleBtn = document.getElementById('clockStyleBtn');
    var globalBtn = document.getElementById('worldTimeBtn');
    if (styleBtn) {
        styleBtn.addEventListener('click', function() {
            if (typeof window.toggleClockStyle === 'function') {
                window.toggleClockStyle();
            }
        });
    }
    if (globalBtn) {
        globalBtn.addEventListener('click', function() {
            if (typeof window.showWorldTime === 'function') {
                window.showWorldTime();
            }
        });
    }

    // Close world time modal button (ID: closeWorldTimeBtn)
    var closeWorldTimeBtn = document.getElementById('closeWorldTimeBtn');
    if (closeWorldTimeBtn) {
        closeWorldTimeBtn.addEventListener('click', function() {
            if (typeof window.closeWorldTime === 'function') {
                window.closeWorldTime();
            }
        });
    }
});
