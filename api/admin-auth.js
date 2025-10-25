import { neon } from '@neondatabase/serverless';
import { withLoginRateLimit, resetLoginAttempts } from '../lib/rate-limiter.js';

export const config = {
    runtime: 'edge'
};

const CEO_EMAIL = 'furkan_akaslan@hotmail.com';

export default async function handler(req) {
    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
            status: 405,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    // Rate Limiting für Login: 5 Versuche/15 Minuten
    return withLoginRateLimit(req, async () => {
        try {
            const { email, password } = await req.json();

        // CEO email check
        if (email.toLowerCase() !== CEO_EMAIL.toLowerCase()) {
            return new Response(JSON.stringify({ error: 'Access denied' }), {
                status: 403,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Check password first (no database needed)
        const correctPassword = 'Masallah1,';
        if (password !== correctPassword) {
            return new Response(JSON.stringify({ error: 'Invalid password' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Password is correct, reset login attempts
        resetLoginAttempts(req);
        
        return new Response(JSON.stringify({ 
            email: email.toLowerCase(),
            name: 'CEO'
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Admin auth error:', error);
        return new Response(JSON.stringify({ error: 'Authentication failed' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
    });
}
