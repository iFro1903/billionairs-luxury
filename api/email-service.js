// Centralized Email Service using Resend API
// Templates for all email types

export const config = {
    runtime: 'edge'
};

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = 'BILLIONAIRS <onboarding@resend.dev>';

// Main email sending function
async function sendEmail(to, subject, html) {
    if (!RESEND_API_KEY) {
        console.error('RESEND_API_KEY is not configured');
        return { success: false, error: 'Email service not configured' };
    }

    try {
        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${RESEND_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                from: FROM_EMAIL,
                to: [to],
                subject: subject,
                html: html
            })
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('Email sending failed:', data);
            return { success: false, error: data.message || 'Failed to send email' };
        }

        console.log('Email sent successfully to:', to, 'ID:', data.id);
        return { success: true, id: data.id };
    } catch (error) {
        console.error('Email sending error:', error);
        return { success: false, error: error.message };
    }
}

// Email Templates
const templates = {
    welcome: (userName) => ({
        subject: '🎩 Welcome to BILLIONAIRS - Your Exclusive Journey Begins',
        html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Montserrat', Arial, sans-serif; background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%);">
    <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%); padding: 40px 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background: rgba(26, 26, 46, 0.95); border-radius: 20px; border: 2px solid rgba(212, 175, 55, 0.3); overflow: hidden;">
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, rgba(212, 175, 55, 0.2), rgba(212, 175, 55, 0.1)); padding: 40px 30px; text-align: center; border-bottom: 1px solid rgba(212, 175, 55, 0.3);">
                            <h1 style="margin: 0; font-size: 36px; color: #d4af37; font-weight: 900; letter-spacing: 3px; text-shadow: 0 0 20px rgba(212, 175, 55, 0.5);">
                                BILLIONAIRS
                            </h1>
                            <p style="margin: 10px 0 0 0; font-size: 14px; color: rgba(255, 255, 255, 0.7); letter-spacing: 2px;">
                                BEYOND WEALTH. BEYOND STATUS.
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Body -->
                    <tr>
                        <td style="padding: 40px 30px; color: #ffffff;">
                            <h2 style="margin: 0 0 20px 0; font-size: 24px; color: #d4af37;">Welcome, ${userName || 'Distinguished Member'} 🎩</h2>
                            
                            <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.8; color: rgba(255, 255, 255, 0.9);">
                                You have successfully joined the most exclusive digital experience platform reserved for those who transcend conventional boundaries.
                            </p>
                            
                            <div style="background: rgba(212, 175, 55, 0.1); border-left: 4px solid #d4af37; padding: 20px; margin: 30px 0; border-radius: 8px;">
                                <h3 style="margin: 0 0 15px 0; font-size: 18px; color: #d4af37;">What's Included:</h3>
                                <ul style="margin: 0; padding-left: 20px; color: rgba(255, 255, 255, 0.9);">
                                    <li style="margin-bottom: 10px;">🔒 <strong>Exclusive Access</strong> - Limited membership platform</li>
                                    <li style="margin-bottom: 10px;">💎 <strong>Hidden Easter Eggs</strong> - Unlock rare achievements</li>
                                    <li style="margin-bottom: 10px;">💬 <strong>Global Elite Chat</strong> - Connect with members worldwide</li>
                                    <li style="margin-bottom: 10px;">🎁 <strong>Premium Content</strong> - Unique experiences & moments</li>
                                </ul>
                            </div>
                            
                            <p style="margin: 30px 0 20px 0; font-size: 16px; line-height: 1.8; color: rgba(255, 255, 255, 0.9);">
                                Your journey begins now. Explore the platform, discover hidden treasures, and connect with fellow members who understand that true luxury transcends material possessions.
                            </p>
                            
                            <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                                <tr>
                                    <td align="center">
                                        <a href="https://billionairs-luxury.vercel.app/dashboard" style="display: inline-block; padding: 15px 40px; background: linear-gradient(135deg, #d4af37, #f4e4a8); color: #1a1a2e; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 16px; letter-spacing: 1px; box-shadow: 0 4px 15px rgba(212, 175, 55, 0.4);">
                                            ENTER DASHBOARD
                                        </a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background: rgba(0, 0, 0, 0.3); padding: 30px; text-align: center; border-top: 1px solid rgba(255, 255, 255, 0.1);">
                            <p style="margin: 0 0 10px 0; font-size: 14px; color: rgba(255, 255, 255, 0.6);">
                                BILLIONAIRS LUXURY<br>
                                <a href="https://billionairs-luxury.vercel.app" style="color: #d4af37; text-decoration: none;">billionairs-luxury.vercel.app</a>
                            </p>
                            <p style="margin: 15px 0 0 0; font-size: 12px; color: rgba(255, 255, 255, 0.5);">
                                This email was sent because you created an account.<br>
                                Questions? Contact us at <a href="mailto:support@billionairs.luxury" style="color: #d4af37; text-decoration: none;">support@billionairs.luxury</a>
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
        `
    }),

    easterEggUnlock: (userName, eggName, eggDescription) => ({
        subject: `🎁 Achievement Unlocked: ${eggName}`,
        html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Montserrat', Arial, sans-serif; background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%);">
    <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%); padding: 40px 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background: rgba(26, 26, 46, 0.95); border-radius: 20px; border: 2px solid rgba(212, 175, 55, 0.3); overflow: hidden;">
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, rgba(212, 175, 55, 0.3), rgba(212, 175, 55, 0.1)); padding: 40px 30px; text-align: center; border-bottom: 1px solid rgba(212, 175, 55, 0.3);">
                            <div style="font-size: 60px; margin-bottom: 15px;">🎁</div>
                            <h1 style="margin: 0; font-size: 32px; color: #d4af37; font-weight: 900; letter-spacing: 2px;">
                                ACHIEVEMENT UNLOCKED
                            </h1>
                        </td>
                    </tr>
                    
                    <!-- Body -->
                    <tr>
                        <td style="padding: 40px 30px; color: #ffffff;">
                            <h2 style="margin: 0 0 20px 0; font-size: 24px; color: #d4af37;">Congratulations, ${userName || 'Member'}!</h2>
                            
                            <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.8; color: rgba(255, 255, 255, 0.9);">
                                You've discovered something extraordinary. Only a select few will ever unlock this achievement.
                            </p>
                            
                            <div style="background: linear-gradient(135deg, rgba(212, 175, 55, 0.2), rgba(212, 175, 55, 0.05)); border: 2px solid rgba(212, 175, 55, 0.5); padding: 30px; margin: 30px 0; border-radius: 15px; text-align: center; box-shadow: 0 10px 40px rgba(212, 175, 55, 0.2);">
                                <h3 style="margin: 0 0 15px 0; font-size: 26px; color: #d4af37; text-transform: uppercase; letter-spacing: 2px;">
                                    ${eggName}
                                </h3>
                                <p style="margin: 0; font-size: 16px; color: rgba(255, 255, 255, 0.9); line-height: 1.6;">
                                    ${eggDescription}
                                </p>
                            </div>
                            
                            <div style="background: rgba(0, 0, 0, 0.3); border-left: 4px solid #d4af37; padding: 20px; margin: 30px 0; border-radius: 8px;">
                                <p style="margin: 0; font-size: 15px; color: rgba(255, 255, 255, 0.8); font-style: italic;">
                                    "In a world of billions, you are among the few who look beyond the surface."
                                </p>
                            </div>
                            
                            <p style="margin: 30px 0 20px 0; font-size: 16px; line-height: 1.8; color: rgba(255, 255, 255, 0.9);">
                                Continue your journey. More secrets await those persistent enough to seek them.
                            </p>
                            
                            <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                                <tr>
                                    <td align="center">
                                        <a href="https://billionairs-luxury.vercel.app/dashboard" style="display: inline-block; padding: 15px 40px; background: linear-gradient(135deg, #d4af37, #f4e4a8); color: #1a1a2e; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 16px; letter-spacing: 1px; box-shadow: 0 4px 15px rgba(212, 175, 55, 0.4);">
                                            CONTINUE EXPLORING
                                        </a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background: rgba(0, 0, 0, 0.3); padding: 30px; text-align: center; border-top: 1px solid rgba(255, 255, 255, 0.1);">
                            <p style="margin: 0 0 10px 0; font-size: 14px; color: rgba(255, 255, 255, 0.6);">
                                BILLIONAIRS LUXURY
                            </p>
                            <p style="margin: 15px 0 0 0; font-size: 12px; color: rgba(255, 255, 255, 0.5);">
                                Share this achievement? Keep it exclusive.<br>
                                True value lies in rarity.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
        `
    }),

    paymentSuccess: (userName, amount, currency, productName) => ({
        subject: '✅ Payment Confirmed - Welcome to Exclusivity',
        html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Montserrat', Arial, sans-serif; background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%);">
    <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%); padding: 40px 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background: rgba(26, 26, 46, 0.95); border-radius: 20px; border: 2px solid rgba(212, 175, 55, 0.3); overflow: hidden;">
                    <tr>
                        <td style="background: linear-gradient(135deg, rgba(0, 200, 0, 0.2), rgba(0, 150, 0, 0.1)); padding: 40px 30px; text-align: center; border-bottom: 1px solid rgba(212, 175, 55, 0.3);">
                            <div style="font-size: 60px; margin-bottom: 15px;">✅</div>
                            <h1 style="margin: 0; font-size: 32px; color: #d4af37; font-weight: 900;">PAYMENT CONFIRMED</h1>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 40px 30px; color: #ffffff;">
                            <h2 style="margin: 0 0 20px 0; font-size: 24px; color: #d4af37;">Thank you, ${userName || 'Member'}!</h2>
                            <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.8; color: rgba(255, 255, 255, 0.9);">
                                Your payment has been successfully processed. Access has been granted.
                            </p>
                            <div style="background: rgba(212, 175, 55, 0.1); border: 2px solid rgba(212, 175, 55, 0.3); padding: 25px; margin: 30px 0; border-radius: 12px;">
                                <table width="100%" cellpadding="8" cellspacing="0">
                                    <tr>
                                        <td style="color: rgba(255, 255, 255, 0.7); font-size: 14px;">Product:</td>
                                        <td style="color: #d4af37; font-weight: 600; text-align: right; font-size: 14px;">${productName}</td>
                                    </tr>
                                    <tr>
                                        <td style="color: rgba(255, 255, 255, 0.7); font-size: 14px;">Amount:</td>
                                        <td style="color: #d4af37; font-weight: 600; text-align: right; font-size: 16px;">${amount} ${currency}</td>
                                    </tr>
                                    <tr>
                                        <td style="color: rgba(255, 255, 255, 0.7); font-size: 14px;">Status:</td>
                                        <td style="color: #00ff00; font-weight: 600; text-align: right; font-size: 14px;">CONFIRMED ✓</td>
                                    </tr>
                                </table>
                            </div>
                            <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                                <tr>
                                    <td align="center">
                                        <a href="https://billionairs-luxury.vercel.app/dashboard" style="display: inline-block; padding: 15px 40px; background: linear-gradient(135deg, #d4af37, #f4e4a8); color: #1a1a2e; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 16px; letter-spacing: 1px;">
                                            ACCESS YOUR ACCOUNT
                                        </a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td style="background: rgba(0, 0, 0, 0.3); padding: 30px; text-align: center; border-top: 1px solid rgba(255, 255, 255, 0.1);">
                            <p style="margin: 0; font-size: 12px; color: rgba(255, 255, 255, 0.5);">
                                Receipt ID: ${Date.now()}<br>
                                Questions? <a href="mailto:support@billionairs.luxury" style="color: #d4af37; text-decoration: none;">support@billionairs.luxury</a>
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
        `
    })
};

// API Handler
export default async function handler(req) {
    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
            status: 405,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    try {
        const { type, to, ...data } = await req.json();

        if (!type || !to) {
            return new Response(JSON.stringify({ error: 'Missing required fields: type, to' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Get template
        let template;
        switch (type) {
            case 'welcome':
                template = templates.welcome(data.userName);
                break;
            case 'easterEgg':
                template = templates.easterEggUnlock(data.userName, data.eggName, data.eggDescription);
                break;
            case 'payment':
                template = templates.paymentSuccess(data.userName, data.amount, data.currency, data.productName);
                break;
            default:
                return new Response(JSON.stringify({ error: 'Invalid email type' }), {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                });
        }

        // Send email
        const result = await sendEmail(to, template.subject, template.html);

        return new Response(JSON.stringify(result), {
            status: result.success ? 200 : 500,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Email service error:', error);
        return new Response(JSON.stringify({ 
            success: false, 
            error: error.message 
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
