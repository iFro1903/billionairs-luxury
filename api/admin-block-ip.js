import { neon } from '@neondatabase/serverless';

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

    try {
        const sql = neon(process.env.DATABASE_URL);
        const { email, action, ip, reason } = await req.json();

        // CEO authentication check
        if (email.toLowerCase() !== CEO_EMAIL.toLowerCase()) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                status: 403,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Create table if not exists
        await sql`
            CREATE TABLE IF NOT EXISTS blocked_ips (
                id SERIAL PRIMARY KEY,
                ip_address VARCHAR(45) UNIQUE NOT NULL,
                reason TEXT,
                blocked_at TIMESTAMP DEFAULT NOW(),
                blocked_by VARCHAR(255),
                is_active BOOLEAN DEFAULT true
            )
        `;

        if (action === 'block') {
            // Block IP
            await sql`
                INSERT INTO blocked_ips (ip_address, reason, blocked_by, is_active)
                VALUES (${ip}, ${reason || 'Suspicious activity'}, ${email}, true)
                ON CONFLICT (ip_address) 
                DO UPDATE SET is_active = true, blocked_at = NOW(), reason = ${reason}
            `;

            return new Response(JSON.stringify({ 
                success: true,
                message: `IP ${ip} has been blocked`
            }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        } 
        
        else if (action === 'unblock') {
            // Unblock IP
            await sql`
                UPDATE blocked_ips 
                SET is_active = false 
                WHERE ip_address = ${ip}
            `;

            return new Response(JSON.stringify({ 
                success: true,
                message: `IP ${ip} has been unblocked`
            }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        else if (action === 'list') {
            // Get all blocked IPs
            const blocked = await sql`
                SELECT ip_address, reason, blocked_at, blocked_by, is_active
                FROM blocked_ips
                WHERE is_active = true
                ORDER BY blocked_at DESC
            `;

            return new Response(JSON.stringify({ blocked }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        return new Response(JSON.stringify({ error: 'Invalid action' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('IP blocking error:', error);
        return new Response(JSON.stringify({ 
            error: 'Operation failed',
            message: error.message 
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
