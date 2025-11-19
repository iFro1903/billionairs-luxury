// Vercel Serverless Function to delete a user
const { Pool } = require('pg');

function getPool() {
    const dbUrl = process.env.POSTGRES_URL || process.env.DATABASE_URL;
    return new Pool({
        connectionString: dbUrl,
        ssl: { rejectUnauthorized: false }
    });
}

module.exports = async (req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'DELETE') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { userId } = req.body;

    if (!userId) {
        return res.status(400).json({ error: 'User ID required' });
    }

    const pool = getPool();
    let client;

    try {
        client = await pool.connect();

        // Get user email before deletion for logging
        const userResult = await client.query('SELECT email FROM users WHERE id = $1', [userId]);
        
        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const userEmail = userResult.rows[0].email;

        // Delete related data first (foreign key constraints)
        await client.query('DELETE FROM sessions WHERE user_id = $1', [userId]);
        await client.query('DELETE FROM payments WHERE user_id = $1', [userId]);
        await client.query('DELETE FROM chat_messages WHERE user_id = $1', [userId]);
        
        // Delete the user
        await client.query('DELETE FROM users WHERE id = $1', [userId]);

        console.log(`✅ User deleted: ${userEmail} (ID: ${userId})`);

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
        await pool.end();
    }
};
