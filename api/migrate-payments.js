// API Endpoint: Run Database Migration for stripe_payment_id
// Vercel Serverless Function

module.exports = async (req, res) => {
    const { getPool } = await import('../lib/db.js');

    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const pool = getPool();

    try {

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

        // Create index for performance
        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_payments_stripe_id 
            ON payments(stripe_payment_id)
        `);

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
            error: 'Internal server error',
            hint: 'Check Vercel logs for details'
        });
    }
};
