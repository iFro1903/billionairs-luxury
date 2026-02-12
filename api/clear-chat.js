import { neon } from '@neondatabase/serverless';

export const config = {
    runtime: 'edge'
};

// CORS: Only allow requests from our domain
function getCorsOrigin(req) {
    const origin = req.headers?.get?.('origin') || '';
    const allowed = ['https://billionairs.luxury', 'https://www.billionairs.luxury'];
    return allowed.includes(origin) ? origin : allowed[0];
}

const CEO_EMAIL = 'furkan_akaslan@hotmail.com';

export default async function handler(req) {
    // CORS
    if (req.method === 'OPTIONS') {
        return new Response(null, {
            status: 204,
            headers: {
                'Access-Control-Allow-Origin': getCorsOrigin(req),
                'Access-Control-Allow-Methods': 'DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
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
        const body = await req.json();
        
        // Only CEO can clear all chat
        if (body.ceoEmail !== CEO_EMAIL) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                status: 403,
                headers: { 'Content-Type': 'application/json' }
            });
        }

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
            message: error.message 
        }), {
            status: 500,
            headers: { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': getCorsOrigin(req)
            }
        });
    }
}
