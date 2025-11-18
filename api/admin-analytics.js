/**
 * Enhanced Analytics API
 * Provides detailed statistics for admin dashboard
 */

import { neon } from '@neondatabase/serverless';

export const config = {
    runtime: 'edge'
};

export default async function handler(req) {
    if (req.method !== 'GET') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
            status: 405,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    // Admin authentication check
    const adminEmail = req.headers.get('x-admin-email');
    const adminPassword = req.headers.get('x-admin-password');

    const ADMIN_EMAIL = 'furkan_akaslan@hotmail.com';
    const ADMIN_PASSWORD = 'Masallah1,';

    if (adminEmail !== ADMIN_EMAIL || adminPassword !== ADMIN_PASSWORD) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    try {
        const dbUrl = process.env.POSTGRES_URL || process.env.DATABASE_URL;
        if (!dbUrl) {
            throw new Error('Database URL not configured');
        }
        const sql = neon(dbUrl);

        // Conversion Rate
        const totalUsers = await sql`SELECT COUNT(*) as count FROM users`;
        const paidUsers = await sql`SELECT COUNT(*) as count FROM users WHERE payment_status = 'paid'`;
        const conversionRate = totalUsers[0].count > 0 
            ? ((paidUsers[0].count / totalUsers[0].count) * 100).toFixed(2)
            : 0;

        // Revenue Statistics
        const revenueStats = await sql`
            SELECT 
                COUNT(*) as total_payments,
                SUM(amount) as total_revenue,
                AVG(amount) as avg_payment,
                MIN(amount) as min_payment,
                MAX(amount) as max_payment
            FROM payments 
            WHERE status = 'paid'
        `;

        // Payment Methods Distribution
        const paymentMethods = await sql`
            SELECT 
                payment_method,
                COUNT(*) as count,
                SUM(amount) as total_amount
            FROM payments 
            WHERE status = 'paid'
            GROUP BY payment_method
            ORDER BY count DESC
        `;

        // Daily Revenue (Last 30 days)
        const dailyRevenue = await sql`
            SELECT 
                DATE(created_at) as date,
                COUNT(*) as payment_count,
                SUM(amount) as revenue
            FROM payments 
            WHERE status = 'paid' 
                AND created_at > NOW() - INTERVAL '30 days'
            GROUP BY DATE(created_at)
            ORDER BY date DESC
        `;

        // Top Paying Customers
        const topCustomers = await sql`
            SELECT 
                user_email,
                COUNT(*) as payment_count,
                SUM(amount) as total_spent,
                MAX(created_at) as last_payment
            FROM payments 
            WHERE status = 'paid'
            GROUP BY user_email
            ORDER BY total_spent DESC
            LIMIT 10
        `;

        // Refund Statistics
        const refundStats = await sql`
            SELECT 
                COUNT(*) as total_refunds,
                SUM(amount) as refunded_amount,
                AVG(amount) as avg_refund
            FROM refunds 
            WHERE status = 'succeeded'
        `;

        // Chat Activity
        const chatStats = await sql`
            SELECT 
                COUNT(*) as total_messages,
                COUNT(DISTINCT email) as unique_users,
                COUNT(CASE WHEN is_read = false THEN 1 END) as unread_messages
            FROM chat_messages
        `;

        // Recent Registrations (Last 7 days)
        const recentRegistrations = await sql`
            SELECT COUNT(*) as count 
            FROM users 
            WHERE created_at > NOW() - INTERVAL '7 days'
        `;

        // Active Users (Last 30 days - users with activity)
        const activeUsers = await sql`
            SELECT COUNT(DISTINCT user_email) as count 
            FROM audit_logs 
            WHERE timestamp > NOW() - INTERVAL '30 days'
        `;

        // 2FA Adoption Rate
        const twoFAStats = await sql`
            SELECT 
                COUNT(CASE WHEN enabled = true THEN 1 END) as enabled_count,
                COUNT(*) as total_count
            FROM two_factor_auth
        `;
        const twoFARate = twoFAStats[0].total_count > 0
            ? ((twoFAStats[0].enabled_count / twoFAStats[0].total_count) * 100).toFixed(2)
            : 0;

        // System Health
        const systemHealth = {
            rateLimit: {
                activeEntries: (await sql`SELECT COUNT(*) as count FROM rate_limits`)[0].count,
                recentBlocks: (await sql`SELECT COUNT(*) as count FROM blocked_ips WHERE expires_at > NOW()`)[0].count
            },
            database: {
                totalTables: 10,
                totalIndexes: (await sql`SELECT COUNT(*) as count FROM pg_indexes WHERE schemaname = 'public'`)[0].count
            }
        };

        // Push Notifications Stats (if table exists)
        let pushStats = { total: 0, active: 0 };
        try {
            pushStats = await sql`
                SELECT 
                    COUNT(*) as total,
                    COUNT(CASE WHEN is_active = true THEN 1 END) as active
                FROM push_subscriptions
            `.then(r => r[0]);
        } catch (e) {
            // Table doesn't exist yet
        }

        return new Response(JSON.stringify({
            conversion: {
                totalUsers: totalUsers[0].count,
                paidUsers: paidUsers[0].count,
                conversionRate: parseFloat(conversionRate)
            },
            revenue: {
                ...revenueStats[0],
                total_revenue: parseFloat(revenueStats[0].total_revenue || 0),
                avg_payment: parseFloat(revenueStats[0].avg_payment || 0)
            },
            paymentMethods: paymentMethods.map(pm => ({
                method: pm.payment_method,
                count: pm.count,
                amount: parseFloat(pm.total_amount || 0)
            })),
            dailyRevenue: dailyRevenue.map(dr => ({
                date: dr.date,
                count: dr.payment_count,
                revenue: parseFloat(dr.revenue || 0)
            })),
            topCustomers: topCustomers.map(tc => ({
                email: tc.user_email,
                payments: tc.payment_count,
                totalSpent: parseFloat(tc.total_spent || 0),
                lastPayment: tc.last_payment
            })),
            refunds: {
                ...refundStats[0],
                refunded_amount: parseFloat(refundStats[0].refunded_amount || 0),
                avg_refund: parseFloat(refundStats[0].avg_refund || 0)
            },
            chat: chatStats[0],
            users: {
                recentRegistrations: recentRegistrations[0].count,
                activeUsers: activeUsers[0].count
            },
            twoFA: {
                enabled: twoFAStats[0].enabled_count,
                total: twoFAStats[0].total_count,
                adoptionRate: parseFloat(twoFARate)
            },
            pushNotifications: pushStats,
            systemHealth
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Analytics error:', error);
        return new Response(JSON.stringify({ 
            error: 'Failed to fetch analytics',
            message: error.message 
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
