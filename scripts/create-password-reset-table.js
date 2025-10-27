// Create password_reset_tokens table
import { neon } from '@neondatabase/serverless';
import 'dotenv/config';

const sql = neon(process.env.DATABASE_URL);

async function createTable() {
  try {
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
    
    await sql`
      CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_hash 
      ON password_reset_tokens(token_hash)
    `;
    
    await sql`
      CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires 
      ON password_reset_tokens(expires_at)
    `;
    
    console.log('✅ password_reset_tokens Tabelle erstellt!');
    console.log('✅ Indexes erstellt!');
  } catch (error) {
    console.error('❌ Fehler:', error.message);
  }
}

createTable();
