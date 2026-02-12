// Vercel Serverless Function to delete a user
const { Pool } = require('pg');

function getPool() {
    const dbUrl = process.env.POSTGRES_URL || process.env.DATABASE_URL;
    return new Pool({
        connectionString: dbUrl,
        ssl: { rejectUnauthorized: false }
    });
}

// CORS: Only allow requests from our domain
function getCorsOrigin(req) {
    const origin = req.headers.origin || req.headers['origin'];
    const allowed = ['https://billionairs.luxury', 'https://www.billionairs.luxury'];
    return allowed.includes(origin) ? origin : allowed[0];
}

module.exports = async (req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', getCorsOrigin(req));
    res.setHeader('Access-Control-Allow-Methods', 'DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'DELETE') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ error: 'Email required' });
    }

    const pool = getPool();
    let client;

    try {
        client = await pool.connect();

        // Get user ID first
        const userResult = await client.query('SELECT id FROM users WHERE email = $1', [email]);
        
        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const userId = userResult.rows[0].id;

        // Delete related data first (check if tables exist)
        try {
            await client.query('DELETE FROM sessions WHERE user_id = $1', [userId]);
        } catch (e) {
            console.log('Sessions delete skipped:', e.message);
        }
        
        try {
            await client.query('DELETE FROM payments WHERE user_id = $1', [userId]);
        } catch (e) {
            console.log('Payments delete skipped:', e.message);
        }
        
        try {
            await client.query('DELETE FROM chat_messages WHERE user_id = $1', [userId]);
        } catch (e) {
            console.log('Chat messages delete skipped:', e.message);
        }
        
        // Delete the user
        await client.query('DELETE FROM users WHERE email = $1', [email]);

        console.log(`✅ User deleted: ${email} (ID: ${userId})`);

        res.status(200).json({
            success: true,
            message: 'User deleted successfully'
        });

    } catch (error) {
        console.error('❌ Delete user error:', error);
        res.status(500).json({
            error: 'Failed to delete user',
            details: error.message
        });
    } finally {
        if (client) {
            client.release();
        }
    }
};
