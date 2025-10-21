// Vercel Serverless Function for Bank Wire Transfer
// Collects customer information and sends bank details via email

// Email sending function using fetch API (no dependencies needed)
async function sendEmail(to, subject, html) {
    // Using Resend API - simple and free tier available
    const RESEND_API_KEY = process.env.RESEND_API_KEY || 're_demo_key';
    
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
            console.error('Email sending failed:', await response.text());
            return false;
        }

        return true;
    } catch (error) {
        console.error('Email error:', error);
        return false;
    }
}

export default async function handler(req, res) {
    // Set CORS headers
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
        const { fullName, email, phone, company } = req.body;

        // Validate required fields
        if (!fullName || !email || !phone) {
            return res.status(400).json({ 
                error: 'Missing required fields',
                message: 'Please provide your full name, email, and phone number'
            });
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ 
                error: 'Invalid email',
                message: 'Please provide a valid email address'
            });
        }

        // Log the wire transfer request (in production, this would go to a database)
        console.log('🏦 Wire Transfer Request:', {
            fullName,
            email,
            phone,
            company: company || 'N/A',
            amount: '500,000 CHF',
            timestamp: new Date().toISOString()
        });

        // Bank account details - Furkan Akaslan UBS Switzerland
        const bankDetails = {
            amount: '500,000 CHF',
            bankName: 'UBS Switzerland AG',
            accountHolder: 'Furkan Akaslan',
            iban: 'CH13 0022 7227 1418 9140 B',
            swift: 'UBSWCHZH80A',
            reference: `BILLIONAIRS-${Date.now()}`,
            address: 'UBS Switzerland AG, Zürich, Switzerland',
            instructions: [
                'Please include the reference number in your transfer',
                'Transfer must come from an account in your name',
                'Access will be granted within 24 hours of receiving funds',
                'Contact support@billionairs-luxury.com for any questions'
            ]
        };

        // Send email with bank details to customer
        const emailHTML = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Montserrat:wght@300;400;500;600&display=swap');
        
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Montserrat', sans-serif; 
            background: #000000; 
            color: #ffffff; 
            line-height: 1.6;
            -webkit-font-smoothing: antialiased;
        }
        .email-wrapper { 
            background: linear-gradient(135deg, #0a0a0a 0%, #1a1200 50%, #0a0a0a 100%); 
            padding: 40px 20px; 
        }
        .container { 
            max-width: 650px; 
            margin: 0 auto; 
            background: linear-gradient(180deg, #1a1a1a 0%, #0d0d0d 100%); 
            border: 2px solid #D4AF37;
            box-shadow: 0 20px 60px rgba(212, 175, 55, 0.2),
                        0 0 100px rgba(212, 175, 55, 0.1),
                        inset 0 0 100px rgba(212, 175, 55, 0.03);
            border-radius: 8px;
            overflow: hidden;
        }
        
        .header { 
            background: linear-gradient(135deg, #D4AF37 0%, #F4D03F 50%, #D4AF37 100%); 
            padding: 50px 40px;
            text-align: center;
            position: relative;
            border-bottom: 3px solid #C19B2D;
        }
        .header::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120"><path fill="%23ffffff" fill-opacity="0.05" d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z" opacity=".25"/></svg>') no-repeat bottom;
            background-size: cover;
        }
        .logo {
            font-family: 'Playfair Display', serif;
            font-size: 42px;
            font-weight: 700;
            color: #0a0a0a;
            letter-spacing: 6px;
            margin: 0;
            text-transform: uppercase;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.1);
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 12px;
        }
        .logo-icon {
            font-size: 36px;
            filter: drop-shadow(2px 2px 4px rgba(0,0,0,0.2));
        }
        .header-subtitle {
            font-family: 'Montserrat', sans-serif;
            font-size: 11px;
            color: #0a0a0a;
            letter-spacing: 4px;
            margin-top: 12px;
            font-weight: 600;
            text-transform: uppercase;
            opacity: 0.8;
        }
        
        .hero-section {
            background: linear-gradient(135deg, rgba(212, 175, 55, 0.15) 0%, rgba(212, 175, 55, 0.05) 100%);
            padding: 50px 40px;
            text-align: center;
            border-bottom: 1px solid rgba(212, 175, 55, 0.2);
        }
        .hero-title {
            font-family: 'Playfair Display', serif;
            font-size: 32px;
            font-weight: 700;
            color: #D4AF37;
            margin-bottom: 20px;
            letter-spacing: 1px;
        }
        .hero-amount {
            font-family: 'Playfair Display', serif;
            font-size: 56px;
            font-weight: 700;
            color: #FFD700;
            margin: 20px 0;
            letter-spacing: 2px;
            text-shadow: 0 0 30px rgba(255, 215, 0, 0.4),
                         0 0 60px rgba(212, 175, 55, 0.2);
        }
        .hero-subtitle {
            font-size: 14px;
            color: rgba(255, 255, 255, 0.7);
            font-weight: 300;
            letter-spacing: 2px;
            text-transform: uppercase;
        }
        
        .content { 
            padding: 50px 40px; 
        }
        .greeting { 
            font-family: 'Playfair Display', serif;
            font-size: 24px;
            margin-bottom: 25px;
            color: #D4AF37;
            font-weight: 600;
        }
        .intro-text {
            font-size: 15px;
            color: rgba(255, 255, 255, 0.9);
            line-height: 1.8;
            margin-bottom: 35px;
        }
        
        .bank-details-section {
            background: linear-gradient(135deg, rgba(212, 175, 55, 0.08) 0%, rgba(212, 175, 55, 0.03) 100%);
            border: 2px solid rgba(212, 175, 55, 0.4);
            border-radius: 8px;
            padding: 35px;
            margin: 35px 0;
            box-shadow: 0 8px 32px rgba(212, 175, 55, 0.15),
                        inset 0 0 60px rgba(212, 175, 55, 0.03);
        }
        .section-title {
            font-family: 'Playfair Display', serif;
            font-size: 22px;
            color: #D4AF37;
            margin: 0 0 25px 0;
            font-weight: 600;
            letter-spacing: 1px;
            text-align: center;
            padding-bottom: 15px;
            border-bottom: 1px solid rgba(212, 175, 55, 0.3);
        }
        .detail-row { 
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin: 18px 0;
            padding: 12px 0;
            border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }
        .detail-row:last-child {
            border-bottom: none;
        }
        .detail-label { 
            font-size: 13px;
            color: rgba(212, 175, 55, 0.9);
            font-weight: 600;
            letter-spacing: 1px;
            text-transform: uppercase;
            min-width: 140px;
        }
        .detail-value { 
            font-size: 15px;
            color: #ffffff;
            font-weight: 500;
            text-align: right;
            font-family: 'Courier New', monospace;
        }
        .reference-box {
            background: linear-gradient(135deg, #D4AF37 0%, #F4D03F 100%);
            color: #0a0a0a;
            padding: 18px 25px;
            border-radius: 6px;
            font-weight: 700;
            font-size: 16px;
            text-align: center;
            margin-top: 25px;
            letter-spacing: 2px;
            box-shadow: 0 8px 24px rgba(212, 175, 55, 0.3),
                        inset 0 -2px 4px rgba(0, 0, 0, 0.2);
            font-family: 'Courier New', monospace;
        }
        .reference-label {
            font-size: 11px;
            letter-spacing: 2px;
            opacity: 0.8;
            margin-bottom: 8px;
            text-transform: uppercase;
            font-weight: 600;
        }
        
        .critical-info {
            background: linear-gradient(135deg, rgba(255, 71, 71, 0.12) 0%, rgba(255, 71, 71, 0.06) 100%);
            border: 2px solid rgba(255, 71, 71, 0.5);
            border-left: 6px solid #FF4747;
            border-radius: 8px;
            padding: 30px;
            margin: 35px 0;
        }
        .critical-title {
            font-family: 'Playfair Display', serif;
            font-size: 20px;
            color: #FF6B6B;
            margin: 0 0 20px 0;
            font-weight: 600;
            display: flex;
            align-items: center;
        }
        .critical-title::before {
            content: '⚠';
            font-size: 24px;
            margin-right: 12px;
        }
        .critical-item { 
            margin: 14px 0;
            padding-left: 28px;
            position: relative;
            font-size: 14px;
            color: rgba(255, 255, 255, 0.95);
            line-height: 1.7;
        }
        .critical-item::before { 
            content: "▸";
            position: absolute;
            left: 0;
            color: #D4AF37;
            font-size: 16px;
            font-weight: bold;
        }
        
        .steps-section {
            margin: 35px 0;
        }
        .steps-title {
            font-family: 'Playfair Display', serif;
            font-size: 20px;
            color: #D4AF37;
            margin-bottom: 20px;
            font-weight: 600;
        }
        .step-item {
            display: flex;
            margin: 18px 0;
            align-items: flex-start;
        }
        .step-number {
            background: linear-gradient(135deg, #D4AF37 0%, #C19B2D 100%);
            color: #0a0a0a;
            width: 32px;
            height: 32px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 700;
            font-size: 14px;
            margin-right: 15px;
            flex-shrink: 0;
            box-shadow: 0 4px 12px rgba(212, 175, 55, 0.3);
        }
        .step-text {
            font-size: 14px;
            color: rgba(255, 255, 255, 0.9);
            line-height: 1.7;
            padding-top: 4px;
        }
        
        .contact-section {
            background: rgba(212, 175, 55, 0.05);
            border-radius: 8px;
            padding: 25px;
            margin: 35px 0;
            text-align: center;
        }
        .contact-text {
            font-size: 14px;
            color: rgba(255, 255, 255, 0.8);
            margin-bottom: 12px;
        }
        .contact-email {
            color: #D4AF37;
            text-decoration: none;
            font-weight: 600;
            font-size: 15px;
            letter-spacing: 0.5px;
        }
        .contact-email:hover {
            color: #F4D03F;
        }
        
        .signature {
            margin-top: 45px;
            padding-top: 30px;
            border-top: 1px solid rgba(212, 175, 55, 0.2);
        }
        .signature-text {
            font-size: 14px;
            color: rgba(255, 255, 255, 0.7);
            margin-bottom: 8px;
        }
        .signature-name {
            font-family: 'Playfair Display', serif;
            font-size: 18px;
            color: #D4AF37;
            font-weight: 600;
            letter-spacing: 1px;
        }
        
        .footer { 
            background: linear-gradient(180deg, #0a0a0a 0%, #000000 100%);
            text-align: center;
            padding: 40px 30px;
            border-top: 2px solid rgba(212, 175, 55, 0.3);
        }
        .footer-logo {
            font-family: 'Playfair Display', serif;
            font-size: 20px;
            color: #D4AF37;
            letter-spacing: 3px;
            margin-bottom: 15px;
            font-weight: 700;
        }
        .footer-text {
            color: rgba(255, 255, 255, 0.4);
            font-size: 11px;
            letter-spacing: 1px;
            margin: 8px 0;
            line-height: 1.6;
        }
        .footer-year {
            color: rgba(212, 175, 55, 0.6);
            font-weight: 600;
        }
        
        @media only screen and (max-width: 600px) {
            .email-wrapper { padding: 20px 10px; }
            .container { border-radius: 0; }
            .header { padding: 35px 20px; }
            .logo { font-size: 32px; letter-spacing: 4px; }
            .hero-section { padding: 35px 20px; }
            .hero-title { font-size: 24px; }
            .hero-amount { font-size: 42px; }
            .content { padding: 35px 20px; }
            .detail-row { flex-direction: column; align-items: flex-start; }
            .detail-value { text-align: left; margin-top: 5px; }
            .bank-details-section, .critical-info { padding: 20px; }
        }
    </style>
</head>
<body>
    <div class="email-wrapper">
        <div class="container">
            <div class="header">
                <h1 class="logo">
                    <span class="logo-icon">💎</span>
                    <span>BILLIONAIRS</span>
                </h1>
                <p class="header-subtitle">Exclusive Luxury Network</p>
            </div>
            
            <div class="hero-section">
                <h2 class="hero-title">Wire Transfer Payment Instructions</h2>
                <div class="hero-amount">CHF 500,000</div>
                <p class="hero-subtitle">Elite Membership Access</p>
            </div>
            
            <div class="content">
                <p class="greeting">Dear ${fullName},</p>
                
                <p class="intro-text">
                    Thank you for choosing BILLIONAIRS LUXURY. We are pleased to provide you with the complete wire transfer details to secure your exclusive membership access valued at <strong style="color: #D4AF37;">CHF 500,000</strong>.
                </p>
                
                <div class="bank-details-section">
                    <h3 class="section-title">Bank Wire Transfer Details</h3>
                    
                    <div class="detail-row">
                        <span class="detail-label">Bank Name</span>
                        <span class="detail-value">${bankDetails.bankName}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Account Holder</span>
                        <span class="detail-value">${bankDetails.accountHolder}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">IBAN</span>
                        <span class="detail-value">${bankDetails.iban}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">SWIFT/BIC Code</span>
                        <span class="detail-value">${bankDetails.swift}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Bank Address</span>
                        <span class="detail-value">${bankDetails.address}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Transfer Amount</span>
                        <span class="detail-value" style="color: #FFD700; font-size: 17px; font-weight: 700;">CHF 500,000</span>
                    </div>
                    
                    <div class="reference-box">
                        <div class="reference-label">Payment Reference Number</div>
                        <div>${bankDetails.reference}</div>
                    </div>
                </div>
                
                <div class="critical-info">
                    <h3 class="critical-title">Critical Instructions</h3>
                    <div class="critical-item">
                        <strong>MANDATORY:</strong> Include reference number <strong style="color: #FFD700;">${bankDetails.reference}</strong> in your wire transfer
                    </div>
                    <div class="critical-item">
                        Wire transfer must originate from a bank account registered in your legal name
                    </div>
                    <div class="critical-item">
                        Exclusive access will be granted within 24 hours upon successful fund verification
                    </div>
                    <div class="critical-item">
                        This email contains confidential financial information - do not forward or share
                    </div>
                    <div class="critical-item">
                        Contact our concierge team immediately if you encounter any issues
                    </div>
                </div>
                
                <div class="steps-section">
                    <h3 class="steps-title">Completion Process</h3>
                    <div class="step-item">
                        <div class="step-number">1</div>
                        <div class="step-text">
                            Log into your private banking portal or visit your relationship manager
                        </div>
                    </div>
                    <div class="step-item">
                        <div class="step-number">2</div>
                        <div class="step-text">
                            Initiate an international wire transfer using the bank details provided above
                        </div>
                    </div>
                    <div class="step-item">
                        <div class="step-number">3</div>
                        <div class="step-text">
                            Ensure the payment reference <strong style="color: #D4AF37;">${bankDetails.reference}</strong> is included
                        </div>
                    </div>
                    <div class="step-item">
                        <div class="step-number">4</div>
                        <div class="step-text">
                            Allow 24-48 hours for international transfer processing and verification
                        </div>
                    </div>
                    <div class="step-item">
                        <div class="step-number">5</div>
                        <div class="step-text">
                            Receive your exclusive access credentials and welcome package via secure email
                        </div>
                    </div>
                </div>
                
                <div class="contact-section">
                    <p class="contact-text">
                        <strong>24/7 Elite Concierge Support</strong>
                    </p>
                    <a href="mailto:elite@billionairs.luxury" class="contact-email">elite@billionairs.luxury</a>
                    <p class="contact-text" style="margin-top: 15px; font-size: 12px;">
                        Our dedicated team is available around the clock for your assistance
                    </p>
                </div>
                
                <div class="signature">
                    <p class="signature-text">With distinguished regards,</p>
                    <p class="signature-name">The BILLIONAIRS LUXURY Team</p>
                    <p class="signature-text" style="margin-top: 8px; font-size: 12px;">
                        Elite Membership Services
                    </p>
                </div>
            </div>
            
            <div class="footer">
                <div class="footer-logo">BILLIONAIRS</div>
                <p class="footer-text">
                    <span class="footer-year">© 2025</span> BILLIONAIRS LUXURY | Exclusive Members Only
                </p>
                <p class="footer-text">
                    This is a secure, automated communication. Please do not reply directly.
                </p>
                <p class="footer-text" style="margin-top: 15px;">
                    Confidential & Privileged Information
                </p>
            </div>
        </div>
    </div>
</body>
</html>
        `;

        // Send email to customer
        const emailSent = await sendEmail(
            email,
            '💎 BILLIONAIRS LUXURY - CHF 500,000 Wire Transfer Instructions',
            emailHTML
        );

        // For now, we'll return the bank details directly
        return res.status(200).json({
            success: true,
            message: 'Wire transfer initiated successfully',
            customerInfo: {
                fullName,
                email,
                phone,
                company: company || null
            },
            bankDetails: bankDetails,
            instructions: [
                '1. Use the bank details below to initiate your wire transfer',
                '2. Make sure to include the reference number',
                '3. Transfer must be from an account in your name',
                '4. You will receive access credentials within 24h after payment confirmation',
                '5. Keep this information secure'
            ],
            emailSent: emailSent,
            nextSteps: [
                'Check your email for detailed instructions',
                'Complete the wire transfer from your bank',
                'Wait for confirmation (usually 24-48 hours)',
                'Receive your exclusive access credentials'
            ]
        });

    } catch (error) {
        console.error('Wire Transfer Error:', error);
        return res.status(500).json({ 
            error: 'Wire transfer initialization failed',
            message: error.message 
        });
    }
}
