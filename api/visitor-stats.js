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

    try {
        const dbUrl = process.env.POSTGRES_URL || process.env.DATABASE_URL;
        if (!dbUrl) throw new Error('No DB URL');
        const sql = neon(dbUrl);

        // Ensure table exists
        await sql`
            CREATE TABLE IF NOT EXISTS page_visits (
                id SERIAL PRIMARY KEY,
                page VARCHAR(255) NOT NULL DEFAULT '/',
                referrer TEXT,
                user_agent TEXT,
                country VARCHAR(10),
                device VARCHAR(20),
                session_id VARCHAR(64),
                user_email VARCHAR(255),
                visited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            )
        `;

        // === Total Visits ===
        const totalResult = await sql`SELECT COUNT(*) as count FROM page_visits`;
        const total = parseInt(totalResult[0].count);

        // === Today ===
        const todayResult = await sql`
            SELECT COUNT(*) as count FROM page_visits 
            WHERE visited_at >= CURRENT_DATE
        `;
        const today = parseInt(todayResult[0].count);

        // === Unique visitors today (by session_id) ===
        const uniqueTodayResult = await sql`
            SELECT COUNT(DISTINCT session_id) as count FROM page_visits 
            WHERE visited_at >= CURRENT_DATE
        `;
        const uniqueToday = parseInt(uniqueTodayResult[0].count);

        // === This Week ===
        const weekResult = await sql`
            SELECT COUNT(*) as count FROM page_visits 
            WHERE visited_at >= CURRENT_DATE - INTERVAL '7 days'
        `;
        const thisWeek = parseInt(weekResult[0].count);

        // === This Month ===
        const monthResult = await sql`
            SELECT COUNT(*) as count FROM page_visits 
            WHERE visited_at >= CURRENT_DATE - INTERVAL '30 days'
        `;
        const thisMonth = parseInt(monthResult[0].count);

        // === Unique visitors total ===
        const uniqueTotalResult = await sql`
            SELECT COUNT(DISTINCT session_id) as count FROM page_visits
        `;
        const uniqueTotal = parseInt(uniqueTotalResult[0].count);

        // === Daily visits (last 30 days) ===
        const dailyVisits = await sql`
            SELECT 
                DATE(visited_at) as date,
                COUNT(*) as visits,
                COUNT(DISTINCT session_id) as unique_visitors
            FROM page_visits 
            WHERE visited_at >= CURRENT_DATE - INTERVAL '30 days'
            GROUP BY DATE(visited_at)
            ORDER BY date ASC
        `;

        // === Hourly distribution today ===
        const hourlyVisits = await sql`
            SELECT 
                EXTRACT(HOUR FROM visited_at) as hour,
                COUNT(*) as visits
            FROM page_visits 
            WHERE visited_at >= CURRENT_DATE
            GROUP BY EXTRACT(HOUR FROM visited_at)
            ORDER BY hour ASC
        `;

        // === Device breakdown ===
        const deviceStats = await sql`
            SELECT 
                device,
                COUNT(*) as count
            FROM page_visits 
            WHERE visited_at >= CURRENT_DATE - INTERVAL '30 days'
            GROUP BY device
            ORDER BY count DESC
        `;

        // === Top pages ===
        const topPages = await sql`
            SELECT 
                page,
                COUNT(*) as visits
            FROM page_visits 
            WHERE visited_at >= CURRENT_DATE - INTERVAL '30 days'
            GROUP BY page
            ORDER BY visits DESC
            LIMIT 10
        `;

        // === Top countries ===
        const topCountries = await sql`
            SELECT 
                country,
                COUNT(*) as visits
            FROM page_visits 
            WHERE visited_at >= CURRENT_DATE - INTERVAL '30 days'
              AND country != 'unknown'
            GROUP BY country
            ORDER BY visits DESC
            LIMIT 10
        `;

        // === Referrers ===
        const topReferrers = await sql`
            SELECT 
                referrer,
                COUNT(*) as visits
            FROM page_visits 
            WHERE visited_at >= CURRENT_DATE - INTERVAL '30 days'
              AND referrer IS NOT NULL 
              AND referrer != ''
            GROUP BY referrer
            ORDER BY visits DESC
            LIMIT 10
        `;

        // === Registrations (from users table) ===
        let registrationStats = { total: 0, thisWeek: 0, thisMonth: 0 };
        try {
            const regTotal = await sql`SELECT COUNT(*) as count FROM users`;
            const regWeek = await sql`SELECT COUNT(*) as count FROM users WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'`;
            const regMonth = await sql`SELECT COUNT(*) as count FROM users WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'`;
            registrationStats = {
                total: parseInt(regTotal[0].count),
                thisWeek: parseInt(regWeek[0].count),
                thisMonth: parseInt(regMonth[0].count)
            };
        } catch (e) {}

        return new Response(JSON.stringify({
            overview: {
                total,
                today,
                uniqueToday,
                thisWeek,
                thisMonth,
                uniqueTotal
            },
            dailyVisits: dailyVisits.map(d => ({
                date: d.date,
                visits: parseInt(d.visits),
                unique: parseInt(d.unique_visitors)
            })),
            hourlyVisits: hourlyVisits.map(h => ({
                hour: parseInt(h.hour),
                visits: parseInt(h.visits)
            })),
            devices: deviceStats.map(d => ({
                device: d.device || 'unknown',
                count: parseInt(d.count)
            })),
            topPages: topPages.map(p => ({
                page: p.page,
                visits: parseInt(p.visits)
            })),
            topCountries: topCountries.map(c => ({
                country: c.country,
                visits: parseInt(c.visits)
            })),
            topReferrers: topReferrers.map(r => ({
                referrer: r.referrer,
                visits: parseInt(r.visits)
            })),
            registrations: registrationStats
        }), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });

    } catch (error) {
        console.error('Visitor stats error:', error);
        return new Response(JSON.stringify({ 
            error: 'Failed to load stats',
            overview: { total: 0, today: 0, uniqueToday: 0, thisWeek: 0, thisMonth: 0, uniqueTotal: 0 },
            dailyVisits: [],
            hourlyVisits: [],
            devices: [],
            topPages: [],
            topCountries: [],
            topReferrers: [],
            registrations: { total: 0, thisWeek: 0, thisMonth: 0 }
        }), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
    }
}
