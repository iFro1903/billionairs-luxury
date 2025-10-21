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

        // Get customer information from common form fields
        const fullNameInput = document.getElementById('customerName');
        const emailInput = document.getElementById('customerEmail');
        const phoneInput = document.getElementById('customerPhone');
        const companyInput = document.getElementById('customerCompany');

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
                border: 1px solid rgba(232, 180, 160, 0.3);
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.8);
            ">
                <h2 style="
                    font-family: 'Playfair Display', serif;
                    font-size: 2rem;
                    color: #E8B4A0;
                    margin-bottom: 1rem;
                    text-align: center;
                ">Bank Wire Transfer Details</h2>
                
                <p style="
                    color: rgba(255, 255, 255, 0.7);
                    text-align: center;
                    margin-bottom: 2rem;
                    font-size: 0.9rem;
                ">Please use the following details to complete your wire transfer</p>

                <div style="
                    background: rgba(232, 180, 160, 0.05);
                    border-left: 3px solid #E8B4A0;
                    padding: 1.5rem;
                    border-radius: 8px;
                    margin-bottom: 1.5rem;
                ">
                    <div style="margin-bottom: 1rem;">
                        <strong style="color: #E8B4A0;">Amount:</strong>
                        <span style="color: #ffffff; font-size: 1.2rem; margin-left: 1rem;">${bankDetails.amount}</span>
                    </div>
                    <div style="margin-bottom: 1rem;">
                        <strong style="color: #E8B4A0;">Bank Name:</strong>
                        <span style="color: rgba(255, 255, 255, 0.9); margin-left: 1rem;">${bankDetails.bankName}</span>
                    </div>
                    <div style="margin-bottom: 1rem;">
                        <strong style="color: #E8B4A0;">Account Holder:</strong>
                        <span style="color: rgba(255, 255, 255, 0.9); margin-left: 1rem;">${bankDetails.accountHolder}</span>
                    </div>
                    <div style="margin-bottom: 1rem;">
                        <strong style="color: #E8B4A0;">IBAN:</strong>
                        <span style="color: rgba(255, 255, 255, 0.9); margin-left: 1rem; font-family: monospace;">${bankDetails.iban}</span>
                    </div>
                    <div style="margin-bottom: 1rem;">
                        <strong style="color: #E8B4A0;">SWIFT/BIC:</strong>
                        <span style="color: rgba(255, 255, 255, 0.9); margin-left: 1rem; font-family: monospace;">${bankDetails.swift}</span>
                    </div>
                    <div style="margin-bottom: 1rem;">
                        <strong style="color: #E8B4A0;">Reference:</strong>
                        <span style="color: #FF6B6B; margin-left: 1rem; font-weight: 700; font-family: monospace;">${bankDetails.reference}</span>
                    </div>
                    <div style="margin-bottom: 0;">
                        <strong style="color: #E8B4A0;">Bank Address:</strong>
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

                <button onclick="window.location.href = '/create-account.html'" style="
                    width: 100%;
                    padding: 1rem;
                    background: #E8B4A0;
                    color: #000000;
                    border: none;
                    border-radius: 8px;
                    font-weight: 700;
                    font-size: 0.9rem;
                    letter-spacing: 2px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                " onmouseover="this.style.background='#F5D4C1'" onmouseout="this.style.background='#E8B4A0'">
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

    async createCryptoPaymentRequest(cryptocurrency) {
        if (this.isProcessing) {
            console.log('Request already in progress...');
            return;
        }

        // Get customer information from form
        const fullNameElement = document.getElementById('customerName');
        const emailElement = document.getElementById('customerEmail');
        const phoneElement = document.getElementById('customerPhone');
        const companyElement = document.getElementById('customerCompany');

        console.log('🔍 Field Elements:', {
            fullName: fullNameElement,
            email: emailElement,
            phone: phoneElement,
            fullNameValue: fullNameElement?.value,
            emailValue: emailElement?.value,
            phoneValue: phoneElement?.value
        });

        const fullName = fullNameElement?.value?.trim();
        const email = emailElement?.value?.trim();
        const phone = phoneElement?.value?.trim();
        const company = companyElement?.value?.trim();

        // Validate required fields
        if (!fullName || !email || !phone) {
            console.error('❌ Validation failed:', { fullName, email, phone });
            alert('Please fill in all required fields (Name, Email, Phone)');
            return;
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            alert('Please enter a valid email address');
            return;
        }

        await this.createCryptoPaymentRequestWithData(cryptocurrency, { fullName, email, phone, company });
    }

    async createCryptoPaymentRequestWithData(cryptocurrency, customerData) {
        if (this.isProcessing) {
            console.log('Request already in progress...');
            return;
        }

        const { fullName, email, phone, company } = customerData;

        console.log('✅ Creating crypto payment with validated data:', { fullName, email, phone, cryptocurrency });

        this.isProcessing = true;

        try {
            console.log('🪙 Creating crypto payment request:', { fullName, email, phone, cryptocurrency });

            const response = await fetch('/api/crypto-payment', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    fullName,
                    email,
                    phone,
                    company,
                    cryptocurrency
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to create crypto payment request');
            }

            const data = await response.json();
            console.log('✅ Crypto payment request created:', data);

            // Show crypto wallet modal
            this.showCryptoWalletModal(data);

        } catch (error) {
            console.error('Crypto payment error:', error);
            alert('Failed to create crypto payment request. Please try again.');
        } finally {
            this.isProcessing = false;
        }
    }

    showCryptoWalletModal(data) {
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
            overflow-y: auto;
        `;

        modal.innerHTML = `
            <div style="
                background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%);
                border: 2px solid #E8B4A0;
                border-radius: 12px;
                padding: 3rem;
                max-width: 600px;
                width: 100%;
                position: relative;
                box-shadow: 0 20px 60px rgba(232, 180, 160, 0.3);
            ">
                <h2 style="
                    font-family: 'Playfair Display', serif;
                    font-size: 2rem;
                    color: #E8B4A0;
                    text-align: center;
                    margin-bottom: 0.5rem;
                    font-weight: 700;
                ">${data.wallet.symbol} ${data.cryptocurrency} Payment</h2>
                
                <p style="
                    text-align: center;
                    color: rgba(255, 255, 255, 0.7);
                    font-size: 0.9rem;
                    margin-bottom: 2rem;
                ">CHF 500'000.00</p>

                <div style="
                    text-align: center;
                    margin: 2rem 0;
                    padding: 2rem;
                    background: rgba(255, 255, 255, 0.95);
                    border-radius: 12px;
                    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
                ">
                    <img src="${data.wallet.qrCode}" alt="QR Code" style="
                        width: 300px;
                        height: 300px;
                        border: 4px solid #E8B4A0;
                        border-radius: 12px;
                        display: block;
                        margin: 0 auto;
                    " onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
                    <div style="display: none; color: #FF6B6B; padding: 2rem; font-size: 0.9rem;">
                        ⚠️ QR Code could not be loaded. Please copy the wallet address manually.
                    </div>
                </div>

                <div style="
                    background: rgba(232, 180, 160, 0.1);
                    border: 2px dashed #E8B4A0;
                    border-radius: 8px;
                    padding: 1rem;
                    margin: 1.5rem 0;
                    text-align: center;
                ">
                    <p style="
                        color: rgba(255, 255, 255, 0.7);
                        font-size: 0.75rem;
                        text-transform: uppercase;
                        letter-spacing: 1px;
                        margin-bottom: 0.5rem;
                    ">Wallet Address</p>
                    <p style="
                        color: #E8B4A0;
                        font-family: 'Courier New', monospace;
                        font-size: 0.85rem;
                        font-weight: 700;
                        word-break: break-all;
                        letter-spacing: 0.5px;
                    ">${data.wallet.address}</p>
                </div>

                <div style="
                    background: rgba(0, 0, 0, 0.3);
                    border-radius: 8px;
                    padding: 1.5rem;
                    margin: 1.5rem 0;
                ">
                    <div style="display: flex; justify-content: space-between; padding: 0.75rem 0; border-bottom: 1px solid rgba(232, 180, 160, 0.2);">
                        <span style="color: rgba(255, 255, 255, 0.6); font-size: 0.85rem;">Network</span>
                        <span style="color: #ffffff; font-weight: 600; font-size: 0.85rem;">${data.wallet.network}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; padding: 0.75rem 0; border-bottom: 1px solid rgba(232, 180, 160, 0.2);">
                        <span style="color: rgba(255, 255, 255, 0.6); font-size: 0.85rem;">Amount (CHF)</span>
                        <span style="color: #E8B4A0; font-weight: 700; font-size: 0.9rem;">${data.amount.chf}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; padding: 0.75rem 0;">
                        <span style="color: rgba(255, 255, 255, 0.6); font-size: 0.85rem;">Reference</span>
                        <span style="color: #ffffff; font-weight: 600; font-size: 0.85rem;">${data.reference}</span>
                    </div>
                </div>

                <div style="
                    background: rgba(255, 59, 48, 0.1);
                    border-left: 4px solid #FF3B30;
                    padding: 1rem;
                    margin: 1.5rem 0;
                    border-radius: 4px;
                ">
                    <p style="color: #FF3B30; font-weight: 700; font-size: 0.85rem; margin-bottom: 0.5rem;">⚠️ IMPORTANT</p>
                    <ul style="color: rgba(255, 255, 255, 0.8); font-size: 0.8rem; line-height: 1.6; margin: 0; padding-left: 1.5rem;">
                        <li>Double-check the wallet address</li>
                        <li>Only use ${data.wallet.network} network</li>
                        <li>Transactions are irreversible</li>
                        <li>Email us the transaction hash</li>
                    </ul>
                </div>

                <button onclick="
                    console.log('🧹 Crypto payment noted - redirecting to account setup');
                    // Reset processing flag
                    if (window.stripeProcessor) {
                        window.stripeProcessor.isProcessing = false;
                        console.log('✅ Reset isProcessing flag');
                    }
                    // Redirect to account creation
                    window.location.href = '/create-account.html';
                " style="
                    width: 100%;
                    padding: 1rem 2rem;
                    background: linear-gradient(135deg, #E8B4A0 0%, #D4A574 100%);
                    color: rgba(0,0,0,0.9);
                    border: none;
                    border-radius: 6px;
                    font-weight: 700;
                    font-size: 0.9rem;
                    letter-spacing: 2px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    margin-top: 1rem;
                " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 10px 30px rgba(232, 180, 160, 0.4)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none'">
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
                <p class="success-note">Redirecting to account setup...</p>
            </div>
        `;
        
        document.body.appendChild(successOverlay);
        
        // Redirect to account creation page after animation
        setTimeout(() => {
            window.location.href = '/create-account.html';
        }, 3000);
    }
}

// Initialize Stripe processor
const stripeProcessor = new StripePaymentProcessor();

// Export for global access
window.stripeProcessor = stripeProcessor;