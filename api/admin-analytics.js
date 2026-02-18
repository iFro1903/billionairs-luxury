/**
 * Enhanced Analytics API
 * Provides detailed statistics for admin dashboard
 */

import { neon } from '@neondatabase/serverless';
import { verifyAdminSession } from '../lib/verify-admin.js';

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

    try {
        // Admin authentication (cookie + legacy header fallback)
        const auth = await verifyAdminSession(req);
        if (!auth.authorized) return auth.response;

        const dbUrl = process.env.POSTGRES_URL || process.env.DATABASE_URL;
        if (!dbUrl) {
            throw new Error('Database URL not configured');
        }
        const sql = neon(dbUrl);

        // Conversion Rate
        let totalUsers, paidUsers;
        try {
            totalUsers = await sql`SELECT COUNT(*) as count FROM users`;
            paidUsers = await sql`SELECT COUNT(*) as count FROM users WHERE payment_status = 'paid'`;
        } catch (e) {
            // Table might not exist yet
            totalUsers = [{ count: 0 }];
            paidUsers = [{ count: 0 }];
        }
        const conversionRate = totalUsers[0].count > 0 
            ? ((paidUsers[0].count / totalUsers[0].count) * 100).toFixed(2)
            : 0;

        // Revenue Statistics
        let revenueStats;
        try {
            revenueStats = await sql`
                SELECT 
                    COUNT(*) as total_payments,
                    SUM(amount) as total_revenue,
                    AVG(amount) as avg_payment,
                    MIN(amount) as min_payment,
                    MAX(amount) as max_payment
                FROM payments 
                WHERE status = 'paid'
            `;
        } catch (e) {
            revenueStats = [{ total_payments: 0, total_revenue: 0, avg_payment: 0, min_payment: 0, max_payment: 0 }];
        }

        // Payment Methods Distribution
        let paymentMethods = [];
        try {
            paymentMethods = await sql`
                SELECT 
                    payment_method,
                    COUNT(*) as count,
                    SUM(amount) as total_amount
                FROM payments 
                WHERE status = 'paid'
                GROUP BY payment_method
                ORDER BY count DESC
            `;
        } catch (e) {
            console.warn('Payments table might not exist');
        }

        // Daily Revenue (Last 30 days)
        let dailyRevenue = [];
        try {
            dailyRevenue = await sql`
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
        } catch (e) {
            console.warn('Payments table might not exist');
        }

        // Top Paying Customers
        let topCustomers = [];
        try {
            topCustomers = await sql`
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
        } catch (e) {
            console.warn('Payments table might not exist');
        }

        // Refund Statistics
        let refundStats = [{ total_refunds: 0, refunded_amount: 0, avg_refund: 0 }];
        try {
            refundStats = await sql`
                SELECT 
                    COUNT(*) as total_refunds,
                    SUM(amount) as refunded_amount,
                    AVG(amount) as avg_refund
                FROM refunds 
                WHERE status = 'succeeded'
            `;
        } catch (e) {
            console.warn('Refunds table might not exist');
        }

        // Chat Activity
        let chatStats = [{ total_messages: 0, unique_users: 0, unread_messages: 0 }];
        try {
            chatStats = await sql`
                SELECT 
                    COUNT(*) as total_messages,
                    COUNT(DISTINCT email) as unique_users,
                    COUNT(CASE WHEN is_read = false THEN 1 END) as unread_messages
                FROM chat_messages
            `;
        } catch (e) {
            console.warn('Chat messages table might not exist');
        }

        // Recent Registrations (Last 7 days)
        let recentRegistrations = [{ count: 0 }];
        try {
            recentRegistrations = await sql`
                SELECT COUNT(*) as count 
                FROM users 
                WHERE created_at > NOW() - INTERVAL '7 days'
            `;
        } catch (e) {
            console.warn('Users table might not exist');
        }

        // Active Users (Last 30 days - users with activity)
        let activeUsers = [{ count: 0 }];
        try {
            activeUsers = await sql`
                SELECT COUNT(DISTINCT user_email) as count 
                FROM audit_logs 
                WHERE timestamp > NOW() - INTERVAL '30 days'
            `;
        } catch (e) {
            console.warn('Audit logs table might not exist');
        }

        // 2FA Adoption Rate
        let twoFAStats = [{ enabled_count: 0, total_count: 0 }];
        try {
            twoFAStats = await sql`
                SELECT 
                    COUNT(CASE WHEN enabled = true THEN 1 END) as enabled_count,
                    COUNT(*) as total_count
                FROM two_factor_auth
            `;
        } catch (e) {
            console.warn('2FA table might not exist');
        }
        const twoFARate = twoFAStats[0].total_count > 0
            ? ((twoFAStats[0].enabled_count / twoFAStats[0].total_count) * 100).toFixed(2)
            : 0;

        // System Health
        let systemHealth = {
            rateLimit: {
                activeEntries: 0,
                recentBlocks: 0
            },
            database: {
                totalTables: 10,
                totalIndexes: 0
            }
        };
        try {
            const rateLimits = await sql`SELECT COUNT(*) as count FROM rate_limits`;
            const blockedIps = await sql`SELECT COUNT(*) as count FROM blocked_ips WHERE expires_at > NOW()`;
            const indexes = await sql`SELECT COUNT(*) as count FROM pg_indexes WHERE schemaname = 'public'`;
            
            systemHealth = {
                rateLimit: {
                    activeEntries: rateLimits[0].count,
                    recentBlocks: blockedIps[0].count
                },
                database: {
                    totalTables: 10,
                    totalIndexes: indexes[0].count
                }
            };
        } catch (e) {
            console.warn('System tables might not exist');
        }

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
            message: 'Internal server error' 
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
