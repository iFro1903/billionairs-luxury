// Vercel Serverless Function to delete a user

module.exports = async (req, res) => {
    const { getPool } = await import('../lib/db.js');
    const { getCorsOrigin } = await import('../lib/cors.js');

    // CORS headers
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', getCorsOrigin(req));
    res.setHeader('Access-Control-Allow-Methods', 'DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-email, x-admin-password');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'DELETE') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    // Admin auth check — verify both email AND password
    const adminEmail = req.headers['x-admin-email'];
    const adminPassword = req.headers['x-admin-password'];
    
    if (adminEmail !== 'furkan_akaslan@hotmail.com') {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    
    // Verify admin password against stored hash
    const passwordHash = process.env.ADMIN_PASSWORD_HASH;
    if (!adminPassword || !passwordHash) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    
    const { verifyPasswordSimple } = await import('../lib/password-hash.js');
    const isValidPassword = await verifyPasswordSimple(adminPassword, passwordHash);
    if (!isValidPassword) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ success: false, error: 'Email required' });
    }

    const pool = getPool();
    let client;

    try {
        client = await pool.connect();

        // Get user ID first
        const userResult = await client.query('SELECT id FROM users WHERE email = $1', [email]);
        
        if (userResult.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        const userId = userResult.rows[0].id;

        // Delete related data first (check if tables exist)
        try {
            await client.query('DELETE FROM sessions WHERE user_id = $1', [userId]);
        } catch (e) {
            console.warn('Sessions delete skipped:', e.message);
        }
        
        try {
            await client.query('DELETE FROM payments WHERE user_id = $1', [userId]);
        } catch (e) {
            console.warn('Payments delete skipped:', e.message);
        }
        
        try {
            await client.query('DELETE FROM chat_messages WHERE user_id = $1', [userId]);
        } catch (e) {
            console.warn('Chat messages delete skipped:', e.message);
        }
        
        // Delete the user
        await client.query('DELETE FROM users WHERE email = $1', [email]);

        res.status(200).json({
            success: true,
            message: 'User deleted successfully'
        });

    } catch (error) {
        console.error('❌ Delete user error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete user'
        });
    } finally {
        if (client) {
            client.release();
        }
        await pool.end();
    }
};
