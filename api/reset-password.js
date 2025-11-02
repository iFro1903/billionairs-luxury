const { neon } = require('@neondatabase/serverless');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Content-Type', 'application/json');
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { token, email, newPassword } = req.body;

    console.log('Reset password request received');
    console.log('Email:', email);
    console.log('Token length:', token?.length);
    console.log('Password length:', newPassword?.length);

    if (!token || !email || !newPassword) {
      return res.status(400).json({ 
        error: 'Token, E-Mail und neues Passwort sind erforderlich.' 
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ 
        error: 'Passwort muss mindestens 8 Zeichen lang sein.' 
      });
    }

    const sql = neon(process.env.DATABASE_URL);

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    console.log('Looking for token hash:', tokenHash);
    console.log('For email:', email.toLowerCase());

    const users = await sql`
      SELECT u.id, u.email, prt.token_hash, prt.expires_at, prt.used
      FROM users u
      INNER JOIN password_reset_tokens prt ON u.id = prt.user_id
      WHERE u.email = ${email.toLowerCase()}
      AND prt.token_hash = ${tokenHash}
      LIMIT 1
    `;

    console.log('Found users:', users.length);

    if (users.length === 0) {
      return res.status(400).json({ 
        error: 'Ungültiger oder abgelaufener Reset-Link.' 
      });
    }

    const user = users[0];

    if (user.used) {
      return res.status(400).json({ 
        error: 'Dieser Reset-Link wurde bereits verwendet.' 
      });
    }

    if (new Date(user.expires_at) < new Date()) {
      return res.status(400).json({ 
        error: 'Dieser Reset-Link ist abgelaufen. Bitte fordern Sie einen neuen an.' 
      });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    console.log('Updating password for user:', user.id);

    // Update password
    await sql`
      UPDATE users 
      SET password_hash = ${passwordHash}, 
          updated_at = NOW() 
      WHERE id = ${user.id}
    `;

    // Mark token as used
    await sql`
      UPDATE password_reset_tokens 
      SET used = true 
      WHERE user_id = ${user.id}
    `;

    console.log('Password reset successful for user:', user.id);

    return res.status(200).json({ 
      success: true,
      message: 'Passwort erfolgreich geändert. Sie können sich jetzt anmelden.' 
    });

  } catch (error) {
    console.error('Password reset error:', error);
    return res.status(500).json({ 
      error: 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.',
      details: error.message
    });
  }
};
