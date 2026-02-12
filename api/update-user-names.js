// Update User Names
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
        const { email, firstName, lastName } = req.query;

        if (!email || !firstName || !lastName) {
            return res.status(400).json({
                success: false,
                message: 'Email, firstName and lastName required. Usage: /api/update-user-names?email=user@example.com&firstName=John&lastName=Doe'
            });
        }

        // Update user names
        const result = await pool.query(
            'UPDATE users SET first_name = $1, last_name = $2 WHERE email = $3 RETURNING id, email, first_name, last_name',
            [firstName, lastName, email]
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
            message: 'User names updated',
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
