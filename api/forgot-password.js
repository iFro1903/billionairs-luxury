import { neon } from '@neondatabase/serverless';
import { checkRateLimit, getClientIp, RATE_LIMITS } from '../lib/rate-limiter.js';

export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Apply rate limiting
  const clientIp = getClientIp(req);
  const rateLimit = await checkRateLimit(clientIp, RATE_LIMITS.PASSWORD_RESET.maxRequests, RATE_LIMITS.PASSWORD_RESET.windowMs, RATE_LIMITS.PASSWORD_RESET.endpoint);
  
  const rateLimitHeaders = {
    'Content-Type': 'application/json',
    'X-RateLimit-Limit': RATE_LIMITS.PASSWORD_RESET.maxRequests.toString(),
    'X-RateLimit-Remaining': rateLimit.remaining.toString(),
    'X-RateLimit-Reset': new Date(rateLimit.resetAt).toISOString()
  };
  
  if (!rateLimit.allowed) {
    return new Response(JSON.stringify({ 
      error: RATE_LIMITS.PASSWORD_RESET.message,
      retryAfter: rateLimit.retryAfter
    }), {
      status: 429,
      headers: {
        ...rateLimitHeaders,
        'Retry-After': rateLimit.retryAfter.toString()
      }
    });
  }

  try {
    const { email } = await req.json();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Response(JSON.stringify({ 
        error: 'Please enter a valid email address.' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const sql = neon(process.env.DATABASE_URL);

    const users = await sql`SELECT id, email, first_name FROM users WHERE email = ${email.toLowerCase()} LIMIT 1`;

    if (users.length === 0) {
      return new Response(JSON.stringify({ 
        success: true,
        message: 'If an account exists with this email, a reset link has been sent.' 
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const user = users[0];
    
    // Generate reset token using Web Crypto API (Edge Runtime compatible)
    const tokenBytes = new Uint8Array(32);
    crypto.getRandomValues(tokenBytes);
    const resetToken = Array.from(tokenBytes).map(b => b.toString(16).padStart(2, '0')).join('');
    
    // Hash token using Web Crypto API
    const encoder = new TextEncoder();
    const data = encoder.encode(resetToken);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const resetTokenHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    const expiresAt = new Date(Date.now() + 3600000); // 1 hour

    await sql`INSERT INTO password_reset_tokens (user_id, token_hash, expires_at, used) 
              VALUES (${user.id}, ${resetTokenHash}, ${expiresAt}, false) 
              ON CONFLICT (user_id) 
              DO UPDATE SET token_hash = ${resetTokenHash}, expires_at = ${expiresAt}, used = false, created_at = NOW()`;

    const baseUrl = `https://${req.headers.get('host')}`;
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
      }
    } catch (emailError) {
      console.error('Email sending failed:', emailError.message);
    }

    return new Response(JSON.stringify({ 
      success: true,
      message: 'If an account exists with this email, a reset link has been sent.' 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Password reset request error:', error);
    return new Response(JSON.stringify({ 
      error: 'An error occurred. Please try again later.'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
