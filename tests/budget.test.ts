/**
 * Tests: Budget enforcement
 *
 * addStepCost(model, promptTokens, completionTokens) — converts to USD via MODEL_PRICING
 * A cheap model: 'gpt-3.5-turbo' at ~$0.0015/1M input, $0.002/1M output
 * To reliably exceed a $0.001 per-run cap, use very high token counts.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { BudgetEnforcer, BudgetExceededError, InMemoryBudgetStore, estimateCostUsd } from '../src/production/budget.js';
import type { BudgetConfig } from '../src/production/budget.js';

// Model with known pricing for deterministic tests
const MODEL = 'gpt-4';
// gpt-4 pricing: ~$30/1M input, $60/1M output
// 100k input + 100k output ≈ $3 + $6 = $9 → reliably exceeds $0.10 cap
const BIG_TOKENS = 100_000;
// 100 input + 100 output ≈ $0.003 + $0.006 = $0.009 — well under $0.10
const SMALL_INPUT = 100;
const SMALL_OUTPUT = 100;

describe('estimateCostUsd', () => {
    it('returns a positive number', () => {
        const cost = estimateCostUsd(MODEL, 1000, 500);
        expect(cost).toBeGreaterThan(0);
    });

    it('returns zero for zero tokens', () => {
        const cost = estimateCostUsd(MODEL, 0, 0);
        expect(cost).toBe(0);
    });

    it('output tokens cost more than equal input tokens for GPT-4', () => {
        const inputCost = estimateCostUsd(MODEL, 1000, 0);
        const outputCost = estimateCostUsd(MODEL, 0, 1000);
        expect(outputCost).toBeGreaterThan(inputCost);
    });
});

describe('BudgetEnforcer', () => {
    let enforcer: BudgetEnforcer;

    beforeEach(() => {
        const config: BudgetConfig = {
            maxUsdPerRun: 0.10,     // 10 cents per run
            maxUsdPerUser: 1.00,    // $1 per user per day
            onExceeded: 'throw',
            store: new InMemoryBudgetStore(),
        };
        enforcer = new BudgetEnforcer(config);
    });

    it('does not throw for a cheap run', async () => {
        enforcer.resetRun();
        // Small tokens → very cheap, well under $0.10
        enforcer.addStepCost(MODEL, 100, 100);
        await expect(enforcer.recordAndCheck('user-1')).resolves.toBeGreaterThanOrEqual(0);
    });

    it('throws BudgetExceededError when per-run limit is exceeded', () => {
        enforcer.resetRun();
        // addStepCost throws synchronously when run cap is exceeded
        expect(() => {
            enforcer.addStepCost(MODEL, BIG_TOKENS, BIG_TOKENS);
        }).toThrow(BudgetExceededError);
    });

    it('accumulates cost across multiple addStepCost calls', () => {
        enforcer.resetRun();
        // First call: cheap, stays under cap
        enforcer.addStepCost(MODEL, SMALL_INPUT, SMALL_OUTPUT);
        // Second large call crosses the cap
        expect(() => {
            enforcer.addStepCost(MODEL, BIG_TOKENS, BIG_TOKENS);
        }).toThrow(BudgetExceededError);
    });

    it('resets per-run cost between runs', async () => {
        enforcer.resetRun();
        enforcer.addStepCost(MODEL, SMALL_INPUT, SMALL_OUTPUT); // small — OK
        await enforcer.recordAndCheck('user-reset');

        // Fresh run — should not throw again for a small call
        enforcer.resetRun();
        enforcer.addStepCost(MODEL, SMALL_INPUT, SMALL_OUTPUT);
        await expect(enforcer.recordAndCheck('user-reset')).resolves.toBeGreaterThanOrEqual(0);
    });

    it('returns run cost in USD from recordAndCheck', async () => {
        enforcer.resetRun();
        enforcer.addStepCost(MODEL, SMALL_INPUT, SMALL_OUTPUT);
        const cost = await enforcer.recordAndCheck('user-cost');
        expect(cost).toBeGreaterThan(0);
        expect(cost).toBeLessThan(0.10);
    });

    it('BudgetExceededError has the right shape', () => {
        enforcer.resetRun();
        try {
            enforcer.addStepCost(MODEL, BIG_TOKENS, BIG_TOKENS);
        } catch (err) {
            expect(err).toBeInstanceOf(BudgetExceededError);
            const budgetErr = err as BudgetExceededError;
            expect(budgetErr.name).toBe('BudgetExceededError');
            expect(budgetErr.cap).toBe('run');
            expect(typeof budgetErr.limitUsd).toBe('number');
            expect(typeof budgetErr.spentUsd).toBe('number');
            expect(typeof budgetErr.message).toBe('string');
        }
    });

    it('enforces per-user daily limit across multiple runs', async () => {
        const perUserConfig: BudgetConfig = {
            maxUsdPerRun: Infinity,   // no run cap
            maxUsdPerUser: 0.05,      // 5 cents total per user
            onExceeded: 'throw',
            store: new InMemoryBudgetStore(),
        };
        const userEnforcer = new BudgetEnforcer(perUserConfig);

        // First run: small tokens, cheap cost
        userEnforcer.resetRun();
        userEnforcer.addStepCost(MODEL, SMALL_INPUT, SMALL_OUTPUT);
        await userEnforcer.recordAndCheck('user-limit');

        // Repeat until user daily cap is exceeded
        let threw = false;
        for (let i = 0; i < 20; i++) {
            try {
                userEnforcer.resetRun();
                userEnforcer.addStepCost(MODEL, SMALL_INPUT, SMALL_OUTPUT);
                await userEnforcer.recordAndCheck('user-limit');
            } catch (err) {
                expect(err).toBeInstanceOf(BudgetExceededError);
                threw = true;
                break;
            }
        }
        expect(threw).toBe(true);
    });
});
