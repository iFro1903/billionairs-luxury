// Stripe Configuration for BILLIONAIRS - 500K CHF (Price revealed only at checkout)
class StripePaymentProcessor {
    constructor() {
        // Initialize Stripe with your test key
        this.stripe = Stripe('pk_test_51SJwwa8C64nNqkP2Qk3kpiNiNt167qAvG3i1ra3RGryHjEifqgqyOJxdToYzHnMuEMEGcMxUJP9Qyi8ro6sL4xcS007RY811CQ');
        this.priceId = 'price_1234567890_REPLACE_WITH_YOUR_PRICE_ID'; // 500,000 CHF
        this.isProcessing = false;
        
        // Actual pricing - 500K CHF (only visible at Stripe Checkout)
        this.paymentTiers = {
            full: 50000000,      // 500,000 CHF - Exclusive access
            split: 25000000,     // 250,000 CHF - Split payment option
            corporate: 50000000  // 500,000 CHF - Corporate accounts
        };
    }

    async createCheckoutSession(paymentType = 'full') {
        if (this.isProcessing) {
            console.log('Payment already in progress...');
            return;
        }

        this.isProcessing = true;
        
        try {
            // Show loading state
            this.showPaymentLoading();

            const amount = this.paymentTiers[paymentType];
            
            console.log('💳 Starting payment process:', {
                amount,
                paymentType,
                currency: 'chf'
            });
            
            // Create checkout session with millionaire-optimized settings
            const response = await fetch('/api/stripe-checkout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    priceId: this.priceId,
                    mode: 'payment',
                    currency: 'chf',
                    amount: amount,
                    paymentType: paymentType,
                    metadata: {
                        product: 'BILLIONAIRS_EXCLUSIVE_ACCESS',
                        tier: 'MILLIONAIRE_SEGMENT',
                        payment_type: paymentType,
                        timestamp: new Date().toISOString(),
                        user_agent: navigator.userAgent,
                        referrer: document.referrer || 'direct'
                    }
                })
            });

            console.log('📡 Response status:', response.status);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ Server error:', errorText);
                throw new Error(`Server error: ${response.status} - ${errorText}`);
            }

            const session = await response.json();
            console.log('✅ Session created:', session);

            if (session.error) {
                console.error('❌ Session error:', session.error);
                throw new Error(session.error);
            }

            if (!session.url) {
                console.error('❌ No session URL:', session);
                throw new Error('No checkout URL received from server');
            }

            console.log('🚀 Redirecting to Stripe Checkout...');
            
            // Direct redirect to Stripe Checkout URL (modern method)
            window.location.href = session.url;

        } catch (error) {
            console.error('Payment Error:', error);
            this.showPaymentError(error.message);
        } finally {
            this.isProcessing = false;
        }
    }

    async createWireTransferRequest() {
        if (this.isProcessing) {
            console.log('Request already in progress...');
            return;
        }

        // Get customer information from form
        const fullNameInput = document.getElementById('wireFullName');
        const emailInput = document.getElementById('wireEmail');
        const phoneInput = document.getElementById('wirePhone');
        const companyInput = document.getElementById('wireCompany');

        if (!fullNameInput || !emailInput || !phoneInput) {
            this.showPaymentError('Please fill in all required fields');
            return;
        }

        const fullName = fullNameInput.value.trim();
        const email = emailInput.value.trim();
        const phone = phoneInput.value.trim();
        const company = companyInput ? companyInput.value.trim() : '';

        // Validation
        if (!fullName || !email || !phone) {
            this.showPaymentError('Please fill in all required fields');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            this.showPaymentError('Please enter a valid email address');
            return;
        }

        this.isProcessing = true;

        try {
            this.showPaymentLoading();

            console.log('🏦 Starting Wire Transfer Request:', { fullName, email, phone, company });

            const response = await fetch('/api/wire-transfer', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    fullName,
                    email,
                    phone,
                    company
                })
            });

            console.log('📡 Wire Transfer Response status:', response.status);

            if (!response.ok) {
                const errorData = await response.json();
                console.error('❌ Wire Transfer error:', errorData);
                throw new Error(errorData.message || 'Wire transfer request failed');
            }

            const result = await response.json();
            console.log('✅ Wire Transfer Request successful:', result);

            // Show bank details in a modal or alert
            this.showBankDetailsModal(result.bankDetails, result.instructions);

        } catch (error) {
            console.error('Wire Transfer Error:', error);
            this.showPaymentError(error.message);
        } finally {
            this.isProcessing = false;
        }
    }

    showBankDetailsModal(bankDetails, instructions) {
        // Create a beautiful modal with bank details
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.95);
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 2rem;
        `;

        modal.innerHTML = `
            <div style="
                background: linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%);
                padding: 3rem;
                border-radius: 16px;
                max-width: 600px;
                width: 100%;
                border: 1px solid rgba(212, 175, 55, 0.3);
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.8);
            ">
                <h2 style="
                    font-family: 'Playfair Display', serif;
                    font-size: 2rem;
                    color: #D4AF37;
                    margin-bottom: 1rem;
                    text-align: center;
                ">🏦 Bank Wire Transfer Details</h2>
                
                <p style="
                    color: rgba(255, 255, 255, 0.7);
                    text-align: center;
                    margin-bottom: 2rem;
                    font-size: 0.9rem;
                ">Please use the following details to complete your wire transfer</p>

                <div style="
                    background: rgba(212, 175, 55, 0.05);
                    border-left: 3px solid #D4AF37;
                    padding: 1.5rem;
                    border-radius: 8px;
                    margin-bottom: 1.5rem;
                ">
                    <div style="margin-bottom: 1rem;">
                        <strong style="color: #D4AF37;">Amount:</strong>
                        <span style="color: #ffffff; font-size: 1.2rem; margin-left: 1rem;">${bankDetails.amount}</span>
                    </div>
                    <div style="margin-bottom: 1rem;">
                        <strong style="color: #D4AF37;">Bank Name:</strong>
                        <span style="color: rgba(255, 255, 255, 0.9); margin-left: 1rem;">${bankDetails.bankName}</span>
                    </div>
                    <div style="margin-bottom: 1rem;">
                        <strong style="color: #D4AF37;">Account Holder:</strong>
                        <span style="color: rgba(255, 255, 255, 0.9); margin-left: 1rem;">${bankDetails.accountHolder}</span>
                    </div>
                    <div style="margin-bottom: 1rem;">
                        <strong style="color: #D4AF37;">IBAN:</strong>
                        <span style="color: rgba(255, 255, 255, 0.9); margin-left: 1rem; font-family: monospace;">${bankDetails.iban}</span>
                    </div>
                    <div style="margin-bottom: 1rem;">
                        <strong style="color: #D4AF37;">SWIFT/BIC:</strong>
                        <span style="color: rgba(255, 255, 255, 0.9); margin-left: 1rem; font-family: monospace;">${bankDetails.swift}</span>
                    </div>
                    <div style="margin-bottom: 1rem;">
                        <strong style="color: #D4AF37;">Reference:</strong>
                        <span style="color: #FF6B6B; margin-left: 1rem; font-weight: 700; font-family: monospace;">${bankDetails.reference}</span>
                    </div>
                    <div style="margin-bottom: 0;">
                        <strong style="color: #D4AF37;">Bank Address:</strong>
                        <span style="color: rgba(255, 255, 255, 0.9); margin-left: 1rem; font-size: 0.85rem;">${bankDetails.address}</span>
                    </div>
                </div>

                <div style="
                    background: rgba(255, 107, 107, 0.1);
                    border-left: 3px solid #FF6B6B;
                    padding: 1rem;
                    border-radius: 8px;
                    margin-bottom: 2rem;
                ">
                    <strong style="color: #FF6B6B; display: block; margin-bottom: 0.5rem;">⚠️ Important:</strong>
                    ${instructions.map(inst => `
                        <p style="color: rgba(255, 255, 255, 0.8); margin: 0.5rem 0; font-size: 0.85rem;">• ${inst}</p>
                    `).join('')}
                </div>

                <button onclick="this.parentElement.parentElement.remove()" style="
                    width: 100%;
                    padding: 1rem;
                    background: #D4AF37;
                    color: #000000;
                    border: none;
                    border-radius: 8px;
                    font-weight: 700;
                    font-size: 0.9rem;
                    letter-spacing: 2px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                " onmouseover="this.style.background='#E8C55B'" onmouseout="this.style.background='#D4AF37'">
                    I HAVE NOTED THE DETAILS
                </button>

                <p style="
                    text-align: center;
                    color: rgba(255, 255, 255, 0.5);
                    font-size: 0.75rem;
                    margin-top: 1rem;
                ">These details have also been sent to your email address</p>
            </div>
        `;

        document.body.appendChild(modal);

        // Reset payment button
        const paymentButton = document.querySelector('.payment-button');
        if (paymentButton) {
            paymentButton.innerHTML = '<span class="button-text">SECURE PAYMENT</span>';
            paymentButton.disabled = false;
            paymentButton.style.opacity = '1';
        }
    }

    showPaymentLoading() {
        const paymentButton = document.querySelector('.payment-button');
        if (paymentButton) {
            paymentButton.innerHTML = `
                <div class="loading-spinner"></div>
                PROCESSING SECURE PAYMENT...
            `;
            paymentButton.disabled = true;
            paymentButton.style.opacity = '0.7';
        }
    }

    showPaymentError(message) {
        const paymentButton = document.querySelector('.payment-button');
        if (paymentButton) {
            paymentButton.innerHTML = 'PAYMENT ERROR - TRY AGAIN';
            paymentButton.disabled = false;
            paymentButton.style.opacity = '1';
            paymentButton.classList.add('error-state');
            
            // Reset after 3 seconds
            setTimeout(() => {
                paymentButton.innerHTML = '<span class="button-text">SECURE PAYMENT</span>';
                paymentButton.classList.remove('error-state');
            }, 3000);
        }

        // Show user-friendly error message
        this.showErrorModal(message);
    }

    showErrorModal(message) {
        // Create error modal
        const errorModal = document.createElement('div');
        errorModal.className = 'payment-error-modal';
        errorModal.innerHTML = `
            <div class="error-content">
                <div class="error-icon">⚠️</div>
                <h3>Payment Processing Error</h3>
                <p>We encountered an issue processing your payment:</p>
                <p class="error-details">${message}</p>
                <p>Please try again or contact our support team.</p>
                <button class="error-close-btn" onclick="this.parentElement.parentElement.remove()">
                    CLOSE
                </button>
            </div>
        `;
        
        document.body.appendChild(errorModal);
        
        // Auto-remove after 10 seconds
        setTimeout(() => {
            if (errorModal.parentElement) {
                errorModal.remove();
            }
        }, 10000);
    }

    // Payment success handling (called from success page)
    handlePaymentSuccess(sessionId) {
        console.log('Payment successful!', sessionId);
        
        // Track successful payment
        if (typeof gtag !== 'undefined') {
            gtag('event', 'purchase', {
                'transaction_id': sessionId,
                'value': 500000,
                'currency': 'CHF',
                'items': [{
                    'item_id': 'billionairs_access',
                    'item_name': 'BILLIONAIRS Exclusive Access',
                    'category': 'Digital Experience',
                    'quantity': 1,
                    'price': 500000
                }]
            });
        }

        // Show success animation or redirect
        this.showPaymentSuccess();
    }

    showPaymentSuccess() {
        // Create success overlay
        const successOverlay = document.createElement('div');
        successOverlay.className = 'payment-success-overlay';
        successOverlay.innerHTML = `
            <div class="success-content">
                <div class="success-icon">✨</div>
                <h2>PAYMENT SUCCESSFUL</h2>
                <p>Welcome to BILLIONAIRS</p>
                <p>Your exclusive access has been activated.</p>
                <div class="success-divider"></div>
                <p class="success-note">You will receive confirmation shortly.</p>
            </div>
        `;
        
        document.body.appendChild(successOverlay);
        
        // Proceed to timepiece section after animation
        setTimeout(() => {
            successOverlay.remove();
            if (typeof showTimepiece === 'function') {
                showTimepiece();
            }
        }, 4000);
    }
}

// Initialize Stripe processor
const stripeProcessor = new StripePaymentProcessor();

// Export for global access
window.stripeProcessor = stripeProcessor;