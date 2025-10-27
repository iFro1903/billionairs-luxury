// Password Reset API
// Setzt neues Passwort mit Token
import { neon } from '@neondatabase/serverless';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

export const config = {
  runtime: 'edge'
};

export default async function handler(request) {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const { token, email, newPassword } = await request.json();

    // Validierung
    if (!token || !email || !newPassword) {
      return new Response(JSON.stringify({ 
        error: 'Token, E-Mail und neues Passwort sind erforderlich.' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (newPassword.length < 8) {
      return new Response(JSON.stringify({ 
        error: 'Passwort muss mindestens 8 Zeichen lang sein.' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const sql = neon(process.env.DATABASE_URL);

    // Hash den Token (wie beim Speichern)
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // Finde User und Token
    const users = await sql`
      SELECT u.id, u.email, prt.token_hash, prt.expires_at, prt.used
      FROM users u
      INNER JOIN password_reset_tokens prt ON u.id = prt.user_id
      WHERE u.email = ${email.toLowerCase()}
      AND prt.token_hash = ${tokenHash}
      LIMIT 1
    `;

    if (users.length === 0) {
      return new Response(JSON.stringify({ 
        error: 'Ungültiger oder abgelaufener Reset-Link.' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const user = users[0];

    // Prüfe ob Token bereits verwendet wurde
    if (user.used) {
      return new Response(JSON.stringify({ 
        error: 'Dieser Reset-Link wurde bereits verwendet.' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Prüfe ob Token abgelaufen ist
    if (new Date(user.expires_at) < new Date()) {
      return new Response(JSON.stringify({ 
        error: 'Dieser Reset-Link ist abgelaufen. Bitte fordern Sie einen neuen an.' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Hash neues Passwort
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Update Passwort und markiere Token als verwendet
    await sql`BEGIN`;
    
    try {
      await sql`
        UPDATE users 
        SET password_hash = ${passwordHash},
            updated_at = NOW()
        WHERE id = ${user.id}
      `;

      await sql`
        UPDATE password_reset_tokens
        SET used = true
        WHERE user_id = ${user.id}
      `;

      await sql`COMMIT`;

      return new Response(JSON.stringify({ 
        success: true,
        message: 'Passwort erfolgreich geändert. Sie können sich jetzt anmelden.' 
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });

    } catch (error) {
      await sql`ROLLBACK`;
      throw error;
    }

  } catch (error) {
    console.error('Password reset error:', error);
    return new Response(JSON.stringify({ 
      error: 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.',
      details: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
