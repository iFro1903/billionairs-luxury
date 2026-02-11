import { neon } from '@neondatabase/serverless';

export const config = {
    runtime: 'edge',
};

// ═══════════════════════════════════════════════════════════
// AES-256-GCM ENCRYPTION — Messages encrypted at rest
// CEO has transparent access via master key (server-side)
// ═══════════════════════════════════════════════════════════

async function getEncryptionKey() {
    const encoder = new TextEncoder();
    const passphrase = process.env.CHAT_ENCRYPTION_KEY || 'BILLIONAIRS_LUXURY_INNER_CIRCLE_E2E_2025';
    
    const keyMaterial = await crypto.subtle.importKey(
        'raw',
        encoder.encode(passphrase),
        'PBKDF2',
        false,
        ['deriveKey']
    );
    
    return await crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt: encoder.encode('billionairs-titanium-salt'),
            iterations: 100000,
            hash: 'SHA-256'
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
    );
}

async function encryptMessage(plaintext) {
    if (!plaintext) return plaintext;
    
    const key = await getEncryptionKey();
    const encoder = new TextEncoder();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    
    const encrypted = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        encoder.encode(plaintext)
    );
    
    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(encrypted), iv.length);
    
    return 'ENC:' + btoa(String.fromCharCode(...combined));
}

async function decryptMessage(ciphertext) {
    if (!ciphertext) return ciphertext;
    if (!ciphertext.startsWith('ENC:')) return ciphertext; // Legacy unencrypted
    
    try {
        const key = await getEncryptionKey();
        const combined = Uint8Array.from(atob(ciphertext.slice(4)), c => c.charCodeAt(0));
        
        const iv = combined.slice(0, 12);
        const data = combined.slice(12);
        
        const decrypted = await crypto.subtle.decrypt(
            { name: 'AES-GCM', iv },
            key,
            data
        );
        
        return new TextDecoder().decode(decrypted);
    } catch (e) {
        console.error('Decryption error:', e);
        return ciphertext; // Return raw if decryption fails
    }
}

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

            // CEO request - return all messages (decrypted, with email)
            if (isCEORequest) {
                try {
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

                    // Decrypt all messages for CEO
                    const decryptedMessages = await Promise.all(
                        (messages || []).map(async (msg) => ({
                            ...msg,
                            message: await decryptMessage(msg.message)
                        }))
                    );

                    return new Response(JSON.stringify({ 
                        messages: decryptedMessages, 
                        encrypted: true,
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

            // Regular user request
            const email = url.searchParams.get('email');
            if (!email) {
                return new Response(JSON.stringify({ error: 'Email required' }), {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            try {
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

                // Decrypt all messages for user
                const decryptedMessages = await Promise.all(
                    (messages || []).map(async (msg) => ({
                        ...msg,
                        message: await decryptMessage(msg.message),
                        email: undefined // Hide email from regular users
                    }))
                );

                return new Response(JSON.stringify({ 
                    messages: decryptedMessages, 
                    encrypted: true,
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

        // POST: Send message (encrypt before storing)
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
                // Encrypt the message before storing
                const encryptedMessage = message ? await encryptMessage(message) : '';

                await sql`
                    INSERT INTO chat_messages (username, message, email, file_url, file_name, file_type, created_at)
                    VALUES (${username}, ${encryptedMessage}, ${email}, ${fileUrl || null}, ${fileName || null}, ${fileType || null}, NOW())
                `;

                return new Response(JSON.stringify({ success: true, encrypted: true }), {
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
