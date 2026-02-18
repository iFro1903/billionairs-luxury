// Delete a single chat message — Edge Runtime (Vercel)
import { neon } from '@neondatabase/serverless';
import { verifyAdminSession } from '../lib/verify-admin.js';

export const config = { runtime: 'edge' };

export default async function handler(req) {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Cookie',
        'Content-Type': 'application/json'
    };

    if (req.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers: corsHeaders });
    }

    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: corsHeaders });
    }

    try {
        // Admin authentication (cookie + legacy header fallback)
        const auth = await verifyAdminSession(req);
        if (!auth.authorized) return auth.response;

        const { messageId } = await req.json();
        if (!messageId) {
            return new Response(JSON.stringify({ error: 'Message ID required' }), { status: 400, headers: corsHeaders });
        }

        const sql = neon(process.env.DATABASE_URL);
        const result = await sql`DELETE FROM chat_messages WHERE id = ${messageId} RETURNING id`;

        if (result.length === 0) {
            return new Response(JSON.stringify({ error: 'Message not found' }), { status: 404, headers: corsHeaders });
        }

        return new Response(JSON.stringify({ success: true, message: `Nachricht #${messageId} geloescht` }), { status: 200, headers: corsHeaders });
    } catch (error) {
        console.error('Delete message error:', error);
        return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500, headers: corsHeaders });
    }
}
