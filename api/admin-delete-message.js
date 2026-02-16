// Vercel Serverless Function to delete a chat message

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

    // Admin authentication
    const adminEmail = req.headers['x-admin-email'];
    const adminPassword = req.headers['x-admin-password'];

    if (adminEmail !== 'furkan_akaslan@hotmail.com') {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const passwordHash = process.env.ADMIN_PASSWORD_HASH;
    if (!adminPassword || !passwordHash) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { verifyPasswordSimple } = await import('../lib/password-hash.js');
    const isValidPassword = await verifyPasswordSimple(adminPassword, passwordHash);
    if (!isValidPassword) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    try {
        const { messageId } = req.body;

        if (!messageId) {
            return res.status(400).json({ success: false, error: 'Message ID required' });
        }

        const pool = getPool();
        const client = await pool.connect();

        try {
            const result = await client.query(
                'DELETE FROM chat_messages WHERE id = $1 RETURNING id',
                [messageId]
            );

            if (result.rowCount === 0) {
                return res.status(404).json({ success: false, error: 'Message not found' });
            }

            console.log(`[ADMIN] Chat message #${messageId} deleted by ${adminEmail}`);

            return res.status(200).json({ 
                success: true, 
                message: `Nachricht #${messageId} geloescht` 
            });
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Delete message error:', error);
        return res.status(500).json({ success: false, error: 'Internal server error' });
    }
};
