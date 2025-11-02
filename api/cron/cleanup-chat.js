import { neon } from '@neondatabase/serverless';

/**
 * Cron Job: Chat Message Cleanup
 * Runs daily at 3:00 AM UTC
 * Deletes old chat messages to prevent unbounded database growth
 */
export default async function handler(req, res) {
  // Verify cron secret to prevent unauthorized access
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.authorization;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ 
      error: 'Unauthorized',
      message: 'Invalid or missing CRON_SECRET' 
    });
  }

  try {
    const sql = neon(process.env.DATABASE_URL);

    // Delete messages older than 30 days for CEO monitor
    // Delete messages older than 7 days for regular users
    const result = await sql`
      DELETE FROM chat_messages 
      WHERE 
        (email = 'ceo@billionairs.luxury' AND created_at < NOW() - INTERVAL '30 days')
        OR 
        (email != 'ceo@billionairs.luxury' AND created_at < NOW() - INTERVAL '7 days')
      RETURNING id
    `;

    const deletedCount = result.length;

    console.log(`[Chat Cleanup] Deleted ${deletedCount} old messages`);

    return res.status(200).json({
      success: true,
      deletedCount,
      timestamp: new Date().toISOString(),
      retention: {
        ceo: '30 days',
        users: '7 days'
      }
    });

  } catch (error) {
    console.error('[Chat Cleanup Error]:', error);
    
    return res.status(500).json({
      error: 'Cleanup failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
