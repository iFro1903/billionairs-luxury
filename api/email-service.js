// Centralized Email Service using Resend API
// Templates for all email types with GDPR compliance

import { addEmailFooter, wrapEmailTemplate } from '../lib/email-utils.js';

export const config = {
    runtime: 'edge'
};

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = 'BILLIONAIRS <noreply@billionairs.luxury>';

// Main email sending function with auto-footer
async function sendEmail(to, subject, html, skipFooter = false) {
    if (!RESEND_API_KEY) {
        console.error('RESEND_API_KEY is not configured');
        return { success: false, error: 'Email service not configured' };
    }

    try {
        // Domain is verified - send emails to actual recipients
        
        // Add unsubscribe footer unless explicitly skipped (for transactional emails)
        let finalHtml = html;
        if (!skipFooter) {
            finalHtml = await addEmailFooter(html, to);
        }

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
                html: finalHtml
            })
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('Email sending failed:', data);
            return { success: false, error: data.message || 'Failed to send email' };
        }

        return { success: true, id: data.id };
    } catch (error) {
        console.error('Email sending error:', error);
        return { success: false, error: error.message };
    }
}

// Email Templates
const templates = {
    welcome: (userName, userEmail) => ({
        subject: 'Welcome to BILLIONAIRS - Your Exclusive Access Credentials',
        html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=Montserrat:wght@300;400;600;700&display=swap');
    </style>
</head>
<body style="margin: 0; padding: 0; font-family: 'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; background: #000000;">
    <!-- Preheader Text (hidden but appears in email preview) -->
    <div style="display: none; max-height: 0; overflow: hidden;">
        Your exclusive access credentials to the BILLIONAIRS platform await. Welcome to ultra-luxury.
    </div>
    
    <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(180deg, #000000 0%, #0a0a0a 50%, #1a1a1a 100%); padding: 60px 20px;">
        <tr>
            <td align="center">
                <table width="650" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, rgba(15, 15, 25, 0.98) 0%, rgba(25, 25, 40, 0.98) 100%); border-radius: 24px; border: 3px solid transparent; background-clip: padding-box; box-shadow: 0 25px 50px rgba(0, 0, 0, 0.8), inset 0 1px 0 rgba(255, 255, 255, 0.1); position: relative; overflow: hidden;">
                    
                    <!-- Gold Border Glow Effect -->
                    <tr>
                        <td style="position: relative;">
                            <div style="position: absolute; top: -2px; left: -2px; right: -2px; bottom: -2px; background: linear-gradient(135deg, #e8b4b8 0%, #f7cac9 25%, #e8b4b8 50%, #f7cac9 75%, #e8b4b8 100%); border-radius: 24px; z-index: -1;"></div>
                        </td>
                    </tr>
                    
                    <!-- Luxury Header with Logo -->
                    <tr>
                        <td style="background: linear-gradient(135deg, rgba(232, 180, 184, 0.15) 0%, rgba(247, 202, 201, 0.05) 100%); padding: 50px 40px; text-align: center; border-bottom: 2px solid rgba(232, 180, 184, 0.4); position: relative;">
                            <!-- Decorative Corner Elements -->
                            <div style="position: absolute; top: 20px; left: 20px; width: 40px; height: 40px; border-top: 3px solid #e8b4b8; border-left: 3px solid #e8b4b8; opacity: 0.6;"></div>
                            <div style="position: absolute; top: 20px; right: 20px; width: 40px; height: 40px; border-top: 3px solid #e8b4b8; border-right: 3px solid #e8b4b8; opacity: 0.6;"></div>
                            
                            <!-- Logo Image -->
                            <img src="https://billionairs.luxury/assets/images/logo.png" alt="BILLIONAIRS" style="max-width: 180px; height: auto; margin-bottom: 20px; filter: drop-shadow(0 0 30px rgba(232, 180, 184, 0.6));" />
                            
                            <h1 style="margin: 0; font-family: 'Playfair Display', Georgia, serif; font-size: 48px; color: #e8b4b8; font-weight: 900; letter-spacing: 4px; text-transform: uppercase; text-shadow: 0 0 40px rgba(232, 180, 184, 0.5), 0 2px 4px rgba(0, 0, 0, 0.8);">
                                BILLIONAIRS
                            </h1>
                            <p style="margin: 15px 0 0 0; font-size: 13px; color: rgba(255, 255, 255, 0.8); letter-spacing: 4px; font-weight: 300; text-transform: uppercase;">
                                Beyond Wealth. Beyond Status. Beyond Limits.
                            </p>
                            <div style="width: 60px; height: 2px; background: linear-gradient(90deg, transparent, #e8b4b8, transparent); margin: 20px auto 0;"></div>
                        </td>
                    </tr>
                    
                    <!-- Welcome Message -->
                    <tr>
                        <td style="padding: 50px 40px 30px; color: #ffffff;">
                            <h2 style="margin: 0 0 25px 0; font-family: 'Playfair Display', Georgia, serif; font-size: 32px; color: #ffffff; font-weight: 700; text-align: center; line-height: 1.3;">
                                Welcome to the <span style="color: #e8b4b8;">Elite Circle</span>,<br/>
                                ${userName || 'Distinguished Member'}
                            </h2>
                            
                            <p style="margin: 0 0 30px 0; font-size: 17px; line-height: 1.9; color: rgba(255, 255, 255, 0.85); text-align: center; font-weight: 300;">
                                Congratulations. You have been granted access to the most exclusive digital sanctuary reserved for those who understand that <strong style="color: #e8b4b8;">true luxury is an experience</strong>, not a possession.
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Premium Credentials Box -->
                    <tr>
                        <td style="padding: 0 40px 40px;">
                            <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, rgba(232, 180, 184, 0.12) 0%, rgba(247, 202, 201, 0.05) 100%); border-radius: 16px; border: 2px solid rgba(232, 180, 184, 0.4); overflow: hidden; box-shadow: 0 10px 40px rgba(232, 180, 184, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1);">
                                <!-- Credentials Header -->
                                <tr>
                                    <td style="background: linear-gradient(90deg, rgba(232, 180, 184, 0.25), rgba(247, 202, 201, 0.15)); padding: 25px 30px; border-bottom: 1px solid rgba(232, 180, 184, 0.3);">
                                        <h3 style="margin: 0; font-family: 'Playfair Display', Georgia, serif; font-size: 22px; color: #e8b4b8; font-weight: 700; letter-spacing: 1px; text-align: center;">
                                            Your Exclusive Access Credentials
                                        </h3>
                                        <p style="margin: 8px 0 0 0; font-size: 13px; color: rgba(255, 255, 255, 0.7); text-align: center; font-weight: 300;">
                                            Guard these details with the utmost discretion
                                        </p>
                                    </td>
                                </tr>
                                
                                <!-- Email Credential -->
                                <tr>
                                    <td style="padding: 30px 35px 15px;">
                                        <table width="100%" cellpadding="0" cellspacing="0">
                                            <tr>
                                                <td style="padding-bottom: 10px;">
                                                    <span style="display: inline-block; font-size: 12px; color: rgba(255, 255, 255, 0.6); text-transform: uppercase; letter-spacing: 2px; font-weight: 600;">Email Address</span>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td>
                                                    <div style="background: rgba(0, 0, 0, 0.4); border: 1px solid rgba(232, 180, 184, 0.3); border-radius: 10px; padding: 18px 22px; font-family: 'Courier New', monospace; font-size: 16px; color: #ffffff; letter-spacing: 0.5px; box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.3);">
                                                        <strong style="color: #f7cac9;">${userEmail || 'your-email@example.com'}</strong>
                                                    </div>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                                
                                <!-- Password Info -->
                                <tr>
                                    <td style="padding: 15px 35px 30px;">
                                        <table width="100%" cellpadding="0" cellspacing="0">
                                            <tr>
                                                <td style="padding-bottom: 10px;">
                                                    <span style="display: inline-block; font-size: 12px; color: rgba(255, 255, 255, 0.6); text-transform: uppercase; letter-spacing: 2px; font-weight: 600;">Password</span>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td>
                                                    <div style="background: rgba(0, 0, 0, 0.4); border: 1px solid rgba(232, 180, 184, 0.3); border-radius: 10px; padding: 18px 22px; font-size: 15px; color: rgba(255, 255, 255, 0.85); letter-spacing: 0.5px; box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.3);">
                                                        Use the password you chose during registration.
                                                    </div>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                                
                                <!-- Security Notice -->
                                <tr>
                                    <td style="background: rgba(232, 180, 184, 0.08); padding: 20px 30px; border-top: 1px solid rgba(232, 180, 184, 0.2);">
                                        <p style="margin: 0; font-size: 13px; color: rgba(255, 255, 255, 0.75); line-height: 1.6; text-align: center;">
                                            <strong style="color: #e8b4b8;">Security Recommendation:</strong> Change your password upon first login.<br/>
                                            <span style="font-size: 12px; opacity: 0.8;">Your privacy and security are paramount to us.</span>
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Mysterious Message -->
                    <tr>
                        <td style="padding: 40px 40px 20px;">
                            <div style="background: rgba(0, 0, 0, 0.6); border: 2px solid rgba(232, 180, 184, 0.3); border-radius: 15px; padding: 35px 40px; text-align: center; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5), inset 0 2px 20px rgba(232, 180, 184, 0.1);">
                                <p style="margin: 0 0 15px 0; font-family: 'Playfair Display', Georgia, serif; font-size: 18px; color: #e8b4b8; font-weight: 700; letter-spacing: 2px; text-transform: uppercase;">
                                    Access Granted
                                </p>
                                <div style="height: 1px; background: linear-gradient(90deg, transparent, rgba(232, 180, 184, 0.5), transparent); margin: 20px 0;"></div>
                                <p style="margin: 15px 0 0 0; font-size: 14px; line-height: 1.8; color: rgba(255, 255, 255, 0.75); font-style: italic; letter-spacing: 0.5px;">
                                    Some doors remain closed until the right moment arrives.<br/>
                                    What lies beyond is revealed only to those who enter.
                                </p>
                            </div>
                        </td>
                    </tr>
                    
                    <!-- Call to Action -->
                    <tr>
                        <td style="padding: 20px 40px 50px; text-align: center;">
                            <p style="margin: 0 0 25px 0; font-size: 16px; line-height: 1.7; color: rgba(255, 255, 255, 0.85); font-weight: 300;">
                                Your journey into a world where <em style="color: #e8b4b8;">luxury meets mystery</em> begins now.<br/>
                                Step through the gilded gates and discover what awaits beyond.
                            </p>
                            
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center" style="padding: 10px 0;">
                                        <a href="https://www.billionairs.luxury/login.html" style="display: inline-block; padding: 18px 50px; background: linear-gradient(135deg, #e8b4b8 0%, #f7cac9 50%, #e8b4b8 100%); background-size: 200% 100%; color: #000000; text-decoration: none; border-radius: 50px; font-weight: 700; font-size: 16px; letter-spacing: 2px; text-transform: uppercase; box-shadow: 0 8px 25px rgba(232, 180, 184, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3); border: 2px solid rgba(232, 180, 184, 0.8); transition: all 0.3s ease;">
                                            Enter Your Sanctuary
                                        </a>
                                    </td>
                                </tr>
                                <tr>
                                    <td align="center" style="padding: 15px 0 0;">
                                        <p style="margin: 0; font-size: 12px; color: rgba(255, 255, 255, 0.5); font-style: italic;">
                                            Alternative access: <a href="https://www.billionairs.luxury/dashboard" style="color: #e8b4b8; text-decoration: none; border-bottom: 1px solid rgba(232, 180, 184, 0.4);">Direct Dashboard Entry</a>
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Divider Line -->
                    <tr>
                        <td style="padding: 0 40px;">
                            <div style="height: 1px; background: linear-gradient(90deg, transparent, rgba(232, 180, 184, 0.5), transparent);"></div>
                        </td>
                    </tr>
                    
                    <!-- Premium Footer -->
                    <tr>
                        <td style="background: linear-gradient(180deg, transparent, rgba(0, 0, 0, 0.4)); padding: 40px 40px 50px; text-align: center;">
                            <!-- Decorative Bottom Corners -->
                            <div style="position: relative;">
                                <div style="position: absolute; bottom: 20px; left: 20px; width: 40px; height: 40px; border-bottom: 3px solid #e8b4b8; border-left: 3px solid #e8b4b8; opacity: 0.6;"></div>
                                <div style="position: absolute; bottom: 20px; right: 20px; width: 40px; height: 40px; border-bottom: 3px solid #e8b4b8; border-right: 3px solid #e8b4b8; opacity: 0.6;"></div>
                            </div>
                            
                            <p style="margin: 0 0 8px 0; font-family: 'Playfair Display', Georgia, serif; font-size: 16px; color: #e8b4b8; font-weight: 700; letter-spacing: 3px;">
                                BILLIONAIRS
                            </p>
                            <p style="margin: 0 0 20px 0; font-size: 11px; color: rgba(255, 255, 255, 0.5); letter-spacing: 2px; text-transform: uppercase;">
                                Luxury · Exclusivity · Mystique
                            </p>
                            
                            <p style="margin: 0 0 15px 0; font-size: 14px; color: rgba(255, 255, 255, 0.7);">
                                <a href="https://billionairs.luxury" style="color: #e8b4b8; text-decoration: none; border-bottom: 1px solid rgba(232, 180, 184, 0.3);">billionairs.luxury</a>
                            </p>
                            
                            <p style="margin: 15px 0 0 0; font-size: 12px; line-height: 1.6; color: rgba(255, 255, 255, 0.5);">
                                This email contains sensitive credentials. Do not forward.<br/>
                                <span style="font-size: 11px;">Concierge Support: <a href="mailto:support@billionairs.luxury" style="color: #e8b4b8; text-decoration: none;">support@billionairs.luxury</a></span>
                            </p>
                            
                            <div style="width: 100px; height: 1px; background: linear-gradient(90deg, transparent, rgba(232, 180, 184, 0.4), transparent); margin: 20px auto 15px;"></div>
                            
                            <p style="margin: 0; font-size: 10px; color: rgba(255, 255, 255, 0.4); line-height: 1.5;">
                                © ${new Date().getFullYear()} BILLIONAIRS. All rights reserved.<br/>
                                <span style="font-style: italic;">For the select. By invitation only.</span>
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

    'password-reset': (userName, resetLink) => ({
        subject: 'BILLIONAIRS - Reset Your Password',
        html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=Montserrat:wght@300;400;600;700&display=swap');
    </style>
</head>
<body style="margin: 0; padding: 0; font-family: 'Montserrat', -apple-system, BlinkMacSystemFont, sans-serif; background: #000000;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(180deg, #000000 0%, #0a0a0a 50%, #1a1a1a 100%); padding: 60px 20px;">
        <tr>
            <td align="center">
                <table width="650" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, rgba(15, 15, 25, 0.98) 0%, rgba(25, 25, 40, 0.98) 100%); border-radius: 24px; border: 3px solid rgba(232, 180, 184, 0.5); box-shadow: 0 25px 50px rgba(0, 0, 0, 0.8); overflow: hidden;">
                    
                    <!-- Header with Logo -->
                    <tr>
                        <td style="padding: 50px 40px 30px; text-align: center; background: linear-gradient(135deg, rgba(0, 0, 0, 0.6), rgba(10, 10, 10, 0.8)); position: relative;">
                            <div style="position: absolute; top: 20px; left: 20px; width: 50px; height: 50px; border-top: 4px solid #e8b4b8; border-left: 4px solid #e8b4b8; opacity: 0.6;"></div>
                            <div style="position: absolute; top: 20px; right: 20px; width: 50px; height: 50px; border-top: 4px solid #e8b4b8; border-right: 4px solid #e8b4b8; opacity: 0.6;"></div>
                            
                            <img src="https://billionairs.luxury/assets/images/logo.png" alt="BILLIONAIRS" style="width: 80px; height: auto; margin-bottom: 20px; filter: drop-shadow(0 4px 12px rgba(232, 180, 184, 0.4));" />
                            
                            <h1 style="margin: 0; font-family: 'Playfair Display', Georgia, serif; font-size: 36px; font-weight: 900; color: #e8b4b8; letter-spacing: 4px; text-transform: uppercase; text-shadow: 0 2px 10px rgba(232, 180, 184, 0.3);">
                                BILLIONAIRS
                            </h1>
                            <p style="margin: 10px 0 0; font-size: 13px; color: rgba(247, 202, 201, 0.7); letter-spacing: 3px; text-transform: uppercase; font-weight: 300;">
                                Password Reset Request
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Main Content -->
                    <tr>
                        <td style="padding: 40px 40px 20px; background: rgba(0, 0, 0, 0.3);">
                            <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: rgba(255, 255, 255, 0.9);">
                                Hello <strong style="color: #e8b4b8;">${userName}</strong>,
                            </p>
                            <p style="margin: 0 0 25px; font-size: 15px; line-height: 1.7; color: rgba(255, 255, 255, 0.85);">
                                We received a request to reset your password for your BILLIONAIRS account. Click the button below to create a new password:
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Reset Button -->
                    <tr>
                        <td style="padding: 20px 40px; text-align: center; background: rgba(0, 0, 0, 0.3);">
                            <a href="${resetLink}" style="display: inline-block; padding: 20px 55px; background: linear-gradient(135deg, #d4a59a 0%, #c9958b 100%); color: #FFFFFF; text-decoration: none; border-radius: 50px; font-weight: 700; font-size: 17px; letter-spacing: 3px; text-transform: uppercase; box-shadow: 0 10px 30px rgba(212, 165, 154, 0.5), 0 4px 12px rgba(0, 0, 0, 0.3); border: 3px solid #e8b4b8; text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);">
                                RESET PASSWORD
                            </a>
                        </td>
                    </tr>
                    
                    <!-- Security Info -->
                    <tr>
                        <td style="padding: 30px 40px; background: rgba(232, 180, 184, 0.08); border-top: 1px solid rgba(232, 180, 184, 0.2);">
                            <div style="background: rgba(255, 193, 7, 0.1); border-left: 4px solid #FFC107; padding: 20px; margin: 0; border-radius: 8px;">
                                <p style="margin: 0 0 10px; font-size: 14px; color: #FFC107; font-weight: 700; letter-spacing: 1px;">
                                    SECURITY NOTICE
                                </p>
                                <p style="margin: 0; font-size: 13px; line-height: 1.6; color: rgba(255, 255, 255, 0.75);">
                                    • This link expires in <strong style="color: #e8b4b8;">1 hour</strong><br/>
                                    • Link can only be used <strong style="color: #e8b4b8;">once</strong><br/>
                                    • If you didn't request this, ignore this email<br/>
                                    • Never share this link with anyone
                                </p>
                            </div>
                        </td>
                    </tr>
                    
                    <!-- Alternative Link -->
                    <tr>
                        <td style="padding: 20px 40px; background: rgba(0, 0, 0, 0.3);">
                            <p style="margin: 0 0 10px; font-size: 12px; color: rgba(255, 255, 255, 0.6);">
                                If the button doesn't work, copy and paste this link:
                            </p>
                            <p style="margin: 0; font-size: 11px; word-break: break-all; color: #e8b4b8;">
                                ${resetLink}
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Divider -->
                    <tr>
                        <td style="padding: 0 40px;">
                            <div style="height: 1px; background: linear-gradient(90deg, transparent, rgba(232, 180, 184, 0.5), transparent);"></div>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="padding: 40px; text-align: center; background: linear-gradient(180deg, transparent, rgba(0, 0, 0, 0.4));">
                            <p style="margin: 0 0 8px; font-family: 'Playfair Display', Georgia, serif; font-size: 16px; color: #e8b4b8; font-weight: 700; letter-spacing: 3px;">
                                BILLIONAIRS
                            </p>
                            <p style="margin: 0 0 15px; font-size: 11px; color: rgba(255, 255, 255, 0.5); letter-spacing: 2px; text-transform: uppercase;">
                                Exclusive Luxury Platform
                            </p>
                            <p style="margin: 0; font-size: 11px; color: rgba(255, 255, 255, 0.4); line-height: 1.6;">
                                © ${new Date().getFullYear()} BILLIONAIRS. All rights reserved.<br/>
                                This is an automated message. Please do not reply.
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
        subject: `Achievement Unlocked: ${eggName}`,
        html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=Montserrat:wght@300;400;600;700&display=swap');
    </style>
</head>
<body style="margin: 0; padding: 0; font-family: 'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; background: #000000;">
    <div style="display: none; max-height: 0; overflow: hidden;">
        You have unlocked a rare achievement on BILLIONAIRS. Only the select few reach this level.
    </div>
    
    <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(180deg, #000000 0%, #0a0a0a 50%, #1a1a1a 100%); padding: 60px 20px;">
        <tr>
            <td align="center">
                <table width="650" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, rgba(15, 15, 25, 0.98) 0%, rgba(25, 25, 40, 0.98) 100%); border-radius: 24px; border: 3px solid rgba(232, 180, 184, 0.5); box-shadow: 0 25px 50px rgba(0, 0, 0, 0.8), inset 0 1px 0 rgba(255, 255, 255, 0.1); overflow: hidden;">
                    
                    <!-- Header with Logo -->
                    <tr>
                        <td style="background: linear-gradient(135deg, rgba(232, 180, 184, 0.15) 0%, rgba(247, 202, 201, 0.05) 100%); padding: 50px 40px; text-align: center; border-bottom: 2px solid rgba(232, 180, 184, 0.4); position: relative;">
                            <div style="position: absolute; top: 20px; left: 20px; width: 40px; height: 40px; border-top: 3px solid #e8b4b8; border-left: 3px solid #e8b4b8; opacity: 0.6;"></div>
                            <div style="position: absolute; top: 20px; right: 20px; width: 40px; height: 40px; border-top: 3px solid #e8b4b8; border-right: 3px solid #e8b4b8; opacity: 0.6;"></div>
                            
                            <img src="https://billionairs.luxury/assets/images/logo.png" alt="BILLIONAIRS" style="max-width: 80px; height: auto; margin-bottom: 20px; filter: drop-shadow(0 0 30px rgba(232, 180, 184, 0.6));" />
                            
                            <p style="margin: 0 0 10px 0; font-size: 13px; color: rgba(247, 202, 201, 0.7); letter-spacing: 4px; text-transform: uppercase; font-weight: 300;">
                                Exclusive Discovery
                            </p>
                            <h1 style="margin: 0; font-family: 'Playfair Display', Georgia, serif; font-size: 36px; color: #e8b4b8; font-weight: 900; letter-spacing: 3px; text-transform: uppercase; text-shadow: 0 0 40px rgba(232, 180, 184, 0.5), 0 2px 4px rgba(0, 0, 0, 0.8);">
                                ACHIEVEMENT UNLOCKED
                            </h1>
                            <div style="width: 60px; height: 2px; background: linear-gradient(90deg, transparent, #e8b4b8, transparent); margin: 20px auto 0;"></div>
                        </td>
                    </tr>
                    
                    <!-- Body -->
                    <tr>
                        <td style="padding: 50px 40px 30px; color: #ffffff;">
                            <h2 style="margin: 0 0 25px 0; font-family: 'Playfair Display', Georgia, serif; font-size: 28px; color: #ffffff; font-weight: 700; text-align: center; line-height: 1.3;">
                                Congratulations, <span style="color: #e8b4b8;">${userName || 'Member'}</span>
                            </h2>
                            
                            <p style="margin: 0 0 30px 0; font-size: 16px; line-height: 1.9; color: rgba(255, 255, 255, 0.85); text-align: center; font-weight: 300;">
                                You have discovered something extraordinary. Only a select few will ever unlock this achievement.
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Achievement Card -->
                    <tr>
                        <td style="padding: 0 40px 40px;">
                            <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, rgba(232, 180, 184, 0.12) 0%, rgba(247, 202, 201, 0.05) 100%); border-radius: 16px; border: 2px solid rgba(232, 180, 184, 0.4); overflow: hidden; box-shadow: 0 10px 40px rgba(232, 180, 184, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1);">
                                <tr>
                                    <td style="padding: 35px 30px; text-align: center;">
                                        <h3 style="margin: 0 0 15px 0; font-family: 'Playfair Display', Georgia, serif; font-size: 24px; color: #e8b4b8; text-transform: uppercase; letter-spacing: 2px; font-weight: 700;">
                                            ${eggName}
                                        </h3>
                                        <div style="width: 40px; height: 1px; background: linear-gradient(90deg, transparent, rgba(232, 180, 184, 0.6), transparent); margin: 15px auto;"></div>
                                        <p style="margin: 0; font-size: 16px; color: rgba(255, 255, 255, 0.9); line-height: 1.7; font-weight: 300;">
                                            ${eggDescription}
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Quote -->
                    <tr>
                        <td style="padding: 0 40px 40px;">
                            <div style="background: rgba(0, 0, 0, 0.4); border-left: 3px solid #e8b4b8; padding: 25px 30px; border-radius: 8px;">
                                <p style="margin: 0; font-size: 15px; color: rgba(255, 255, 255, 0.75); font-style: italic; line-height: 1.7; font-weight: 300;">
                                    "In a world of billions, you are among the few who look beyond the surface."
                                </p>
                            </div>
                        </td>
                    </tr>
                    
                    <!-- CTA -->
                    <tr>
                        <td style="padding: 0 40px 50px; text-align: center;">
                            <p style="margin: 0 0 25px 0; font-size: 16px; line-height: 1.8; color: rgba(255, 255, 255, 0.85); font-weight: 300;">
                                Continue your journey. More secrets await those persistent enough to seek them.
                            </p>
                            
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center">
                                        <a href="https://billionairs.luxury/dashboard" style="display: inline-block; padding: 18px 50px; background: linear-gradient(135deg, #e8b4b8 0%, #f7cac9 50%, #e8b4b8 100%); color: #000000; text-decoration: none; border-radius: 50px; font-weight: 700; font-size: 15px; letter-spacing: 2px; text-transform: uppercase; box-shadow: 0 8px 25px rgba(232, 180, 184, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3); border: 2px solid rgba(232, 180, 184, 0.8);">
                                            Continue Exploring
                                        </a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Divider -->
                    <tr>
                        <td style="padding: 0 40px;">
                            <div style="height: 1px; background: linear-gradient(90deg, transparent, rgba(232, 180, 184, 0.5), transparent);"></div>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background: linear-gradient(180deg, transparent, rgba(0, 0, 0, 0.4)); padding: 40px 40px 50px; text-align: center;">
                            <p style="margin: 0 0 8px 0; font-family: 'Playfair Display', Georgia, serif; font-size: 16px; color: #e8b4b8; font-weight: 700; letter-spacing: 3px;">
                                BILLIONAIRS
                            </p>
                            <p style="margin: 0 0 15px 0; font-size: 11px; color: rgba(255, 255, 255, 0.5); letter-spacing: 2px; text-transform: uppercase;">
                                Luxury · Exclusivity · Mystique
                            </p>
                            <p style="margin: 0; font-size: 11px; color: rgba(255, 255, 255, 0.4); line-height: 1.6;">
                                Share this achievement? Keep it exclusive.<br/>
                                True value lies in rarity.
                            </p>
                            <div style="width: 100px; height: 1px; background: linear-gradient(90deg, transparent, rgba(232, 180, 184, 0.4), transparent); margin: 20px auto 15px;"></div>
                            <p style="margin: 0; font-size: 10px; color: rgba(255, 255, 255, 0.4);">
                                © ${new Date().getFullYear()} BILLIONAIRS. All rights reserved.
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
        subject: 'Payment Confirmed — Welcome to Exclusivity',
        html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=Montserrat:wght@300;400;600;700&display=swap');
    </style>
</head>
<body style="margin: 0; padding: 0; font-family: 'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; background: #000000;">
    <div style="display: none; max-height: 0; overflow: hidden;">
        Your payment has been confirmed. Welcome to the BILLIONAIRS elite circle.
    </div>
    
    <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(180deg, #000000 0%, #0a0a0a 50%, #1a1a1a 100%); padding: 60px 20px;">
        <tr>
            <td align="center">
                <table width="650" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, rgba(15, 15, 25, 0.98) 0%, rgba(25, 25, 40, 0.98) 100%); border-radius: 24px; border: 3px solid rgba(232, 180, 184, 0.5); box-shadow: 0 25px 50px rgba(0, 0, 0, 0.8), inset 0 1px 0 rgba(255, 255, 255, 0.1); overflow: hidden;">
                    
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, rgba(232, 180, 184, 0.15) 0%, rgba(247, 202, 201, 0.05) 100%); padding: 50px 40px; text-align: center; border-bottom: 2px solid rgba(232, 180, 184, 0.4); position: relative;">
                            <div style="position: absolute; top: 20px; left: 20px; width: 40px; height: 40px; border-top: 3px solid #e8b4b8; border-left: 3px solid #e8b4b8; opacity: 0.6;"></div>
                            <div style="position: absolute; top: 20px; right: 20px; width: 40px; height: 40px; border-top: 3px solid #e8b4b8; border-right: 3px solid #e8b4b8; opacity: 0.6;"></div>
                            
                            <img src="https://billionairs.luxury/assets/images/logo.png" alt="BILLIONAIRS" style="max-width: 80px; height: auto; margin-bottom: 20px; filter: drop-shadow(0 0 30px rgba(232, 180, 184, 0.6));" />
                            
                            <p style="margin: 0 0 10px 0; font-size: 13px; color: rgba(247, 202, 201, 0.7); letter-spacing: 4px; text-transform: uppercase; font-weight: 300;">
                                Transaction Confirmed
                            </p>
                            <h1 style="margin: 0; font-family: 'Playfair Display', Georgia, serif; font-size: 36px; color: #e8b4b8; font-weight: 900; letter-spacing: 3px; text-transform: uppercase; text-shadow: 0 0 40px rgba(232, 180, 184, 0.5), 0 2px 4px rgba(0, 0, 0, 0.8);">
                                PAYMENT CONFIRMED
                            </h1>
                            <div style="width: 60px; height: 2px; background: linear-gradient(90deg, transparent, #e8b4b8, transparent); margin: 20px auto 0;"></div>
                        </td>
                    </tr>
                    
                    <!-- Body -->
                    <tr>
                        <td style="padding: 50px 40px 30px; color: #ffffff;">
                            <h2 style="margin: 0 0 25px 0; font-family: 'Playfair Display', Georgia, serif; font-size: 28px; color: #ffffff; font-weight: 700; text-align: center; line-height: 1.3;">
                                Thank you, <span style="color: #e8b4b8;">${userName || 'Member'}</span>
                            </h2>
                            
                            <p style="margin: 0 0 30px 0; font-size: 16px; line-height: 1.9; color: rgba(255, 255, 255, 0.85); text-align: center; font-weight: 300;">
                                Your payment has been successfully processed. Full access has been granted to your account.
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Payment Details Card -->
                    <tr>
                        <td style="padding: 0 40px 40px;">
                            <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, rgba(232, 180, 184, 0.12) 0%, rgba(247, 202, 201, 0.05) 100%); border-radius: 16px; border: 2px solid rgba(232, 180, 184, 0.4); overflow: hidden; box-shadow: 0 10px 40px rgba(232, 180, 184, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1);">
                                <tr>
                                    <td style="background: linear-gradient(90deg, rgba(232, 180, 184, 0.25), rgba(247, 202, 201, 0.15)); padding: 20px 30px; border-bottom: 1px solid rgba(232, 180, 184, 0.3);">
                                        <h3 style="margin: 0; font-family: 'Playfair Display', Georgia, serif; font-size: 18px; color: #e8b4b8; font-weight: 700; letter-spacing: 1px; text-align: center;">
                                            Transaction Details
                                        </h3>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 25px 30px;">
                                        <table width="100%" cellpadding="10" cellspacing="0">
                                            <tr>
                                                <td style="color: rgba(255, 255, 255, 0.6); font-size: 12px; text-transform: uppercase; letter-spacing: 2px; font-weight: 600;">Product</td>
                                                <td style="color: #e8b4b8; font-weight: 600; text-align: right; font-size: 15px;">${productName}</td>
                                            </tr>
                                            <tr>
                                                <td colspan="2" style="padding: 0;"><div style="height: 1px; background: rgba(232, 180, 184, 0.15);"></div></td>
                                            </tr>
                                            <tr>
                                                <td style="color: rgba(255, 255, 255, 0.6); font-size: 12px; text-transform: uppercase; letter-spacing: 2px; font-weight: 600;">Amount</td>
                                                <td style="color: #e8b4b8; font-weight: 700; text-align: right; font-size: 18px;">${amount} ${currency}</td>
                                            </tr>
                                            <tr>
                                                <td colspan="2" style="padding: 0;"><div style="height: 1px; background: rgba(232, 180, 184, 0.15);"></div></td>
                                            </tr>
                                            <tr>
                                                <td style="color: rgba(255, 255, 255, 0.6); font-size: 12px; text-transform: uppercase; letter-spacing: 2px; font-weight: 600;">Status</td>
                                                <td style="color: #e8b4b8; font-weight: 700; text-align: right; font-size: 15px;">Confirmed</td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- CTA -->
                    <tr>
                        <td style="padding: 0 40px 50px; text-align: center;">
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center">
                                        <a href="https://billionairs.luxury/dashboard" style="display: inline-block; padding: 18px 50px; background: linear-gradient(135deg, #e8b4b8 0%, #f7cac9 50%, #e8b4b8 100%); color: #000000; text-decoration: none; border-radius: 50px; font-weight: 700; font-size: 15px; letter-spacing: 2px; text-transform: uppercase; box-shadow: 0 8px 25px rgba(232, 180, 184, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3); border: 2px solid rgba(232, 180, 184, 0.8);">
                                            Access Your Account
                                        </a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Divider -->
                    <tr>
                        <td style="padding: 0 40px;">
                            <div style="height: 1px; background: linear-gradient(90deg, transparent, rgba(232, 180, 184, 0.5), transparent);"></div>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background: linear-gradient(180deg, transparent, rgba(0, 0, 0, 0.4)); padding: 40px 40px 50px; text-align: center;">
                            <p style="margin: 0 0 8px 0; font-family: 'Playfair Display', Georgia, serif; font-size: 16px; color: #e8b4b8; font-weight: 700; letter-spacing: 3px;">
                                BILLIONAIRS
                            </p>
                            <p style="margin: 0 0 15px 0; font-size: 11px; color: rgba(255, 255, 255, 0.5); letter-spacing: 2px; text-transform: uppercase;">
                                Luxury · Exclusivity · Mystique
                            </p>
                            <p style="margin: 0 0 15px 0; font-size: 12px; color: rgba(255, 255, 255, 0.5);">
                                Receipt ID: ${Date.now()}
                            </p>
                            <p style="margin: 0; font-size: 12px; color: rgba(255, 255, 255, 0.5);">
                                Questions? <a href="mailto:support@billionairs.luxury" style="color: #e8b4b8; text-decoration: none; border-bottom: 1px solid rgba(232, 180, 184, 0.3);">support@billionairs.luxury</a>
                            </p>
                            <div style="width: 100px; height: 1px; background: linear-gradient(90deg, transparent, rgba(232, 180, 184, 0.4), transparent); margin: 20px auto 15px;"></div>
                            <p style="margin: 0; font-size: 10px; color: rgba(255, 255, 255, 0.4);">
                                © ${new Date().getFullYear()} BILLIONAIRS. All rights reserved.
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

    refund: (userName, amount, currency, refundId) => ({
        subject: 'Refund Processed — BILLIONAIRS',
        html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=Montserrat:wght@300;400;600;700&display=swap');
    </style>
</head>
<body style="margin: 0; padding: 0; font-family: 'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; background: #000000;">
    <div style="display: none; max-height: 0; overflow: hidden;">
        Your refund has been processed. The funds will be returned to your original payment method.
    </div>
    
    <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(180deg, #000000 0%, #0a0a0a 50%, #1a1a1a 100%); padding: 60px 20px;">
        <tr>
            <td align="center">
                <table width="650" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, rgba(15, 15, 25, 0.98) 0%, rgba(25, 25, 40, 0.98) 100%); border-radius: 24px; border: 3px solid rgba(232, 180, 184, 0.5); box-shadow: 0 25px 50px rgba(0, 0, 0, 0.8), inset 0 1px 0 rgba(255, 255, 255, 0.1); overflow: hidden;">
                    
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, rgba(232, 180, 184, 0.15) 0%, rgba(247, 202, 201, 0.05) 100%); padding: 50px 40px; text-align: center; border-bottom: 2px solid rgba(232, 180, 184, 0.4); position: relative;">
                            <div style="position: absolute; top: 20px; left: 20px; width: 40px; height: 40px; border-top: 3px solid #e8b4b8; border-left: 3px solid #e8b4b8; opacity: 0.6;"></div>
                            <div style="position: absolute; top: 20px; right: 20px; width: 40px; height: 40px; border-top: 3px solid #e8b4b8; border-right: 3px solid #e8b4b8; opacity: 0.6;"></div>
                            
                            <img src="https://billionairs.luxury/assets/images/logo.png" alt="BILLIONAIRS" style="max-width: 80px; height: auto; margin-bottom: 20px; filter: drop-shadow(0 0 30px rgba(232, 180, 184, 0.6));" />
                            
                            <p style="margin: 0 0 10px 0; font-size: 13px; color: rgba(247, 202, 201, 0.7); letter-spacing: 4px; text-transform: uppercase; font-weight: 300;">
                                Transaction Update
                            </p>
                            <h1 style="margin: 0; font-family: 'Playfair Display', Georgia, serif; font-size: 36px; color: #e8b4b8; font-weight: 900; letter-spacing: 3px; text-transform: uppercase; text-shadow: 0 0 40px rgba(232, 180, 184, 0.5), 0 2px 4px rgba(0, 0, 0, 0.8);">
                                REFUND PROCESSED
                            </h1>
                            <div style="width: 60px; height: 2px; background: linear-gradient(90deg, transparent, #e8b4b8, transparent); margin: 20px auto 0;"></div>
                        </td>
                    </tr>
                    
                    <!-- Body -->
                    <tr>
                        <td style="padding: 50px 40px 30px; color: #ffffff;">
                            <h2 style="margin: 0 0 25px 0; font-family: 'Playfair Display', Georgia, serif; font-size: 28px; color: #ffffff; font-weight: 700; text-align: center; line-height: 1.3;">
                                Dear <span style="color: #e8b4b8;">${userName || 'Member'}</span>,
                            </h2>
                            
                            <p style="margin: 0 0 30px 0; font-size: 16px; line-height: 1.9; color: rgba(255, 255, 255, 0.85); text-align: center; font-weight: 300;">
                                Your refund has been successfully processed. The funds will be returned to your original payment method within 5–10 business days.
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Refund Details Card -->
                    <tr>
                        <td style="padding: 0 40px 40px;">
                            <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, rgba(232, 180, 184, 0.12) 0%, rgba(247, 202, 201, 0.05) 100%); border-radius: 16px; border: 2px solid rgba(232, 180, 184, 0.4); overflow: hidden; box-shadow: 0 10px 40px rgba(232, 180, 184, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1);">
                                <tr>
                                    <td style="background: linear-gradient(90deg, rgba(232, 180, 184, 0.25), rgba(247, 202, 201, 0.15)); padding: 20px 30px; border-bottom: 1px solid rgba(232, 180, 184, 0.3);">
                                        <h3 style="margin: 0; font-family: 'Playfair Display', Georgia, serif; font-size: 18px; color: #e8b4b8; font-weight: 700; letter-spacing: 1px; text-align: center;">
                                            Refund Details
                                        </h3>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 25px 30px;">
                                        <table width="100%" cellpadding="10" cellspacing="0">
                                            <tr>
                                                <td style="color: rgba(255, 255, 255, 0.6); font-size: 12px; text-transform: uppercase; letter-spacing: 2px; font-weight: 600;">Refund Amount</td>
                                                <td style="color: #e8b4b8; font-weight: 700; text-align: right; font-size: 18px;">${amount} ${currency}</td>
                                            </tr>
                                            <tr>
                                                <td colspan="2" style="padding: 0;"><div style="height: 1px; background: rgba(232, 180, 184, 0.15);"></div></td>
                                            </tr>
                                            <tr>
                                                <td style="color: rgba(255, 255, 255, 0.6); font-size: 12px; text-transform: uppercase; letter-spacing: 2px; font-weight: 600;">Refund ID</td>
                                                <td style="color: rgba(255, 255, 255, 0.9); font-weight: 600; text-align: right; font-size: 14px;">${refundId}</td>
                                            </tr>
                                            <tr>
                                                <td colspan="2" style="padding: 0;"><div style="height: 1px; background: rgba(232, 180, 184, 0.15);"></div></td>
                                            </tr>
                                            <tr>
                                                <td style="color: rgba(255, 255, 255, 0.6); font-size: 12px; text-transform: uppercase; letter-spacing: 2px; font-weight: 600;">Status</td>
                                                <td style="color: #e8b4b8; font-weight: 700; text-align: right; font-size: 15px;">Processed</td>
                                            </tr>
                                            <tr>
                                                <td colspan="2" style="padding: 0;"><div style="height: 1px; background: rgba(232, 180, 184, 0.15);"></div></td>
                                            </tr>
                                            <tr>
                                                <td style="color: rgba(255, 255, 255, 0.6); font-size: 12px; text-transform: uppercase; letter-spacing: 2px; font-weight: 600;">Processing Time</td>
                                                <td style="color: rgba(255, 255, 255, 0.9); text-align: right; font-size: 14px;">5–10 business days</td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Notice -->
                    <tr>
                        <td style="padding: 0 40px 40px;">
                            <div style="background: rgba(0, 0, 0, 0.4); border-left: 3px solid #e8b4b8; padding: 25px 30px; border-radius: 8px;">
                                <p style="margin: 0 0 5px 0; font-size: 13px; color: #e8b4b8; font-weight: 700; letter-spacing: 1px; text-transform: uppercase;">
                                    Please Note
                                </p>
                                <p style="margin: 0; font-size: 14px; color: rgba(255, 255, 255, 0.75); line-height: 1.7; font-weight: 300;">
                                    The refund will appear in your account within 5–10 business days, depending on your bank or payment provider.
                                </p>
                            </div>
                        </td>
                    </tr>
                    
                    <!-- Contact -->
                    <tr>
                        <td style="padding: 0 40px 50px;">
                            <p style="margin: 0; font-size: 16px; line-height: 1.8; color: rgba(255, 255, 255, 0.85); text-align: center; font-weight: 300;">
                                If you have any questions about this refund, please do not hesitate to contact our support team.
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Divider -->
                    <tr>
                        <td style="padding: 0 40px;">
                            <div style="height: 1px; background: linear-gradient(90deg, transparent, rgba(232, 180, 184, 0.5), transparent);"></div>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background: linear-gradient(180deg, transparent, rgba(0, 0, 0, 0.4)); padding: 40px 40px 50px; text-align: center;">
                            <p style="margin: 0 0 8px 0; font-family: 'Playfair Display', Georgia, serif; font-size: 16px; color: #e8b4b8; font-weight: 700; letter-spacing: 3px;">
                                BILLIONAIRS
                            </p>
                            <p style="margin: 0 0 15px 0; font-size: 11px; color: rgba(255, 255, 255, 0.5); letter-spacing: 2px; text-transform: uppercase;">
                                Luxury · Exclusivity · Mystique
                            </p>
                            <p style="margin: 0; font-size: 12px; color: rgba(255, 255, 255, 0.5);">
                                Questions? <a href="mailto:support@billionairs.luxury" style="color: #e8b4b8; text-decoration: none; border-bottom: 1px solid rgba(232, 180, 184, 0.3);">support@billionairs.luxury</a>
                            </p>
                            <div style="width: 100px; height: 1px; background: linear-gradient(90deg, transparent, rgba(232, 180, 184, 0.4), transparent); margin: 20px auto 15px;"></div>
                            <p style="margin: 0; font-size: 10px; color: rgba(255, 255, 255, 0.4);">
                                © ${new Date().getFullYear()} BILLIONAIRS. All rights reserved.
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
                template = templates.welcome(data.userName, data.userEmail);
                break;
            case 'password-reset':
                template = templates['password-reset'](data.userName, data.resetLink);
                break;
            case 'easterEgg':
                template = templates.easterEggUnlock(data.userName, data.eggName, data.eggDescription);
                break;
            case 'payment':
                template = templates.paymentSuccess(data.userName, data.amount, data.currency, data.productName);
                break;
            case 'refund':
                template = templates.refund(data.userName, data.amount, data.currency, data.refundId);
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
            error: 'Internal server error' 
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
