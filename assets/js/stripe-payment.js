// Stripe Configuration for BILLIONAIRS 500K CHF Payment - Millionaire Tier
class StripePaymentProcessor {
    constructor() {
        // Initialize Stripe with your test key
        this.stripe = Stripe('pk_test_51SJwwa8C64nNqkP2Qk3kpiNiNt167qAvG3i1ra3RGryHjEifqgqyOJxdToYzHnMuEMEGcMxUJP9Qyi8ro6sL4xcS007RY811CQ');
        this.priceId = 'price_1234567890_REPLACE_WITH_YOUR_PRICE_ID'; // 500,000 CHF
        this.isProcessing = false;
        
        // Millionaire-specific configuration
        this.paymentTiers = {
            full: 50000000,      // 500,000 CHF - For liquid millionaires
            split: 25000000,     // 250,000 CHF - Split payment option
            corporate: 50000000  // 500,000 CHF - Corporate/Business accounts
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
            const response = await fetch('http://localhost:3000/create-checkout-session', {
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

            if (!session.id) {
                console.error('❌ No session ID:', session);
                throw new Error('No session ID received from server');
            }

            console.log('🚀 Redirecting to Stripe Checkout...');
            
            // Redirect to Stripe Checkout
            const result = await this.stripe.redirectToCheckout({
                sessionId: session.id
            });

            if (result.error) {
                throw new Error(result.error.message);
            }

        } catch (error) {
            console.error('Payment Error:', error);
            this.showPaymentError(error.message);
        } finally {
            this.isProcessing = false;
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
                paymentButton.innerHTML = 'SECURE PAYMENT - 500,000 CHF';
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