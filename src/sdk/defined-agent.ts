import { MemoryStore, InMemoryStore } from '../memory/index.js';
import { ToolRegistry, ToolRegistryImpl, Tool } from '../tools/index.js';
import { ClassicalPlanner, PlanningAlgorithm } from '../planner/index.js';
import type { Planner } from '../planner/types.js';
import { ExecutionEngine, ExecutionEngineImpl } from '../execution/index.js';
import type { AgentDefinitionConfig, AgentRunConfig } from './types.js';

/**
 * Define a typed agent with optional `handler` for production logic.
 */
export function defineAgent<TInput = string, TOutput = unknown>(
    config: AgentDefinitionConfig<TInput, TOutput>
): DefinedAgent<TInput, TOutput> {
    return new DefinedAgent(config);
}

/**
 * Fluent, schema-first agent: tools, memory, planner, and optional handler.
 */
export class DefinedAgent<TInput, TOutput> {
    private config: AgentDefinitionConfig<TInput, TOutput>;
    private toolRegistry: ToolRegistry;
    private memoryStore: MemoryStore;
    private plannerInstance: Planner;
    private _executionEngine: ExecutionEngine;

    constructor(config: AgentDefinitionConfig<TInput, TOutput>) {
        this.config = config;
        this.toolRegistry = new ToolRegistryImpl();
        this.memoryStore = config.memory ?? new InMemoryStore();
        this.plannerInstance = config.planner ?? new ClassicalPlanner({ algorithm: PlanningAlgorithm.HIERARCHICAL });
        this._executionEngine = new ExecutionEngineImpl();

        if (config.tools) {
            for (const tool of config.tools) {
                this.toolRegistry.register(tool);
            }
        }
    }

    withTool(tool: Tool): this {
        this.toolRegistry.register(tool);
        return this;
    }

    withTools(tools: Tool[]): this {
        for (const tool of tools) {
            this.toolRegistry.register(tool);
        }
        return this;
    }

    withMemory(memory: MemoryStore): this {
        Object.assign(this, { memoryStore: memory });
        return this;
    }

    withPlanner(planner: Planner): this {
        Object.assign(this, { plannerInstance: planner });
        return this;
    }

    withExecutionEngine(engine: ExecutionEngine): this {
        this._executionEngine = engine;
        return this;
    }

    getExecutionEngine(): ExecutionEngine {
        return this._executionEngine;
    }

    async run(config: AgentRunConfig<TInput>): Promise<TOutput> {
        const validatedInput = this.config.inputSchema.parse(config.input);
        const handlerContext = {
            ...(config.context ?? {}),
            __memoryStore: this.memoryStore,
            __toolRegistry: this.toolRegistry,
            __planner: this.plannerInstance,
        };

        if (this.config.handler) {
            const handled = await this.config.handler(validatedInput, handlerContext);
            return this.config.outputSchema.parse(handled);
        }

        return this.config.outputSchema.parse(validatedInput as unknown);
    }

    async plan(goal: string): Promise<import('../planner/types.js').Plan> {
        return this.plannerInstance.plan(goal, {
            availableTools: this.toolRegistry.list().map(t => t.name),
        });
    }

    getConfig(): AgentDefinitionConfig<TInput, TOutput> {
        return { ...this.config };
    }
}
