// Vercel Serverless Function for NDA Signature Storage
module.exports = async (req, res) => {
  const { getPool } = await import('../lib/db.js');
  const { logRequest, logSuccess, logError, logTimer } = await import('../lib/logger.js');
  const timer = logTimer('nda_signature');
  logRequest('nda-signature', req.method, { email: req.body?.email ? req.body.email.replace(/(.{2}).*@/, '$1***@') : undefined });

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    // Rate limiting
    const { checkRateLimit, getClientIp, RATE_LIMITS } = await import('../lib/rate-limiter.js');
    const clientIp = getClientIp(req);
    const rl = await checkRateLimit(clientIp, 10, 15 * 60 * 1000, 'nda_signature');
    if (!rl.allowed) {
      return res.status(429).json({
        success: false,
        error: 'Too many requests. Please try again later.',
        retryAfter: rl.retryAfter
      });
    }

    const { name, email, phone, company, signature, agreedAt, documentRef, userAgent } = req.body;

    // Validate required fields
    if (!name || !email || !signature) {
      return res.status(400).json({
        success: false,
        error: 'Name, email, and signature are required'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email address'
      });
    }

    // Validate signature is a data URL (base64 PNG)
    if (!signature.startsWith('data:image/png;base64,')) {
      return res.status(400).json({
        success: false,
        error: 'Invalid signature format'
      });
    }

    // Check signature size (max ~500KB base64 which is ~375KB image)
    if (signature.length > 700000) {
      return res.status(400).json({
        success: false,
        error: 'Signature image too large'
      });
    }

    const pool = getPool();
    let client;

    try {
      client = await pool.connect();

      // Create table if not exists
      await client.query(`
        CREATE TABLE IF NOT EXISTS nda_signatures (
          id SERIAL PRIMARY KEY,
          signature_id VARCHAR(64) UNIQUE NOT NULL,
          full_name VARCHAR(255) NOT NULL,
          email VARCHAR(255) NOT NULL,
          phone VARCHAR(50),
          company VARCHAR(255),
          signature_data TEXT NOT NULL,
          document_ref VARCHAR(50) DEFAULT 'BLX-NDA-2026',
          ip_address VARCHAR(45),
          user_agent TEXT,
          agreed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);

      // Generate unique signature ID
      const crypto = require('crypto');
      const signatureId = 'NDA-' + crypto.randomBytes(16).toString('hex').toUpperCase();

      // Store the signature
      await client.query(
        `INSERT INTO nda_signatures (signature_id, full_name, email, phone, company, signature_data, document_ref, ip_address, user_agent, agreed_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          signatureId,
          name,
          email.toLowerCase(),
          phone || null,
          company || null,
          signature,
          documentRef || 'BLX-NDA-2026',
          clientIp,
          userAgent || req.headers['user-agent'] || null,
          agreedAt || new Date().toISOString()
        ]
      );

      logSuccess('nda-signature', 'nda_signed', { signatureId, email: email.replace(/(.{2}).*@/, '$1***@') });

      // Send NDA confirmation email (non-blocking)
      try {
        const signedAt = new Date().toLocaleString('en-GB', { timeZone: 'Europe/Zurich' });
        const emailPayload = {
          type: 'nda-confirmation',
          to: email.toLowerCase(),
          userName: name,
          signatureId: signatureId,
          signedAt: signedAt
        };

        const baseUrl = req.headers['x-forwarded-proto'] 
            ? `${req.headers['x-forwarded-proto']}://${req.headers['x-forwarded-host'] || req.headers['host']}`
            : `https://${req.headers['host']}`;

        fetch(`${baseUrl}/api/email-service`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(emailPayload)
        }).catch(emailErr => {
          console.error('NDA confirmation email failed (non-blocking):', emailErr.message);
        });
      } catch (emailError) {
        console.error('NDA confirmation email setup error:', emailError.message);
      }

      timer.end();

      return res.status(200).json({
        success: true,
        signatureId: signatureId,
        message: 'NDA signed successfully'
      });

    } catch (dbError) {
      console.error('❌ Database error storing NDA signature:', dbError);
      if (client) {
        try { client.release(); } catch (e) {}
      }
      return res.status(500).json({
        success: false,
        error: 'Failed to store NDA signature. Please try again.'
      });
    } finally {
      if (client) {
        try { client.release(); } catch (e) {}
      }
      await pool.end();
    }

  } catch (error) {
    logError('nda-signature', error);
    timer.end();
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
};
