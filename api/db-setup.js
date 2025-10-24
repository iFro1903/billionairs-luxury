// Database Setup Script for BILLIONAIRS
// Run this once to create the necessary tables

import pg from 'pg';
const { Pool } = pg;

export default async function handler(req, res) {
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
            console.log('✅ Added new columns to users table (if not exists)');
        } catch (migrationError) {
            console.log('⚠️ Column migration skipped (might already exist):', migrationError.message);
        }

        await pool.end();

        console.log('✅ Database tables created successfully!');

        return res.status(200).json({
            success: true,
            message: 'Database setup complete',
            tables: ['users', 'sessions', 'payments', 'downloads'],
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
            error: error.message
        });
    }
}
