// Admin API - Get NDA Signature for a specific user
module.exports = async (req, res) => {
    if (req.method !== 'GET') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    try {
        // Admin auth check
        const adminEmail = req.headers['x-admin-email'];
        const adminPassword = req.headers['x-admin-password'];

        if (!adminEmail || !adminPassword) {
            return res.status(401).json({ success: false, error: 'Unauthorized' });
        }

        // Verify admin credentials
        const validEmail = process.env.ADMIN_EMAIL || 'admin@billionairs.luxury';
        const validPassword = process.env.ADMIN_PASSWORD || '';

        if (adminEmail !== validEmail || adminPassword !== validPassword) {
            return res.status(403).json({ success: false, error: 'Forbidden' });
        }

        const email = req.query.email;
        if (!email) {
            return res.status(400).json({ success: false, error: 'Email parameter required' });
        }

        const { getPool } = await import('../lib/db.js');
        const pool = getPool();

        // Check if nda_signatures table exists
        const tableCheck = await pool.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'nda_signatures'
            )
        `);

        if (!tableCheck.rows[0].exists) {
            return res.json({ success: true, nda: null, message: 'No NDA signatures table' });
        }

        // Get the latest NDA signature for this email
        const result = await pool.query(
            `SELECT signature_id, full_name, email, phone, company, 
                    signature_data, document_ref, ip_address, 
                    agreed_at, created_at
             FROM nda_signatures 
             WHERE LOWER(email) = LOWER($1) 
             ORDER BY created_at DESC 
             LIMIT 1`,
            [email]
        );

        if (result.rows.length === 0) {
            return res.json({ success: true, nda: null });
        }

        return res.json({ success: true, nda: result.rows[0] });

    } catch (error) {
        console.error('Admin NDA fetch error:', error);
        return res.status(500).json({ success: false, error: 'Internal server error' });
    }
};
