/**
 * Delete all users except CEO
 * Admin API endpoint
 */

import { neon } from '@neondatabase/serverless';

export const config = {
    runtime: 'edge'
};

export default async function handler(req) {
    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
            status: 405,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    try {
        const { adminEmail, adminPassword } = await req.json();

        // Verify admin credentials
        const sql = neon(process.env.DATABASE_URL);
        
        // Import password verification
        const { verifyPassword } = await import('../lib/password-hash.js');
        const passwordHash = process.env.ADMIN_PASSWORD_HASH;
        
        const isValidPassword = await verifyPassword(adminPassword, passwordHash);
        
        if (adminEmail !== 'furkan_akaslan@hotmail.com' || !isValidPassword) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Delete all users except CEO
        const ceoEmail = 'furkan_akaslan@hotmail.com';
        
        // Get count before deletion
        const beforeCount = await sql`
            SELECT COUNT(*) as count 
            FROM users 
            WHERE email != ${ceoEmail}
        `;
        
        // Delete users
        const result = await sql`
            DELETE FROM users 
            WHERE email != ${ceoEmail}
            RETURNING email
        `;
        
        // Log the action
        await sql`
            INSERT INTO audit_logs (action, user_email, details, ip_address, timestamp)
            VALUES (
                'bulk_user_deletion',
                ${adminEmail},
                ${JSON.stringify({ 
                    deleted_count: result.length,
                    kept_user: ceoEmail 
                })},
                ${req.headers.get('x-forwarded-for') || 'unknown'},
                NOW()
            )
        `;

        return new Response(JSON.stringify({ 
            success: true,
            deleted_count: result.length,
            deleted_users: result.map(u => u.email),
            message: `Successfully deleted ${result.length} users. CEO account preserved.`
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Delete users error:', error);
        return new Response(JSON.stringify({ 
            error: 'Failed to delete users',
            details: error.message 
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
