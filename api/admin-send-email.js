// Vercel Edge Function — CEO sends email to a member
import { neon } from '@neondatabase/serverless';
import { verifyPasswordSimple as verifyPassword } from '../lib/password-hash.js';

export const config = {
    runtime: 'edge'
};

const CEO_EMAIL = 'furkan_akaslan@hotmail.com';

export default async function handler(req) {
    // CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response(null, {
            status: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST,OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Email, X-Admin-Password'
            }
        });
    }

    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
            status: 405, headers: { 'Content-Type': 'application/json' }
        });
    }

    // Auth
    const adminEmail = (req.headers.get('x-admin-email') || '').trim();
    const adminPassword = (req.headers.get('x-admin-password') || '').trim();

    if (adminEmail.toLowerCase() !== CEO_EMAIL) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401, headers: { 'Content-Type': 'application/json' }
        });
    }

    const passwordHash = process.env.ADMIN_PASSWORD_HASH;
    if (!passwordHash || !(await verifyPassword(adminPassword, passwordHash))) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401, headers: { 'Content-Type': 'application/json' }
        });
    }

    try {
        const body = await req.json();
        const { to, subject, message } = body || {};

        if (!to || !subject || !message) {
            return new Response(JSON.stringify({ error: 'to, subject und message sind erforderlich' }), {
                status: 400, headers: { 'Content-Type': 'application/json' }
            });
        }

        // Validate recipient is a real email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(to)) {
            return new Response(JSON.stringify({ error: 'Ungültige Empfänger-Adresse' }), {
                status: 400, headers: { 'Content-Type': 'application/json' }
            });
        }

        // RESEND API
        const RESEND_API_KEY = process.env.RESEND_API_KEY;
        if (!RESEND_API_KEY) {
            return new Response(JSON.stringify({ error: 'Email service not configured' }), {
                status: 500, headers: { 'Content-Type': 'application/json' }
            });
        }

        // Fixed sender — ONLY elite@billionairs.luxury allowed
        const FROM = 'BILLIONAIRS Elite <elite@billionairs.luxury>';

        // Build HTML email
        const html = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:'Montserrat',-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;background:#000;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(180deg,#000 0%,#0a0a0a 50%,#1a1a1a 100%);padding:40px 20px;">
        <tr><td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
                <!-- Header -->
                <tr><td style="text-align:center;padding:30px 0 20px;">
                    <img src="https://billionairs.luxury/assets/images/logo.png" alt="BILLIONAIRS" style="max-width:120px;height:auto;margin-bottom:16px;filter:drop-shadow(0 0 20px rgba(232,196,168,0.5));" />
                    <h1 style="font-family:'Playfair Display',Georgia,serif;color:#E8C4A8;font-size:28px;margin:0;letter-spacing:3px;">BILLIONAIRS</h1>
                    <div style="width:60px;height:2px;background:linear-gradient(90deg,transparent,#E8C4A8,transparent);margin:12px auto;"></div>
                </td></tr>
                <!-- Content -->
                <tr><td style="background:rgba(255,255,255,.03);border:1px solid rgba(232,196,168,.15);border-radius:12px;padding:35px 30px;">
                    <h2 style="color:#E8C4A8;font-size:18px;margin:0 0 20px;font-weight:600;">${subject.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</h2>
                    <div style="color:#ccc;font-size:15px;line-height:1.7;white-space:pre-line;">${message.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</div>
                </td></tr>
                <!-- Footer -->
                <tr><td style="text-align:center;padding:25px 0 10px;">
                    <p style="color:#555;font-size:11px;margin:0;">© ${new Date().getFullYear()} BILLIONAIRS — Ultra-Luxury Membership</p>
                    <p style="color:#444;font-size:10px;margin:6px 0 0;">billionairs.luxury</p>
                </td></tr>
            </table>
        </td></tr>
    </table>
</body>
</html>`;

        // Send via Resend
        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${RESEND_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                from: FROM,
                to: [to],
                subject: subject,
                html: html
            })
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('Email send failed:', data);
            return new Response(JSON.stringify({ error: data.message || 'Email senden fehlgeschlagen' }), {
                status: 500, headers: { 'Content-Type': 'application/json' }
            });
        }

        // Audit log
        try {
            const sql = neon(process.env.DATABASE_URL);
            await sql`INSERT INTO admin_audit_log (action, user_email, details, ip, timestamp)
                       VALUES ('email_sent', ${to}, ${'Subject: ' + subject}, ${req.headers.get('x-forwarded-for') || 'unknown'}, NOW())`;
        } catch (logErr) {
            console.error('Audit log error:', logErr);
        }

        return new Response(JSON.stringify({ success: true, id: data.id }), {
            status: 200, headers: { 'Content-Type': 'application/json' }
        });

    } catch (err) {
        console.error('Email error:', err);
        return new Response(JSON.stringify({ error: 'Interner Fehler beim Email-Versand' }), {
            status: 500, headers: { 'Content-Type': 'application/json' }
        });
    }
}
