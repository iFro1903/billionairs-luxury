/**
 * Unit Tests for /api/auth.js handler
 * Tests: register, login, verify, logout, 2FA, edge cases
 * All DB/external calls are mocked
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Mocks ──────────────────────────────────────────────
const mockQuery = vi.fn();
const mockEnd = vi.fn();

vi.mock('../../lib/db.js', () => ({
    getPool: () => ({ query: mockQuery, end: mockEnd })
}));

vi.mock('../../lib/rate-limiter.js', () => ({
    checkRateLimit: vi.fn().mockResolvedValue({ allowed: true, remaining: 10, resetAt: Date.now() + 60000 }),
    getClientIp: vi.fn().mockReturnValue('127.0.0.1'),
    RATE_LIMITS: {
        AUTH: { maxRequests: 10, windowMs: 60000, endpoint: 'auth', message: 'Rate limited' }
    }
}));

vi.mock('../../lib/password-hash.js', () => ({
    hashPassword: vi.fn().mockResolvedValue('pbkdf2$100000$abcdef$123456'),
    verifyPassword: vi.fn().mockResolvedValue({ valid: true, needsUpgrade: false })
}));

vi.mock('../../lib/helpers.js', () => ({
    generateMemberId: vi.fn().mockReturnValue('BILL-1234567890-TESTID')
}));

vi.mock('../../lib/cors.js', () => ({
    getCorsOrigin: vi.fn().mockReturnValue('https://billionairs.luxury')
}));

vi.mock('../../lib/logger.js', () => ({
    logRequest: vi.fn(),
    logSuccess: vi.fn(),
    logWarn: vi.fn(),
    logError: vi.fn(),
    logTimer: vi.fn().mockReturnValue({ end: vi.fn() })
}));

vi.mock('../../lib/totp.js', () => ({
    verifyTOTP: vi.fn().mockReturnValue(false)
}));

// Import after mocks
const { default: handler } = await import('../../api/auth.js');
const { verifyPassword } = await import('../../lib/password-hash.js');
const { checkRateLimit } = await import('../../lib/rate-limiter.js');
const { verifyTOTP } = await import('../../lib/totp.js');

// ─── Helpers ────────────────────────────────────────────
function createReq(body = {}, headers = {}) {
    return {
        method: 'POST',
        body,
        headers: { host: 'billionairs.luxury', cookie: '', ...headers }
    };
}

function createRes() {
    const res = {
        _status: null,
        _json: null,
        _headers: {},
        status(code) { res._status = code; return res; },
        json(data) { res._json = data; return res; },
        end() { return res; },
        setHeader(key, val) { res._headers[key] = val; }
    };
    return res;
}

beforeEach(() => {
    vi.clearAllMocks();
    mockQuery.mockReset();
    mockEnd.mockReset();
    verifyPassword.mockResolvedValue({ valid: true, needsUpgrade: false });
});

// ═════════════════════════════════════════════════════════
// REGISTER
// ═════════════════════════════════════════════════════════
describe('Auth Handler — Register', () => {
    it('should reject registration without email', async () => {
        const req = createReq({ action: 'register', password: 'Test1234' });
        const res = createRes();
        await handler(req, res);
        expect(res._status).toBe(400);
        expect(res._json.success).toBe(false);
    });

    it('should reject registration without password', async () => {
        const req = createReq({ action: 'register', email: 'test@example.com' });
        const res = createRes();
        await handler(req, res);
        expect(res._status).toBe(400);
        expect(res._json.success).toBe(false);
    });

    it('should reject invalid email format', async () => {
        const req = createReq({ action: 'register', email: 'not-an-email', password: 'Test1234' });
        const res = createRes();
        await handler(req, res);
        expect(res._status).toBe(400);
        expect(res._json.message).toContain('email');
    });

    it('should reject short password (<8 chars)', async () => {
        // First mock: email check returns no existing user
        mockQuery.mockResolvedValueOnce({ rows: [] });
        const req = createReq({ action: 'register', email: 'test@example.com', password: 'short' });
        const res = createRes();
        await handler(req, res);
        expect(res._status).toBe(400);
        expect(res._json.message).toContain('8 characters');
    });

    it('should reject duplicate email', async () => {
        mockQuery.mockResolvedValueOnce({ rows: [{ id: 1 }] }); // existing user
        const req = createReq({ action: 'register', email: 'exists@example.com', password: 'Test12345' });
        const res = createRes();
        await handler(req, res);
        expect(res._status).toBe(400);
    });

    it('should successfully register a new user', async () => {
        // Mock: no existing user, then insert succeeds
        mockQuery.mockResolvedValueOnce({ rows: [] }); // SELECT check
        mockQuery.mockResolvedValueOnce({ rows: [] }); // INSERT

        // Mock global fetch for welcome email
        global.fetch = vi.fn().mockResolvedValue({ ok: true });

        const req = createReq({
            action: 'register',
            email: 'new@example.com',
            password: 'SecurePass123',
            firstName: 'John',
            lastName: 'Doe',
            language: 'de'
        });
        const res = createRes();
        await handler(req, res);
        expect(res._status).toBe(200);
        expect(res._json.success).toBe(true);
        expect(res._json.message).toContain('successful');
    });

    it('should accept valid languages and default invalid ones to "en"', async () => {
        mockQuery.mockResolvedValueOnce({ rows: [] });
        mockQuery.mockResolvedValueOnce({ rows: [] });
        global.fetch = vi.fn().mockResolvedValue({ ok: true });

        const req = createReq({
            action: 'register',
            email: 'lang@example.com',
            password: 'SecurePass123',
            language: 'zz' // invalid language
        });
        const res = createRes();
        await handler(req, res);
        // Should still succeed (defaults to 'en')
        expect(res._status).toBe(200);
    });
});

// ═════════════════════════════════════════════════════════
// LOGIN
// ═════════════════════════════════════════════════════════
describe('Auth Handler — Login', () => {
    it('should reject login without credentials', async () => {
        const req = createReq({ action: 'login' });
        const res = createRes();
        await handler(req, res);
        expect(res._status).toBe(400);
    });

    it('should reject non-existent user', async () => {
        mockQuery.mockResolvedValueOnce({ rows: [] }); // no user found
        const req = createReq({ action: 'login', email: 'ghost@example.com', password: 'Test1234' });
        const res = createRes();
        await handler(req, res);
        expect(res._status).toBe(401);
        expect(res._json.message).toBe('Invalid credentials');
    });

    it('should reject wrong password', async () => {
        mockQuery.mockResolvedValueOnce({
            rows: [{ id: 1, email: 'user@example.com', password_hash: 'pbkdf2$100000$salt$hash', member_id: 'BILL-1', payment_status: 'paid', full_name: 'User' }]
        });
        // auth.js checks: if (!isValidPassword) — so falsy return means rejected
        verifyPassword.mockResolvedValueOnce(false);

        const req = createReq({ action: 'login', email: 'user@example.com', password: 'WrongPass' });
        const res = createRes();
        await handler(req, res);
        expect(res._status).toBe(401);
        expect(res._json.message).toBe('Invalid credentials');
    });

    it('should login successfully and set HttpOnly cookie', async () => {
        const dbUser = {
            id: 1, email: 'user@example.com', password_hash: 'pbkdf2$100000$salt$hash',
            member_id: 'BILL-1', payment_status: 'paid', full_name: 'Test User'
        };
        mockQuery.mockResolvedValueOnce({ rows: [dbUser] }); // SELECT user
        mockQuery.mockResolvedValueOnce({ rows: [] }); // UPDATE last_seen
        // 2FA check — table doesn't have 2FA enabled
        mockQuery.mockResolvedValueOnce({ rows: [] }); // 2FA check
        mockQuery.mockResolvedValueOnce({ rows: [] }); // INSERT session

        const req = createReq({ action: 'login', email: 'user@example.com', password: 'CorrectPass' });
        const res = createRes();
        await handler(req, res);

        expect(res._status).toBe(200);
        expect(res._json.success).toBe(true);
        expect(res._json.user.email).toBe('user@example.com');
        expect(res._json.user.memberId).toBe('BILL-1');
        // HttpOnly cookie should be set
        expect(res._headers['Set-Cookie']).toContain('billionairs_session=');
        expect(res._headers['Set-Cookie']).toContain('HttpOnly');
        expect(res._headers['Set-Cookie']).toContain('Secure');
    });

    it('should request 2FA code when 2FA is enabled', async () => {
        const dbUser = {
            id: 1, email: 'secure@example.com', password_hash: 'pbkdf2$100000$salt$hash',
            member_id: 'BILL-2', payment_status: 'paid', full_name: 'Secure User'
        };
        mockQuery.mockResolvedValueOnce({ rows: [dbUser] }); // SELECT user
        mockQuery.mockResolvedValueOnce({ rows: [] }); // UPDATE last_seen
        mockQuery.mockResolvedValueOnce({
            rows: [{ secret: 'ABCDEF', backup_codes: '["111111"]', enabled: true }]
        }); // 2FA check returns enabled

        const req = createReq({ action: 'login', email: 'secure@example.com', password: 'CorrectPass' });
        const res = createRes();
        await handler(req, res);

        expect(res._status).toBe(200);
        expect(res._json.requiresTwoFactor).toBe(true);
    });

    it('should reject invalid 2FA code', async () => {
        const dbUser = {
            id: 1, email: 'secure@example.com', password_hash: 'pbkdf2$100000$salt$hash',
            member_id: 'BILL-2', payment_status: 'paid', full_name: 'Secure User'
        };
        mockQuery.mockResolvedValueOnce({ rows: [dbUser] }); // SELECT user
        mockQuery.mockResolvedValueOnce({ rows: [] }); // UPDATE last_seen
        mockQuery.mockResolvedValueOnce({
            rows: [{ secret: 'ABCDEF', backup_codes: '["111111"]', enabled: true }]
        }); // 2FA returns enabled
        verifyTOTP.mockReturnValueOnce(false);

        const req = createReq({
            action: 'login', email: 'secure@example.com', password: 'CorrectPass', twoFactorCode: '000000'
        });
        const res = createRes();
        await handler(req, res);

        expect(res._status).toBe(401);
        expect(res._json.requiresTwoFactor).toBe(true);
    });

    it('should accept valid 2FA backup code', async () => {
        const dbUser = {
            id: 1, email: 'secure@example.com', password_hash: 'pbkdf2$100000$salt$hash',
            member_id: 'BILL-2', payment_status: 'paid', full_name: 'Secure User'
        };
        mockQuery.mockResolvedValueOnce({ rows: [dbUser] }); // SELECT user
        mockQuery.mockResolvedValueOnce({ rows: [] }); // UPDATE last_seen
        mockQuery.mockResolvedValueOnce({
            rows: [{ secret: 'ABCDEF', backup_codes: '["111111","222222"]', enabled: true }]
        }); // 2FA enabled
        verifyTOTP.mockReturnValueOnce(false); // TOTP invalid
        // But backup code IS valid (111111)
        mockQuery.mockResolvedValueOnce({ rows: [] }); // UPDATE backup_codes
        mockQuery.mockResolvedValueOnce({ rows: [] }); // UPDATE last_used
        mockQuery.mockResolvedValueOnce({ rows: [] }); // INSERT session

        const req = createReq({
            action: 'login', email: 'secure@example.com', password: 'CorrectPass', twoFactorCode: '111111'
        });
        const res = createRes();
        await handler(req, res);

        expect(res._status).toBe(200);
        expect(res._json.success).toBe(true);
    });
});

// ═════════════════════════════════════════════════════════
// VERIFY SESSION
// ═════════════════════════════════════════════════════════
describe('Auth Handler — Verify', () => {
    it('should reject verify without token', async () => {
        const req = createReq({ action: 'verify' });
        const res = createRes();
        await handler(req, res);
        expect(res._status).toBe(401);
        expect(res._json.message).toContain('No token');
    });

    it('should reject invalid session token', async () => {
        mockQuery.mockResolvedValueOnce({ rows: [] }); // no session found
        const req = createReq({ action: 'verify' }, { cookie: 'billionairs_session=invalidtoken' });
        const res = createRes();
        await handler(req, res);
        expect(res._status).toBe(401);
        expect(res._json.message).toBe('Invalid session');
    });

    it('should reject expired session', async () => {
        const expired = new Date(Date.now() - 86400000).toISOString(); // 1 day ago
        mockQuery.mockResolvedValueOnce({
            rows: [{
                expires_at: expired, id: 1, email: 'user@example.com',
                member_id: 'BILL-1', payment_status: 'paid', full_name: 'User'
            }]
        });
        mockQuery.mockResolvedValueOnce({ rows: [] }); // DELETE expired session

        const req = createReq({ action: 'verify' }, { cookie: 'billionairs_session=expiredtoken' });
        const res = createRes();
        await handler(req, res);
        expect(res._status).toBe(401);
        expect(res._json.message).toBe('Session expired');
    });

    it('should verify valid session', async () => {
        const future = new Date(Date.now() + 86400000).toISOString(); // 1 day from now
        mockQuery.mockResolvedValueOnce({
            rows: [{
                expires_at: future, id: 1, email: 'user@example.com',
                member_id: 'BILL-1', payment_status: 'paid', full_name: 'Test User'
            }]
        });

        const req = createReq({ action: 'verify' }, { cookie: 'billionairs_session=validtoken' });
        const res = createRes();
        await handler(req, res);
        expect(res._status).toBe(200);
        expect(res._json.success).toBe(true);
        expect(res._json.user.email).toBe('user@example.com');
        expect(res._json.user.paymentStatus).toBe('paid');
    });
});

// ═════════════════════════════════════════════════════════
// LOGOUT
// ═════════════════════════════════════════════════════════
describe('Auth Handler — Logout', () => {
    it('should logout and clear cookie', async () => {
        mockQuery.mockResolvedValueOnce({ rows: [] }); // DELETE session
        const req = createReq({ action: 'logout' }, { cookie: 'billionairs_session=sometoken' });
        const res = createRes();
        await handler(req, res);
        expect(res._status).toBe(200);
        expect(res._json.success).toBe(true);
        expect(res._headers['Set-Cookie']).toContain('Max-Age=0');
    });

    it('should handle logout without token gracefully', async () => {
        const req = createReq({ action: 'logout' });
        const res = createRes();
        await handler(req, res);
        expect(res._status).toBe(200);
        expect(res._json.success).toBe(true);
    });
});

// ═════════════════════════════════════════════════════════
// EDGE CASES
// ═════════════════════════════════════════════════════════
describe('Auth Handler — Edge Cases', () => {
    it('should handle OPTIONS (CORS preflight)', async () => {
        const req = { method: 'OPTIONS', body: {}, headers: { host: 'billionairs.luxury', cookie: '' } };
        const res = createRes();
        await handler(req, res);
        expect(res._status).toBe(200);
    });

    it('should reject invalid action', async () => {
        const req = createReq({ action: 'hack_the_planet' });
        const res = createRes();
        await handler(req, res);
        expect(res._status).toBe(400);
        expect(res._json.message).toBe('Invalid action');
    });

    it('should block update_payment action', async () => {
        const req = createReq({ action: 'update_payment' });
        const res = createRes();
        await handler(req, res);
        expect(res._status).toBe(403);
        expect(res._json.message).toContain('Stripe webhook');
    });

    it('should return 429 when rate limited', async () => {
        checkRateLimit.mockResolvedValueOnce({
            allowed: false, remaining: 0, resetAt: Date.now() + 60000, retryAfter: 60
        });

        const req = createReq({ action: 'login', email: 'test@example.com', password: 'Test1234' });
        const res = createRes();
        await handler(req, res);
        expect(res._status).toBe(429);
        expect(res._headers['Retry-After']).toBe(60);
    });

    it('should handle database error gracefully', async () => {
        mockQuery.mockRejectedValueOnce(new Error('Connection refused'));
        const req = createReq({ action: 'verify' }, { cookie: 'billionairs_session=token123' });
        const res = createRes();
        await handler(req, res);
        expect(res._status).toBe(500);
        expect(res._json.message).toBe('Server error');
    });
});
