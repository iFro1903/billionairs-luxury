// Vercel Serverless Function to add missing member_id column
const { Pool } = require('pg');

function getPool() {
    const dbUrl = process.env.POSTGRES_URL || process.env.DATABASE_URL;
    return new Pool({
        connectionString: dbUrl,
        ssl: { rejectUnauthorized: false }
    });
}

module.exports = async (req, res) => {
    // Only allow GET requests
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const pool = getPool();
    let client;

    try {
        client = await pool.connect();

        // Add member_id column if it doesn't exist
        await client.query(`
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS member_id VARCHAR(100) UNIQUE
        `);

        // Create index for better performance
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_users_member_id 
            ON users(member_id)
        `);

        // Verify the column exists now
        const columnsResult = await client.query(`
            SELECT column_name, data_type, is_nullable 
            FROM information_schema.columns 
            WHERE table_name = 'users' 
            ORDER BY ordinal_position
        `);

        res.status(200).json({
            success: true,
            message: 'Database migration completed successfully',
            columns: columnsResult.rows
        });

    } catch (error) {
        console.error('❌ Migration error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    } finally {
        if (client) {
            client.release();
        }
        await pool.end();
    }
};
