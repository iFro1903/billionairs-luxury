export default async function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { userId, email } = req.body;

        if (!userId || !email) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Import database connection
        const { sql } = await import('@vercel/postgres');

        // Verify user has paid
        const result = await sql`
            SELECT payment_status 
            FROM users 
            WHERE id = ${userId} AND email = ${email}
        `;

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (result.rows[0].payment_status !== 'paid') {
            return res.status(403).json({ error: 'Payment required' });
        }

        // Log download
        await sql`
            INSERT INTO downloads (user_id, downloaded_at)
            VALUES (${userId}, NOW())
        `;

        // Return success - client will handle PDF generation
        res.status(200).json({ 
            success: true,
            message: 'Download authorized',
            pdfUrl: '/downloads/final-truth.html'
        });

    } catch (error) {
        console.error('PDF generation error:', error);
        res.status(500).json({ 
            error: 'Failed to generate PDF',
            details: error.message 
        });
    }
}
