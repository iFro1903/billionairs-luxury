// API Endpoint: Run Database Migration for stripe_payment_id
// Vercel Serverless Function

const pg = require('pg');
const { Pool } = pg;

function getPool() {
    const dbUrl = process.env.POSTGRES_URL || process.env.DATABASE_URL || process.env.STORAGE_URL;
    return new Pool({
        connectionString: dbUrl,
        ssl: { rejectUnauthorized: false }
    });
}

module.exports = async (req, res) => {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const pool = getPool();

    try {
        console.log('🔄 Starting migration: Add stripe_payment_id to payments table');

        // Check if column already exists
        const checkColumn = await pool.query(`
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_name = 'payments' 
            AND column_name = 'stripe_payment_id'
        `);

        if (checkColumn.rows.length > 0) {
            await pool.end();
            return res.status(200).json({
                success: true,
                message: 'Column stripe_payment_id already exists',
                alreadyExists: true
            });
        }

        // Add the column
        await pool.query(`
            ALTER TABLE payments 
            ADD COLUMN stripe_payment_id VARCHAR(255) UNIQUE
        `);

        console.log('✅ Added stripe_payment_id column');

        // Create index for performance
        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_payments_stripe_id 
            ON payments(stripe_payment_id)
        `);

        console.log('✅ Created index on stripe_payment_id');

        await pool.end();

        return res.status(200).json({
            success: true,
            message: 'Migration completed successfully',
            changes: [
                'Added stripe_payment_id column to payments table',
                'Created index idx_payments_stripe_id'
            ]
        });

    } catch (error) {
        console.error('❌ Migration error:', error);
        await pool.end();
        
        return res.status(500).json({
            success: false,
            error: error.message,
            hint: 'Check Vercel logs for details'
        });
    }
};
