// Payment Handler: Feature flags, terms checkbox, toast system, checkout handler, crypto modal
// ?? FEATURE FLAG: Bank Transfer (true = aktiv, false = deaktiviert)
const ENABLE_BANK_TRANSFER = false;

// UI ausblenden wenn deaktiviert
document.addEventListener('DOMContentLoaded', function() {
    if (!ENABLE_BANK_TRANSFER) {
        const wireButton = document.querySelector('.payment-method[data-method="wire"]');
        const wireForm = document.getElementById('wirePaymentForm');
        if (wireButton) wireButton.style.display = 'none';
        if (wireForm) wireForm.style.display = 'none';
    }
    
    // Force re-translate payment form after i18n loads
    window.addEventListener('i18nReady', function() {
        setTimeout(function() {
            if (window.i18nManager) {
                const paymentForm = document.querySelector('.payment-form-container');
                if (paymentForm) {
                    window.i18nManager.translateElement(paymentForm);
                }
            }
        }, 500);
    });
    
    // Also try after full page load
    setTimeout(function() {
        if (window.i18nManager) {
            const paymentForm = document.querySelector('.payment-form-container');
            if (paymentForm) {
                window.i18nManager.translateElement(paymentForm);
            }
        }
    }, 2000);
});

// -- Terms Checkbox → Payment Button Toggle --
document.addEventListener('DOMContentLoaded', function() {
    const termsCheckbox = document.getElementById('termsCheckbox');
    const paymentButton = document.getElementById('stripeCheckoutButton');
    
    function updatePaymentButton() {
        if (!termsCheckbox || !paymentButton) return;
        if (termsCheckbox.checked) {
            paymentButton.disabled = false;
            paymentButton.classList.remove('payment-button-disabled');
        } else {
            paymentButton.disabled = true;
            paymentButton.classList.add('payment-button-disabled');
        }
    }

    if (termsCheckbox && paymentButton) {
        termsCheckbox.addEventListener('change', updatePaymentButton);
    }
    
    // Wire consent links to modals — stop propagation so link taps don't toggle checkbox on iOS
    const termsConsentLink = document.getElementById('termsConsentLink');
    const privacyConsentLink = document.getElementById('privacyConsentLink');
    const refundConsentLink = document.getElementById('refundConsentLink');
    
    if (termsConsentLink) {
        termsConsentLink.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            const modal = document.getElementById('termsModal');
            if (modal) modal.classList.add('active');
        });
    }
    if (privacyConsentLink) {
        privacyConsentLink.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            const modal = document.getElementById('privacyModal');
            if (modal) modal.classList.add('active');
        });
    }
    if (refundConsentLink) {
        refundConsentLink.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            // Refund info is in FAQ #8 and Terms modal — open Terms
            const modal = document.getElementById('termsModal');
            if (modal) modal.classList.add('active');
        });
    }
});

// -- Toast i18n helper --
function toastT(key, params) {
    if (window.i18n && typeof window.i18n.t === 'function') {
        const translated = window.i18n.t('toast.' + key, params || {});
        if (translated !== 'toast.' + key) return translated;
    }
    return null; // fallback: caller passes English string
}

// -- Premium Toast Notification System --
window.showPaymentToast = function(message, type) {
    type = type || 'warning';
    const existing = document.getElementById('billionairsToast');
    if (existing) existing.remove();

    const icons = { warning: '?', error: '?', info: '?', success: '?' };
    const colors = {
        warning: 'rgba(232, 180, 160, 0.15)',
        error:   'rgba(220, 80, 80, 0.15)',
        info:    'rgba(160, 190, 232, 0.15)',
        success: 'rgba(160, 232, 180, 0.15)'
    };
    const borderColors = {
        warning: 'rgba(232, 180, 160, 0.4)',
        error:   'rgba(220, 80, 80, 0.4)',
        info:    'rgba(160, 190, 232, 0.4)',
        success: 'rgba(160, 232, 180, 0.4)'
    };

    const toast = document.createElement('div');
    toast.id = 'billionairsToast';
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    toast.style.cssText = 'position:fixed;top:30px;left:50%;transform:translateX(-50%) translateY(-20px);z-index:100000;'
        + 'background:' + colors[type] + ';backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);'
        + 'border:1px solid ' + borderColors[type] + ';border-radius:12px;padding:16px 28px;'
        + 'display:flex;align-items:center;gap:14px;max-width:520px;width:90%;'
        + 'box-shadow:0 8px 32px rgba(0,0,0,0.4);opacity:0;transition:all 0.4s cubic-bezier(0.4,0,0.2,1);'
        + 'font-family:Montserrat,sans-serif;';

    toast.innerHTML = '<span style="font-size:20px;flex-shrink:0;">' + (icons[type] || '?') + '</span>'
        + '<span style="color:rgba(255,255,255,0.95);font-size:13px;line-height:1.5;letter-spacing:0.3px;">'
        + message + '</span>';

    document.body.appendChild(toast);
    requestAnimationFrame(function() {
        toast.style.opacity = '1';
        toast.style.transform = 'translateX(-50%) translateY(0)';
    });
    setTimeout(function() {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(-50%) translateY(-20px)';
        setTimeout(function() { toast.remove(); }, 400);
    }, 5000);
};

window.handleStripeCheckout = function() {
    // Check Terms & Conditions consent
    const termsCheckbox = document.getElementById('termsCheckbox');
    if (!termsCheckbox || !termsCheckbox.checked) {
        showPaymentToast(toastT('acceptTermsFirst') || 'Please accept the Terms of Service and Privacy Policy before proceeding.', 'warning');
        const container = document.getElementById('legalConsentContainer');
        if (container) {
            container.classList.add('legal-consent-shake');
            setTimeout(() => container.classList.remove('legal-consent-shake'), 600);
        }
        return;
    }

    // Get selected payment method - check for both 'active' and 'selected' class
    const selectedMethod = document.querySelector('.payment-method.active, .payment-method.selected');
    if (!selectedMethod) {
        showPaymentToast(toastT('selectPaymentMethod') || 'Please select a payment method', 'warning');
        return;
    }
    
    const methodType = selectedMethod.dataset.method;
    
    // Handle different payment methods
    if (methodType === 'card') {
        // Collect and validate customer data including password
        const firstName = document.getElementById('customerFirstName').value.trim();
        const lastName = document.getElementById('customerLastName').value.trim();
        const email = document.getElementById('customerEmail').value.trim();
        const password = document.getElementById('customerPassword').value;
        const passwordConfirm = document.getElementById('customerPasswordConfirm').value;
        const phone = document.getElementById('customerPhone').value.trim();
        const company = document.getElementById('customerCompany').value.trim();
        
        // Validate required fields
        if (!firstName || !lastName || !email || !password || !passwordConfirm || !phone) {
            showPaymentToast(toastT('fillRequiredFields') || 'Please fill in all required fields', 'warning');
            return;
        }
        
        // Validate passwords match
        if (password !== passwordConfirm) {
            showPaymentToast(toastT('passwordsNoMatch') || 'Passwords do not match', 'error');
            return;
        }
        
        // Validate password length
        if (password.length < 8) {
            showPaymentToast(toastT('passwordMinLength') || 'Password must be at least 8 characters', 'error');
            return;
        }
        
        // Prepare customer data - API expects fullName
        const customerData = {
            fullName: `${firstName} ${lastName}`.trim(),
            email,
            password,
            phone,
            company
        };
        
        // Redirect to NDA signing page before payment
        const currentLang = window.currentLanguage || document.documentElement.lang || 'en';
        
        // Store sensitive data in sessionStorage (not in URL)
        sessionStorage.setItem('nda_customer', JSON.stringify(customerData));
        
        const ndaParams = new URLSearchParams({
            name: customerData.fullName,
            email: customerData.email,
            phone: customerData.phone || '',
            company: customerData.company || '',
            lang: currentLang
        });
        window.location.href = `/nda-signing.html?${ndaParams.toString()}`;
    } else if (methodType === 'wire') {
        if (!ENABLE_BANK_TRANSFER) {
            showPaymentToast(toastT('wireUnavailable') || 'Bank wire transfer is temporarily unavailable. Please use Credit Card or Cryptocurrency.', 'warning');
            return;
        }
        if (window.paymentMethodSelector) {
            window.paymentMethodSelector.handleWireTransfer();
        } else {
            showPaymentToast(toastT('paymentInitializing') || 'Payment system initializing. Please try again in a moment.', 'info');
        }
    } else if (methodType === 'crypto') {
        if (window.paymentMethodSelector) {
            window.paymentMethodSelector.handleCryptoPayment();
        } else {
            showPaymentToast(toastT('paymentInitializing') || 'Payment system initializing. Please try again in a moment.', 'info');
        }
    } else {
        showPaymentToast(toastT('comingSoon') || `${methodType.toUpperCase()} payment coming soon! Use Credit Card or Wire Transfer for now.`, 'info');
    }
};

// Crypto currency selection modal
window.showCryptoSelectionModal = function() {
    const modal = document.createElement('div');
    modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.95);z-index:10000;display:flex;align-items:center;justify-content:center;padding:2rem;';

    modal.innerHTML = '<div style="background:linear-gradient(135deg,#0a0a0a 0%,#1a1a1a 100%);border:2px solid #B76E79;border-radius:12px;padding:3rem;max-width:500px;width:100%;position:relative;"><h2 style="font-family:\'Playfair Display\',serif;font-size:2rem;color:#B76E79;text-align:center;margin-bottom:1rem;font-weight:700;">Select Cryptocurrency</h2><p style="text-align:center;color:rgba(255,255,255,0.7);font-size:0.9rem;margin-bottom:2rem;">CHF 500\'000.00</p><div style="display:flex;flex-direction:column;gap:1rem;"><button data-crypto="bitcoin" style="width:100%;padding:1.5rem;background:linear-gradient(135deg,rgba(247,147,26,0.1) 0%,rgba(247,147,26,0.05) 100%);border:2px solid rgba(247,147,26,0.3);border-radius:8px;color:#ffffff;font-weight:700;font-size:1.1rem;cursor:pointer;transition:all 0.3s ease;display:flex;align-items:center;justify-content:center;gap:1rem;"><svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg"><g fill="none" fill-rule="evenodd"><circle cx="16" cy="16" r="16" fill="#F7931A"/><path fill="#FFF" fill-rule="nonzero" d="M23.189 14.02c.314-2.096-1.283-3.223-3.465-3.975l.708-2.84-1.728-.43-.69 2.765c-.454-.114-.92-.22-1.385-.326l.695-2.783L15.596 6l-.708 2.839c-.376-.086-.746-.17-1.104-.26l.002-.009-2.384-.595-.46 1.846s1.283.294 1.256.312c.7.175.826.638.805 1.006l-.806 3.235c.048.012.11.03.18.057l-.183-.045-1.13 4.532c-.086.212-.303.531-.793.41.018.025-1.256-.313-1.256-.313l-.858 1.978 2.25.561c.418.105.828.215 1.231.318l-.715 2.872 1.727.43.708-2.84c.472.127.93.245 1.378.357l-.706 2.828 1.728.43.715-2.866c2.948.558 5.164.333 6.097-2.333.752-2.146-.037-3.385-1.588-4.192 1.13-.26 1.98-1.003 2.207-2.538zm-3.95 5.538c-.533 2.147-4.148.986-5.32.695l.95-3.805c1.172.293 4.929.872 4.37 3.11zm.535-5.569c-.487 1.953-3.495.96-4.47.717l.86-3.45c.975.243 4.118.696 3.61 2.733z"/></g></svg><span>Bitcoin (BTC)</span></button><button data-crypto="ethereum" style="width:100%;padding:1.5rem;background:linear-gradient(135deg,rgba(98,126,234,0.1) 0%,rgba(98,126,234,0.05) 100%);border:2px solid rgba(98,126,234,0.3);border-radius:8px;color:#ffffff;font-weight:700;font-size:1.1rem;cursor:pointer;transition:all 0.3s ease;display:flex;align-items:center;justify-content:center;gap:1rem;"><svg width="32" height="32" viewBox="0 0 784 1277" xmlns="http://www.w3.org/2000/svg"><g fill="#627EEA" fill-rule="evenodd"><path d="M392 0l-8.7 29.6v844.5l8.7 8.7 392-231.7z" opacity=".6"/><path d="M392 0L0 651.1l392 231.7V0z"/><path d="M392 956.7l-4.9 6v301.3l4.9 14.3L784 733z" opacity=".6"/><path d="M392 1278.3V956.7L0 733z"/><path d="M392 882.8l392-231.7-392-178.2z" opacity=".2"/><path d="M0 651.1l392 231.7V472.9z" opacity=".6"/></g></svg><span>Ethereum (ETH)</span></button><button data-crypto="usdt" style="width:100%;padding:1.5rem;background:linear-gradient(135deg,rgba(38,161,123,0.1) 0%,rgba(38,161,123,0.05) 100%);border:2px solid rgba(38,161,123,0.3);border-radius:8px;color:#ffffff;font-weight:700;font-size:1.1rem;cursor:pointer;transition:all 0.3s ease;display:flex;align-items:center;justify-content:center;gap:1rem;"><svg width="32" height="32" viewBox="0 0 339.43 295.27" xmlns="http://www.w3.org/2000/svg"><path fill="#26A17B" d="M62.15 1.45l-61.89 130a2.52 2.52 0 0 0 .54 2.94l167.15 160.17a2.55 2.55 0 0 0 3.53 0L338.63 134.4a2.52 2.52 0 0 0 .54-2.94l-61.89-130A2.5 2.5 0 0 0 275 0H64.45a2.5 2.5 0 0 0-2.3 1.45z"/><path fill="#fff" d="M191.19 144.8v0c-1.2.09-7.4.46-21.23.46-11 0-18.81-.33-21.55-.46v0c-42.51-1.87-74.24-9.27-74.24-18.13s31.73-16.25 74.24-18.15v28.91c2.78.2 10.74.67 21.74.67 13.2 0 19.81-.55 21-0.66v-28.9c42.42 1.89 74.08 9.29 74.08 18.13s-31.65 16.24-74.08 18.12zm0-39.25V79.68h59.2V40.23H89.21v39.45H148.4v25.86c-48.11 2.21-84.29 11.74-84.29 23.16s36.18 20.94 84.29 23.16v82.9h42.78v-82.93c48-2.21 84.12-11.73 84.12-23.14s-36.09-20.93-84.12-23.15z"/></svg><span>Tether (USDT)</span></button></div><button data-action="cancel-crypto" style="width:100%;padding:1rem;background:transparent;border:1px solid rgba(255,255,255,0.2);border-radius:6px;color:rgba(255,255,255,0.6);font-weight:600;font-size:0.9rem;cursor:pointer;transition:all 0.3s ease;margin-top:1.5rem;">CANCEL</button></div>';

    document.body.appendChild(modal);

    // Wire up event listeners (CSP-safe, no inline handlers)
    var cryptoBtns = modal.querySelectorAll('[data-crypto]');
    var hoverConfigs = {
        bitcoin:  { bgHover: 'linear-gradient(135deg,rgba(247,147,26,0.2) 0%,rgba(247,147,26,0.1) 100%)', borderHover: 'rgba(247,147,26,0.6)',
                    bgNorm:  'linear-gradient(135deg,rgba(247,147,26,0.1) 0%,rgba(247,147,26,0.05) 100%)', borderNorm: 'rgba(247,147,26,0.3)' },
        ethereum: { bgHover: 'linear-gradient(135deg,rgba(98,126,234,0.2) 0%,rgba(98,126,234,0.1) 100%)', borderHover: 'rgba(98,126,234,0.6)',
                    bgNorm:  'linear-gradient(135deg,rgba(98,126,234,0.1) 0%,rgba(98,126,234,0.05) 100%)', borderNorm: 'rgba(98,126,234,0.3)' },
        usdt:     { bgHover: 'linear-gradient(135deg,rgba(38,161,123,0.2) 0%,rgba(38,161,123,0.1) 100%)', borderHover: 'rgba(38,161,123,0.6)',
                    bgNorm:  'linear-gradient(135deg,rgba(38,161,123,0.1) 0%,rgba(38,161,123,0.05) 100%)', borderNorm: 'rgba(38,161,123,0.3)' }
    };
    cryptoBtns.forEach(function(btn) {
        var crypto = btn.getAttribute('data-crypto');
        var cfg = hoverConfigs[crypto];
        btn.addEventListener('click', function() { selectCrypto(crypto); });
        if (cfg) {
            btn.addEventListener('mouseover', function() { this.style.background = cfg.bgHover; this.style.borderColor = cfg.borderHover; this.style.transform = 'translateY(-2px)'; });
            btn.addEventListener('mouseout', function() { this.style.background = cfg.bgNorm; this.style.borderColor = cfg.borderNorm; this.style.transform = 'translateY(0)'; });
        }
    });
    var cancelBtn = modal.querySelector('[data-action="cancel-crypto"]');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', function() { modal.remove(); });
        cancelBtn.addEventListener('mouseover', function() { this.style.borderColor = 'rgba(255,255,255,0.4)'; this.style.color = 'rgba(255,255,255,0.9)'; });
        cancelBtn.addEventListener('mouseout', function() { this.style.borderColor = 'rgba(255,255,255,0.2)'; this.style.color = 'rgba(255,255,255,0.6)'; });
    }
};

// Handle crypto currency selection
window.selectCrypto = function(cryptocurrency) {
    // Reset processing flag in case it's stuck
    if (window.stripeProcessor) {
        window.stripeProcessor.isProcessing = false;
    }
    
    // Wait a tiny bit to ensure DOM is stable after modal interactions
    setTimeout(() => {
        const firstNameEl = document.getElementById('customerFirstName');
        const lastNameEl = document.getElementById('customerLastName');
        const emailEl = document.getElementById('customerEmail');
        const passwordEl = document.getElementById('customerPassword');
        const passwordConfirmEl = document.getElementById('customerPasswordConfirm');
        const phoneEl = document.getElementById('customerPhone');
        const companyEl = document.getElementById('customerCompany');
        
        if (!firstNameEl || !lastNameEl || !emailEl || !passwordEl || !passwordConfirmEl || !phoneEl) {
            showPaymentToast(toastT('formFieldsError') || 'Error: Form fields not found! Please refresh the page.', 'error');
            return;
        }
        
        const firstName = (firstNameEl.value || '').trim();
        const lastName = (lastNameEl.value || '').trim();
        const email = (emailEl.value || '').trim();
        const password = passwordEl.value || '';
        const passwordConfirm = passwordConfirmEl.value || '';
        const phone = (phoneEl.value || '').trim();
        const company = companyEl ? (companyEl.value || '').trim() : '';
        
        window.processCryptoSelection(cryptocurrency, firstName, lastName, email, password, passwordConfirm, phone, company);
    }, 50);
};

window.processCryptoSelection = function(cryptocurrency, firstName, lastName, email, password, passwordConfirm, phone, company) {
    const missingFields = [];
    if (!firstName) missingFields.push('First Name');
    if (!lastName) missingFields.push('Last Name');
    if (!email) missingFields.push('Email');
    if (!password) missingFields.push('Password');
    if (!passwordConfirm) missingFields.push('Confirm Password');
    if (!phone) missingFields.push('Phone');
    
    if (missingFields.length > 0) {
        showPaymentToast(toastT('fillFollowingFields', {fields: missingFields.join(', ')}) || 'Please fill in the following fields: ' + missingFields.join(', ') + '. Make sure you scroll up and fill in ALL the form fields.', 'warning');
        const modals = document.querySelectorAll('body > div');
        modals.forEach(function(modal) { if (modal.innerHTML && modal.innerHTML.includes('Select Cryptocurrency')) modal.remove(); });
        const firstNameEl = document.getElementById('customerFirstName');
        if (firstNameEl) firstNameEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
    }

    if (password !== passwordConfirm) {
        showPaymentToast(toastT('passwordsNoMatch') || 'Passwords do not match', 'error');
        const modals = document.querySelectorAll('body > div');
        modals.forEach(function(modal) { if (modal.innerHTML && modal.innerHTML.includes('Select Cryptocurrency')) modal.remove(); });
        return;
    }

    if (password.length < 8) {
        showPaymentToast(toastT('passwordMinLength') || 'Password must be at least 8 characters', 'error');
        const modals = document.querySelectorAll('body > div');
        modals.forEach(function(modal) { if (modal.innerHTML && modal.innerHTML.includes('Select Cryptocurrency')) modal.remove(); });
        return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showPaymentToast(toastT('invalidEmail') || 'Please enter a valid email address', 'error');
        const modals = document.querySelectorAll('body > div');
        modals.forEach(function(modal) { if (modal.innerHTML && modal.innerHTML.includes('Select Cryptocurrency')) modal.remove(); });
        return;
    }
    
    // Close the selection modal
    const modals = document.querySelectorAll('body > div');
    modals.forEach(function(modal) { if (modal.innerHTML && modal.innerHTML.includes('Select Cryptocurrency')) modal.remove(); });

    if (window.stripeProcessor) {
        window.stripeProcessor.createCryptoPaymentRequestWithData(cryptocurrency, {
            firstName, lastName, email, password, phone, company
        });
    } else {
        showPaymentToast(toastT('paymentInitializing') || 'Payment system initializing. Please try again in a moment.', 'info');
    }
};
