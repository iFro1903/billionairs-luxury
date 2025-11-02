const { neon } = require('@neondatabase/serverless');
const crypto = require('crypto');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email } = req.body;

    if (!email || !email.includes('@')) {
      return res.status(400).json({ 
        error: 'Bitte geben Sie eine gültige E-Mail-Adresse ein.' 
      });
    }

    const sql = neon(process.env.DATABASE_URL);

    const users = await sql`SELECT id, email, first_name FROM users WHERE email = ${email.toLowerCase()} LIMIT 1`;

    if (users.length === 0) {
      return res.status(200).json({ 
        success: true,
        message: 'Falls ein Konto mit dieser E-Mail existiert, wurde ein Reset-Link versendet.' 
      });
    }

    const user = users[0];
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
    const expiresAt = new Date(Date.now() + 3600000);

    await sql`INSERT INTO password_reset_tokens (user_id, token_hash, expires_at, used) VALUES (${user.id}, ${resetTokenHash}, ${expiresAt}, false) ON CONFLICT (user_id) DO UPDATE SET token_hash = ${resetTokenHash}, expires_at = ${expiresAt}, used = false, created_at = NOW()`;

    const baseUrl = `https://${req.headers.host}`;
    const resetLink = `${baseUrl}/reset-password.html?token=${resetToken}&email=${encodeURIComponent(email)}`;

    try {
      const emailServiceUrl = `${baseUrl}/api/email-service`;
      const emailResponse = await fetch(emailServiceUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'password-reset',
          to: email,
          userName: user.first_name || email,
          resetLink: resetLink
        })
      });

      if (!emailResponse.ok) {
        console.error('Email service error:', await emailResponse.text());
      } else {
        console.log('Password reset email sent successfully');
      }
    } catch (emailError) {
      console.error('Email sending failed:', emailError.message);
    }

    return res.status(200).json({ 
      success: true,
      message: 'Falls ein Konto mit dieser E-Mail existiert, wurde ein Reset-Link versendet.' 
    });

  } catch (error) {
    console.error('Password reset request error:', error);
    return res.status(500).json({ 
      error: 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.',
      details: error.message
    });
  }
};
