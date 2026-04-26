/**
 * Orchestration module exports
 */

export * from './types.js';
export { OrchestratorImpl } from './orchestrator.js';
export { MessageBusImpl } from './message-bus.js';
export { RoundRobinLoadBalancer } from './load-balancer.js';
export { createRunnableAgent } from './agent-adapter.js';
export type { RunnableAgentConfig } from './agent-adapter.js';
export { createSupervisor, createRole } from './supervisor.js';
export type { SupervisorConfig } from './supervisor.js';
export { createPipeline } from './pipeline.js';
export type { PipelineConfig } from './pipeline.js';
export { createToolkit, toolkitsToRegistry } from './toolkit.js';
export type { Toolkit } from './toolkit.js';
export type { MCPClient, MCPServerAdapter, MCPToolDescriptor, A2AMessage, A2AClient } from './mcp-types.js';
export { HttpA2AClient, createHttpA2AClient } from './http-a2a-client.js';
export type { HttpA2AClientConfig } from './http-a2a-client.js';

// Agent Swarm exports (Kimi K2.5 inspired)
export {
    SwarmOrchestrator,
    createSwarm,
    createSwarmAgent,
} from './swarm.js';
export type {
    SwarmConfig,
    SwarmResult,
    SubagentTemplate,
    Subtask,
    SubtaskResult,
    ExecutionStage,
    CriticalPathMetrics,
    SubagentInstance,
} from './swarm.js';

// Team orchestration
export {
    Team,
    createResearchTeam,
    createDecisionTeam,
} from './team.js';
export type { TeamAgent, TeamConfig, TeamMemberResult, TeamResult } from './team.js';

// Agent Router — capability-based dynamic routing
export { AgentRouter, createAgentRouter } from './router.js';
export type { RoutableAgent, AgentRouterConfig, RouteResult, AgentRoutingStrategy } from './router.js';

// Handoff Protocol — structured agent-to-agent task handoff
export { HandoffProtocol, createHandoff } from './handoff.js';
export type { HandoffConfig, HandoffResult, HandoffRecord, HandoffContext } from './handoff.js';

// Consensus Protocol — multi-agent voting and agreement
export { ConsensusProtocol, createConsensus } from './consensus.js';
export type { ConsensusConfig, ConsensusResult, AgentVote, ConsensusStrategy } from './consensus.js';