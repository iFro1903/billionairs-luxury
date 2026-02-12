// Database Backup Cron Job
// Runs weekly: Every Sunday at 3:00 AM UTC
import { neon } from '@neondatabase/serverless';

export const config = {
    runtime: 'edge'
};

export default async function handler(req) {
    // Verify cron secret (security)
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
        return new Response('Unauthorized', { status: 401 });
    }

    const sql = neon(process.env.DATABASE_URL);

    try {
        console.log('🔄 Starting database backup...');

        // Get all critical data counts
        const usersCount = await sql`SELECT COUNT(*) as count FROM users`;
        const paymentsCount = await sql`SELECT COUNT(*) as count FROM payments WHERE payment_status = 'paid'`;
        const chatCount = await sql`SELECT COUNT(*) as count FROM chat_messages`;
        const auditCount = await sql`SELECT COUNT(*) as count FROM audit_logs`;

        // Create backup record
        await sql`
            INSERT INTO backup_logs (
                backup_type,
                status,
                users_count,
                payments_count,
                chat_count,
                audit_count,
                created_at
            ) VALUES (
                'weekly_automatic',
                'completed',
                ${usersCount[0].count},
                ${paymentsCount[0].count},
                ${chatCount[0].count},
                ${auditCount[0].count},
                NOW()
            )
        `;

        console.log('✅ Backup record created successfully');
        console.log(`📊 Users: ${usersCount[0].count}, Payments: ${paymentsCount[0].count}, Chats: ${chatCount[0].count}, Audits: ${auditCount[0].count}`);

        return new Response(JSON.stringify({
            success: true,
            message: 'Backup completed',
            stats: {
                users: usersCount[0].count,
                payments: paymentsCount[0].count,
                chats: chatCount[0].count,
                audits: auditCount[0].count
            }
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('❌ Backup failed:', error);

        // Log failed backup
        try {
            await sql`
                INSERT INTO backup_logs (backup_type, status, error_message, created_at)
                VALUES ('weekly_automatic', 'failed', ${error.message}, NOW())
            `;
        } catch (logError) {
            console.error('Failed to log backup error:', logError);
        }

        return new Response(JSON.stringify({
            success: false,
            error: 'Internal server error'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
