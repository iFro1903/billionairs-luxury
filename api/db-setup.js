// Database Setup Script for BILLIONAIRS
// Run this once to create the necessary tables

import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
    try {
        // Check if database environment variables are set
        const dbUrl = process.env.POSTGRES_URL || process.env.STORAGE_URL;
        if (!dbUrl) {
            return res.status(500).json({
                success: false,
                message: 'Database connection not configured',
                error: 'Missing POSTGRES_URL or STORAGE_URL environment variable',
                help: 'Please add database environment variables in Vercel Settings → Environment Variables'
            });
        }
        // Create users table
        await sql`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                member_id VARCHAR(50) UNIQUE NOT NULL,
                payment_status VARCHAR(20) DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                paid_at TIMESTAMP,
                last_login TIMESTAMP
            );
        `;

        // Create sessions table
        await sql`
            CREATE TABLE IF NOT EXISTS sessions (
                id SERIAL PRIMARY KEY,
                token VARCHAR(255) UNIQUE NOT NULL,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                expires_at TIMESTAMP NOT NULL
            );
        `;

        // Create payments table (for tracking payment history)
        await sql`
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
            );
        `;

        // Create downloads table (for tracking downloads)
        await sql`
            CREATE TABLE IF NOT EXISTS downloads (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                file_name VARCHAR(255) NOT NULL,
                downloaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                ip_address VARCHAR(50)
            );
        `;

        // Create indexes for better performance
        await sql`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);`;
        await sql`CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);`;
        await sql`CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);`;
        await sql`CREATE INDEX IF NOT EXISTS idx_payments_user ON payments(user_id);`;

        console.log('✅ Database tables created successfully!');

        return res.status(200).json({
            success: true,
            message: 'Database setup complete',
            tables: ['users', 'sessions', 'payments', 'downloads']
        });

    } catch (error) {
        console.error('❌ Database setup error:', error);
        return res.status(500).json({
            success: false,
            message: 'Database setup failed',
            error: error.message
        });
    }
}
