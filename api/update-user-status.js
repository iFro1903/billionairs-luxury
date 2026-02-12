// Update User Payment Status
import pg from 'pg';
const { Pool } = pg;

export default async function handler(req, res) {
    const dbUrl = process.env.POSTGRES_URL || process.env.DATABASE_URL || process.env.STORAGE_URL;
    
    if (!dbUrl) {
        return res.status(500).json({
            success: false,
            message: 'Database connection not configured'
        });
    }

    const pool = new Pool({
        connectionString: dbUrl,
        ssl: { rejectUnauthorized: false }
    });

    try {
        const { email, status } = req.query;

        if (!email || !status) {
            return res.status(400).json({
                success: false,
                message: 'Email and status required. Usage: /api/update-user-status?email=user@example.com&status=paid'
            });
        }

        // Update user payment status
        const result = await pool.query(
            'UPDATE users SET payment_status = $1, paid_at = CURRENT_TIMESTAMP WHERE email = $2 RETURNING id, email, member_id, payment_status',
            [status, email]
        );

        await pool.end();

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'User status updated',
            user: result.rows[0]
        });

    } catch (error) {
        console.error('Update error:', error);
        await pool.end();
        
        return res.status(500).json({
            success: false,
            message: 'Update failed',
            error: 'Internal server error'
        });
    }
}
