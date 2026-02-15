// Database Setup Script for BILLIONAIRS
// Run this once to create the necessary tables
// Protected: Requires admin credentials

import pg from 'pg';
const { Pool } = pg;

const CEO_EMAIL = 'furkan_akaslan@hotmail.com';

export default async function handler(req, res) {
    // Only allow POST requests with admin credentials
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed. Send POST with admin credentials.' });
    }

    // Require admin email + password
    const { email, password } = req.body || {};
    if (!email || !password || email.toLowerCase() !== CEO_EMAIL.toLowerCase()) {
        return res.status(403).json({ error: 'Access denied. Admin credentials required.' });
    }

    // Verify admin password
    const passwordHash = process.env.ADMIN_PASSWORD_HASH;
    if (!passwordHash) {
        return res.status(500).json({ error: 'ADMIN_PASSWORD_HASH not configured' });
    }

    // Use bcrypt for Node.js runtime
    const bcrypt = await import('bcryptjs');
    const isValid = await bcrypt.compare(password, passwordHash);
    if (!isValid) {
        // Also try simple SHA-256 comparison if bcrypt fails
        const crypto = await import('crypto');
        const shaHash = crypto.createHash('sha256').update(password).digest('hex');
        if (shaHash !== passwordHash && !passwordHash.startsWith('pbkdf2$')) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
    }

    // Get database URL from environment
    const dbUrl = process.env.POSTGRES_URL || process.env.DATABASE_URL || process.env.STORAGE_URL;
    
    if (!dbUrl) {
        return res.status(500).json({
            success: false,
            message: 'Database connection not configured',
            error: 'Missing POSTGRES_URL environment variable',
            help: 'Please add database URL in Vercel Settings → Environment Variables'
        });
    }

    const pool = new Pool({
        connectionString: dbUrl,
        ssl: { rejectUnauthorized: false }
    });

    try {
        // Create users table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                member_id VARCHAR(50) UNIQUE NOT NULL,
                first_name VARCHAR(100),
                last_name VARCHAR(100),
                full_name VARCHAR(255),
                phone VARCHAR(50),
                company VARCHAR(255),
                payment_status VARCHAR(20) DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                paid_at TIMESTAMP,
                last_login TIMESTAMP
            )
        `);

        // Create sessions table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS sessions (
                id SERIAL PRIMARY KEY,
                token VARCHAR(255) UNIQUE NOT NULL,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                expires_at TIMESTAMP NOT NULL
            )
        `);

        // Create payments table (for tracking payment history)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS payments (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                stripe_payment_id VARCHAR(255) UNIQUE,
                amount DECIMAL(10, 2) NOT NULL,
                currency VARCHAR(10) DEFAULT 'CHF',
                payment_method VARCHAR(50),
                transaction_id VARCHAR(255),
                status VARCHAR(20) DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                completed_at TIMESTAMP
            )
        `);

        // Create downloads table (for tracking downloads)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS downloads (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                file_name VARCHAR(255) NOT NULL,
                downloaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                ip_address VARCHAR(50)
            )
        `);

        // Create indexes for better performance
        await pool.query(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`);
        await pool.query(`CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token)`);
        await pool.query(`CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at)`);
        await pool.query(`CREATE INDEX IF NOT EXISTS idx_payments_user ON payments(user_id)`);

        // Add new columns if they don't exist (migration for existing databases)
        try {
            await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name VARCHAR(255)`);
            await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(50)`);
            await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS company VARCHAR(255)`);
        } catch (migrationError) {
            console.warn('⚠️ Column migration skipped (might already exist):', migrationError.message);
        }

        // Create password_reset_tokens table
        try {
            await pool.query(`
                CREATE TABLE IF NOT EXISTS password_reset_tokens (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                    token_hash VARCHAR(64) NOT NULL,
                    expires_at TIMESTAMP NOT NULL,
                    used BOOLEAN DEFAULT FALSE,
                    created_at TIMESTAMP DEFAULT NOW(),
                    UNIQUE(user_id)
                )
            `);
            
            await pool.query(`
                CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_hash 
                ON password_reset_tokens(token_hash)
            `);
            
            await pool.query(`
                CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires 
                ON password_reset_tokens(expires_at)
            `);
            
        } catch (resetError) {
            console.warn('⚠️ Password reset table skipped:', resetError.message);
        }

        await pool.end();

        return res.status(200).json({
            success: true,
            message: 'Database setup complete',
            tables: ['users', 'sessions', 'payments', 'downloads', 'password_reset_tokens'],
            columns_added: ['full_name', 'phone', 'company']
        });

    } catch (error) {
        console.error('❌ Database setup error:', error);
        try {
            await pool.end();
        } catch (e) {}
        return res.status(500).json({
            success: false,
            message: 'Database setup failed',
            error: 'Internal server error'
        });
    }
}
