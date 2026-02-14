/**
 * Health Check API for BILLIONAIRS
 * 
 * Endpoint: GET /api/health
 * 
 * Checks:
 * - API is reachable ✅
 * - Database connection works
 * - Response time measurement
 * 
 * Used by:
 * - UptimeRobot / BetterUptime / Pingdom for monitoring
 * - Vercel dashboard
 * - Manual debugging
 */

import { neon } from '@neondatabase/serverless';

export const config = {
    runtime: 'edge',
};

export default async function handler(req) {
    if (req.method === 'OPTIONS') {
        return new Response(null, {
            status: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
            },
        });
    }

    if (req.method !== 'GET') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
            status: 405,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    const startTime = Date.now();
    const checks = {
        api: { status: 'ok', latency: 0 },
        database: { status: 'unknown', latency: 0 },
        timestamp: new Date().toISOString(),
        version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || 'local',
        environment: process.env.VERCEL_ENV || 'development',
    };

    let overallStatus = 'ok';

    // ── Database Check ──
    try {
        const dbStart = Date.now();
        const sql = neon(process.env.DATABASE_URL);
        const result = await sql`SELECT 1 AS ping`;
        checks.database.latency = Date.now() - dbStart;

        if (result && result.length > 0 && result[0].ping === 1) {
            checks.database.status = 'ok';
        } else {
            checks.database.status = 'degraded';
            overallStatus = 'degraded';
        }
    } catch (dbError) {
        checks.database.status = 'error';
        checks.database.error = dbError.message;
        overallStatus = 'error';
    }

    // ── Total latency ──
    checks.api.latency = Date.now() - startTime;

    const statusCode = overallStatus === 'ok' ? 200 : overallStatus === 'degraded' ? 200 : 503;

    return new Response(JSON.stringify({
        status: overallStatus,
        checks,
    }, null, 2), {
        status: statusCode,
        headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'X-Health-Status': overallStatus,
        },
    });
}
