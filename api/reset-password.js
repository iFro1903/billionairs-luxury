import { neon } from '@neondatabase/serverless';

export const config = {
  runtime: 'edge',
};

// Hash password with PBKDF2 (100k iterations, Edge Runtime compatible)
const PBKDF2_ITERATIONS = 100000;
async function hashPassword(password) {
    const saltBuffer = crypto.getRandomValues(new Uint8Array(16));
    const saltHex = Array.from(saltBuffer).map(b => b.toString(16).padStart(2, '0')).join('');
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
        'raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']
    );
    const derivedBits = await crypto.subtle.deriveBits(
        { name: 'PBKDF2', salt: saltBuffer, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
        keyMaterial, 256
    );
    const hashHex = Array.from(new Uint8Array(derivedBits)).map(b => b.toString(16).padStart(2, '0')).join('');
    return `pbkdf2$${PBKDF2_ITERATIONS}$${saltHex}$${hashHex}`;
}

export default async function handler(req) {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await req.json();
    const { token, email, newPassword } = body;

    console.log('Reset password request received');
    console.log('Email:', email);
    console.log('Token length:', token?.length);
    console.log('Password length:', newPassword?.length);

    if (!token || !email || !newPassword) {
      return new Response(JSON.stringify({ 
        error: 'Token, email and new password are required.' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (newPassword.length < 8) {
      return new Response(JSON.stringify({ 
        error: 'Password must be at least 8 characters long.' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const sql = neon(process.env.DATABASE_URL);

    // Hash token with Web Crypto API
    const encoder = new TextEncoder();
    const data = encoder.encode(token);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const tokenHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

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
      return new Response(JSON.stringify({ 
        error: 'Invalid or expired reset link.' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const user = users[0];

    if (user.used) {
      return new Response(JSON.stringify({ 
        error: 'This reset link has already been used.' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (new Date(user.expires_at) < new Date()) {
      return new Response(JSON.stringify({ 
        error: 'This reset link has expired. Please request a new one.' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Hash new password with Web Crypto API
    const passwordHash = await hashPassword(newPassword);

    console.log('Updating password for user:', user.id);

    // Update password
    await sql`
      UPDATE users 
      SET password_hash = ${passwordHash}
      WHERE id = ${user.id}
    `;

    console.log('Password updated successfully');

    // Mark token as used
    await sql`
      UPDATE password_reset_tokens 
      SET used = true 
      WHERE user_id = ${user.id} 
      AND token_hash = ${tokenHash}
    `;

    console.log('Password reset successful for user:', user.id);

    return new Response(JSON.stringify({ 
      success: true,
      message: 'Password successfully changed. You can now log in.' 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Password reset error:', error);
    return new Response(JSON.stringify({ 
      error: 'An error occurred. Please try again later.',
      details: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
