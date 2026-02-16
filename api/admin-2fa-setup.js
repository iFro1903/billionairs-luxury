// Two-Factor Auth Setup für CEO
import { neon } from '@neondatabase/serverless';
import { verifyPasswordSimple as verifyPassword } from '../lib/password-hash.js';

export const config = {
  runtime: 'edge'
};

const CEO_EMAIL = 'furkan_akaslan@hotmail.com';

export default async function handler(request) {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const { email, password, action, code } = await request.json();

    // Verify credentials with Web Crypto API
    if (email !== CEO_EMAIL) {
      return new Response(JSON.stringify({ error: 'Invalid credentials' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const passwordHash = process.env.ADMIN_PASSWORD_HASH;
    if (!passwordHash) {
      console.error('ADMIN_PASSWORD_HASH not set');
      return new Response(JSON.stringify({ error: 'Server configuration error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const isValidPassword = await verifyPassword(password, passwordHash);
    if (!isValidPassword) {
      return new Response(JSON.stringify({ error: 'Invalid credentials' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const sql = neon(process.env.DATABASE_URL);

    // Erstelle 2fa_secrets Tabelle
    await sql`
      CREATE TABLE IF NOT EXISTS two_factor_auth (
        id SERIAL PRIMARY KEY,
        user_email VARCHAR(255) NOT NULL UNIQUE,
        secret VARCHAR(255) NOT NULL,
        backup_codes TEXT,
        enabled BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW(),
        last_used TIMESTAMP
      )
    `;

    if (action === 'generate') {
      // Generiere TOTP Secret (32 Zeichen Base32)
      const secret = generateSecret();
      
      // Generiere 10 Backup Codes
      const backupCodes = Array.from({ length: 10 }, () => 
        generateBackupCode()
      );

      // Speichere in DB (noch nicht enabled)
      await sql`
        INSERT INTO two_factor_auth (user_email, secret, backup_codes, enabled)
        VALUES (${email}, ${secret}, ${JSON.stringify(backupCodes)}, false)
        ON CONFLICT (user_email)
        DO UPDATE SET
          secret = ${secret},
          backup_codes = ${JSON.stringify(backupCodes)},
          created_at = NOW()
      `;

      // Generiere QR Code URL für Authenticator Apps
      const appName = 'Billionairs Luxury';
      const qrCodeUrl = `otpauth://totp/${encodeURIComponent(appName)}:${encodeURIComponent(email)}?secret=${secret}&issuer=${encodeURIComponent(appName)}`;

      // Audit Log
      await logAudit(sql, {
        action: '2FA_SETUP_STARTED',
        user: email,
        ip: request.headers.get('x-forwarded-for') || 'unknown',
        details: JSON.stringify({ step: 'secret_generated' })
      });

      return new Response(JSON.stringify({ 
        success: true,
        secret,
        qrCodeUrl,
        backupCodes,
        message: 'Scan the QR code with your authenticator app'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (action === 'verify') {

      // Hole Secret aus DB
      const result = await sql`
        SELECT secret FROM two_factor_auth
        WHERE user_email = ${email}
        LIMIT 1
      `;

      if (result.length === 0) {
        return new Response(JSON.stringify({ error: '2FA not set up' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const { secret } = result[0];
      const isValid = await verifyTOTP(secret, code);

      if (isValid) {
        // Aktiviere 2FA
        await sql`
          UPDATE two_factor_auth
          SET enabled = true, last_used = NOW()
          WHERE user_email = ${email}
        `;

        // Audit Log
        await logAudit(sql, {
          action: '2FA_ENABLED',
          user: email,
          ip: request.headers.get('x-forwarded-for') || 'unknown',
          details: JSON.stringify({ verified: true })
        });

        return new Response(JSON.stringify({ 
          success: true,
          message: '2FA enabled successfully'
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      } else {
        return new Response(JSON.stringify({ error: 'Invalid verification code' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    if (action === 'disable') {

      // Verifiziere Code oder Backup Code
      const result = await sql`
        SELECT secret, backup_codes FROM two_factor_auth
        WHERE user_email = ${email} AND enabled = true
        LIMIT 1
      `;

      if (result.length === 0) {
        return new Response(JSON.stringify({ error: '2FA not enabled' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const { secret, backup_codes } = result[0];
      const backupCodesList = JSON.parse(backup_codes);
      
      const isValidTOTP = await verifyTOTP(secret, code);
      const isValidBackup = backupCodesList.includes(code);

      if (isValidTOTP || isValidBackup) {
        await sql`
          UPDATE two_factor_auth
          SET enabled = false
          WHERE user_email = ${email}
        `;

        // Audit Log
        await logAudit(sql, {
          action: '2FA_DISABLED',
          user: email,
          ip: request.headers.get('x-forwarded-for') || 'unknown',
          details: JSON.stringify({ method: isValidBackup ? 'backup_code' : 'totp' })
        });

        return new Response(JSON.stringify({ 
          success: true,
          message: '2FA disabled'
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      } else {
        return new Response(JSON.stringify({ error: 'Invalid code' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    if (action === 'status') {
      const result = await sql`
        SELECT enabled FROM two_factor_auth
        WHERE user_email = ${email} AND enabled = true
        LIMIT 1
      `;

      return new Response(JSON.stringify({
        success: true,
        enabled: result.length > 0
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('2FA setup error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

function generateSecret() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let secret = '';
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  for (let i = 0; i < 32; i++) {
    secret += chars[array[i] % chars.length];
  }
  return secret;
}

function generateBackupCode() {
  const array = new Uint8Array(4);
  crypto.getRandomValues(array);
  return Array.from(array)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase();
}

// Proper TOTP using Web Crypto API (HMAC-SHA1) - RFC 6238 compliant
function base32Decode(base32) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = '';
  const cleaned = base32.replace(/[\s=-]/g, '').toUpperCase();
  for (let i = 0; i < cleaned.length; i++) {
    const val = chars.indexOf(cleaned[i]);
    if (val === -1) continue;
    bits += val.toString(2).padStart(5, '0');
  }
  const bytes = new Uint8Array(Math.floor(bits.length / 8));
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(bits.substr(i * 8, 8), 2);
  }
  return bytes;
}

async function generateTOTP(secret, timeStep) {
  const key = base32Decode(secret);
  const timeBuffer = new Uint8Array(8);
  let t = timeStep;
  for (let i = 7; i >= 0; i--) {
    timeBuffer[i] = t & 0xff;
    t = Math.floor(t / 256);
  }
  const cryptoKey = await crypto.subtle.importKey(
    'raw', key, { name: 'HMAC', hash: 'SHA-1' }, false, ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, timeBuffer);
  const hash = new Uint8Array(signature);
  const offset = hash[hash.length - 1] & 0x0f;
  const binary = ((hash[offset] & 0x7f) << 24) |
                 ((hash[offset + 1] & 0xff) << 16) |
                 ((hash[offset + 2] & 0xff) << 8) |
                 (hash[offset + 3] & 0xff);
  const otp = binary % 1000000;
  return otp.toString().padStart(6, '0');
}

async function verifyTOTP(secret, token, window = 2) {
  if (!secret || !token) return false;
  const codeStr = String(token).trim();
  if (codeStr.length !== 6 || !/^\d{6}$/.test(codeStr)) return false;
  const time = Math.floor(Date.now() / 1000 / 30);
  for (let i = -window; i <= window; i++) {
    const generated = await generateTOTP(secret, time + i);
    if (generated === codeStr) return true;
  }
  return false;
}

function simpleHmac(key, message) {
  // Legacy placeholder - no longer used, kept for compatibility
  const combined = new Uint8Array(key.length + message.length);
  combined.set(key);
  combined.set(message, key.length);
  const hash = new Uint8Array(20);
  for (let i = 0; i < 20; i++) {
    let sum = 0;
    for (let j = 0; j < combined.length; j++) {
      sum += combined[j] * (i + j + 1);
    }
    hash[i] = sum % 256;
  }
  return hash;
}

async function logAudit(sql, { action, user, ip, details }) {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id SERIAL PRIMARY KEY,
        action VARCHAR(100) NOT NULL,
        user_email VARCHAR(255),
        ip VARCHAR(100),
        details TEXT,
        timestamp TIMESTAMP DEFAULT NOW()
      )
    `;

    await sql`
      INSERT INTO audit_logs (action, user_email, ip, details)
      VALUES (${action}, ${user}, ${ip}, ${details})
    `;
  } catch (error) {
    console.error('Audit log error:', error);
  }
}
