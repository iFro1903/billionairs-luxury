// Payment Method Selector Logic - Optimized for 500K CHF Transactions
class PaymentMethodSelector {
    constructor() {
        this.selectedMethod = 'card'; // Default: Credit Card
        this.selectedCrypto = 'btc'; // Default crypto: Bitcoin
        this.init();
    }

    init() {
        // Payment method selection
        const paymentMethods = document.querySelectorAll('.payment-method');
        paymentMethods.forEach(method => {
            method.addEventListener('click', (e) => {
                this.selectPaymentMethod(e.currentTarget.dataset.method);
            });
        });

        // Crypto currency selection
        const cryptoOptions = document.querySelectorAll('.crypto-option');
        cryptoOptions.forEach(option => {
            option.addEventListener('click', (e) => {
                this.selectCrypto(e.currentTarget.dataset.crypto);
            });
        });
    }

    selectCrypto(crypto) {
        // Update active crypto
        document.querySelectorAll('.crypto-option').forEach(opt => opt.classList.remove('active'));
        const selectedElement = document.querySelector(`[data-crypto="${crypto}"]`);
        if (selectedElement) {
            selectedElement.classList.add('active');
        }
        this.selectedCrypto = crypto;
        console.log('✓ Selected cryptocurrency:', crypto);
    }

    selectPaymentMethod(method) {
        // Update active payment method
        document.querySelectorAll('.payment-method').forEach(pm => pm.classList.remove('active'));
        const selectedElement = document.querySelector(`[data-method="${method}"]`);
        if (selectedElement) {
            selectedElement.classList.add('active');
        }

        // Show/hide payment form sections
        document.querySelectorAll('.payment-form-section').forEach(section => {
            section.classList.remove('active');
        });

        const sectionMap = {
            'card': 'cardPaymentForm',
            'wire': 'wirePaymentForm',
            'crypto': 'cryptoPaymentForm'
        };

        const sectionId = sectionMap[method];
        if (sectionId) {
            const section = document.getElementById(sectionId);
            if (section) {
                section.classList.add('active');
            }
        }

        this.selectedMethod = method;
        console.log('✓ Selected payment method for 500K CHF:', method);
    }

    getSelectedPaymentData() {
        const data = {
            method: this.selectedMethod,
            amount: 50000000, // 500,000 CHF in cents
            currency: 'chf'
        };

        switch (this.selectedMethod) {
            case 'card':
                // Credit/Debit Card - Supports high amounts with bank authorization
                data.paymentMethodTypes = ['card'];
                data.description = 'Premium Card Payment - 500,000 CHF';
                data.metadata = {
                    payment_tier: 'millionaire',
                    supports_amount: '500000_chf',
                    processing_note: 'May require bank authorization for amount'
                };
                break;

            case 'wire':
                // Manual Bank Wire Transfer - Unlimited
                data.paymentMethodTypes = ['wire_transfer'];
                data.description = 'Bank Wire Transfer - 500,000 CHF';
                data.requiresManualProcessing = true;
                data.metadata = {
                    payment_tier: 'millionaire',
                    supports_amount: 'unlimited',
                    processing_type: 'manual_wire_transfer',
                    processing_note: 'Bank details will be provided via email'
                };
                break;

            case 'crypto':
                // Cryptocurrency - Unlimited, Fast
                data.paymentMethodTypes = ['crypto'];
                data.description = `Cryptocurrency Payment (${this.selectedCrypto.toUpperCase()}) - 500,000 CHF`;
                data.requiresManualProcessing = true;
                data.selectedCrypto = this.selectedCrypto;
                data.metadata = {
                    payment_tier: 'millionaire',
                    supports_amount: 'unlimited',
                    processing_type: 'cryptocurrency',
                    crypto_currency: this.selectedCrypto,
                    processing_time: '10-60_minutes',
                    processing_note: 'Crypto address will be provided via email'
                };
                break;
        }

        return data;
    }

    // Get payment method capabilities and limits
    getPaymentMethodInfo() {
        const info = {
            card: {
                name: 'Credit/Debit Card',
                supports_500k: true,
                limit: 'Variable (bank-dependent)',
                processing_time: 'Instant',
                note: 'Requires bank authorization for high amounts',
                recommended: true
            },
            wire: {
                name: 'Bank Wire Transfer',
                supports_500k: true,
                limit: 'Unlimited',
                processing_time: '1-2 business days',
                note: 'Most secure for very large amounts',
                recommended: true
            },
            crypto: {
                name: 'Cryptocurrency',
                supports_500k: true,
                limit: 'Unlimited',
                processing_time: '10-60 minutes',
                note: 'Fast, private, and popular with tech millionaires',
                recommended: true,
                currencies: ['Bitcoin (BTC)', 'Ethereum (ETH)', 'Tether (USDT)']
            }
        };

        return info[this.selectedMethod] || {};
    }

    // Integration with existing Stripe processor
    async initiatePayment() {
        const paymentData = this.getSelectedPaymentData();
        const methodInfo = this.getPaymentMethodInfo();

        console.log('💰 Initiating payment:', {
            method: this.selectedMethod,
            amount: '500,000 CHF',
            ...methodInfo
        });

        if (this.selectedMethod === 'wire') {
            // Handle wire transfer separately (manual processing)
            return this.handleWireTransfer(paymentData);
        }

        if (this.selectedMethod === 'crypto') {
            // Handle crypto payment separately (manual processing)
            return this.handleCryptoPayment(paymentData);
        }
        
        if (window.stripeProcessor) {
            // Update Stripe processor with selected payment methods
            await window.stripeProcessor.createCheckoutSession('full', paymentData);
        } else {
            console.error('❌ Stripe processor not available');
            throw new Error('Payment processor not initialized');
        }
    }

    async handleCryptoPayment(paymentData) {
        // For crypto payments, we collect information and send wallet address
        console.log('₿ Processing crypto payment request...');
        
        // Collect form data from common customer fields
        const firstName = document.getElementById('customerFirstName')?.value || '';
        const lastName = document.getElementById('customerLastName')?.value || '';
        const fullName = `${firstName} ${lastName}`.trim();
        const email = document.getElementById('customerEmail')?.value;
        const phone = document.getElementById('customerPhone')?.value;
        const company = document.getElementById('customerCompany')?.value || '';
        const password = document.getElementById('customerPassword')?.value;
        const passwordConfirm = document.getElementById('customerPasswordConfirm')?.value;

        // Validate required fields
        if (!fullName || !email || !phone || !password) {
            alert('Please fill in all required fields for crypto payment (First Name, Last Name, Email, Phone, Password)');
            return;
        }

        // Validate password length
        if (password.length < 8) {
            alert('Password must be at least 8 characters long');
            return;
        }

        // Validate password confirmation
        if (password !== passwordConfirm) {
            alert('Passwords do not match. Please check and try again.');
            return;
        }

        const cryptoNames = {
            'btc': 'Bitcoin (BTC)',
            'eth': 'Ethereum (ETH)',
            'usdt': 'Tether (USDT)'
        };

        // Get selected crypto (default to BTC if not selected)
        const selectedCrypto = this.selectedCrypto || 'btc';

        // In production, this would send data to your server
        const cryptoPaymentData = {
            ...paymentData,
            customer: {
                fullName,
                email,
                phone,
                company,
                password
            },
            cryptocurrency: selectedCrypto
        };

        console.log('Crypto payment request:', cryptoPaymentData);
        
        // Show confirmation message
        alert(`✓ Crypto Payment Request Received

Thank you, ${fullName}!

Payment Details:
• Currency: ${cryptoNames[selectedCrypto]}
• Amount: 500,000 CHF

You will receive via email at ${email}:
• Crypto wallet address
• Exact amount in ${cryptoNames[selectedCrypto]}
• Payment reference ID
• Real-time exchange rate (valid for 30 minutes)

⚡ Fast processing: Access granted within 10-60 minutes after blockchain confirmation!

💡 Note: Your account has been created. You can login at login.html after payment confirmation.`);

        return cryptoPaymentData;
    }

    async handleWireTransfer(paymentData) {
        // For wire transfers, we collect information and send bank details
        console.log('🏛️ Processing wire transfer request...');
        
        // Collect form data from common fields
        const firstName = document.getElementById('customerFirstName')?.value || '';
        const lastName = document.getElementById('customerLastName')?.value || '';
        const fullName = `${firstName} ${lastName}`.trim();
        const email = document.getElementById('customerEmail')?.value;
        const phone = document.getElementById('customerPhone')?.value;
        const company = document.getElementById('customerCompany')?.value || '';
        const password = document.getElementById('customerPassword')?.value;
        const passwordConfirm = document.getElementById('customerPasswordConfirm')?.value;

        // Validate required fields
        if (!fullName || !email || !phone || !password) {
            alert('Please fill in all required fields for wire transfer (First Name, Last Name, Email, Phone, Password)');
            return;
        }

        // Validate password length
        if (password.length < 8) {
            alert('Password must be at least 8 characters long');
            return;
        }

        // Validate password confirmation
        if (password !== passwordConfirm) {
            alert('Passwords do not match. Please check and try again.');
            return;
        }

        try {
            // Show loading indicator
            const loadingMsg = document.createElement('div');
            loadingMsg.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:rgba(0,0,0,0.9);color:#fff;padding:2rem;border-radius:10px;z-index:10000;text-align:center;';
            loadingMsg.innerHTML = '<div style="font-size:2rem;margin-bottom:1rem;">⏳</div><div>Processing wire transfer request...</div>';
            document.body.appendChild(loadingMsg);

            // Call wire transfer API
            const response = await fetch('/api/wire-transfer', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    fullName,
                    email,
                    phone,
                    company,
                    password
                })
            });

            const result = await response.json();
            
            // Remove loading indicator
            document.body.removeChild(loadingMsg);

            if (response.ok) {
                // Success - show bank details
                alert(`✓ Wire Transfer Details Sent!

Thank you, ${fullName}!

📧 Check your email: ${email}

You will receive:
• Complete bank account details
• Reference number for your transfer  
• Step-by-step payment instructions

Amount: CHF 500,000.00

⏱️ Access granted within 24 hours of receiving your transfer.

Please keep your phone ${phone} available for verification.`);

                // Redirect to success page or dashboard
                setTimeout(() => {
                    window.location.href = '/login.html?registered=true';
                }, 3000);
            } else {
                // Error - show message
                alert(`❌ Error: ${result.message || 'Failed to process wire transfer request'}\n\nPlease try again or contact support.`);
            }

            return result;

        } catch (error) {
            console.error('Wire transfer error:', error);
            alert('❌ Network error. Please check your connection and try again.');
            throw error;
        }
    }
}

// Initialize payment method selector
document.addEventListener('DOMContentLoaded', () => {
    window.paymentMethodSelector = new PaymentMethodSelector();
    console.log('✓ Payment Method Selector initialized for 500K CHF transactions');
});

// Export for global access
window.PaymentMethodSelector = PaymentMethodSelector;
