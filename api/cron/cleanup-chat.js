/**
 * Cleanup Old Chat Messages (runs daily)
 * Deletes chat messages older than 7 days to keep database lean
 */

import { neon } from '@neondatabase/serverless';

export const config = {
    runtime: 'edge',
};

export default async function handler(req) {
    const sql = neon(process.env.DATABASE_URL);
    
    // Verify cron secret
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
        return new Response(JSON.stringify({ 
            error: 'Unauthorized - Invalid cron secret' 
        }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    try {
        // Delete messages older than 7 days (keep CEO messages for 30 days)
        const result = await sql`
            DELETE FROM chat_messages
            WHERE created_at < NOW() - INTERVAL '7 days'
            AND email != 'furkan_akaslan@hotmail.com'
        `;
        
        // Delete CEO messages older than 30 days
        const ceoResult = await sql`
            DELETE FROM chat_messages
            WHERE created_at < NOW() - INTERVAL '30 days'
            AND email = 'furkan_akaslan@hotmail.com'
        `;
        
        // Count remaining messages
        const remaining = await sql`
            SELECT COUNT(*) as count FROM chat_messages
        `;
        
        // Log cleanup
        await sql`
            INSERT INTO backup_logs (backup_type, status, chat_count)
            VALUES ('chat_cleanup', 'completed', ${remaining[0].count})
        `;

        console.log(`✅ Chat cleanup complete`);
        console.log(`📊 Deleted: ${result.count} regular + ${ceoResult.count} CEO messages`);
        console.log(`💬 Remaining messages: ${remaining[0].count}`);

        return new Response(JSON.stringify({ 
            success: true,
            deleted: {
                regular: result.count || 0,
                ceo: ceoResult.count || 0
            },
            remaining: remaining[0].count,
            timestamp: new Date().toISOString()
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('❌ Chat cleanup error:', error);
        
        // Log error
        try {
            await sql`
                INSERT INTO backup_logs (backup_type, status, error_message)
                VALUES ('chat_cleanup', 'failed', ${error.message})
            `;
        } catch (logError) {
            console.error('Failed to log error:', logError);
        }

        return new Response(JSON.stringify({ 
            error: 'Cleanup failed',
            details: error.message 
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
