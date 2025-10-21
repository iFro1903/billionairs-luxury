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
            'bank': 'bankPaymentForm',
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

            case 'bank':
                // SEPA Direct Debit - No transaction limit
                data.paymentMethodTypes = ['sepa_debit'];
                data.description = 'SEPA Direct Debit - 500,000 CHF';
                data.metadata = {
                    payment_tier: 'millionaire',
                    supports_amount: 'unlimited',
                    processing_time: '3-5_business_days',
                    processing_note: 'SEPA has no fixed limits - perfect for large amounts'
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
            bank: {
                name: 'SEPA Direct Debit',
                supports_500k: true,
                limit: 'Unlimited',
                processing_time: '3-5 business days',
                note: 'No fixed limit - ideal for large transactions',
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
        
        // Collect form data
        const fullName = document.getElementById('cryptoFullName')?.value;
        const email = document.getElementById('cryptoEmail')?.value;
        const wallet = document.getElementById('cryptoWallet')?.value;

        if (!fullName || !email) {
            alert('Please fill in all required fields for crypto payment');
            return;
        }

        const cryptoNames = {
            'btc': 'Bitcoin (BTC)',
            'eth': 'Ethereum (ETH)',
            'usdt': 'Tether (USDT)'
        };

        // In production, this would send data to your server
        const cryptoPaymentData = {
            ...paymentData,
            customer: {
                fullName,
                email,
                wallet: wallet || 'Not provided'
            }
        };

        console.log('Crypto payment request:', cryptoPaymentData);
        
        // Show confirmation message
        alert(`✓ Crypto Payment Request Received

Thank you, ${fullName}!

Payment Details:
• Currency: ${cryptoNames[this.selectedCrypto]}
• Amount: 500,000 CHF

You will receive via email at ${email}:
• Crypto wallet address
• Exact amount in ${cryptoNames[this.selectedCrypto]}
• Payment reference ID
• Real-time exchange rate (valid for 30 minutes)

⚡ Fast processing: Access granted within 10-60 minutes after blockchain confirmation!

${wallet ? '✓ Refund address saved' : '💡 Tip: Add your wallet address for faster refunds if needed'}`);

        return cryptoPaymentData;
    }

    async handleWireTransfer(paymentData) {
        // For wire transfers, we collect information and send bank details
        console.log('🏛️ Processing wire transfer request...');
        
        // Collect form data
        const fullName = document.getElementById('wireFullName')?.value;
        const email = document.getElementById('wireEmail')?.value;
        const phone = document.getElementById('wirePhone')?.value;
        const company = document.getElementById('wireCompany')?.value;

        if (!fullName || !email || !phone) {
            alert('Please fill in all required fields for wire transfer');
            return;
        }

        // In production, this would send data to your server
        const wireTransferData = {
            ...paymentData,
            customer: {
                fullName,
                email,
                phone,
                company
            }
        };

        console.log('Wire transfer request:', wireTransferData);
        
        // Show confirmation message
        alert(`✓ Wire Transfer Request Received

Thank you, ${fullName}!

You will receive our bank account details at:
${email}

Amount: 500,000 CHF

Our team will contact you within 1 hour with:
• Bank account details
• Transfer reference number
• Payment instructions

Please keep your phone ${phone} available.`);

        return wireTransferData;
    }
}

// Initialize payment method selector
document.addEventListener('DOMContentLoaded', () => {
    window.paymentMethodSelector = new PaymentMethodSelector();
    console.log('✓ Payment Method Selector initialized for 500K CHF transactions');
});

// Export for global access
window.PaymentMethodSelector = PaymentMethodSelector;
