import { neon } from '@neondatabase/serverless';

export const config = {
  runtime: 'edge',
};

// CORS: Only allow requests from our domain
function getCorsOrigin(req) {
    const origin = req.headers?.get?.('origin') || '';
    const allowed = ['https://billionairs.luxury', 'https://www.billionairs.luxury'];
    return allowed.includes(origin) ? origin : allowed[0];
}

export default async function handler(req) {
  const headers = {
    'Access-Control-Allow-Origin': getCorsOrigin(req),
    'Content-Type': 'application/json',
  };

  try {
    const sql = neon(process.env.DATABASE_URL);
    
    // Add Easter Egg columns to users table
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS first_dashboard_access TIMESTAMP`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS pyramid_unlocked BOOLEAN DEFAULT FALSE`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS pyramid_opened_at TIMESTAMP`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS eye_unlocked BOOLEAN DEFAULT FALSE`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS eye_opened_at TIMESTAMP`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS chat_unlocked BOOLEAN DEFAULT FALSE`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS chat_ready BOOLEAN DEFAULT FALSE`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS chat_opened_at TIMESTAMP`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS last_daily_login TIMESTAMP`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS login_streak INTEGER DEFAULT 0`;

    // Create indexes for performance
    await sql`CREATE INDEX IF NOT EXISTS idx_first_dashboard_access ON users(first_dashboard_access)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_pyramid_unlocked ON users(pyramid_unlocked)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_eye_unlocked ON users(eye_unlocked)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_chat_unlocked ON users(chat_unlocked)`;

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Easter egg columns and indexes created successfully' 
      }),
      { status: 200, headers }
    );

  } catch (error) {
    console.error('Setup Easter Egg Error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to setup easter egg columns',
        details: error.message 
      }),
      { status: 500, headers }
    );
  }
}
