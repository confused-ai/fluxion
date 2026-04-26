/**
 * Confused-AI Framework Architecture
 *
 * A production-grade, lightweight, high-performance multi-agent framework in TypeScript.
 *
 * ## Design Principles
 *
 * 1. **Zero abstraction overhead** - No heavy base classes, minimal metaclasses
 * 2. **Async-first** - All operations are async, built for concurrent workloads
 * 3. **Dependency-free core** - The contracts layer has zero dependencies
 * 4. **Pluggable everything** - LLM providers, tools, memory, storage all use interfaces
 * 5. **DX-first** - Clean API, strong typing, minimal boilerplate
 *
 * ## Architecture Overview
 *
 * ```
 * ┌─────────────────────────────────────────────────────────────────┐
 * │                         User Code                                │
 * │                                                                   │
 * │   agent('You are helpful')          defineAgent().build()        │
 * │   createAgent({...})                new Agent({...})              │
 * └────────────────────────┬────────────────────────────────────────┘
 *                          │
 * ┌────────────────────────▼────────────────────────────────────────┐
 * │                      DX Layer                                   │
 * │   agent() · defineAgent() · compose() · persona-builder          │
 * └────────────────────────┬────────────────────────────────────────┘
 *                          │
 * ┌────────────────────────▼────────────────────────────────────────┐
 * │                    Agentic Core                                 │
 * │                                                                   │
 * │   AgenticRunner (ReAct loop)                                     │
 * │     ├── LLM Provider (OpenAI, Anthropic, Google, local)         │
 * │     ├── Tool Registry                                            │
 * │     ├── Guardrail Engine                                         │
 * │     ├── Human-in-the-Loop hooks                                  │
 * │     └── Memory Store                                             │
 * │                                                                   │
 * │   Execution Engine (task graph, parallelism)                      │
 * │   Planner (LLM-based or classical)                               │
 * └────────────────────────┬────────────────────────────────────────┘
 *                          │
 * ┌────────────────────────▼────────────────────────────────────────┐
 * │                    Contracts (Dependency-Free)                   │
 * │                                                                   │
 * │   AgentIdentity · Message · ToolCall · MemoryStore                │
 * │   Session · Planner · Guardrail · Orchestration                  │
 * │   RAGEngine · Plugin · Workflow                                  │
 * └────────────────────────┬────────────────────────────────────────┘
 *                          │
 * ┌────────────────────────▼────────────────────────────────────────┐
 * │                   Infrastructure Layer                            │
 * │                                                                   │
 * │   Tools (50+ built-in)                                           │
 * │   Memory (InMemory, Vector, Redis, Postgres)                      │
 * │   Session (InMemory, SQLite, Redis, BunSqlite)                    │
 * │   Storage (Key-Value blob)                                        │
 * │   Observability (OTLP, metrics, logging)                         │
 * │   Production (circuit breakers, budgets, checkpoints)             │
 * └─────────────────────────────────────────────────────────────────┘
 * ```
 *
 * ## Module Structure
 *
 * ### Core Abstractions (`src/core/`, `src/contracts/`)
 *
 * - `Agent` - Abstract base class for all agents
 * - `BaseAgent` - Common functionality (lifecycle, hooks, state machine)
 * - `AgentContext` - Execution context (memory, tools, planner, metadata)
 * - `AgentConfig` - Agent configuration
 *
 * ### Contracts (`src/contracts/index.ts`)
 *
 * The dependency-free foundation layer. All modules import from here instead
 * of cross-importing. This eliminates circular dependencies.
 *
 * Key interfaces:
 * - `AgentIdentity`, `AgentInput`, `AgentOutput`, `AgentHooks`
 * - `Message`, `ToolCall`, `LLMToolDefinition`, `Embedding`
 * - `MemoryStore`, `Session`, `SessionStore`
 * - `Tool`, `ToolRegistry`, `ToolResult`
 * - `Planner`, `Plan`, `Task`
 * - `GuardrailEngine`, `GuardrailContext`
 * - `Workflow`, `WorkflowExecutor`
 * - `Orchestrator`, `MessageBus`
 *
 * ### Agentic Loop (`src/agentic/`)
 *
 * ReAct-style agent execution:
 * ```
 * while steps < maxSteps:
 *   1. LLM generates text/tool_calls
 *   2. If no tool_calls → return response
 *   3. For each tool_call:
 *      - Guardrail check
 *      - Human-in-the-loop approval (optional)
 *      - Execute tool
 *      - Output guardrail check
 *      - Feed result back to LLM
 *   4. Repeat
 * ```
 *
 * Features:
 * - Checkpoint/resume (durable state survives restarts)
 * - Streaming support
 * - Retry with exponential backoff
 * - Budget enforcement (per-user USD caps)
 * - Structured output validation
 *
 * ### Execution Engine (`src/execution/`)
 *
 * Task graph execution with:
 * - DAG-based dependency resolution
 * - Parallel execution (configurable concurrency)
 * - Event emission (start, complete, error, retry)
 * - Abort signal support
 * - Retry policies
 *
 * ### State Graph (`src/execution/state-graph.ts`)
 *
 * Graph-based workflow state management:
 * - Nodes: TASK, DECISION, PARALLEL, MERGE, START, END
 * - Transitions: UNCONDITIONAL, CONDITIONAL, TIMEOUT, ERROR
 * - Branch merging with dependency tracking
 * - Deterministic replay
 * - Checkpoint/persistence
 *
 * ### Memory System (`src/memory/`)
 *
 * Two-tier memory:
 * - **Short-term**: Session messages, conversation history
 * - **Long-term**: Semantic vector store (pluggable backends)
 *
 * Memory types:
 * - `MemoryType.SHORT_TERM` - In-memory, session-scoped
 * - `MemoryType.LONG_TERM` - Persisted, cross-session
 * - `MemoryType.EPISODIC` - Event/log storage
 * - `MemoryType.SEMANTIC` - Vector embeddings
 *
 * ### Session System (`src/session/`)
 *
 * Session store interface with multiple backends:
 * - `InMemorySessionStore` - Development, testing
 * - `SqliteSessionStore` - Production single-instance
 * - `RedisSessionStore` - Production distributed
 * - `BunSqliteStore` - Bun runtime optimized
 *
 * ### Tools (`src/tools/`)
 *
 * 50+ built-in tools organized by category:
 * - `core/` - HTTP, browser, file system, database
 * - `ai/` - Embeddings, image generation
 * - `web/` - Web search, scraping
 * - `communication/` - Email, Slack
 * - `data/` - Data processing, SQL
 * - And more...
 *
 * Tool features:
 * - Zod parameter validation
 * - Middleware (beforeExecute, afterExecute, onError)
 * - Permission system
 * - Timeout handling
 *
 * ### Providers (`src/providers/`)
 *
 * LLM provider interface with implementations:
 * - `OpenAIProvider` - OpenAI GPT models
 * - `AnthropicProvider` - Claude models
 * - `GoogleProvider` - Gemini models
 * - `OpenRouterProvider` - Multi-model gateway
 * - `OllamaProvider` - Local models
 *
 * ### Orchestration (`src/orchestration/`)
 *
 * Multi-agent coordination:
 * - `MessageBus` - Inter-agent communication
 * - `Orchestrator` - Agent registration, delegation
 * - `LoadBalancer` - Task distribution
 * - `Supervisor` - Hierarchical delegation
 * - `Swarm` - Peer-to-peer collaboration
 * - `Router` - Intent-based routing
 * - `Consensus` - Multi-agent agreement
 *
 * ### Production Features (`src/production/`)
 *
 * - `CircuitBreaker` - Failure handling
 * - `RateLimiter` - In-memory, Redis-backed
 * - `BudgetEnforcer` - Per-user USD caps
 * - `CheckpointStore` - Durable state
 * - `IdempotencyKeys` - Duplicate prevention
 * - `HealthChecks` - Liveness/readiness
 * - `AuditLogging` - Compliance logging
 *
 * ### Observability (`src/observability/`)
 *
 * - OTLP tracing (OpenTelemetry)
 * - Metrics collection
 * - Structured logging
 *
 * ## Design Trade-offs
 *
 * ### Why not LangChain-style chains?
 *
 * LangChain's chain abstraction is:
 * - Heavy (LCEL has significant overhead)
 * - Implicit (hard to debug, predict execution order)
 * - Monolithic (hard to extend individual components)
 *
 * Our approach:
 * - Explicit execution graph (you see exactly what runs when)
 * - Minimal overhead (no chain abstractions)
 * - Full extensibility (swap any component)
 *
 * ### Why graph-based state?
 *
 * Traditional workflow engines use:
 * - Sequential steps (hard to express parallel branches)
 * - Centralized state (bottleneck for high concurrency)
 * - Implicit dependencies (hard to track, debug)
 *
 * Graph-based state:
 * - DAG represents all possible execution paths
 * - Each node is independent (parallel execution trivial)
 * - Transitions are explicit (easy to trace, debug)
 * - Branches merge naturally (deterministic replay)
 *
 * ### Why async-first?
 *
 * Synchronous APIs:
 * - Easier to write (familiar patterns)
 * - Harder to scale (blocking threads)
 * - Poor concurrency (one thing at a time)
 *
 * Async-first:
 * - Steeper learning curve
 * - Better resource utilization
 * - Native concurrency (multiple agents at once)
 *
 * ### Why contracts layer?
 *
 * Without dependency-free contracts:
 * - Circular dependencies (A imports B, B imports A)
 * - Breaking changes cascade (change in one module affects many)
 * - Testing requires full system (can't unit test in isolation)
 *
 * With contracts:
 * - Clear boundaries (modules only know interfaces, not implementations)
 * - Testable (mock any interface)
 * - Extensible (swap implementations without changing consumers)
 *
 * ## Usage Examples
 *
 * ### Minimal Agent
 *
 * ```typescript
 * import { createAgent } from 'confused-ai/create-agent';
 *
 * const agent = createAgent({
 *   name: 'MyAgent',
 *   instructions: 'You are a helpful assistant.',
 * });
 *
 * const result = await agent.run('What is 2+2?');
 * console.log(result.text);
 * ```
 *
 * ### Agent with Tools
 *
 * ```typescript
 * import { createAgent } from 'confused-ai/create-agent';
 * import { HttpClientTool } from 'confused-ai/tools/core';
 *
 * const agent = createAgent({
 *   name: 'ResearchAgent',
 *   instructions: 'You are a research assistant. Use tools to find information.',
 *   tools: [new HttpClientTool()],
 * });
 * ```
 *
 * ### Graph-Based Workflow
 *
 * ```typescript
 * import { WorkflowBuilder, StateGraph } from 'confused-ai/execution';
 *
 * const workflow = new WorkflowBuilder('my-workflow')
 *   .start('start')
 *   .task('fetch-data', async (ctx) => {
 *     ctx.variables.set('data', await fetchData());
 *   })
 *   .decision('validate', async (ctx) => {
 *     return ctx.variables.get('data') !== null;
 *   })
 *   .task('process', async (ctx) => {
 *     return processData(ctx.variables.get('data'));
 *   })
 *   .end('end')
 *   .build();
 *
 * const executor = new WorkflowExecutor(workflow);
 * const result = await executor.execute({});
 * ```
 *
 * ### Multi-Agent Orchestration
 *
 * ```typescript
 * import { createSupervisorOrchestrator } from 'confused-ai/orchestration';
 *
 * const orchestrator = createSupervisorOrchestrator({
 *   agents: [researchAgent, writerAgent, editorAgent],
 *   coordination: 'hierarchical',
 * });
 *
 * const result = await orchestrator.execute({
 *   task: 'Research, write, and edit an article about AI.',
 * });
 * ```
 *
 * ## Performance Considerations
 *
 * ### Memory Footprint
 *
 * The framework is designed for minimal memory overhead:
 * - Lazy loading (modules load on first use)
 * - No heavy dependencies (core has zero runtime deps)
 * - Streaming responses (don't buffer full outputs)
 * - Efficient data structures (Maps, Sets over Objects)
 *
 * ### Latency
 *
 * - Connection pooling for HTTP tools
 * - Parallel tool execution when possible
 * - Minimal intermediate allocations
 * - Async-first (non-blocking I/O)
 *
 * ### Concurrency
 *
 * - Execution engine supports parallel step execution
 * - Configurable concurrency limits
 * - Backpressure handling (queue overflow protection)
 * - Abort signal propagation
 *
 * ## Comparison with Other Frameworks
 *
 * | Feature              | LangChain    | Confused-AI              |
 * |---------------------|--------------|--------------------------|
 * | Core abstractions    | Chains, Agents| State graph, Agent loops |
 * | Dependency model     | Heavy        | Zero (contracts layer)   |
 * | Memory system       | Buffer-based | Tiered (short/long-term) |
 * | Workflow model      | Sequential   | DAG-based                |
 * | Extensibility        | Monkey-patching| Interface-based        |
 * | Performance         | Heavy overhead| Minimal abstractions    |
 * | DX                  | Complex      | Simple, typed           |
 *
 * ## Extension Points
 *
 * ### Custom LLM Provider
 *
 * ```typescript
 * import { LLMProvider, Message } from 'confused-ai/contracts';
 *
 * class MyProvider implements LLMProvider {
 *   async generateText(messages: Message[]): Promise<GenerateResult> {
 *     // Your implementation
 *   }
 *
 *   async streamText(messages: Message[], onChunk: StreamCallback): Promise<void> {
 *     // Your streaming implementation
 *   }
 * }
 * ```
 *
 * ### Custom Tool
 *
 * ```typescript
 * import { Tool } from 'confused-ai/contracts';
 *
 * class MyTool implements Tool {
 *   id = 'my-tool';
 *   name = 'My Tool';
 *   description = 'Does something useful';
 *   parameters = zodSchema;
 *
 *   async execute(args, context): Promise<ToolResult> {
 *     // Your implementation
 *   }
 * }
 * ```
 *
 * ### Custom Memory Store
 *
 * ```typescript
 * import { MemoryStore } from 'confused-ai/contracts';
 *
 * class MyMemoryStore implements MemoryStore {
 *   async store(entry): Promise<MemoryEntry> { /* ... */ }
 *   async retrieve(query): Promise<MemorySearchResult[]> { /* ... */ }
 *   // ... other methods
 * }
 * ```
 */

export const VERSION = '0.8.1';
export const FRAMEWORK_NAME = 'Confused-AI';