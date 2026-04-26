/**
 * Tests: JWT RBAC middleware
 */
import { describe, it, expect } from 'vitest';
import { verifyJwtHs256, jwtAuth, hasRole } from '../src/runtime/jwt-rbac.js';
import type { JwtPayload } from '../src/runtime/jwt-rbac.js';
import { createHmac } from 'node:crypto';

// Helper: build a minimal HS256 token
function makeToken(payload: JwtPayload, secret: string, expiresInSec = 3600): string {
    function b64url(buf: Buffer): string {
        return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
    }
    const header = b64url(Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })));
    const body = b64url(
        Buffer.from(
            JSON.stringify({
                ...payload,
                iat: Math.floor(Date.now() / 1000),
                exp: Math.floor(Date.now() / 1000) + expiresInSec,
            })
        )
    );
    const sig = b64url(createHmac('sha256', secret).update(`${header}.${body}`).digest());
    return `${header}.${body}.${sig}`;
}

describe('verifyJwtHs256', () => {
    const SECRET = 'test-secret-32-chars-1234567890ab';

    it('verifies a valid HS256 token', () => {
        const token = makeToken({ sub: 'user-1', role: 'admin' }, SECRET);
        const payload = verifyJwtHs256(token, SECRET);
        expect(payload.sub).toBe('user-1');
        expect(payload.role).toBe('admin');
    });

    it('throws on tampered payload', () => {
        const token = makeToken({ sub: 'user-1' }, SECRET);
        const parts = token.split('.');
        // Tamper payload
        const fakePayload = Buffer.from(JSON.stringify({ sub: 'hacker' })).toString('base64url');
        const tampered = `${parts[0]}.${fakePayload}.${parts[2]}`;
        expect(() => verifyJwtHs256(tampered, SECRET)).toThrow('verification failed');
    });

    it('throws on expired token', () => {
        const token = makeToken({ sub: 'user-1' }, SECRET, -1); // expired 1 second ago
        expect(() => verifyJwtHs256(token, SECRET)).toThrow('expired');
    });

    it('throws on wrong secret', () => {
        const token = makeToken({ sub: 'user-1' }, SECRET);
        expect(() => verifyJwtHs256(token, 'wrong-secret')).toThrow('verification failed');
    });

    it('throws on malformed token', () => {
        expect(() => verifyJwtHs256('not.a.valid.jwt.token.nope', SECRET)).toThrow('Invalid JWT format');
    });
});

describe('hasRole', () => {
    it('returns true when role matches (string)', () => {
        expect(hasRole({ role: 'admin' }, ['admin'])).toBe(true);
    });

    it('returns true when any role matches (array)', () => {
        expect(hasRole({ role: ['support', 'admin'] }, ['admin'])).toBe(true);
    });

    it('returns false when no roles match', () => {
        expect(hasRole({ role: 'user' }, ['admin', 'support'])).toBe(false);
    });

    it('returns false when no role claim', () => {
        expect(hasRole({}, ['admin'])).toBe(false);
    });
});

describe('jwtAuth factory', () => {
    const SECRET = 'test-secret-32-chars-1234567890ab';

    it('produces a custom auth strategy', () => {
        const auth = jwtAuth({ secret: SECRET });
        expect((auth as { strategy: string }).strategy).toBe('custom');
    });

    it('has expected public paths by default', () => {
        const auth = jwtAuth({ secret: SECRET }) as {
            publicPaths?: string[];
        };
        expect(auth.publicPaths).toContain('/health');
        expect(auth.publicPaths).toContain('/v1/health');
    });

    it('validates a bearer token successfully', async () => {
        const token = makeToken({ sub: 'u1', role: 'user' }, SECRET);
        const auth = jwtAuth({ secret: SECRET }) as {
            validate: (req: { headers: Record<string, string> }) => Promise<{ authenticated: boolean; identity?: string }>;
        };
        const result = await auth.validate({
            headers: { authorization: `Bearer ${token}` },
        });
        expect(result.authenticated).toBe(true);
        expect(result.identity).toBe('u1');
    });

    it('rejects missing auth header', async () => {
        const auth = jwtAuth({ secret: SECRET }) as {
            validate: (req: { headers: Record<string, string> }) => Promise<{ authenticated: boolean; reason?: string }>;
        };
        const result = await auth.validate({ headers: {} });
        expect(result.authenticated).toBe(false);
    });

    it('rejects invalid token', async () => {
        const auth = jwtAuth({ secret: SECRET }) as {
            validate: (req: { headers: Record<string, string> }) => Promise<{ authenticated: boolean; reason?: string }>;
        };
        const result = await auth.validate({ headers: { authorization: 'Bearer invalid.token.here' } });
        expect(result.authenticated).toBe(false);
    });
});
