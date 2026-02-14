/**
 * Shared Database Pool for BILLIONAIRS API (Node.js runtime)
 * Provides a singleton-per-request connection pool
 * 
 * For Edge Runtime, use @neondatabase/serverless directly:
 *   import { neon } from '@neondatabase/serverless';
 *   const sql = neon(process.env.DATABASE_URL);
 */

import pg from 'pg';
const { Pool } = pg;

/**
 * Create a PostgreSQL connection pool
 * IMPORTANT: Always call pool.end() in a finally block!
 * @returns {Pool} PostgreSQL connection pool
 */
export function getPool() {
    const dbUrl = process.env.POSTGRES_URL || process.env.DATABASE_URL || process.env.STORAGE_URL;
    return new Pool({
        connectionString: dbUrl,
        ssl: { rejectUnauthorized: false }
    });
}
