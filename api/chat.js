import { neon } from '@neondatabase/serverless';
import { checkRateLimit, getClientIp, RATE_LIMITS } from '../lib/rate-limiter.js';
import { verifyPasswordSimple as verifyPassword } from '../lib/password-hash.js';

export const config = {
    runtime: 'edge',
};

// ═══════════════════════════════════════════════════════════
// SESSION AUTHENTICATION — Verify user is logged in & paid
// ═══════════════════════════════════════════════════════════

function getSessionToken(req) {
    const cookieHeader = req.headers.get('cookie') || '';
    const match = cookieHeader.match(/billionairs_session=([^;]+)/);
    return match ? match[1] : null;
}

async function validateSession(sql, token) {
    if (!token) return null;
    try {
        const result = await sql`
            SELECT s.user_id, u.email, u.full_name, u.has_paid, u.payment_status
            FROM sessions s
            JOIN users u ON s.user_id = u.id
            WHERE s.token = ${token} AND s.expires_at > NOW()
            LIMIT 1
        `;
        return result.length > 0 ? result[0] : null;
    } catch (e) {
        console.error('Session validation error:', e);
        return null;
    }
}

async function validateAdminAccess(req, sql) {
    const CEO_EMAIL = process.env.CEO_EMAIL || 'furkan_akaslan@hotmail.com';

    // Method 1: Check admin secret header
    const adminSecret = req.headers.get('x-admin-secret');
    if (adminSecret && adminSecret === process.env.ADMIN_API_SECRET) {
        return true;
    }
    
    // Method 2: Check admin email + password headers (used by admin panel)
    const adminEmail = req.headers.get('x-admin-email');
    const adminPassword = req.headers.get('x-admin-password');
    if (adminEmail && adminPassword && adminEmail.toLowerCase() === CEO_EMAIL.toLowerCase()) {
        const passwordHash = process.env.ADMIN_PASSWORD_HASH;
        if (passwordHash && (await verifyPassword(adminPassword, passwordHash))) {
            return true;
        }
    }

    // Method 3: Check if the session belongs to the CEO email
    const token = getSessionToken(req);
    if (token) {
        const session = await validateSession(sql, token);
        if (session && session.email && session.email.toLowerCase() === CEO_EMAIL.toLowerCase()) {
            return true;
        }
    }
    
    return false;
}

function authError(message) {
    return new Response(JSON.stringify({ error: message }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
    });
}

// ═══════════════════════════════════════════════════════════
// AES-256-GCM ENCRYPTION — Messages encrypted at rest
// CEO has transparent access via master key (server-side)
// ═══════════════════════════════════════════════════════════

async function getEncryptionKey() {
    const encoder = new TextEncoder();
    const passphrase = process.env.CHAT_ENCRYPTION_KEY;
    if (!passphrase) {
        throw new Error('CHAT_ENCRYPTION_KEY environment variable is not set. Cannot encrypt/decrypt messages.');
    }
    
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

            // Rate limit GET requests
            const clientIp = getClientIp(req);
            const rl = await checkRateLimit(clientIp, RATE_LIMITS.CHAT_GET.maxRequests, RATE_LIMITS.CHAT_GET.windowMs, RATE_LIMITS.CHAT_GET.endpoint);
            if (!rl.allowed) {
                return new Response(JSON.stringify({ error: RATE_LIMITS.CHAT_GET.message }), {
                    status: 429,
                    headers: {
                        'Content-Type': 'application/json',
                        'Retry-After': String(rl.retryAfter)
                    }
                });
            }

            // CEO request - requires admin authentication
            if (isCEORequest) {
                const isAdmin = await validateAdminAccess(req, sql);
                if (!isAdmin) {
                    return authError('Admin authentication required for CEO access');
                }

                try {
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
                        error: 'Database query failed' 
                    }), {
                        status: 200,
                        headers: { 'Content-Type': 'application/json' }
                    });
                }
            }

            // Regular user request — requires valid session
            const sessionToken = getSessionToken(req);
            const sessionUser = await validateSession(sql, sessionToken);
            
            if (!sessionUser) {
                return authError('Authentication required. Please log in.');
            }
            
            if (!sessionUser.has_paid && sessionUser.payment_status !== 'paid') {
                return authError('Payment required to access The Inner Circle chat.');
            }

            const email = sessionUser.email;

            // Session start filter — members only see messages from their login time onwards
            const since = url.searchParams.get('since');

            try {
                let messages;
                if (since) {
                    messages = await sql`
                        SELECT username, message, created_at, file_url, file_name, file_type, email, id
                        FROM chat_messages
                        WHERE created_at >= ${since}::timestamp
                        ORDER BY created_at ASC
                    `;
                } else {
                    messages = await sql`
                        SELECT username, message, created_at, file_url, file_name, file_type, email, id
                        FROM chat_messages
                        ORDER BY created_at ASC
                    `;
                }

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
                    error: 'Database query failed' 
                }), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' }
                });
            }
        }

        // POST: Send message (filter + encrypt before storing)
        if (req.method === 'POST') {
            // Rate limit POST requests
            const postIp = getClientIp(req);
            const rlPost = await checkRateLimit(postIp, RATE_LIMITS.CHAT_POST.maxRequests, RATE_LIMITS.CHAT_POST.windowMs, RATE_LIMITS.CHAT_POST.endpoint);
            if (!rlPost.allowed) {
                return new Response(JSON.stringify({ error: RATE_LIMITS.CHAT_POST.message }), {
                    status: 429,
                    headers: {
                        'Content-Type': 'application/json',
                        'Retry-After': String(rlPost.retryAfter)
                    }
                });
            }

            // Authenticate user via session cookie
            const postToken = getSessionToken(req);
            const postUser = await validateSession(sql, postToken);
            
            if (!postUser) {
                return authError('Authentication required. Please log in.');
            }
            
            if (!postUser.has_paid && postUser.payment_status !== 'paid') {
                return authError('Payment required to access The Inner Circle chat.');
            }

            const body = await req.json();
            const { username, message, fileUrl, fileName, fileType } = body;
            
            // Use email from validated session, not from request body
            const email = postUser.email;

            if (!username || (!message && !fileUrl)) {
                return new Response(JSON.stringify({ error: 'Missing required fields' }), {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            // Validate file URL (prevent XSS via malicious URLs)
            if (fileUrl && !fileUrl.startsWith('https://')) {
                return new Response(JSON.stringify({ error: 'Invalid file URL. Only HTTPS URLs are allowed.' }), {
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

                // Send push notifications to all other subscribed users (non-blocking)
                triggerChatPushNotifications(req.url, username, message, email).catch(err => {
                    console.error('Push notification error (non-blocking):', err);
                });

                return new Response(JSON.stringify({ success: true, encrypted: true }), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' }
                });
            } catch (dbError) {
                console.error('Chat insert error:', dbError);
                return new Response(JSON.stringify({ 
                    error: 'Failed to send message'
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
            error: 'Internal server error'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

// ═══════════════════════════════════════════════════════════
// PUSH NOTIFICATIONS — Trigger Node.js endpoint for VAPID push
// ═══════════════════════════════════════════════════════════

async function triggerChatPushNotifications(requestUrl, senderUsername, messageText, senderEmail) {
    try {
        // Derive base URL from the current request
        const url = new URL(requestUrl);
        const baseUrl = `${url.protocol}//${url.host}`;
        
        const response = await fetch(`${baseUrl}/api/send-chat-push`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                senderUsername,
                messageText,
                senderEmail
            })
        });
        
        if (response.ok) {
            const data = await response.json();
        }
    } catch (err) {
        console.error('triggerChatPushNotifications error:', err);
    }
}
