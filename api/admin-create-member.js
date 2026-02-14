import { neon } from '@neondatabase/serverless';
import { hashPassword, verifyPasswordSimple as verifyPassword } from '../lib/password-hash.js';
import { generateMemberId } from '../lib/helpers.js';

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

    // Admin authentication
    const adminEmail = req.headers.get('x-admin-email');
    const adminPassword = req.headers.get('x-admin-password');

    if (adminEmail !== CEO_EMAIL) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    const passwordHash = process.env.ADMIN_PASSWORD_HASH;
    if (!passwordHash || !(await verifyPassword(adminPassword, passwordHash))) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    try {
        const body = await req.json();
        const { email, password, fullName, markAsPaid } = body;

        if (!email || !password) {
            return new Response(JSON.stringify({ error: 'Email and password are required' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Validate email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return new Response(JSON.stringify({ error: 'Invalid email format' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        if (password.length < 8) {
            return new Response(JSON.stringify({ error: 'Password must be at least 8 characters' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const sql = neon(process.env.DATABASE_URL);

        // Check if user already exists
        const existing = await sql`SELECT id FROM users WHERE email = ${email}`;
        if (existing.length > 0) {
            return new Response(JSON.stringify({ error: 'User with this email already exists' }), {
                status: 409,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Hash password
        const hashedPassword = await hashPassword(password);
        const memberId = generateMemberId();
        const paymentStatus = markAsPaid ? 'paid' : 'pending';
        const hasPaid = markAsPaid ? true : false;

        // Create user
        await sql`
            INSERT INTO users (email, password_hash, member_id, payment_status, has_paid, full_name, paid_at)
            VALUES (
                ${email}, 
                ${hashedPassword}, 
                ${memberId}, 
                ${paymentStatus}, 
                ${hasPaid}, 
                ${fullName || null},
                ${markAsPaid ? new Date().toISOString() : null}
            )
        `;

        return new Response(JSON.stringify({
            success: true,
            message: `Member ${email} created successfully`,
            member: {
                email,
                memberId,
                fullName: fullName || '',
                paymentStatus,
                hasPaid
            }
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Admin create member error:', error);
        return new Response(JSON.stringify({ 
            error: 'Failed to create member',
            details: error.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
