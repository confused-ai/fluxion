# confused-ai

TypeScript framework for building production AI agents: ReAct-style agents, typed SDK workflows, memory, knowledge, guardrails, orchestration, observability, and a Node HTTP runtime.

**See [CAPABILITIES.md](./CAPABILITIES.md) for a full map of modules** (RAG, orchestration, production, artifacts, etc.) and **runnable** commands below.

## Install

```bash
npm install confused-ai
```

Peer / optional: install `openai` (or the SDK your LLM path uses) in your app. Some tools load optional dependencies at runtime (`@anthropic-ai/sdk`, `mysql2`, `stripe`, etc.); install only what you use.

## Quick start

```ts
import { createAgent } from "confused-ai";

const agent = createAgent({
  name: "Assistant",
  instructions: "You are a helpful assistant.",
});

const result = await agent.run("Hello!");
console.log(result.text);
```

**Lean bundle (no full umbrella import):** `import { createAgent, resolveLlmForCreateAgent } from "confused-ai/create-agent"`.

Set at least one of: `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GOOGLE_API_KEY` / `GEMINI_API_KEY`, or `OPENROUTER_API_KEY`, or pass `llm` / `model` / `apiKey` (see [LLM & environment](#llm--environment)).

---

## Creating agents

Use this section to pick **how** you build an agent, then wire **model → tools → session → run** (and optionally HTTP).

### Choose an entry point

| Approach | Import | When to use it |
|----------|--------|----------------|
| **`createAgent`** | `confused-ai` or `confused-ai/create-agent` | **Default:** one function gives you LLM resolution, ReAct loop, tools, session store, guardrails, `run` / `createSession`. Best for most products. |
| **DX `defineAgent()`** | `confused-ai` | **Fluent builder:** `.name().instructions().model().tools().withSession().build()` → same kind of runnable object as `createAgent`. |
| **`defineTypedAgent`** | `confused-ai` | **Zod I/O + optional `handler`:** typed inputs/outputs, pluggable memory/planner; pair with `createWorkflow` or `asOrchestratorAgent`. |
| **`createAgenticAgent`** | `confused-ai` / `agentic` | **Low-level loop** only: you pass `LLMProvider` + tools; no `createAgent` session wiring. |
| **`Agent` (class)** | `confused-ai` | **Subclassing** / custom lifecycle when you need the base class pattern. |

**Name collision:** on the main package, **`defineAgent`** is the **DX chain builder**. The Zod SDK factory is exported as **`defineTypedAgent`**.

### A. `createAgent` (step by step)

1. **Set credentials** — e.g. `OPENAI_API_KEY` in `.env`, or pass `model: "anthropic:claude-3-5-sonnet-20241022"`, or `llm: new OpenAIProvider({ ... })`.
2. **Pick a name and system prompt** — `name` and `instructions` are required.
3. **Add tools** — pass `tools: [new HttpClientTool(), new BrowserTool()]` or your own `BaseTool` instances, or `tools: []` for chat-only.
4. **Sessions (optional)** — call `await agent.createSession(userId?)` to get a `sessionId`, then `await agent.run(prompt, { sessionId })` so history is stored in `sessionStore` (default: in-memory; use SQL/Redis-backed store in production).
5. **Run** — `const { text, steps, finishReason } = await agent.run("...")`. Optional: `onChunk`, `onToolCall`, `onStep` for streaming and debugging.

```ts
import { createAgent } from "confused-ai";
import { CalculatorAddTool } from "confused-ai/tools";

const agent = createAgent({
  name: "MathHelper",
  instructions: "Use calculator_add for arithmetic (parameters a and b as numbers).",
  tools: [new CalculatorAddTool()],
  // sessionStore: myRedisOrSqlStore,  // optional
  // guardrails: true,
});

const sid = await agent.createSession("user-123");
const out = await agent.run("What is 40 + 2?", { sessionId: sid });
console.log(out.text);
```

### B. DX fluent builder → `CreateAgentResult`

Same capabilities as `createAgent`, but chainable:

```ts
import { defineAgent } from "confused-ai";
import { CalculatorAddTool } from "confused-ai/tools";

const agent = defineAgent()
  .name("MathHelper")
  .instructions("You are concise.")
  .model("openai:gpt-4o-mini")
  .tools([new CalculatorAddTool()])
  .withSession() // in-memory; pass a store for production
  .build();

await agent.run("Hi");
```

### C. Typed agents + workflows (`defineTypedAgent`)

For **Zod-validated** inputs/outputs and **multi-step graphs** without going straight to the orchestration module:

```ts
import { z } from "zod";
import { createWorkflow, defineTypedAgent, type DefinedAgent } from "confused-ai";

const step1 = defineTypedAgent({
  name: "plan",
  inputSchema: z.object({ goal: z.string() }),
  outputSchema: z.object({ bullets: z.array(z.string()) }),
  handler: async (i) => ({ bullets: [i.goal, "execute", "verify"] }),
});

const { results } = await createWorkflow()
  .task("plan", step1 as DefinedAgent<unknown, unknown>)
  .execute({ goal: "Ship v1" });
```

The `task` / `execute` input is merged into the workflow context; each `DefinedAgent` sees `config.input` from that object.

### D. Low-level: `createAgenticAgent`

Use when you already have a **custom** `LLMProvider` and **ToolRegistry** / `Tool[]` and want the ReAct runner **without** `createAgent`’s session CRUD:

```ts
import { createAgenticAgent, OpenAIProvider } from "confused-ai";
import { CalculatorAddTool } from "confused-ai/tools";

const inner = createAgenticAgent({
  name: "LowLevel",
  instructions: "Help the user.",
  llm: new OpenAIProvider({ model: "gpt-4o-mini" }),
  tools: [new CalculatorAddTool()],
});
await inner.run({ prompt: "Hello" });
```

### E. Class-based `Agent`

Use when you implement custom **orchestration** or **core** `Agent` subclasses — see `confused-ai/core` and `src/agent.ts` patterns.

### Serve the same agent over HTTP

After you have a `CreateAgentResult` from `createAgent` (or your builder), register it with **`createHttpService`** — see [HTTP runtime](#http-runtime).

### `createAgent` options (reference)

| Option | Role |
|--------|------|
| `name`, `instructions` | Required. Agent identity and system behavior |
| `llm` | Custom provider; otherwise resolved from `model` / env |
| `model`, `apiKey`, `baseURL` | OpenAI-style or `provider:model` string |
| `openRouter` | `{ apiKey, model? }` for OpenRouter |
| `tools` | `Tool[]` or `ToolRegistry` (framework defaults include HTTP + browser if you omit `tools` in some setups—pass `tools: [...]` explicitly to control) |
| `toolMiddleware` | Cross-tool middleware |
| `sessionStore` | Defaults to in-memory; plug Redis/SQL for production |
| `guardrails` | `true` (sensitive-data rule), `false`, or a `GuardrailEngine` |
| `maxSteps`, `timeoutMs` | Agentic loop limits |
| `retry` | Retry policy for LLM/tools |
| `logger` | `Logger` (e.g. `ConsoleLogger`) |
| `dev` | Dev logger + tool middleware when `true` |

`run()` returns `AgenticRunResult` (`text`, `steps`, `finishReason`, `messages`, …).  
Optional run hooks: `onChunk`, `onToolCall`, `onToolResult`, `onStep` (`AgentRunOptions`).

---

## Table of contents

- [Creating agents](#creating-agents)
- [Subpath packages](#subpath-packages)
- [LLM & environment](#llm--environment)
- [Sessions & chat history](#sessions--chat-history)
- [Tools](#tools)
- [Guardrails](#guardrails)
- [Agentic core (`createAgenticAgent`)](#agentic-core-createagenticagent)
- [SDK (`defineAgent`, workflows)](#sdk-defineagent-workflows)
- [Core `Agent` & orchestration](#core-agent--orchestration)
- [Memory & knowledge](#memory--knowledge)
- [Observability](#observability)
- [Production: health, rate limits, resilience](#production-health-rate-limits-resilience)
- [HTTP runtime](#http-runtime)
- [CLI](#cli)
- [Extensions, learning, config](#extensions-learning-config)
- [Artifacts, voice, video](#artifacts-voice-video)
- [MCP (HTTP) tools](#mcp-http-tools)
- [Examples in this repo](#examples-in-this-repo)
- [Telemetry](#telemetry)
- [License](#license)

---

## Subpath packages

The package is split so you can import only what you need. Main entry re-exports most modules; `package.json` → `exports` is authoritative.

| Import path | Purpose |
|-------------|--------|
| `confused-ai` | Main barrel: `createAgent`, `Agent`, `createAgenticAgent`, tools, session, LLM, orchestration, etc. |
| `confused-ai/create-agent` | `createAgent`, `resolveLlmForCreateAgent`, env helpers — smaller graph |
| `confused-ai/llm` | Providers, model resolution, embeddings |
| `confused-ai/agentic` | ReAct / agentic loop types and runner |
| `confused-ai/tools` | `BaseTool`, registries, built-in toolkits |
| `confused-ai/session` | `SessionStore`, in-memory, SQL, SQLite |
| `confused-ai/memory` | `MemoryStore`, in-memory, vector store |
| `confused-ai/knowledge` | RAG / retrieval engine types and loaders |
| `confused-ai/guardrails` | Validators, rules, types |
| `confused-ai/planner` | Planners, plans, task types |
| `confused-ai/execution` | Execution engine, graphs |
| `confused-ai/orchestration` | Pipelines, supervisor, swarm, team, MCP helpers |
| `confused-ai/observability` | Loggers, tracer, metrics, eval, OTLP |
| `confused-ai/production` | Health checks, rate limiter, circuit breaker, resumable streams, graceful shutdown |
| `confused-ai/config` | Environment / config loading |
| `confused-ai/testing` | Mock LLM, test fixtures |
| `confused-ai/runtime` | `createHttpService`, `listenService`, `getRuntimeOpenApiJson` |
| `confused-ai/artifacts` | Artifact storage and helpers |
| `confused-ai/voice` | Voice-related helpers |
| `confused-ai/extensions` | Extension points for DB, middleware |
| `confused-ai/core` | Base `Agent`, context builder, types |
| Main package | `createAgent`, `defineTypedAgent` (Zod SDK), `defineAgent` (DX chain builder), `createWorkflow`, `asOrchestratorAgent`, `learning`, etc. — see `src/index.ts` |

---

## LLM & environment

`createAgent` resolves a provider in this order (simplified; see `resolveLlmForCreateAgent` in source):

1. `options.llm` — your own `LLMProvider`
2. `options.model` as `provider:model_id` (e.g. `openai:gpt-4o`, `anthropic:claude-3-5-sonnet-20241022`, `google:...`) with matching env keys
3. `OPENROUTER_API_KEY` (+ optional `OPENROUTER_MODEL`)
4. `options.apiKey` / `options.baseURL` — OpenAI-compatible `OpenAIProvider`
5. `ANTHROPIC_API_KEY` → Anthropic
6. `GOOGLE_API_KEY` or `GEMINI_API_KEY` → Google
7. `OPENAI_API_KEY` (and `OPENAI_MODEL` / `OPENAI_BASE_URL` if set)

**Direct providers:** from `confused-ai/llm` use `OpenAIProvider`, `AnthropicProvider`, `GoogleProvider`, etc., and pass `llm: new OpenAIProvider({ ... })` into `createAgent`.

For the step-by-step guide and the **full `createAgent` options table**, see [Creating agents](#creating-agents) above.

**Imports (main package):** `import { createAgent, type CreateAgentResult } from "confused-ai"`.

---

## Sessions & chat history

- `createSession(userId?)` → `sessionId`
- `run(prompt, { sessionId })` — loads history from the session store and persists new turns
- `getSessionMessages(sessionId)` for inspection

Use a shared `SessionStore` (e.g. SQL) behind your `createAgent` instances if you run multiple processes.

---

## Tools

- Implement with `BaseTool` + Zod `parameters`, or use built-ins from `confused-ai/tools` (calculator, HTTP, browser, file, GitHub, finance, data stores, comms, search, …).
- Many integrations use **lazy `require()`** of third-party packages; add those dependencies to *your* app and ensure your bundler marks them as **external** (this library’s `tsup` build already does that for common optional SDKs).
- `toToolRegistry` / `ToolRegistryImpl` to build or adapt registries.

**MCP over HTTP:** `HttpMcpClient`, `loadMcpToolsFromUrl` (from main or tools entry) to bridge JSON-RPC `tools/list` and `tools/call` into `createAgent({ tools })`.

---

## Guardrails

- Pass `guardrails: true` to `createAgent` for a default `GuardrailValidator` with a sensitive-data style rule, or pass a custom `GuardrailEngine`.
- The agentic loop applies guardrails around completion when configured.

**Import:** `confused-ai/guardrails` for validators, allowlists, and types.

---

## Agentic core (`createAgenticAgent`)

Lower-level ReAct loop without `createAgent`’s session persistence: same `LLMProvider` + `ToolRegistry` + optional guardrails and middleware.  
**Import:** `import { createAgenticAgent } from "confused-ai"` or `confused-ai/agentic`.

---

## SDK (typed `defineAgent`, workflows)

Import from the main package name:

- **`defineTypedAgent({ name, inputSchema, outputSchema, handler?, tools?, memory?, planner? })`** — Zod-first **SDK** `DefinedAgent` (same as `defineAgent` in `src/sdk`; exported under this name so it does not clash with the DX builder).
- **`createWorkflow()`** — `.task(name, definedAgent).parallel() | .sequential()....execute(context)`; later tasks can read `context.results` in handlers.
- **`asOrchestratorAgent(definedAgent)`** — adapt a `DefinedAgent` to the core `Agent` type for pipelines / orchestrator.
- **`defineAgent()`** (no args, chainable) — **DX** fluent builder that returns a `CreateAgentResult` (see `defineAgent` in `src/dx`); this is the name `defineAgent` on the public entry.

```ts
import {
  createAgent,
  defineAgent,        // DX builder: defineAgent().name('x').instructions('…').build()
  defineTypedAgent,  // Zod: defineTypedAgent({ name, inputSchema, outputSchema, handler })
  createWorkflow,
  asOrchestratorAgent,
} from "confused-ai";
```

---

## Core `Agent` & orchestration

- **`import { Agent, AgentContextBuilder, ... } from "confused-ai/core"`** — base class and context for custom agents.
- **Orchestration** (`confused-ai/orchestration`): `createPipeline` (sequential handoff), `Orchestrator`, `Supervisor`, `Swarm`, `team`, `createRunnableAgent`, etc. Combine with `asOrchestratorAgent` to insert SDK agents into a pipeline.
- **Planner** (`confused-ai/planner`): classical / LLM planners, plan types.
- **Execution** (`confused-ai/execution`): `ExecutionEngine` for graph / worker-style runs.

---

## Memory & knowledge

- **Session-scoped** messages: `createAgent` + `SessionStore` (not long-term semantic memory).
- **Long-term & structured memory:** `MemoryStore` (`InMemoryStore`, vector store) with `defineAgent` or your own code paths — see `confused-ai/memory`.
- **RAG / knowledge:** `RAGEngine`, loaders, engines under `confused-ai/knowledge` (hybrid search, session state, etc. as implemented in your version).

---

## Observability

`confused-ai/observability`: `ConsoleLogger`, `InMemoryTracer`, `MetricsCollectorImpl`, eval metrics (`EvalAggregator`, accuracy helpers), `OTLPTraceExporter` / `OTLPMetricsExporter`.  
Wire `Logger` into `createAgent` where supported; use tracers/metrics in custom agents or services.

---

## Production: health, rate limits, resilience

`confused-ai/production`:

- **Health:** `HealthCheckManager`, `createLLMHealthCheck`, `createSessionStoreHealthCheck`, `createCustomHealthCheck`, `liveness` / `readiness` / `check`
- **Rate limits:** `RateLimiter`, `createOpenAIRateLimiter`
- **Circuit breaker:** `CircuitBreaker`, `createLLMCircuitBreaker`
- **Streams:** `ResumableStreamManager`, resumable SSE helpers
- **Shutdown:** `GracefulShutdown`, `withShutdownGuard`

---

## HTTP runtime

`import { createHttpService, listenService, getRuntimeOpenApiJson } from "confused-ai/runtime"`.

- **Routes (also under unversioned aliases):** `GET /v1/health`, `GET /v1/agents`, `POST /v1/sessions`, `POST /v1/chat`, `GET /v1/openapi.json`, optional `GET /v1/audit` (with tracing on)
- **Chat:** JSON body `{ "message", "agent"?, "sessionId"?, "userId"?, "stream"?: true }`  
  - Streaming: set `"stream": true` or `Accept: text/event-stream` — SSE `data:` lines with JSON `{ "type": "chunk" | "done" | "error", ... }`
- **CORS:** `cors: "*"` or your origin; headers include `Accept` for browser streaming

`getRuntimeOpenApiJson()` returns the same OpenAPI 3 document the server serves, for clients or documentation merge.

---

## CLI

`package.json` `"bin"`: `confused-ai` → `dist/cli.js` after `npm run build`. Run `npx confused-ai --help` for subcommands (build from source in dev: `bun` / `node` against built output).

---

## Extensions, learning, config

- **`confused-ai/extensions`:** plug DB/adapters, middleware across tools
- **Learning** (main or dedicated exports): user profiles, learning modes — see `src/learning` types
- **`confused-ai/config`:** load and validate environment / YAML-style config in apps that use the framework

---

## Artifacts, voice, video

- **Artifacts** (`confused-ai/artifacts`): structured artifacts (plans, data blobs) and storage abstractions
- **Voice** (`confused-ai/voice`): STT/TTS abstractions
- **Video** (`import ... from "confused-ai"` or video entry): `VideoOrchestrator` and related helpers; OpenAI + Pexels are initialized **lazily** when you use video features, not on every import

---

## MCP (HTTP) tools

Use `loadMcpToolsFromUrl` or `HttpMcpClient` to discover and call tools exposed over HTTP JSON-RPC (`tools/list`, `tools/call`), then pass the resulting tools into `createAgent({ tools: [...] })`.

---

## Examples in this repo

| Command | What it does |
|---------|----------------|
| `bun run example:simple` | Minimal `createAgent` from `confused-ai/create-agent`, optional tools, `examples/.env` |
| `bun run example:showcase` | Sessions, tools, guardrails, metrics, health, `defineAgent`, workflow, pipeline, `getRuntimeOpenApiJson` |
| `bun run example:showcase -- --http` | Same agent exposed via `createHttpService` (optionally `--port=8787`) |
| `bun run example:potential` | Extra stack **without** LLM: chunking (`splitText`), circuit breaker, rate limiter, artifacts, user profiles, eval metrics, `loadConfig` (uses `examples/.env` if present) |

Requires a working LLM key in `examples/.env` (e.g. `OPENAI_API_KEY`).

When published to npm, only **`dist/**`** is in the package (TypeScript `src` is not); examples are for Git clone / development.

---

## Telemetry

**Off by default.** Set `CONFUSED_AI_TELEMETRY=1` and optional `CONFUSED_AI_TELEMETRY_URL` to send a minimal framework startup event (no prompts, no PII).

---

## License

MIT
