import { neon } from '@neondatabase/serverless';

export const config = {
    runtime: 'edge',
};

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
        const sql = neon(process.env.DATABASE_URL);
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
                if (unlockValue) {
                    updateQuery = sql`
                        UPDATE users 
                        SET pyramid_unlocked = TRUE,
                            pyramid_opened_at = NOW()
                        WHERE email != ${adminUser[0].email}
                    `;
                } else {
                    updateQuery = sql`
                        UPDATE users 
                        SET pyramid_unlocked = FALSE,
                            pyramid_opened_at = NULL
                        WHERE email != ${adminUser[0].email}
                    `;
                }
            } else if (feature === 'eye') {
                if (unlockValue) {
                    updateQuery = sql`
                        UPDATE users 
                        SET eye_unlocked = TRUE,
                            eye_opened_at = NOW()
                        WHERE email != ${adminUser[0].email}
                    `;
                } else {
                    updateQuery = sql`
                        UPDATE users 
                        SET eye_unlocked = FALSE,
                            eye_opened_at = NULL
                        WHERE email != ${adminUser[0].email}
                    `;
                }
            } else if (feature === 'chat') {
                updateQuery = sql`
                    UPDATE users 
                    SET chat_unlocked = ${unlockValue}
                    WHERE email != ${adminUser[0].email}
                `;
            } else if (feature === 'all') {
                if (unlockValue) {
                    updateQuery = sql`
                        UPDATE users 
                        SET pyramid_unlocked = TRUE,
                            pyramid_opened_at = NOW(),
                            eye_unlocked = TRUE,
                            eye_opened_at = NOW(),
                            chat_unlocked = TRUE
                        WHERE email != ${adminUser[0].email}
                    `;
                } else {
                    updateQuery = sql`
                        UPDATE users 
                        SET pyramid_unlocked = FALSE,
                            pyramid_opened_at = NULL,
                            eye_unlocked = FALSE,
                            eye_opened_at = NULL,
                            chat_unlocked = FALSE
                        WHERE email != ${adminUser[0].email}
                    `;
                }
            } else {
                return new Response(JSON.stringify({ error: 'Invalid feature' }), { 
                    status: 400, 
                    headers 
                });
            }

            const result = await updateQuery;

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

        // Handle individual user unlock/lock
        if ((action === 'unlock' || action === 'lock') && email) {
            const unlockValue = action === 'unlock';
            let updateQuery;
            
            if (feature === 'pyramid') {
                if (unlockValue) {
                    updateQuery = sql`
                        UPDATE users 
                        SET pyramid_unlocked = TRUE,
                            pyramid_opened_at = NOW()
                        WHERE email = ${email}
                    `;
                } else {
                    updateQuery = sql`
                        UPDATE users 
                        SET pyramid_unlocked = FALSE,
                            pyramid_opened_at = NULL
                        WHERE email = ${email}
                    `;
                }
            } else if (feature === 'eye') {
                if (unlockValue) {
                    updateQuery = sql`
                        UPDATE users 
                        SET eye_unlocked = TRUE,
                            eye_opened_at = NOW()
                        WHERE email = ${email}
                    `;
                } else {
                    updateQuery = sql`
                        UPDATE users 
                        SET eye_unlocked = FALSE,
                            eye_opened_at = NULL
                        WHERE email = ${email}
                    `;
                }
            } else if (feature === 'chat') {
                updateQuery = sql`
                    UPDATE users 
                    SET chat_unlocked = ${unlockValue}
                    WHERE email = ${email}
                `;
            } else {
                return new Response(JSON.stringify({ error: 'Invalid feature' }), { 
                    status: 400, 
                    headers 
                });
            }

            await updateQuery;

            return new Response(JSON.stringify({
                success: true,
                action,
                feature,
                email,
                message: `${feature} ${unlockValue ? 'unlocked' : 'locked'} for ${email}`
            }), { 
                status: 200, 
                headers 
            });
        }

        // Legacy toggle support
        if (action === 'toggle' && email) {
            if (feature === 'pyramid') {
                const user = await sql`SELECT pyramid_unlocked FROM users WHERE email = ${email}`;
                const newValue = !user[0].pyramid_unlocked;
                
                if (newValue) {
                    await sql`
                        UPDATE users 
                        SET pyramid_unlocked = TRUE,
                            pyramid_opened_at = NOW()
                        WHERE email = ${email}
                    `;
                } else {
                    await sql`
                        UPDATE users 
                        SET pyramid_unlocked = FALSE,
                            pyramid_opened_at = NULL
                        WHERE email = ${email}
                    `;
                }
            } else if (feature === 'eye') {
                const user = await sql`SELECT eye_unlocked FROM users WHERE email = ${email}`;
                const newValue = !user[0].eye_unlocked;
                
                if (newValue) {
                    await sql`
                        UPDATE users 
                        SET eye_unlocked = TRUE,
                            eye_opened_at = NOW()
                        WHERE email = ${email}
                    `;
                } else {
                    await sql`
                        UPDATE users 
                        SET eye_unlocked = FALSE,
                            eye_opened_at = NULL
                        WHERE email = ${email}
                    `;
                }
            } else if (feature === 'chat') {
                const user = await sql`SELECT chat_unlocked FROM users WHERE email = ${email}`;
                const newValue = !user[0].chat_unlocked;
                
                await sql`
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
        console.error('Error stack:', error.stack);
        console.error('Error details:', {
            message: error.message,
            name: error.name,
            cause: error.cause
        });
        return new Response(JSON.stringify({ 
            error: 'Internal server error',
            details: error.message,
            stack: error.stack 
        }), { 
            status: 500, 
            headers 
        });
    }
}
