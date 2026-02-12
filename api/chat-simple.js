import { neon } from '@neondatabase/serverless';

export const config = {
    runtime: 'edge',
};

export default async function handler(req) {
    try {
        const dbUrl = process.env.POSTGRES_URL || process.env.DATABASE_URL;
        if (!dbUrl) {
            return new Response(JSON.stringify({ error: 'Database not configured' }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        const sql = neon(dbUrl);

        // GET: Load messages
        if (req.method === 'GET') {
            const url = new URL(req.url);
            const isCEORequest = url.searchParams.get('ceo') === 'true';

            // CEO request - return all messages
            if (isCEORequest) {
                try {
                    // Try to create table first
                    await sql`
                        CREATE TABLE IF NOT EXISTS chat_messages (
                            id SERIAL PRIMARY KEY,
                            username VARCHAR(255) NOT NULL,
                            message TEXT,
                            email VARCHAR(255),
                            file_url TEXT,
                            file_name VARCHAR(255),
                            file_type VARCHAR(100),
                            created_at TIMESTAMP DEFAULT NOW()
                        )
                    `;

                    const messages = await sql`
                        SELECT username, message, created_at, file_url, file_name, file_type, email, id
                        FROM chat_messages
                        ORDER BY created_at DESC
                        LIMIT 1000
                    `;

                    return new Response(JSON.stringify({ 
                        messages: messages || [], 
                        success: true 
                    }), {
                        status: 200,
                        headers: { 'Content-Type': 'application/json' }
                    });
                } catch (dbError) {
                    console.error('Chat CEO query error:', dbError);
                    return new Response(JSON.stringify({ 
                        messages: [], 
                        success: true,
                        error: 'Database query failed' 
                    }), {
                        status: 200,
                        headers: { 'Content-Type': 'application/json' }
                    });
                }
            }

            return new Response(JSON.stringify({ error: 'Email required' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
            status: 405,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Chat API error:', error);
        return new Response(JSON.stringify({ 
            error: 'Internal server error'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
