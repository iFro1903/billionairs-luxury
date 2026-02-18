import { neon } from '@neondatabase/serverless';
import { getCorsOrigin } from '../lib/cors.js';
import { verifyAdminSession } from '../lib/verify-admin.js';

export const config = {
    runtime: 'edge'
};

export default async function handler(req) {
    // CORS
    if (req.method === 'OPTIONS') {
        return new Response(null, {
            status: 204,
            headers: {
                'Access-Control-Allow-Origin': getCorsOrigin(req),
                'Access-Control-Allow-Methods': 'DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Cookie',
                'Access-Control-Allow-Credentials': 'true'
            }
        });
    }

    if (req.method !== 'DELETE') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
            status: 405,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    try {
        // Admin authentication (cookie + legacy fallback)
        const auth = await verifyAdminSession(req);
        if (!auth.authorized) return auth.response;

        const dbUrl = process.env.POSTGRES_URL || process.env.DATABASE_URL;
        if (!dbUrl) throw new Error('No DB URL');
        const sql = neon(dbUrl);

        // Count messages before deleting
        const countResult = await sql`SELECT COUNT(*) as count FROM chat_messages`;
        const deletedCount = parseInt(countResult[0].count);

        // Delete ALL chat messages
        await sql`DELETE FROM chat_messages`;

        return new Response(JSON.stringify({ 
            success: true, 
            deleted: deletedCount,
            message: `${deletedCount} messages deleted`
        }), {
            status: 200,
            headers: { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': getCorsOrigin(req)
            }
        });

    } catch (error) {
        console.error('Clear chat error:', error);
        return new Response(JSON.stringify({ 
            error: 'Failed to clear chat',
            message: 'Internal server error' 
        }), {
            status: 500,
            headers: { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': getCorsOrigin(req)
            }
        });
    }
}
