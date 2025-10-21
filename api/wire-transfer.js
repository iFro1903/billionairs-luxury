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
                from: 'BILLIONAIRS LUXURY <noreply@billionairs-luxury.com>',
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
    <style>
        body { font-family: 'Georgia', serif; background: #0a0a0a; color: #ffffff; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%); border: 1px solid #D4AF37; }
        .header { background: #D4AF37; padding: 30px; text-align: center; }
        .header h1 { margin: 0; color: #0a0a0a; font-size: 28px; letter-spacing: 2px; }
        .content { padding: 40px 30px; }
        .greeting { font-size: 18px; margin-bottom: 20px; }
        .bank-details { background: rgba(212, 175, 55, 0.1); border-left: 4px solid #D4AF37; padding: 20px; margin: 25px 0; }
        .detail-row { margin: 12px 0; line-height: 1.8; }
        .detail-label { color: #D4AF37; font-weight: bold; display: inline-block; min-width: 150px; }
        .detail-value { color: #ffffff; }
        .instructions { background: rgba(255, 107, 107, 0.1); border-left: 4px solid #FF6B6B; padding: 20px; margin: 25px 0; }
        .instruction-item { margin: 10px 0; padding-left: 20px; position: relative; }
        .instruction-item:before { content: "→"; position: absolute; left: 0; color: #D4AF37; }
        .footer { text-align: center; padding: 30px; color: rgba(255, 255, 255, 0.5); font-size: 12px; border-top: 1px solid rgba(212, 175, 55, 0.3); }
        .reference-highlight { background: #D4AF37; color: #0a0a0a; padding: 2px 8px; border-radius: 3px; font-weight: bold; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>BILLIONAIRS LUXURY</h1>
            <p style="margin: 10px 0 0 0; color: #0a0a0a; font-size: 14px;">EXCLUSIVE ACCESS PAYMENT DETAILS</p>
        </div>
        
        <div class="content">
            <p class="greeting">Dear ${fullName},</p>
            
            <p>Thank you for your interest in BILLIONAIRS LUXURY exclusive access. Below you will find the complete bank wire transfer details to complete your payment of <strong style="color: #D4AF37;">CHF 500,000</strong>.</p>
            
            <div class="bank-details">
                <h3 style="color: #D4AF37; margin-top: 0;">Bank Transfer Details</h3>
                <div class="detail-row">
                    <span class="detail-label">Amount:</span>
                    <span class="detail-value">CHF 500,000</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Bank Name:</span>
                    <span class="detail-value">${bankDetails.bankName}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Account Holder:</span>
                    <span class="detail-value">${bankDetails.accountHolder}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">IBAN:</span>
                    <span class="detail-value">${bankDetails.iban}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">SWIFT/BIC:</span>
                    <span class="detail-value">${bankDetails.swift}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Reference:</span>
                    <span class="detail-value"><span class="reference-highlight">${bankDetails.reference}</span></span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Bank Address:</span>
                    <span class="detail-value">${bankDetails.address}</span>
                </div>
            </div>
            
            <div class="instructions">
                <h3 style="color: #FF6B6B; margin-top: 0;">Important Instructions</h3>
                <div class="instruction-item">Please include the reference number <span class="reference-highlight">${bankDetails.reference}</span> in your transfer</div>
                <div class="instruction-item">Transfer must come from an account in your name</div>
                <div class="instruction-item">Access will be granted within 24 hours of receiving funds</div>
                <div class="instruction-item">Keep this email secure and do not share your reference number</div>
            </div>
            
            <p><strong>Next Steps:</strong></p>
            <ol style="line-height: 1.8;">
                <li>Initiate the wire transfer from your bank using the details above</li>
                <li>Ensure the reference number is included in the transfer</li>
                <li>Wait for payment confirmation (typically 24-48 hours)</li>
                <li>You will receive your exclusive access credentials via email</li>
            </ol>
            
            <p style="margin-top: 30px;">If you have any questions, please contact us at <a href="mailto:support@billionairs-luxury.com" style="color: #D4AF37;">support@billionairs-luxury.com</a></p>
            
            <p style="margin-top: 30px; color: rgba(255, 255, 255, 0.7);">Best regards,<br><strong style="color: #D4AF37;">The BILLIONAIRS LUXURY Team</strong></p>
        </div>
        
        <div class="footer">
            <p>BILLIONAIRS LUXURY © 2025 | Exclusive Members Only</p>
            <p>This is an automated message. Please do not reply directly to this email.</p>
        </div>
    </div>
</body>
</html>
        `;

        // Send email to customer
        const emailSent = await sendEmail(
            email,
            'BILLIONAIRS LUXURY - Wire Transfer Details',
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
