export const config = {
    runtime: 'edge',
};

import postgres from 'postgres';

export default async function handler(req) {
    // CORS headers
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Content-Type': 'application/json',
    };

    if (req.method === 'OPTIONS') {
        return new Response(null, { status: 200, headers });
    }

    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), { 
            status: 405, 
            headers 
        });
    }

    try {
        const sql = postgres(process.env.DATABASE_URL, { ssl: 'require' });
        const { action, feature, email } = await req.json();

        // Verify admin authentication
        const authHeader = req.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
                status: 401, 
                headers 
            });
        }

        const token = authHeader.substring(7);
        const adminUser = await sql`
            SELECT email, is_admin FROM users WHERE email = ${token} AND is_admin = TRUE
        `;

        if (!adminUser || adminUser.length === 0) {
            return new Response(JSON.stringify({ error: 'Admin access required' }), { 
                status: 403, 
                headers 
            });
        }

        // Handle different actions
        if (action === 'unlock-all' || action === 'lock-all') {
            const unlockValue = action === 'unlock-all';
            
            let updateQuery;
            if (feature === 'pyramid') {
                updateQuery = sql`
                    UPDATE users 
                    SET pyramid_unlocked = ${unlockValue},
                        pyramid_opened_at = ${unlockValue ? sql`NOW()` : null}
                    WHERE email != ${adminUser[0].email}
                `;
            } else if (feature === 'eye') {
                updateQuery = sql`
                    UPDATE users 
                    SET eye_unlocked = ${unlockValue},
                        eye_opened_at = ${unlockValue ? sql`NOW()` : null}
                    WHERE email != ${adminUser[0].email}
                `;
            } else if (feature === 'chat') {
                updateQuery = sql`
                    UPDATE users 
                    SET chat_unlocked = ${unlockValue}
                    WHERE email != ${adminUser[0].email}
                `;
            } else if (feature === 'all') {
                updateQuery = sql`
                    UPDATE users 
                    SET pyramid_unlocked = ${unlockValue},
                        pyramid_opened_at = ${unlockValue ? sql`NOW()` : null},
                        eye_unlocked = ${unlockValue},
                        eye_opened_at = ${unlockValue ? sql`NOW()` : null},
                        chat_unlocked = ${unlockValue}
                    WHERE email != ${adminUser[0].email}
                `;
            } else {
                return new Response(JSON.stringify({ error: 'Invalid feature' }), { 
                    status: 400, 
                    headers 
                });
            }

            const result = await updateQuery;
            
            await sql.end();

            return new Response(JSON.stringify({
                success: true,
                action,
                feature,
                affectedUsers: result.count,
                message: `${feature} ${action === 'unlock-all' ? 'unlocked' : 'locked'} for all users`
            }), { 
                status: 200, 
                headers 
            });
        }

        // Handle single user toggle
        if (action === 'toggle' && email) {
            let updateQuery;
            
            if (feature === 'pyramid') {
                const user = await sql`SELECT pyramid_unlocked FROM users WHERE email = ${email}`;
                const newValue = !user[0].pyramid_unlocked;
                
                updateQuery = sql`
                    UPDATE users 
                    SET pyramid_unlocked = ${newValue},
                        pyramid_opened_at = ${newValue ? sql`NOW()` : null}
                    WHERE email = ${email}
                `;
            } else if (feature === 'eye') {
                const user = await sql`SELECT eye_unlocked FROM users WHERE email = ${email}`;
                const newValue = !user[0].eye_unlocked;
                
                updateQuery = sql`
                    UPDATE users 
                    SET eye_unlocked = ${newValue},
                        eye_opened_at = ${newValue ? sql`NOW()` : null}
                    WHERE email = ${email}
                `;
            } else if (feature === 'chat') {
                const user = await sql`SELECT chat_unlocked FROM users WHERE email = ${email}`;
                const newValue = !user[0].chat_unlocked;
                
                updateQuery = sql`
                    UPDATE users 
                    SET chat_unlocked = ${newValue}
                    WHERE email = ${email}
                `;
            } else {
                return new Response(JSON.stringify({ error: 'Invalid feature' }), { 
                    status: 400, 
                    headers 
                });
            }

            await updateQuery;
            await sql.end();

            return new Response(JSON.stringify({
                success: true,
                action,
                feature,
                email,
                message: `${feature} toggled for ${email}`
            }), { 
                status: 200, 
                headers 
            });
        }

        return new Response(JSON.stringify({ error: 'Invalid action' }), { 
            status: 400, 
            headers 
        });

    } catch (error) {
        console.error('Admin Easter Egg Toggle Error:', error);
        return new Response(JSON.stringify({ 
            error: 'Internal server error',
            details: error.message 
        }), { 
            status: 500, 
            headers 
        });
    }
}
