/**
 * Health Check Unit Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
    HealthCheckManager,
    HealthStatus,
    createCustomHealthCheck,
} from '../src/production/health.js';
import type { HealthComponent } from '../src/production/health.js';

describe('HealthCheckManager', () => {
    let manager: HealthCheckManager;

    beforeEach(() => {
        manager = new HealthCheckManager({ version: '1.0.0' });
    });

    describe('liveness', () => {
        it('should return HEALTHY status', () => {
            const result = manager.liveness();

            expect(result.status).toBe(HealthStatus.HEALTHY);
            expect(result.uptime).toBeGreaterThanOrEqual(0);
        });
    });

    describe('check with no components', () => {
        it('should return HEALTHY when no components', async () => {
            const result = await manager.check();

            expect(result.status).toBe(HealthStatus.HEALTHY);
            expect(result.components).toHaveLength(0);
            expect(result.version).toBe('1.0.0');
        });
    });

    describe('check with healthy components', () => {
        it('should aggregate healthy status', async () => {
            manager.addComponent({
                name: 'db',
                check: async () => ({ status: HealthStatus.HEALTHY }),
            });
            manager.addComponent({
                name: 'cache',
                check: async () => ({ status: HealthStatus.HEALTHY }),
            });

            const result = await manager.check();

            expect(result.status).toBe(HealthStatus.HEALTHY);
            expect(result.components).toHaveLength(2);
            expect(result.components[0].name).toBe('db');
            expect(result.components[1].name).toBe('cache');
        });
    });

    describe('check with unhealthy components', () => {
        it('should return UNHEALTHY when any component fails', async () => {
            manager.addComponent({
                name: 'healthy',
                check: async () => ({ status: HealthStatus.HEALTHY }),
            });
            manager.addComponent({
                name: 'unhealthy',
                check: async () => ({
                    status: HealthStatus.UNHEALTHY,
                    message: 'Database connection failed',
                }),
            });

            const result = await manager.check();

            expect(result.status).toBe(HealthStatus.UNHEALTHY);
        });

        it('should return DEGRADED when component is degraded', async () => {
            manager.addComponent({
                name: 'healthy',
                check: async () => ({ status: HealthStatus.HEALTHY }),
            });
            manager.addComponent({
                name: 'degraded',
                check: async () => ({ status: HealthStatus.DEGRADED }),
            });

            const result = await manager.check();

            expect(result.status).toBe(HealthStatus.DEGRADED);
        });
    });

    describe('check with throwing component', () => {
        it('should handle errors gracefully', async () => {
            manager.addComponent({
                name: 'throwing',
                check: async () => { throw new Error('Component died'); },
            });

            const result = await manager.check();

            expect(result.status).toBe(HealthStatus.UNHEALTHY);
            expect(result.components[0].message).toContain('Component died');
        });
    });

    describe('check with timeout', () => {
        it('should timeout slow components', async () => {
            manager = new HealthCheckManager({ checkTimeoutMs: 100 });

            manager.addComponent({
                name: 'slow',
                check: async () => {
                    await new Promise(resolve => setTimeout(resolve, 500));
                    return { status: HealthStatus.HEALTHY };
                },
            });

            const result = await manager.check();

            expect(result.status).toBe(HealthStatus.UNHEALTHY);
            expect(result.components[0].message).toContain('timed out');
        });
    });

    describe('component management', () => {
        it('should add components', async () => {
            manager.addComponent({
                name: 'test',
                check: async () => ({ status: HealthStatus.HEALTHY }),
            });

            // Check is accessible via check
            await expect(manager.check()).resolves.toMatchObject({
                components: [{ name: 'test' }],
            });
        });

        it('should remove components', async () => {
            manager.addComponent({
                name: 'to-remove',
                check: async () => ({ status: HealthStatus.HEALTHY }),
            });

            manager.removeComponent('to-remove');

            const result = await manager.check();
            expect(result.components).toHaveLength(0);
        });
    });

    describe('getLastResult', () => {
        it('should return null before first check', () => {
            expect(manager.getLastResult()).toBeNull();
        });

        it('should return last result after check', async () => {
            await manager.check();

            expect(manager.getLastResult()).not.toBeNull();
            expect(manager.getLastResult()?.status).toBe(HealthStatus.HEALTHY);
        });
    });
});

describe('createCustomHealthCheck', () => {
    it('should create component from boolean function', async () => {
        const component = createCustomHealthCheck('custom', async () => true);

        const result = await component.check();
        expect(result.status).toBe(HealthStatus.HEALTHY);
    });

    it('should handle false return', async () => {
        const component = createCustomHealthCheck('failing', async () => false);

        const result = await component.check();
        expect(result.status).toBe(HealthStatus.UNHEALTHY);
    });

    it('should handle detailed status return', async () => {
        const component = createCustomHealthCheck('detailed', async () => ({
            status: HealthStatus.DEGRADED,
            message: 'High latency',
        }));

        const result = await component.check();
        expect(result.status).toBe(HealthStatus.DEGRADED);
        expect(result.message).toBe('High latency');
    });
});
