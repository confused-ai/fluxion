/**
 * Tests: MockToolRegistry + createTestAgent
 */
import { describe, it, expect } from 'vitest';
import { MockToolRegistry } from '../src/testing/mock-tool-registry.js';
import { MockLLMProvider } from '../src/testing/mock-llm.js';
import { MockSessionStore } from '../src/testing/mock-session-store.js';
import { createTestSessionId } from '../src/testing/test-fixtures.js';

describe('MockToolRegistry', () => {
    it('records tool calls', async () => {
        const registry = new MockToolRegistry({
            search: async (args) => `results for: ${(args as { query: string }).query}`,
        });

        const tools = registry.toTools();
        expect(tools).toHaveLength(1);
        expect(tools[0]!.name).toBe('search');

        // Execute the tool directly
        const ctx = {
            toolId: 'test-tool-id',
            agentId: 'test-agent',
            sessionId: createTestSessionId(),
            permissions: {
                allowNetwork: false,
                allowFileSystem: false,
                maxExecutionTimeMs: 5000,
            },
        };
        const result = await tools[0]!.execute({ query: 'TypeScript docs' }, ctx);
        expect(result.success).toBe(true);
        expect(result.data).toBe('results for: TypeScript docs');

        // Verify call was recorded
        expect(registry.calls('search')).toHaveLength(1);
        expect(registry.lastCall('search')?.args).toEqual({ query: 'TypeScript docs' });
    });

    it('handles tool errors gracefully', async () => {
        const registry = new MockToolRegistry({
            failTool: async () => { throw new Error('Tool failed intentionally'); },
        });

        const tools = registry.toTools();
        const ctx = {
            toolId: 'test-tool-id',
            agentId: 'test-agent',
            sessionId: createTestSessionId(),
            permissions: { allowNetwork: false, allowFileSystem: false, maxExecutionTimeMs: 5000 },
        };
        const result = await tools[0]!.execute({}, ctx);
        expect(result.success).toBe(false);
        expect(result.error?.message).toContain('Tool failed intentionally');

        // Still records the (failed) call
        expect(registry.calls('failTool')).toHaveLength(1);
    });

    it('records all calls across multiple tools', async () => {
        const registry = new MockToolRegistry({
            toolA: async () => 'a',
            toolB: async () => 'b',
        });

        const [toolA, toolB] = registry.toTools();
        const ctx = {
            toolId: 'test-tool-id',
            agentId: 'test-agent',
            sessionId: createTestSessionId(),
            permissions: { allowNetwork: false, allowFileSystem: false, maxExecutionTimeMs: 5000 },
        };
        await toolA!.execute({}, ctx);
        await toolB!.execute({}, ctx);
        await toolA!.execute({}, ctx);

        expect(registry.allCalls).toHaveLength(3);
        expect(registry.calls('toolA')).toHaveLength(2);
        expect(registry.calls('toolB')).toHaveLength(1);
    });

    it('resets recorded calls', async () => {
        const registry = new MockToolRegistry({ t: async () => 'ok' });
        const [tool] = registry.toTools();
        const ctx = {
            toolId: 'test-tool-id',
            agentId: 'test-agent',
            sessionId: createTestSessionId(),
            permissions: { allowNetwork: false, allowFileSystem: false, maxExecutionTimeMs: 5000 },
        };
        await tool!.execute({}, ctx);
        expect(registry.allCalls).toHaveLength(1);

        registry.reset();
        expect(registry.allCalls).toHaveLength(0);
    });

    it('allows registering tools after construction', async () => {
        const registry = new MockToolRegistry();
        registry.register('dynamic', async () => 'dynamic result');

        const tools = registry.toTools();
        expect(tools).toHaveLength(1);
        const ctx = {
            toolId: 'test-tool-id',
            agentId: 'test-agent',
            sessionId: createTestSessionId(),
            permissions: { allowNetwork: false, allowFileSystem: false, maxExecutionTimeMs: 5000 },
        };
        const result = await tools[0]!.execute({}, ctx);
        expect(result.data).toBe('dynamic result');
    });
});

describe('MockLLMProvider', () => {
    it('returns mock response', async () => {
        const llm = new MockLLMProvider({ response: 'Paris' });
        const result = await llm.generateText([{ role: 'user', content: 'Capital of France?' }]);
        expect(result.text).toBe('Paris');
    });

    it('throws on shouldError', async () => {
        const llm = new MockLLMProvider({ shouldError: true });
        await expect(
            llm.generateText([{ role: 'user', content: 'test' }])
        ).rejects.toThrow('Mock LLM error');
    });

    it('returns response map for specific prompts', async () => {
        const responses = new Map([
            ['What is 2+2?', '4'],
            ['What is 3+3?', '6'],
        ]);
        const llm = new MockLLMProvider({ responses, response: 'default' });
        const r1 = await llm.generateText([{ role: 'user', content: 'What is 2+2?' }]);
        expect(r1.text).toBe('4');
        const r2 = await llm.generateText([{ role: 'user', content: 'Unknown question' }]);
        expect(r2.text).toBe('default');
    });

    it('returns tool calls when configured', async () => {
        const toolCalls = [{ id: 'tc1', name: 'search', arguments: { query: 'test' } }];
        const llm = new MockLLMProvider({ toolCalls });
        const result = await llm.generateText([{ role: 'user', content: 'Search' }]);
        expect(result.toolCalls).toEqual(toolCalls);
    });
});

describe('MockSessionStore', () => {
    it('creates and retrieves sessions', async () => {
        const store = new MockSessionStore();
        const session = await store.create({ userId: 'u1', agentId: 'a1', state: 'active', metadata: {} });
        expect(session.id).toBeDefined();

        const retrieved = await store.get(session.id);
        expect(retrieved?.userId).toBe('u1');
    });

    it('tracks created session IDs', async () => {
        const store = new MockSessionStore();
        await store.create({ userId: 'u1', agentId: 'a1', state: 'active', metadata: {} });
        await store.create({ userId: 'u2', agentId: 'a1', state: 'active', metadata: {} });
        expect(store.getCreatedSessionIds()).toHaveLength(2);
    });

    it('deletes sessions', async () => {
        const store = new MockSessionStore();
        const session = await store.create({ userId: 'u1', agentId: 'a1', state: 'active', metadata: {} });
        await store.delete(session.id);
        const retrieved = await store.get(session.id);
        expect(retrieved).toBeNull();
    });
});
