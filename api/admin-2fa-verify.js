// Two-Factor Auth Verification beim Login
import { neon } from '@neondatabase/serverless';

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
    const { email, code } = await request.json();

    if (!email || !code) {
      return new Response(JSON.stringify({ error: 'Email and code required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const sql = neon(process.env.DATABASE_URL);

    // Hole 2FA Config
    const result = await sql`
      SELECT secret, backup_codes, enabled FROM two_factor_auth
      WHERE user_email = ${email} AND enabled = true
      LIMIT 1
    `;

    if (result.length === 0) {
      return new Response(JSON.stringify({ 
        success: false,
        error: '2FA not enabled for this account'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { secret, backup_codes } = result[0];
    const backupCodesList = JSON.parse(backup_codes);

    // Verifiziere TOTP Code
    const isValidTOTP = verifyTOTP(secret, code);
    
    // Oder Backup Code
    const isValidBackup = backupCodesList.includes(code);

    if (isValidTOTP || isValidBackup) {
      // Wenn Backup Code verwendet, entferne ihn
      if (isValidBackup) {
        const updatedCodes = backupCodesList.filter(c => c !== code);
        await sql`
          UPDATE two_factor_auth
          SET backup_codes = ${JSON.stringify(updatedCodes)}
          WHERE user_email = ${email}
        `;
      }

      // Update last_used
      await sql`
        UPDATE two_factor_auth
        SET last_used = NOW()
        WHERE user_email = ${email}
      `;

      // Audit Log
      await logAudit(sql, {
        action: '2FA_LOGIN_SUCCESS',
        user: email,
        ip: request.headers.get('x-forwarded-for') || 'unknown',
        details: JSON.stringify({ 
          method: isValidBackup ? 'backup_code' : 'totp',
          remaining_backup_codes: isValidBackup ? backupCodesList.length - 1 : backupCodesList.length
        })
      });

      return new Response(JSON.stringify({ 
        success: true,
        message: '2FA verification successful'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } else {
      // Audit Log für fehlgeschlagenen Versuch
      await logAudit(sql, {
        action: '2FA_LOGIN_FAILED',
        user: email,
        ip: request.headers.get('x-forwarded-for') || 'unknown',
        details: JSON.stringify({ code_invalid: true })
      });

      return new Response(JSON.stringify({ 
        success: false,
        error: 'Invalid verification code'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

  } catch (error) {
    console.error('2FA verify error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

function verifyTOTP(secret, token, window = 1) {
  const time = Math.floor(Date.now() / 1000 / 30);
  
  for (let i = -window; i <= window; i++) {
    if (generateTOTP(secret, time + i) === token) {
      return true;
    }
  }
  return false;
}

function generateTOTP(secret, time) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = '';
  for (let i = 0; i < secret.length; i++) {
    const val = chars.indexOf(secret[i].toUpperCase());
    bits += val.toString(2).padStart(5, '0');
  }
  
  const bytes = new Uint8Array(Math.ceil(bits.length / 8));
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(bits.substr(i * 8, 8), 2);
  }

  const timeBytes = new Uint8Array(8);
  for (let i = 7; i >= 0; i--) {
    timeBytes[i] = time & 0xff;
    time = time >> 8;
  }

  const hash = simpleHmac(bytes, timeBytes);
  const offset = hash[hash.length - 1] & 0x0f;
  const binary = ((hash[offset] & 0x7f) << 24) |
                 ((hash[offset + 1] & 0xff) << 16) |
                 ((hash[offset + 2] & 0xff) << 8) |
                 (hash[offset + 3] & 0xff);
  
  const otp = binary % 1000000;
  return otp.toString().padStart(6, '0');
}

function simpleHmac(key, message) {
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
