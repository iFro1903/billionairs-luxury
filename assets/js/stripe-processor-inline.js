// Inline Stripe Processor - bypasses all caching issues
(function() {
    function initStripe() {
        if (window.stripeProcessor) return;
        if (typeof Stripe === 'undefined') {
            setTimeout(initStripe, 300);
            return;
        }
        try {
            const sp = {
                stripe: Stripe('pk_live_51SJwwF7Fzwybk1NyPjyrV9qkZvmWDkCqsdrmotHypJZnhEIUtnxBea6tV9MMOVkllj9po7RtSIcSwY8JEDQcTPGB00BqlA7hkz'),
                isProcessing: false,
                paymentTiers: { full: 50000000, split: 50000000, corporate: 50000000 },
                createCheckoutSession: async function(paymentType, customerData) {
                    if (this.isProcessing) return;
                    this.isProcessing = true;
                    try {
                        const amount = this.paymentTiers[paymentType || 'full'];
                        const currentLang = localStorage.getItem('billionairs_lang') || 'en';
                        const metadata = {
                            product: 'BILLIONAIRS_EXCLUSIVE_ACCESS',
                            tier: 'MILLIONAIRE_SEGMENT',
                            payment_type: paymentType,
                            timestamp: new Date().toISOString(),
                            language: currentLang
                        };
                        if (customerData) {
                            metadata.customer_name = customerData.fullName;
                            metadata.customer_email = customerData.email;
                            metadata.customer_phone = customerData.phone;
                            if (customerData.company) metadata.customer_company = customerData.company;
                        }
                        const response = await fetch('/api/stripe-checkout', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                mode: 'payment',
                                currency: 'chf',
                                amount: amount,
                                paymentType: paymentType,
                                customerData: customerData,
                                metadata: metadata,
                                language: currentLang
                            })
                        });
                        if (!response.ok) throw new Error('Server error: ' + response.status);
                        const session = await response.json();
                        if (session.error) throw new Error(session.error);
                        if (!session.url) throw new Error('No checkout URL received');
                        sessionStorage.setItem('paymentInitiated', 'true');
                        window.location.href = session.url;
                    } catch (error) {
                        console.error('Payment error:', error.message);
                        const errDiv = document.createElement('div');
                        errDiv.style.cssText = 'position:fixed;top:24px;right:24px;z-index:100000;display:flex;align-items:center;gap:12px;background:linear-gradient(135deg,#2a1a1a,#1f0d0d);border:1.5px solid #c0392b;border-radius:12px;padding:16px 24px;color:#fff;font-family:Montserrat,sans-serif;font-size:14px;box-shadow:0 8px 32px rgba(0,0,0,0.5);max-width:420px;animation:toastIn .4s ease';
                        errDiv.textContent = 'Payment error. Please try again.';
                        document.body.appendChild(errDiv);
                        setTimeout(function(){ errDiv.remove(); }, 5000);
                    } finally {
                        this.isProcessing = false;
                    }
                }
            };
            window.stripeProcessor = sp;
        } catch(e) {
            console.error('Stripe init error:', e);
            setTimeout(initStripe, 1000);
        }
    }
    if (document.readyState === 'complete') {
        initStripe();
    } else {
        window.addEventListener('load', initStripe);
    }
    // Also try immediately
    setTimeout(initStripe, 100);
})();
