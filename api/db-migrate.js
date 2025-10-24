// Database Migration Script - Add first_name and last_name columns
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
        const migrations = [];

        // Add first_name column if it doesn't exist
        try {
            await pool.query(`
                ALTER TABLE users 
                ADD COLUMN IF NOT EXISTS first_name VARCHAR(100)
            `);
            migrations.push('first_name column added');
        } catch (error) {
            if (!error.message.includes('already exists')) {
                throw error;
            }
        }

        // Add last_name column if it doesn't exist
        try {
            await pool.query(`
                ALTER TABLE users 
                ADD COLUMN IF NOT EXISTS last_name VARCHAR(100)
            `);
            migrations.push('last_name column added');
        } catch (error) {
            if (!error.message.includes('already exists')) {
                throw error;
            }
        }

        await pool.end();

        return res.status(200).json({
            success: true,
            message: 'Migration completed successfully',
            migrations: migrations
        });

    } catch (error) {
        console.error('Migration error:', error);
        await pool.end();
        
        return res.status(500).json({
            success: false,
            message: 'Migration failed',
            error: error.message
        });
    }
}
