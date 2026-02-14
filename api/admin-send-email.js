// Vercel Serverless Function — CEO sends email to a member
// Sender is ALWAYS elite@billionairs.luxury, no other address allowed

module.exports = async (req, res) => {
    const { getPool } = await import('../lib/db.js');
    const { getCorsOrigin } = await import('../lib/cors.js');

    async function verifyAdmin(pool, email, password) {
        const client = await pool.connect();
        try {
            const result = await client.query(
                'SELECT password FROM users WHERE LOWER(email) = LOWER($1)',
                [email]
            );
            if (!result.rows.length) return false;
            return result.rows[0].password === password;
        } finally {
            client.release();
        }
    }

    // CORS
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', getCorsOrigin(req));
    res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Admin-Email, X-Admin-Password');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    // Auth
    const adminEmail = (req.headers['x-admin-email'] || '').trim();
    const adminPassword = (req.headers['x-admin-password'] || '').trim();

    if (adminEmail.toLowerCase() !== 'furkan_akaslan@hotmail.com') {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const pool = getPool();
    try {
    const isValid = await verifyAdmin(pool, adminEmail, adminPassword);
    if (!isValid) {
        await pool.end();
        return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Body
    const { to, subject, message } = req.body || {};

    if (!to || !subject || !message) {
        return res.status(400).json({ error: 'to, subject und message sind erforderlich' });
    }

    // Validate recipient is a real email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to)) {
        return res.status(400).json({ error: 'Ungültige Empfänger-Adresse' });
    }

    // RESEND API
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    if (!RESEND_API_KEY) {
        return res.status(500).json({ error: 'Email service not configured' });
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

    try {
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
            return res.status(500).json({ error: data.message || 'Email senden fehlgeschlagen' });
        }

        // Audit log
        try {
            const client = await pool.connect();
            await client.query(
                `INSERT INTO admin_audit_log (action, user_email, details, ip, timestamp)
                 VALUES ($1, $2, $3, $4, NOW())`,
                ['email_sent', to, `Subject: ${subject}`, req.headers['x-forwarded-for'] || 'unknown']
            );
            client.release();
        } catch (logErr) {
            console.error('Audit log error:', logErr);
        }

        return res.status(200).json({ success: true, id: data.id });

    } catch (err) {
        console.error('Email error:', err);
        return res.status(500).json({ error: 'Interner Fehler beim Email-Versand' });
    } finally {
        await pool.end();
    }
    } catch (poolErr) {
        console.error('Pool error:', poolErr);
        return res.status(500).json({ error: 'Database connection error' });
    }
};
