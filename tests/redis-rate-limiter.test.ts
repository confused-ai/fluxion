import { describe, it, expect } from 'vitest';
import { RedisRateLimiter } from '../src/production/redis-rate-limiter.js';
import { RateLimitError } from '../src/production/rate-limiter.js';
import type { RedisClient } from '../src/session/redis-store.js';

/** Minimal fake for {@link RedisRateLimiter} (only incr + expire). */
function createFakeRedis(): RedisClient {
    const counts = new Map<string, number>();
    return {
        async incr(key: string): Promise<number> {
            const n = (counts.get(key) ?? 0) + 1;
            counts.set(key, n);
            return n;
        },
        async expire(_key: string, _seconds: number): Promise<number> {
            return 1;
        },
    } as unknown as RedisClient;
}

describe('RedisRateLimiter', () => {
    it('allows requests up to maxRequests then throws', async () => {
        const redis = createFakeRedis();
        const limiter = new RedisRateLimiter({
            redis,
            name: 'unit',
            maxRequests: 2,
            windowSeconds: 3600,
            keyPrefix: 'test:rl:',
        });
        await expect(limiter.execute(async () => 1)).resolves.toBe(1);
        await expect(limiter.execute(async () => 2)).resolves.toBe(2);
        await expect(limiter.execute(async () => 3)).rejects.toThrow(RateLimitError);
    });

    it('tryAcquire returns false when over limit', async () => {
        const redis = createFakeRedis();
        const limiter = new RedisRateLimiter({
            redis,
            name: 'try',
            maxRequests: 1,
            windowSeconds: 3600,
            keyPrefix: 'test:rl:',
        });
        await expect(limiter.tryAcquire()).resolves.toBe(true);
        await expect(limiter.tryAcquire()).resolves.toBe(false);
    });
});
