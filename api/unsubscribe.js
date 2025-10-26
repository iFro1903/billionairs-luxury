// Unsubscribe from Marketing Emails - GDPR Compliance
// Users can opt-out of marketing emails by clicking link in email footer

import { neon } from '@neondatabase/serverless';

export const config = {
    runtime: 'edge'
};

export default async function handler(req) {
    if (req.method !== 'GET' && req.method !== 'POST') {
        return new Response('Method not allowed', { status: 405 });
    }

    const url = new URL(req.url);
    const email = url.searchParams.get('email');
    const token = url.searchParams.get('token');

    if (!email || !token) {
        return new Response(renderHTML('❌ Invalid unsubscribe link', 'error'), {
            status: 400,
            headers: { 'Content-Type': 'text/html; charset=utf-8' }
        });
    }

    try {
        const sql = neon(process.env.DATABASE_URL);

        // Simple token verification (email + 'unsubscribe')
        // In production, use proper JWT or signed tokens
        const expectedToken = await generateToken(email);
        if (token !== expectedToken) {
            return new Response(renderHTML('❌ Invalid unsubscribe token', 'error'), {
                status: 403,
                headers: { 'Content-Type': 'text/html; charset=utf-8' }
            });
        }

        // Update user preference
        const result = await sql`
            UPDATE users 
            SET marketing_emails = false 
            WHERE LOWER(email) = LOWER(${email})
            RETURNING email, marketing_emails
        `;

        if (result.length === 0) {
            return new Response(renderHTML('❌ Email not found', 'error'), {
                status: 404,
                headers: { 'Content-Type': 'text/html; charset=utf-8' }
            });
        }

        return new Response(renderHTML('✅ Successfully unsubscribed!', 'success', email), {
            status: 200,
            headers: { 'Content-Type': 'text/html; charset=utf-8' }
        });

    } catch (error) {
        console.error('Unsubscribe error:', error);
        return new Response(renderHTML('❌ Server error', 'error'), {
            status: 500,
            headers: { 'Content-Type': 'text/html; charset=utf-8' }
        });
    }
}

// Generate simple token (in production use JWT)
async function generateToken(email) {
    const data = email.toLowerCase() + 'unsubscribe_secret_2024';
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 16);
}

// HTML Template
function renderHTML(message, type, email = '') {
    const color = type === 'success' ? '#10b981' : '#ef4444';
    const icon = type === 'success' ? '✅' : '❌';
    
    return `
<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Unsubscribe - BILLIONAIRS</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #fff;
            padding: 20px;
        }
        .container {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 20px;
            padding: 40px;
            max-width: 500px;
            text-align: center;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .icon {
            font-size: 60px;
            margin-bottom: 20px;
        }
        h1 {
            font-size: 28px;
            margin-bottom: 16px;
            color: ${color};
        }
        p {
            font-size: 16px;
            color: #aaa;
            margin-bottom: 12px;
            line-height: 1.6;
        }
        .email {
            background: rgba(255, 255, 255, 0.1);
            padding: 12px;
            border-radius: 8px;
            margin: 20px 0;
            font-family: monospace;
            word-break: break-all;
        }
        .btn {
            display: inline-block;
            background: linear-gradient(135deg, #d4af37 0%, #f2d06b 100%);
            color: #000;
            padding: 14px 32px;
            border-radius: 10px;
            text-decoration: none;
            font-weight: 600;
            margin-top: 24px;
            transition: transform 0.2s;
        }
        .btn:hover { transform: scale(1.05); }
    </style>
</head>
<body>
    <div class="container">
        <div class="icon">${icon}</div>
        <h1>${message}</h1>
        ${email ? `
            <p>You will no longer receive marketing emails from BILLIONAIRS.</p>
            <div class="email">${email}</div>
            <p style="font-size: 14px; margin-top: 20px;">
                You will still receive important account notifications and payment confirmations.
            </p>
        ` : `
            <p>Please check the unsubscribe link in your email.</p>
        `}
        <a href="https://billionairs-luxury.vercel.app" class="btn">Back to Home</a>
    </div>
</body>
</html>
    `;
}
