// Emergency Fix: Create user manually after successful payment

module.exports = async (req, res) => {
    const { getPool } = await import('../lib/db.js');
    const { getCorsOrigin } = await import('../lib/cors.js');
    const { hashPassword } = await import('../lib/password-hash.js');
    const { generateMemberId } = await import('../lib/helpers.js');

    // CORS headers
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', getCorsOrigin(req));
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const pool = getPool();

    try {
        const { email, password, fullName, phone, company } = req.body;

        if (!email || !password) {
            return res.status(400).json({ 
                success: false,
                error: 'Email and password required' 
            });
        }

        // Check if user exists
        const existingUser = await pool.query(
            'SELECT id, payment_status FROM users WHERE email = $1',
            [email]
        );

        if (existingUser.rows.length > 0) {
            const userId = existingUser.rows[0].id;
            const currentStatus = existingUser.rows[0].payment_status;

            // Update to paid status
            await pool.query(
                'UPDATE users SET payment_status = $1, paid_at = NOW() WHERE id = $2',
                ['paid', userId]
            );

            await pool.end();

            return res.status(200).json({
                success: true,
                message: `User ${email} updated to PAID status`,
                userId: userId,
                previousStatus: currentStatus
            });
        }

        // Create new user
        const hashedPassword = await hashPassword(password);
        const memberId = generateMemberId();

        // Split fullName
        let firstName = '';
        let lastName = '';
        if (fullName) {
            const nameParts = fullName.trim().split(' ');
            firstName = nameParts[0] || '';
            lastName = nameParts.slice(1).join(' ') || '';
        }

        const result = await pool.query(
            `INSERT INTO users (email, password_hash, member_id, payment_status, first_name, last_name, phone, company, paid_at, created_at) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW()) 
             RETURNING id, member_id`,
            [email, hashedPassword, memberId, 'paid', firstName, lastName, phone || null, company || null]
        );

        await pool.end();

        return res.status(200).json({
            success: true,
            message: `User ${email} created with PAID status`,
            userId: result.rows[0].id,
            memberId: result.rows[0].member_id
        });

    } catch (error) {
        console.error('Fix user error:', error);
        await pool.end();
        return res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
};
