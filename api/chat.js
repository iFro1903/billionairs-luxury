import { neon } from '@neondatabase/serverless';

export const config = {
    runtime: 'edge',
};

export default async function handler(req) {
    const sql = neon(process.env.DATABASE_URL);

    try {
        // GET: Load messages
        if (req.method === 'GET') {
            const url = new URL(req.url);
            const email = url.searchParams.get('email');
            const isCEORequest = url.searchParams.get('ceo') === 'true';

            // CEO request - no email needed
            if (isCEORequest) {
                const messages = await sql`
                    SELECT username, message, created_at, file_url, file_name, file_type, email, id
                    FROM chat_messages
                    ORDER BY created_at DESC
                    LIMIT 1000
                `;

                return new Response(JSON.stringify({ messages }), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            if (!email) {
                return new Response(JSON.stringify({ error: 'Email required' }), {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            // Verify user has chat access
            const user = await sql`
                SELECT chat_ready, chat_opened_at 
                FROM users 
                WHERE email = ${email}
            `;

            if (!user || user.length === 0) {
                return new Response(JSON.stringify({ error: 'User not found' }), {
                    status: 404,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            if (!user[0].chat_ready) {
                return new Response(JSON.stringify({ error: 'Chat not unlocked yet' }), {
                    status: 403,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            // Get messages from last 7 days only (performance optimization)
            // CEO can see more, regular users see limited amount
            let messages;
            
            // Check if user is CEO
            const isCEO = email === 'furkan_akaslan@hotmail.com';
            
            if (isCEO) {
                // CEO sees last 30 days (more context, but still limited)
                messages = await sql`
                    SELECT username, message, created_at, file_url, file_name, file_type
                    FROM chat_messages
                    WHERE created_at >= NOW() - INTERVAL '30 days'
                    ORDER BY created_at DESC
                    LIMIT 200
                `;
            } else {
                // Regular users see last 7 days, max 100 messages
                messages = await sql`
                    SELECT username, message, created_at, file_url, file_name, file_type
                    FROM chat_messages
                    WHERE created_at >= NOW() - INTERVAL '7 days'
                    ORDER BY created_at DESC
                    LIMIT 100
                `;
            }

            // Reverse to show oldest first
            messages.reverse();

            // Count online users (active in last 5 minutes)
            const onlineUsers = await sql`
                SELECT COUNT(DISTINCT email) as count
                FROM users
                WHERE last_seen > NOW() - INTERVAL '5 minutes'
                AND chat_ready = TRUE
            `;

            return new Response(JSON.stringify({
                success: true,
                messages: messages,
                onlineCount: parseInt(onlineUsers[0].count) || 1
            }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // POST: Send message
        if (req.method === 'POST') {
            const body = await req.json();
            const { email, username, message, fileUrl, fileName, fileType } = body;

            if (!email || !username) {
                return new Response(JSON.stringify({ error: 'Missing required fields' }), {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            // Must have either message or file
            if (!message && !fileUrl) {
                return new Response(JSON.stringify({ error: 'Message or file required' }), {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            // Verify user has chat access
            const user = await sql`
                SELECT chat_ready 
                FROM users 
                WHERE email = ${email}
            `;

            if (!user || user.length === 0 || !user[0].chat_ready) {
                return new Response(JSON.stringify({ error: 'Chat access denied' }), {
                    status: 403,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            // Insert message with optional file data
            await sql`
                INSERT INTO chat_messages (email, username, message, file_url, file_name, file_type)
                VALUES (${email}, ${username}, ${message || ''}, ${fileUrl || null}, ${fileName || null}, ${fileType || null})
            `;

            // Update user's last_seen
            await sql`
                UPDATE users
                SET last_seen = NOW()
                WHERE email = ${email}
            `;

            return new Response(JSON.stringify({ success: true }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
            status: 405,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Chat API error:', error);
        return new Response(JSON.stringify({ error: 'Internal server error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
