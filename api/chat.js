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

// ═══════════════════════════════════════════════════════════
// CONTENT MODERATION — Server-side personal info filter
// ═══════════════════════════════════════════════════════════

function checkPersonalInfo(text) {
    if (!text) return null;
    
    // Email
    if (/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/i.test(text)) return 'email address';
    
    // Phone (7+ digits)
    if (/(?:\+?\d{1,4}[\s\-.]?)?(?:\(?\d{2,5}\)?[\s\-.]?)?\d{3,}[\s\-.]?\d{2,}/g.test(text) &&
        text.replace(/[^\d]/g, '').length >= 7) return 'phone number';
    
    // Instagram
    if (/(?:instagram\.com\/|@[a-zA-Z0-9._]{3,}|\b(?:insta|ig)\s*[:=]|\bmein\s*(?:insta|ig)\b|\bmy\s*(?:insta|ig)\b|\bfollow\s*(?:me|mich)\b)/i.test(text)) return 'Instagram';
    
    // Twitter/X
    if (/(?:twitter\.com\/|x\.com\/[a-zA-Z0-9_]|\btwitter\s*[:=]|\bmein\s*twitter\b|\bmy\s*twitter\b)/i.test(text)) return 'Twitter/X';
    
    // Snapchat
    if (/(?:snapchat\.com\/|\bsnapchat\s*[:=]|\bsnap\s*[:=]|\bmein\s*snap(?:chat)?\b|\bmy\s*snap(?:chat)?\b|\badd\s*(?:me|mich)\s*(?:on|auf)\s*snap)/i.test(text)) return 'Snapchat';
    
    // TikTok
    if (/(?:tiktok\.com\/@|\btiktok\s*[:=]|\bmein\s*tiktok\b|\bmy\s*tiktok\b)/i.test(text)) return 'TikTok';
    
    // WhatsApp / Telegram / Signal
    if (/(?:wa\.me\/|\bwhatsapp\s*[:=]|\btelegram\s*[:=]|\bsignal\s*[:=]|\bschreib\s*(?:mir|mich)\s*(?:auf|per|über)\s*(?:whatsapp|telegram|signal)|\bmessage\s*me\s*on\s*(?:whatsapp|telegram|signal))/i.test(text)) return 'WhatsApp/Telegram';
    
    // Discord
    if (/(?:discord\.gg\/|\bdiscord\s*[:=]|\bmein\s*discord\b|\bmy\s*discord\b)/i.test(text)) return 'Discord';
    
    // Facebook / LinkedIn
    if (/(?:facebook\.com\/|fb\.com\/|linkedin\.com\/in\/|\bfacebook\s*[:=]|\blinkedin\s*[:=])/i.test(text)) return 'Facebook/LinkedIn';
    
    // YouTube
    if (/(?:youtube\.com\/(?:c\/|channel\/|@)|youtu\.be\/|\byoutube\s*[:=]|\bmein\s*(?:youtube|kanal)\b|\bmy\s*(?:youtube|channel)\b)/i.test(text)) return 'YouTube';
    
    // Generic URLs
    if (/(?:https?:\/\/|www\.)[a-zA-Z0-9\-]+\.[a-zA-Z]{2,}/i.test(text)) return 'link/URL';
    
    // Physical addresses (DE/EN)
    if (/(?:\b\d{4,5}\s+[A-ZÄÖÜ][a-zäöüß]+|\b[\wäöüß]+(?:straße|strasse|str\.|gasse|weg|allee|platz|ring|damm)\s+\d|\b\d+\s+(?:street|road|avenue|drive|lane|blvd)\b)/i.test(text)) return 'address';
    
    return null;
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

        // POST: Send message (filter + encrypt before storing)
        if (req.method === 'POST') {
            const body = await req.json();
            const { email, username, message, fileUrl, fileName, fileType } = body;

            if (!email || !username || (!message && !fileUrl)) {
                return new Response(JSON.stringify({ error: 'Missing required fields' }), {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            // Server-side content moderation (second layer)
            if (message) {
                const blockedType = checkPersonalInfo(message);
                if (blockedType) {
                    return new Response(JSON.stringify({ 
                        blocked: true, 
                        blockedType: blockedType,
                        error: 'Personal information is not allowed in The Inner Circle' 
                    }), {
                        status: 200,
                        headers: { 'Content-Type': 'application/json' }
                    });
                }
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
