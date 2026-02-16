// Two-Factor Authentication Setup for BILLIONAIRS Members
// Handles: generate secret, verify code, enable/disable 2FA, status check
// Authenticated via session cookie (not admin-specific)

import { getPool } from '../lib/db.js';
import { getCorsOrigin } from '../lib/cors.js';
import { generateSecret, generateBackupCodes, verifyTOTP, generateOtpauthUrl } from '../lib/totp.js';

// Get session token from cookie
function getTokenFromCookie(req) {
    const cookies = req.headers.cookie || '';
    const match = cookies.match(/billionairs_session=([^;]+)/);
    return match ? match[1] : null;
}

// Verify session and return user
async function getAuthenticatedUser(req, pool) {
    const token = getTokenFromCookie(req);
    if (!token) return null;

    const result = await pool.query(
        'SELECT u.id, u.email, u.member_id, u.full_name FROM sessions s JOIN users u ON s.user_id = u.id WHERE s.token = $1 AND s.expires_at > NOW()',
        [token]
    );
    return result.rows.length > 0 ? result.rows[0] : null;
}

export default async function handler(req, res) {
    // CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', getCorsOrigin(req));
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const pool = getPool();

    try {
        // Authenticate user via session
        const user = await getAuthenticatedUser(req, pool);
        if (!user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        const { action, code } = req.body;
        const userEmail = user.email.toLowerCase();

        // Ensure two_factor_auth table exists
        await pool.query(`
            CREATE TABLE IF NOT EXISTS two_factor_auth (
                id SERIAL PRIMARY KEY,
                user_email VARCHAR(255) NOT NULL UNIQUE,
                secret VARCHAR(255) NOT NULL,
                backup_codes TEXT,
                enabled BOOLEAN DEFAULT false,
                created_at TIMESTAMP DEFAULT NOW(),
                last_used TIMESTAMP
            )
        `);

        // ===== STATUS =====
        if (action === 'status') {
            const result = await pool.query(
                'SELECT enabled, created_at, last_used FROM two_factor_auth WHERE user_email = $1 LIMIT 1',
                [userEmail]
            );

            return res.status(200).json({
                success: true,
                enabled: result.rows.length > 0 && result.rows[0].enabled,
                setupDate: result.rows[0]?.created_at || null,
                lastUsed: result.rows[0]?.last_used || null
            });
        }

        // ===== GENERATE (Start 2FA Setup) =====
        if (action === 'generate') {
            const secret = generateSecret();
            const backupCodes = generateBackupCodes(10);
            const otpauthUrl = generateOtpauthUrl(userEmail, secret);

            // Save to DB (not yet enabled)
            await pool.query(`
                INSERT INTO two_factor_auth (user_email, secret, backup_codes, enabled)
                VALUES ($1, $2, $3, false)
                ON CONFLICT (user_email)
                DO UPDATE SET
                    secret = $2,
                    backup_codes = $3,
                    enabled = false,
                    created_at = NOW()
            `, [userEmail, secret, JSON.stringify(backupCodes)]);

            // Log audit
            try {
                await pool.query(
                    'INSERT INTO audit_logs (action, user_email, ip, details) VALUES ($1, $2, $3, $4)',
                    ['2FA_SETUP_STARTED', userEmail, req.headers['x-forwarded-for'] || 'unknown', JSON.stringify({ step: 'secret_generated' })]
                );
            } catch (e) {}

            return res.status(200).json({
                success: true,
                secret,
                otpauthUrl,
                backupCodes,
                message: 'Scan the QR code with your authenticator app'
            });
        }

        // ===== VERIFY (Confirm setup with first code) =====
        if (action === 'verify') {
            const codeStr = String(code || '').trim();
            if (!codeStr || codeStr.length !== 6) {
                return res.status(400).json({ error: 'Please enter a valid 6-digit code' });
            }

            // Get the pending secret
            const result = await pool.query(
                'SELECT secret FROM two_factor_auth WHERE user_email = $1 LIMIT 1',
                [userEmail]
            );

            if (result.rows.length === 0) {
                return res.status(400).json({ error: '2FA not set up. Please start setup first.' });
            }

            const { secret } = result.rows[0];
            
            // Verify TOTP code with generous window
            const isValid = verifyTOTP(secret, codeStr);
            
            console.log('[2FA VERIFY]', { email: userEmail, codeLength: codeStr.length, secretLength: secret.length, isValid, serverTime: new Date().toISOString() });

            if (isValid) {
                // Enable 2FA
                await pool.query(
                    'UPDATE two_factor_auth SET enabled = true, last_used = NOW() WHERE user_email = $1',
                    [userEmail]
                );

                // Audit log
                try {
                    await pool.query(
                        'INSERT INTO audit_logs (action, user_email, ip, details) VALUES ($1, $2, $3, $4)',
                        ['2FA_ENABLED', userEmail, req.headers['x-forwarded-for'] || 'unknown', JSON.stringify({ verified: true })]
                    );
                } catch (e) {}

                return res.status(200).json({
                    success: true,
                    message: 'Two-factor authentication enabled successfully'
                });
            } else {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid verification code. Please try again with a new code from your authenticator app.'
                });
            }
        }

        // ===== DISABLE =====
        if (action === 'disable') {
            if (!code) {
                return res.status(400).json({ error: 'Verification code required to disable 2FA' });
            }

            const result = await pool.query(
                'SELECT secret, backup_codes FROM two_factor_auth WHERE user_email = $1 AND enabled = true LIMIT 1',
                [userEmail]
            );

            if (result.rows.length === 0) {
                return res.status(400).json({ error: '2FA is not enabled' });
            }

            const { secret, backup_codes } = result.rows[0];
            let backupCodesList = [];
            try { backupCodesList = JSON.parse(backup_codes || '[]'); } catch (e) {}

            const codeStr = String(code).trim();
            const isValidTOTP = verifyTOTP(secret, codeStr);
            const isValidBackup = backupCodesList.includes(codeStr);

            if (isValidTOTP || isValidBackup) {
                await pool.query(
                    'UPDATE two_factor_auth SET enabled = false WHERE user_email = $1',
                    [userEmail]
                );

                // Audit log
                try {
                    await pool.query(
                        'INSERT INTO audit_logs (action, user_email, ip, details) VALUES ($1, $2, $3, $4)',
                        ['2FA_DISABLED', userEmail, req.headers['x-forwarded-for'] || 'unknown', 
                         JSON.stringify({ method: isValidBackup ? 'backup_code' : 'totp' })]
                    );
                } catch (e) {}

                return res.status(200).json({
                    success: true,
                    message: 'Two-factor authentication disabled'
                });
            } else {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid code. 2FA was not disabled.'
                });
            }
        }

        return res.status(400).json({ error: 'Invalid action. Use: status, generate, verify, disable' });

    } catch (error) {
        console.error('2FA setup error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    } finally {
        try { await pool.end(); } catch (e) {}
    }
}
