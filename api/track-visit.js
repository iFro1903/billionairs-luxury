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

export default async function handler(req) {
    // CORS
    if (req.method === 'OPTIONS') {
        return new Response(null, {
            status: 204,
            headers: {
                'Access-Control-Allow-Origin': getCorsOrigin(req),
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            }
        });
    }

    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
            status: 405,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    try {
        const dbUrl = process.env.POSTGRES_URL || process.env.DATABASE_URL;
        if (!dbUrl) throw new Error('No DB URL');
        const sql = neon(dbUrl);

        // Create table if not exists
        await sql`
            CREATE TABLE IF NOT EXISTS page_visits (
                id SERIAL PRIMARY KEY,
                page VARCHAR(255) NOT NULL DEFAULT '/',
                referrer TEXT,
                user_agent TEXT,
                country VARCHAR(10),
                device VARCHAR(20),
                session_id VARCHAR(64),
                user_email VARCHAR(255),
                visited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            )
        `;

        // Create index for fast date queries
        await sql`
            CREATE INDEX IF NOT EXISTS idx_page_visits_date ON page_visits (visited_at)
        `;

        let body = {};
        try {
            body = await req.json();
        } catch (e) {}

        const page = body.page || '/';
        const referrer = body.referrer || '';
        const userAgent = req.headers.get('user-agent') || '';
        const userEmail = body.email || null;

        // Simple device detection
        const isMobile = /Mobile|Android|iPhone|iPad/i.test(userAgent);
        const isTablet = /iPad|Tablet/i.test(userAgent);
        const device = isTablet ? 'tablet' : isMobile ? 'mobile' : 'desktop';

        // Session ID from body or generate
        const sessionId = body.sessionId || crypto.randomUUID().slice(0, 16);

        // Get country from Vercel header
        const country = req.headers.get('x-vercel-ip-country') || 'unknown';

        await sql`
            INSERT INTO page_visits (page, referrer, user_agent, country, device, session_id, user_email)
            VALUES (${page}, ${referrer}, ${userAgent}, ${country}, ${device}, ${sessionId}, ${userEmail})
        `;

        return new Response(JSON.stringify({ success: true, sessionId }), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': getCorsOrigin(req)
            }
        });

    } catch (error) {
        console.error('Track visit error:', error);
        return new Response(JSON.stringify({ success: false }), {
            status: 200, // Don't expose errors to frontend
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': getCorsOrigin(req)
            }
        });
    }
}
