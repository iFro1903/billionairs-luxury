// ==================== BILLIONAIRS LUXURY - CRYPTO PAYMENT API ====================
// Handles cryptocurrency payment requests (Bitcoin, Ethereum, USDT)
// Sends ultra-luxury email with wallet addresses and QR codes

// Email sending function using Resend API
async function sendEmail(to, subject, html) {
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    
    if (!RESEND_API_KEY) {
        console.error('RESEND_API_KEY is not configured');
        return false;
    }

    try {
        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${RESEND_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                from: 'BILLIONAIRS LUXURY <onboarding@resend.dev>',
                to: [to],
                subject: subject,
                html: html
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Email sending failed:', errorData);
            return false;
        }

        console.log('Email sent successfully to:', to);
        return true;
    } catch (error) {
        console.error('Email sending error:', error);
        return false;
    }
}

export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { fullName, email, phone, company, cryptocurrency } = req.body;

        // Validate required fields
        if (!fullName || !email || !phone || !cryptocurrency) {
            return res.status(400).json({ 
                error: 'Missing required fields',
                required: ['fullName', 'email', 'phone', 'cryptocurrency']
            });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: 'Invalid email format' });
        }

        // Validate cryptocurrency type
        const validCryptos = ['bitcoin', 'ethereum', 'usdt'];
        if (!validCryptos.includes(cryptocurrency.toLowerCase())) {
            return res.status(400).json({ 
                error: 'Invalid cryptocurrency',
                validOptions: ['bitcoin', 'ethereum', 'usdt']
            });
        }

        // Log the crypto payment request
        console.log('Crypto Payment Request:', {
            fullName,
            email,
            phone,
            company: company || 'N/A',
            cryptocurrency: cryptocurrency.toUpperCase(),
            amount: 'CHF 500\'000.00',
            timestamp: new Date().toISOString()
        });

        // Crypto wallet addresses (REPLACE WITH YOUR REAL WALLETS!)
        const wallets = {
            bitcoin: {
                name: 'Bitcoin (BTC)',
                symbol: '₿',
                address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
                network: 'Bitcoin Mainnet',
                qrCode: 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=bitcoin:1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa?amount=500000'
            },
            ethereum: {
                name: 'Ethereum (ETH)',
                symbol: '<svg width="60" height="60" viewBox="0 0 784 1277" xmlns="http://www.w3.org/2000/svg"><g fill="#B76E79" fill-rule="evenodd"><path d="M392 0l-8.7 29.6v844.5l8.7 8.7 392-231.7z" opacity=".6"/><path d="M392 0L0 651.1l392 231.7V0z"/><path d="M392 956.7l-4.9 6v301.3l4.9 14.3L784 733z" opacity=".6"/><path d="M392 1278.3V956.7L0 733z"/><path d="M392 882.8l392-231.7-392-178.2z" opacity=".2"/><path d="M0 651.1l392 231.7V472.9z" opacity=".6"/></g></svg>',
                address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
                network: 'Ethereum Mainnet (ERC-20)',
                qrCode: 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=ethereum:0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb'
            },
            usdt: {
                name: 'Tether (USDT)',
                symbol: '<svg width="60" height="60" viewBox="0 0 339.43 295.27" xmlns="http://www.w3.org/2000/svg"><path fill="#B76E79" d="M62.15 1.45l-61.89 130a2.52 2.52 0 0 0 .54 2.94l167.15 160.17a2.55 2.55 0 0 0 3.53 0L338.63 134.4a2.52 2.52 0 0 0 .54-2.94l-61.89-130A2.5 2.5 0 0 0 275 0H64.45a2.5 2.5 0 0 0-2.3 1.45z"/><path fill="#fff" d="M191.19 144.8v0c-1.2.09-7.4.46-21.23.46-11 0-18.81-.33-21.55-.46v0c-42.51-1.87-74.24-9.27-74.24-18.13s31.73-16.25 74.24-18.15v28.91c2.78.2 10.74.67 21.74.67 13.2 0 19.81-.55 21-0.66v-28.9c42.42 1.89 74.08 9.29 74.08 18.13s-31.65 16.24-74.08 18.12zm0-39.25V79.68h59.2V40.23H89.21v39.45H148.4v25.86c-48.11 2.21-84.29 11.74-84.29 23.16s36.18 20.94 84.29 23.16v82.9h42.78v-82.93c48-2.21 84.12-11.73 84.12-23.14s-36.09-20.93-84.12-23.15z"/></svg>',
                address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
                network: 'Ethereum (ERC-20) / Tron (TRC-20)',
                qrCode: 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb'
            }
        };

        const selectedWallet = wallets[cryptocurrency.toLowerCase()];
        const reference = `BILLIONAIRS-CRYPTO-${Date.now()}`;

        // Calculate approximate crypto amount (based on current rates - UPDATE REGULARLY!)
        const cryptoRates = {
            bitcoin: '500\'000 / Current BTC Rate',
            ethereum: '500\'000 / Current ETH Rate',
            usdt: '500\'000 USDT'
        };

        // Ultra-luxury HTML email template
        const emailHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700;900&family=Montserrat:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <title>BILLIONAIRS LUXURY - Cryptocurrency Payment</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%);
            color: #ffffff;
            line-height: 1.6;
            padding: 0;
            margin: 0;
        }
        
        .email-container {
            max-width: 700px;
            margin: 0 auto;
            background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%);
        }
        
        .header {
            background: linear-gradient(135deg, #f5f5f5 0%, #ffffff 100%);
            padding: 60px 40px;
            text-align: center;
            border-bottom: 3px solid #B76E79;
        }
        
        .logo-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 15px;
        }
        
        .logo-image {
            width: 140px;
            height: auto;
            filter: drop-shadow(0 4px 12px rgba(183, 110, 121, 0.3));
        }
        
        .logo-text {
            font-family: 'Playfair Display', serif;
            font-size: 48px;
            font-weight: 900;
            letter-spacing: 6px;
            color: #B76E79;
            text-shadow: 0 2px 8px rgba(183, 110, 121, 0.2);
        }
        
        .logo-subtitle {
            font-size: 11px;
            letter-spacing: 4px;
            text-transform: uppercase;
            color: #B76E79;
            font-weight: 600;
            opacity: 0.9;
        }
        
        .hero {
            background: linear-gradient(135deg, rgba(183, 110, 121, 0.1) 0%, rgba(183, 110, 121, 0.05) 100%);
            padding: 60px 40px;
            text-align: center;
            border-bottom: 1px solid rgba(183, 110, 121, 0.2);
        }
        
        .hero-title {
            font-family: 'Playfair Display', serif;
            font-size: 42px;
            font-weight: 700;
            color: #B76E79;
            margin-bottom: 20px;
            letter-spacing: 2px;
            text-shadow: 0 2px 20px rgba(183, 110, 121, 0.3);
        }
        
        .hero-amount {
            font-size: 52px;
            font-weight: 900;
            color: #ffffff;
            margin: 30px 0;
            letter-spacing: 3px;
            text-shadow: 0 0 40px rgba(183, 110, 121, 0.5);
        }
        
        .crypto-symbol {
            color: #B76E79;
            font-size: 60px;
            margin-bottom: 10px;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 70px;
        }
        
        .crypto-symbol svg {
            filter: drop-shadow(0 0 20px rgba(183, 110, 121, 0.5));
        }
        
        .content {
            padding: 50px 40px;
        }
        
        .intro-text {
            font-size: 16px;
            color: rgba(255, 255, 255, 0.9);
            margin-bottom: 40px;
            line-height: 1.8;
            text-align: center;
        }
        
        .wallet-section {
            background: rgba(183, 110, 121, 0.05);
            border: 2px solid rgba(183, 110, 121, 0.3);
            border-radius: 12px;
            padding: 40px;
            margin: 40px 0;
        }
        
        .wallet-title {
            font-family: 'Playfair Display', serif;
            font-size: 28px;
            color: #B76E79;
            margin-bottom: 30px;
            text-align: center;
            font-weight: 700;
        }
        
        .qr-code {
            text-align: center;
            margin: 30px 0;
        }
        
        .qr-code img {
            width: 250px;
            height: 250px;
            border: 4px solid #B76E79;
            border-radius: 12px;
            padding: 15px;
            background: #ffffff;
        }
        
        .wallet-details {
            background: rgba(0, 0, 0, 0.3);
            border-radius: 8px;
            padding: 25px;
            margin: 25px 0;
        }
        
        .detail-row {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            padding: 15px 0;
            border-bottom: 1px solid rgba(183, 110, 121, 0.2);
        }
        
        .detail-row:last-child {
            border-bottom: none;
        }
        
        .detail-label {
            font-size: 13px;
            color: rgba(255, 255, 255, 0.6);
            text-transform: uppercase;
            letter-spacing: 1px;
            font-weight: 600;
            min-width: 140px;
        }
        
        .detail-value {
            font-size: 15px;
            color: #ffffff;
            font-weight: 500;
            text-align: right;
            word-break: break-all;
            flex: 1;
        }
        
        .detail-value.highlight {
            color: #B76E79;
            font-weight: 700;
            font-size: 17px;
        }
        
        .address-box {
            background: rgba(183, 110, 121, 0.1);
            border: 2px dashed #B76E79;
            border-radius: 8px;
            padding: 20px;
            margin: 25px 0;
            text-align: center;
        }
        
        .address-text {
            font-family: 'Courier New', monospace;
            font-size: 14px;
            color: #B76E79;
            font-weight: 700;
            word-break: break-all;
            letter-spacing: 1px;
        }
        
        .reference-box {
            background: linear-gradient(135deg, rgba(183, 110, 121, 0.2) 0%, rgba(183, 110, 121, 0.1) 100%);
            border-radius: 8px;
            padding: 25px;
            margin: 30px 0;
            text-align: center;
        }
        
        .reference-label {
            font-size: 12px;
            color: rgba(255, 255, 255, 0.7);
            text-transform: uppercase;
            letter-spacing: 2px;
            margin-bottom: 10px;
        }
        
        .reference-value {
            font-size: 18px;
            color: #ffffff;
            font-weight: 700;
            letter-spacing: 2px;
        }
        
        .warning-box {
            background: rgba(255, 59, 48, 0.1);
            border-left: 4px solid #FF3B30;
            padding: 25px;
            margin: 30px 0;
            border-radius: 6px;
        }
        
        .warning-title {
            font-size: 16px;
            color: #FF3B30;
            font-weight: 700;
            margin-bottom: 15px;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        
        .warning-list {
            list-style: none;
            padding: 0;
        }
        
        .warning-list li {
            color: rgba(255, 255, 255, 0.9);
            margin: 12px 0;
            padding-left: 25px;
            position: relative;
            font-size: 14px;
            line-height: 1.6;
        }
        
        .warning-list li:before {
            content: "⚠";
            position: absolute;
            left: 0;
            color: #B76E79;
            font-size: 16px;
        }
        
        .steps-section {
            margin: 40px 0;
        }
        
        .steps-title {
            font-family: 'Playfair Display', serif;
            font-size: 24px;
            color: #B76E79;
            margin-bottom: 25px;
            text-align: center;
            font-weight: 700;
        }
        
        .step {
            display: flex;
            align-items: flex-start;
            margin: 20px 0;
            gap: 20px;
        }
        
        .step-number {
            min-width: 45px;
            height: 45px;
            background: linear-gradient(135deg, #B76E79 0%, #9A5A64 100%);
            color: #ffffff;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 700;
            font-size: 20px;
            box-shadow: 0 4px 15px rgba(183, 110, 121, 0.4);
        }
        
        .step-content {
            flex: 1;
            padding-top: 8px;
        }
        
        .step-title {
            font-size: 16px;
            color: #B76E79;
            font-weight: 700;
            margin-bottom: 8px;
        }
        
        .step-description {
            font-size: 14px;
            color: rgba(255, 255, 255, 0.8);
            line-height: 1.6;
        }
        
        .contact-section {
            background: rgba(183, 110, 121, 0.05);
            border-radius: 8px;
            padding: 30px;
            margin: 40px 0;
            text-align: center;
        }
        
        .contact-title {
            font-size: 18px;
            color: #B76E79;
            font-weight: 700;
            margin-bottom: 15px;
        }
        
        .contact-email {
            font-size: 16px;
            color: #B76E79;
            font-weight: 600;
            text-decoration: none;
        }
        
        .footer {
            background: rgba(0, 0, 0, 0.5);
            padding: 40px;
            text-align: center;
            border-top: 1px solid rgba(183, 110, 121, 0.2);
        }
        
        .footer-logo {
            font-family: 'Playfair Display', serif;
            font-size: 24px;
            font-weight: 900;
            letter-spacing: 4px;
            color: #B76E79;
            margin-bottom: 15px;
        }
        
        .footer-text {
            font-size: 12px;
            color: rgba(255, 255, 255, 0.5);
            margin: 10px 0;
        }
        
        @media only screen and (max-width: 600px) {
            .header, .hero, .content {
                padding: 30px 20px !important;
            }
            
            .logo-image {
                width: 100px !important;
            }
            
            .logo-text {
                font-size: 32px !important;
                letter-spacing: 4px !important;
            }
            
            .hero-title {
                font-size: 28px !important;
            }
            
            .hero-amount {
                font-size: 36px !important;
            }
            
            .crypto-symbol {
                font-size: 44px !important;
            }
            
            .wallet-section {
                padding: 25px 20px !important;
            }
            
            .qr-code img {
                width: 200px !important;
                height: 200px !important;
            }
            
            .detail-row {
                flex-direction: column;
                gap: 8px;
            }
            
            .detail-label {
                min-width: 100%;
            }
            
            .detail-value {
                text-align: left !important;
            }
            
            .address-text {
                font-size: 11px !important;
            }
            
            .step {
                gap: 15px;
            }
            
            .step-number {
                min-width: 38px;
                height: 38px;
                font-size: 18px;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <!-- Header with Logo -->
        <div class="header">
            <div class="logo-container">
                <img src="https://billionairs-luxury.vercel.app/assets/images/logo.png" alt="BILLIONAIRS" class="logo-image">
                <div class="logo-text">BILLIONAIRS</div>
                <div class="logo-subtitle">LUXURY REDEFINED</div>
            </div>
        </div>
        
        <!-- Hero Section -->
        <div class="hero">
            <div class="crypto-symbol">${selectedWallet.symbol}</div>
            <h1 class="hero-title">${selectedWallet.name} Payment</h1>
            <div class="hero-amount">CHF 500'000.00</div>
        </div>
        
        <!-- Main Content -->
        <div class="content">
            <p class="intro-text">
                Thank you for choosing BILLIONAIRS LUXURY. Please transfer the equivalent of <strong style="color: #B76E79;">CHF 500'000.00</strong> in ${selectedWallet.name} to the wallet address below to secure your exclusive membership access.
            </p>
            
            <!-- Wallet Section -->
            <div class="wallet-section">
                <h2 class="wallet-title">${selectedWallet.name} Wallet Details</h2>
                
                <!-- QR Code -->
                <div class="qr-code">
                    <img src="${selectedWallet.qrCode}" alt="${selectedWallet.name} QR Code">
                </div>
                
                <!-- Wallet Address Box -->
                <div class="address-box">
                    <div class="address-text">${selectedWallet.address}</div>
                </div>
                
                <!-- Wallet Details Table -->
                <div class="wallet-details">
                    <div class="detail-row">
                        <span class="detail-label">Cryptocurrency</span>
                        <span class="detail-value highlight">${selectedWallet.name}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Network</span>
                        <span class="detail-value">${selectedWallet.network}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Wallet Address</span>
                        <span class="detail-value">${selectedWallet.address}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Amount (CHF)</span>
                        <span class="detail-value highlight">CHF 500'000.00</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Amount (Crypto)</span>
                        <span class="detail-value">${cryptoRates[cryptocurrency.toLowerCase()]}</span>
                    </div>
                </div>
            </div>
            
            <!-- Reference Number -->
            <div class="reference-box">
                <div class="reference-label">Transaction Reference</div>
                <div class="reference-value">${reference}</div>
            </div>
            
            <!-- Critical Instructions -->
            <div class="warning-box">
                <div class="warning-title">⚠️ Critical Instructions</div>
                <ul class="warning-list">
                    <li>Double-check the wallet address before sending - cryptocurrency transactions are irreversible</li>
                    <li>Only use the <strong>${selectedWallet.network}</strong> network</li>
                    <li>Include the transaction reference in the memo/note if supported by your wallet</li>
                    <li>After sending, email us the transaction hash/ID for faster verification</li>
                    <li>Access will be granted within 24 hours after blockchain confirmation</li>
                </ul>
            </div>
            
            <!-- Steps Section -->
            <div class="steps-section">
                <h3 class="steps-title">How to Complete Your Payment</h3>
                
                <div class="step">
                    <div class="step-number">1</div>
                    <div class="step-content">
                        <div class="step-title">Open Your Crypto Wallet</div>
                        <div class="step-description">Use a trusted wallet that supports ${selectedWallet.name} on ${selectedWallet.network}</div>
                    </div>
                </div>
                
                <div class="step">
                    <div class="step-number">2</div>
                    <div class="step-content">
                        <div class="step-title">Scan QR Code or Copy Address</div>
                        <div class="step-description">Use the QR code above or manually copy the wallet address</div>
                    </div>
                </div>
                
                <div class="step">
                    <div class="step-number">3</div>
                    <div class="step-content">
                        <div class="step-title">Enter Amount</div>
                        <div class="step-description">Calculate the equivalent of CHF 500'000 in ${selectedWallet.name} at current market rates</div>
                    </div>
                </div>
                
                <div class="step">
                    <div class="step-number">4</div>
                    <div class="step-content">
                        <div class="step-title">Complete Transaction</div>
                        <div class="step-description">Review all details carefully and confirm the transaction in your wallet</div>
                    </div>
                </div>
                
                <div class="step">
                    <div class="step-number">5</div>
                    <div class="step-content">
                        <div class="step-title">Send Confirmation</div>
                        <div class="step-description">Email us the transaction hash/ID along with the reference number: ${reference}</div>
                    </div>
                </div>
            </div>
            
            <!-- Contact Section -->
            <div class="contact-section">
                <div class="contact-title">Need Assistance?</div>
                <p style="color: rgba(255, 255, 255, 0.8); margin: 10px 0;">If you have any questions or need help with your cryptocurrency payment, please contact us at:</p>
                <a href="mailto:elite@billionairs.luxury" class="contact-email">elite@billionairs.luxury</a>
            </div>
            
            <p style="text-align: center; color: rgba(255, 255, 255, 0.6); font-size: 13px; margin-top: 40px; line-height: 1.8;">
                Once your transaction is confirmed on the blockchain, you will receive your exclusive access credentials within 24 hours. Welcome to the world of luxury redefined.
            </p>
        </div>
        
        <!-- Footer -->
        <div class="footer">
            <div class="footer-logo">BILLIONAIRS</div>
            <div class="footer-text">LUXURY REDEFINED</div>
            <div class="footer-text">© ${new Date().getFullYear()} BILLIONAIRS LUXURY. All Rights Reserved.</div>
        </div>
    </div>
</body>
</html>
        `;

        // Send email to customer
        const emailSent = await sendEmail(
            email,
            `💎 BILLIONAIRS LUXURY - ${selectedWallet.name} Payment Instructions`,
            emailHTML
        );

        // Return crypto payment details
        return res.status(200).json({
            success: true,
            cryptocurrency: selectedWallet.name,
            wallet: {
                address: selectedWallet.address,
                network: selectedWallet.network,
                symbol: selectedWallet.symbol,
                qrCode: selectedWallet.qrCode
            },
            amount: {
                chf: 'CHF 500\'000.00',
                crypto: cryptoRates[cryptocurrency.toLowerCase()]
            },
            reference: reference,
            emailSent: emailSent,
            instructions: [
                'Scan the QR code or copy the wallet address',
                `Use only ${selectedWallet.network} network`,
                'Calculate the equivalent of CHF 500\'000 at current rates',
                'Include the reference number if your wallet supports it',
                'Email us the transaction hash after sending'
            ]
        });

    } catch (error) {
        console.error('Crypto payment error:', error);
        return res.status(500).json({ 
            error: 'Failed to process crypto payment request',
            message: error.message 
        });
    }
}
