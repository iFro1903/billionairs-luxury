// Database Setup API - Creates password_reset_tokens table
import { neon } from '@neondatabase/serverless';

export const config = {
  runtime: 'nodejs'
};

export default async function handler(request) {
  try {
    const sql = neon(process.env.DATABASE_URL);

    // Create password_reset_tokens table
    await sql`
      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token_hash VARCHAR(64) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        used BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(user_id)
      )
    `;

    // Create indexes
    await sql`
      CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_hash 
      ON password_reset_tokens(token_hash)
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires 
      ON password_reset_tokens(expires_at)
    `;

    return new Response(JSON.stringify({ 
      success: true,
      message: 'password_reset_tokens table created successfully'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Table creation error:', error);
    return new Response(JSON.stringify({ 
      error: 'Table creation failed'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
