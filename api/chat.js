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
                        ORDER BY created_at ASC
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
                        error: dbError.message 
                    }), {
                        status: 200,
                        headers: { 'Content-Type': 'application/json' }
                    });
                }
            }

            // Regular user request - return all messages (chat is for everyone)
            const email = url.searchParams.get('email');
            if (!email) {
                return new Response(JSON.stringify({ error: 'Email required' }), {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

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
                    ORDER BY created_at ASC
                `;

                return new Response(JSON.stringify({ 
                    messages: messages || [], 
                    success: true 
                }), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' }
                });
            } catch (dbError) {
                console.error('Chat query error:', dbError);
                return new Response(JSON.stringify({ 
                    messages: [], 
                    success: true,
                    error: dbError.message 
                }), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' }
                });
            }
        }

        // POST: Send message
        if (req.method === 'POST') {
            const body = await req.json();
            const { email, username, message, fileUrl, fileName, fileType } = body;

            if (!email || !username || (!message && !fileUrl)) {
                return new Response(JSON.stringify({ error: 'Missing required fields' }), {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            try {
                await sql`
                    INSERT INTO chat_messages (username, message, email, file_url, file_name, file_type, created_at)
                    VALUES (${username}, ${message || ''}, ${email}, ${fileUrl || null}, ${fileName || null}, ${fileType || null}, NOW())
                `;

                return new Response(JSON.stringify({ success: true }), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' }
                });
            } catch (dbError) {
                console.error('Chat insert error:', dbError);
                return new Response(JSON.stringify({ 
                    error: 'Failed to send message',
                    details: dbError.message 
                }), {
                    status: 500,
                    headers: { 'Content-Type': 'application/json' }
                });
            }
        }

        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
            status: 405,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Chat API error:', error);
        return new Response(JSON.stringify({ 
            error: 'Internal server error',
            message: error.message,
            stack: error.stack
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
