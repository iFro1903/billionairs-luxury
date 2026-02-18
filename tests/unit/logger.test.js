/**
 * Unit Tests for Logger Module
 * Tests structured logging, log levels, and timer functionality
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { logRequest, logSuccess, logWarn, logError, logTimer } from '../../lib/logger.js';

describe('Logger - logRequest', () => {
    beforeEach(() => {
        vi.spyOn(console, 'log').mockImplementation(() => {});
        vi.spyOn(console, 'warn').mockImplementation(() => {});
        vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    it('should log an API request with endpoint and method', () => {
        logRequest('auth', 'POST', { action: 'login' });
        expect(console.log).toHaveBeenCalled();
        const logged = JSON.parse(console.log.mock.calls[0][0]);
        expect(logged.endpoint).toBe('auth');
        expect(logged.method).toBe('POST');
        expect(logged.action).toBe('login');
        expect(logged.ts).toBeTruthy();
    });

    it('should include ISO timestamp in all logs', () => {
        logRequest('health', 'GET');
        const logged = JSON.parse(console.log.mock.calls[0][0]);
        expect(() => new Date(logged.ts)).not.toThrow();
        expect(logged.ts).toMatch(/\d{4}-\d{2}-\d{2}T/);
    });
});

describe('Logger - logSuccess', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
        vi.spyOn(console, 'log').mockImplementation(() => {});
    });

    it('should log a success action', () => {
        logSuccess('auth', 'user_registered', { email: 'test@example.com' });
        expect(console.log).toHaveBeenCalled();
        const lastCall = console.log.mock.calls[console.log.mock.calls.length - 1];
        const logged = JSON.parse(lastCall[0]);
        expect(logged.msg).toBe('user_registered');
        expect(logged.email).toBe('test@example.com');
    });
});

describe('Logger - logWarn', () => {
    beforeEach(() => {
        vi.spyOn(console, 'warn').mockImplementation(() => {});
    });

    it('should log warnings to console.warn', () => {
        logWarn('rate-limit', 'Rate limit exceeded', { ip: '1.2.3.4' });
        expect(console.warn).toHaveBeenCalled();
    });
});

describe('Logger - logError', () => {
    beforeEach(() => {
        vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    it('should log errors to console.error', () => {
        logError('auth', new Error('DB connection failed'), { action: 'login' });
        expect(console.error).toHaveBeenCalled();
    });
});

describe('Logger - logTimer', () => {
    beforeEach(() => {
        vi.spyOn(console, 'log').mockImplementation(() => {});
    });

    it('should return a timer with end() method', () => {
        const timer = logTimer('test_endpoint');
        expect(timer).toHaveProperty('end');
        expect(typeof timer.end).toBe('function');
    });

    it('should log elapsed time when end() is called', () => {
        const timer = logTimer('test_endpoint');
        timer.end({ action: 'test' });
        expect(console.log).toHaveBeenCalled();
    });
});
