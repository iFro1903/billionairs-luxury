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

        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }

        // Import database connection
        const { sql } = await import('@vercel/postgres');

        // Verify user has paid
        const result = await sql`
            SELECT id, payment_status, member_id
            FROM users 
            WHERE email = ${email}
        `;

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const user = result.rows[0];

        if (user.payment_status !== 'paid') {
            return res.status(403).json({ error: 'Payment required' });
        }

        // Try to log download (non-critical)
        try {
            await sql`
                INSERT INTO downloads (user_id, downloaded_at)
                VALUES (${user.id}, NOW())
            `;
        } catch (logError) {
            console.error('Download logging failed (non-critical):', logError);
        }

        // Return success - client will handle PDF generation
        res.status(200).json({ 
            success: true,
            message: 'Download authorized',
            pdfUrl: '/downloads/final-truth.html',
            memberId: user.member_id
        });

    } catch (error) {
        console.error('PDF generation error:', error);
        res.status(500).json({ 
            error: 'Failed to generate PDF',
            details: error.message 
        });
    }
}
