// Vercel Serverless Function for Bank Wire Transfer
// Collects customer information and sends bank details via email

export default async function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { fullName, email, phone, company } = req.body;

        // Validate required fields
        if (!fullName || !email || !phone) {
            return res.status(400).json({ 
                error: 'Missing required fields',
                message: 'Please provide your full name, email, and phone number'
            });
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ 
                error: 'Invalid email',
                message: 'Please provide a valid email address'
            });
        }

        // Log the wire transfer request (in production, this would go to a database)
        console.log('🏦 Wire Transfer Request:', {
            fullName,
            email,
            phone,
            company: company || 'N/A',
            amount: '500,000 CHF',
            timestamp: new Date().toISOString()
        });

        // Bank account details - Furkan Akaslan UBS Switzerland
        const bankDetails = {
            amount: '500,000 CHF',
            bankName: 'UBS Switzerland AG',
            accountHolder: 'Furkan Akaslan',
            iban: 'CH13 0022 7227 1418 9140 B',
            swift: 'UBSWCHZH80A',
            reference: `BILLIONAIRS-${Date.now()}`,
            address: 'UBS Switzerland AG, Zürich, Switzerland',
            instructions: [
                'Please include the reference number in your transfer',
                'Transfer must come from an account in your name',
                'Access will be granted within 24 hours of receiving funds',
                'Contact support@billionairs-luxury.com for any questions'
            ]
        };

        // In production, you would:
        // 1. Save this to a database
        // 2. Send an email with bank details to the customer
        // 3. Send a notification to admin
        // 4. Create a payment tracking record

        // For now, we'll return the bank details directly
        return res.status(200).json({
            success: true,
            message: 'Wire transfer initiated successfully',
            customerInfo: {
                fullName,
                email,
                phone,
                company: company || null
            },
            bankDetails: bankDetails,
            instructions: [
                '1. Use the bank details below to initiate your wire transfer',
                '2. Make sure to include the reference number',
                '3. Transfer must be from an account in your name',
                '4. You will receive access credentials within 24h after payment confirmation',
                '5. Keep this information secure'
            ],
            emailSent: false, // In production, this would be true after sending email
            nextSteps: [
                'Check your email for detailed instructions',
                'Complete the wire transfer from your bank',
                'Wait for confirmation (usually 24-48 hours)',
                'Receive your exclusive access credentials'
            ]
        });

    } catch (error) {
        console.error('Wire Transfer Error:', error);
        return res.status(500).json({ 
            error: 'Wire transfer initialization failed',
            message: error.message 
        });
    }
}
