import {
    Agent,
    AgentContext,
    AgentInput,
    AgentOutput,
    AgentState,
} from '../core/index.js';
import type { DefinedAgent } from './defined-agent.js';

class DefinedAgentAdapter extends Agent {
    constructor(private readonly definedAgent: DefinedAgent<unknown, unknown>) {
        super({
            name: definedAgent.getConfig().name,
            description: definedAgent.getConfig().description ?? '',
        });
    }

    async run(input: AgentInput, _ctx: AgentContext): Promise<AgentOutput> {
        const parsedInput =
            typeof input.prompt === 'string' && (input.prompt.startsWith('{') || input.prompt.startsWith('['))
                ? (JSON.parse(input.prompt) as unknown)
                : input.prompt;
        const result = await this.definedAgent.run({
            input: parsedInput,
            context: input.context ?? _ctx.metadata,
        });
        return {
            result,
            state: AgentState.COMPLETED,
            metadata: {
                startTime: new Date(),
                iterations: 0,
            },
        };
    }
}

/**
 * Adapts a `DefinedAgent` to the core `Agent` type for orchestration (supervisor, pipeline, etc.).
 */
export function asOrchestratorAgent(definedAgent: DefinedAgent<unknown, unknown>): Agent {
    return new DefinedAgentAdapter(definedAgent);
}
