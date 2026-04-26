<div align="center">

<img src="docs/public/logo.svg" alt="confused-ai" width="80" height="80" />

# confused-ai

**Production-Grade AI Agent Framework for TypeScript**

Build, orchestrate, and deploy AI agents with enterprise-level reliability — from hello world to SOC 2-ready production in a single package.

[![npm version](https://img.shields.io/npm/v/confused-ai?color=8b5cf6&label=npm)](https://www.npmjs.com/package/confused-ai)
[![npm downloads](https://img.shields.io/npm/dm/confused-ai?color=22d3ee)](https://www.npmjs.com/package/confused-ai)
[![License: MIT](https://img.shields.io/badge/license-MIT-green.svg)](./LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18-brightgreen)](https://nodejs.org/)
[![Tests](https://img.shields.io/badge/tests-99%20passing-success)](./tests/)
[![Docs](https://img.shields.io/badge/docs-vitepress-8b5cf6)](https://your-org.github.io/agent-framework/)

[**Documentation**](https://your-org.github.io/agent-framework/) · [**Getting Started**](https://your-org.github.io/agent-framework/guide/getting-started) · [**18 Examples**](https://your-org.github.io/agent-framework/examples/) · [**Changelog**](./CHANGELOG.md)

</div>

---

## Why confused-ai?

Most AI frameworks give you a prototype. confused-ai gives you a **production system**:

| Capability | confused-ai | LangChain.js | Vercel AI SDK | Mastra |
|---|:---:|:---:|:---:|:---:|
| Zero-config start | ✅ | ⚠️ | ✅ | ⚠️ |
| 50+ built-in tools | ✅ | ✅ | ❌ | ⚠️ |
| Multi-agent orchestration | ✅ | ✅ | ❌ | ✅ |
| Circuit breakers | ✅ | ❌ | ❌ | ❌ |
| USD budget enforcement | ✅ | ❌ | ❌ | ❌ |
| Human-in-the-Loop (HITL) | ✅ | ⚠️ | ❌ | ⚠️ |
| MCP client + server | ✅ | ✅ | ✅ | ✅ |
| OTLP distributed tracing | ✅ | ⚠️ | ❌ | ⚠️ |
| Multi-tenancy | ✅ | ❌ | ❌ | ❌ |
| Audit log (SOC 2 / HIPAA) | ✅ | ❌ | ❌ | ❌ |
| Idempotency keys | ✅ | ❌ | ❌ | ❌ |
| LLM router (by task type) | ✅ | ❌ | ❌ | ❌ |
| Voice (TTS + STT) | ✅ | ⚠️ | ❌ | ❌ |

---

## Install

```bash
npm install confused-ai
# bun add confused-ai
# pnpm add confused-ai
```

Requires Node.js ≥ 18. Set at least one provider key:

```bash
OPENAI_API_KEY=sk-...           # OpenAI / Azure OpenAI
ANTHROPIC_API_KEY=sk-ant-...    # Anthropic Claude
GOOGLE_API_KEY=...              # Google Gemini
OPENROUTER_API_KEY=sk-or-...    # OpenRouter (100+ models)
```

## Quick Start

```ts
import { agent } from 'confused-ai';

const ai = agent('You are a helpful assistant.');
const { text } = await ai.run('What is 2 + 2?');
console.log(text); // "4"
```

That's it. No YAML. No chains. No boilerplate.

---

## Table of Contents

- [Install](#install)
- [Quick Start](#quick-start)
- [Creating Agents](#creating-agents)
- [Tools (50+)](#tools-50)
- [Multi-Agent Orchestration](#multi-agent-orchestration)
- [LLM Router](#llm-router)
- [RAG & Knowledge](#rag--knowledge)
- [Sessions & Memory](#sessions--memory)
- [Guardrails](#guardrails)
- [Production Hardening](#production-hardening)
- [HTTP Runtime](#http-runtime)
- [Observability & Tracing](#observability--tracing)
- [MCP Client & Server](#mcp-client--server)
- [Voice (TTS & STT)](#voice-tts--stt)
- [Deployment](#deployment)
- [Subpath Packages](#subpath-packages)
- [LLM Providers](#llm-providers)
- [Testing](#testing)
- [CLI](#cli)
- [Contributing](#contributing)
- [License](#license)

---

## Creating Agents

### Option A: `createAgent` (recommended)

```ts
import { createAgent } from 'confused-ai';
import { CalculatorAddTool, HttpClientTool } from 'confused-ai/tools';

const agent = createAgent({
  name:         'Assistant',
  instructions: 'You are a helpful assistant.',
  model:        'openai:gpt-4o-mini',
  tools:        [new CalculatorAddTool(), new HttpClientTool()],
});

const { text, steps, finishReason } = await agent.run('What is 40 + 2?');
```

### Option B: DX fluent builder

```ts
import { defineAgent } from 'confused-ai';

const agent = defineAgent()
  .name('Assistant')
  .instructions('You are concise and accurate.')
  .model('openai:gpt-4o-mini')
  .tools([new CalculatorAddTool()])
  .withSession()
  .build();
```

### Option C: Typed agents with Zod I/O

```ts
import { defineTypedAgent, createWorkflow } from 'confused-ai';
import { z } from 'zod';

const planner = defineTypedAgent({
  name:         'plan',
  inputSchema:  z.object({ goal: z.string() }),
  outputSchema: z.object({ bullets: z.array(z.string()) }),
  handler:      async (i) => ({ bullets: [i.goal, 'execute', 'verify'] }),
});

const { results } = await createWorkflow().task('plan', planner).execute({ goal: 'Ship v1' });
```

### `createAgent` options

| Option | Description |
|--------|-------------|
| `name`, `instructions` | **Required.** Agent identity and system behavior |
| `model` | `openai:gpt-4o`, `anthropic:claude-3-5-sonnet-20241022`, `google:gemini-1.5-pro`, … |
| `llm` | Custom `LLMProvider` (overrides `model`) |
| `tools` | `Tool[]` or `ToolRegistry` |
| `sessionStore` | In-memory default; plug in SQLite/Redis/Postgres for production |
| `guardrails` | `true` (sensitive-data rule), `false`, or a `GuardrailEngine` |
| `budget` | `{ maxUsdPerRun?, maxUsdPerUser? }` — hard USD caps |
| `ragEngine` | `RAGEngine` for automatic retrieval-augmented generation |
| `maxSteps`, `timeoutMs` | Loop limits |
| `retry` | Retry policy for LLM / tool calls |
| `logger` | `ConsoleLogger` or custom |
| `dev` | `true` → dev logger + tool middleware |

---

## Tools (50+)

```ts
import {
  HttpClientTool, BrowserTool,           // Web
  EmailTool, SlackTool, DiscordTool,     // Communication
  PostgreSQLTool, MySQLTool, SQLiteTool, // Databases
  RedisTool, CSVTool,                    // Data
  DuckDuckGoTool, WikipediaTool,         // Search
  FileReadTool, FileWriteTool, ShellTool, // File system
  StripeTool, YahooFinanceTool,          // Finance
  GitHubTool, CalculatorAddTool,         // Dev / Utilities
} from 'confused-ai/tools';
```

Every tool is Zod-validated, tree-shakeable, and dependency-lazy. Build custom tools with `defineTool()`:

```ts
import { defineTool } from 'confused-ai';
import { z } from 'zod';

const lookupOrder = defineTool()
  .name('lookupOrder')
  .description('Look up an order by ID')
  .parameters(z.object({ orderId: z.string() }))
  .execute(async ({ orderId }) => db.orders.findById(orderId))
  .build();
```

---

## Multi-Agent Orchestration

```ts
import { agent, compose, createSupervisor } from 'confused-ai';
import { AgentRouter } from 'confused-ai/orchestration';

// Sequential pipeline — output of researcher feeds writer
const pipeline = compose(
  agent('Research and return key facts.'),
  agent('Turn facts into polished reports.'),
);
const { text } = await pipeline.run('TypeScript 5.5 features');

// Supervisor with sub-agents
const supervisor = createSupervisor({
  agents:       [researchAgent, writeAgent, reviewAgent],
  instructions: 'Coordinate the team to produce a final deliverable.',
});

// Capability-based routing
const router = new AgentRouter({ strategy: 'capability' });
router.register(codeAgent,      ['code', 'debug']);
router.register(analyticsAgent, ['data', 'analysis']);
```

---

## LLM Router

```ts
import { createCostOptimizedRouter } from 'confused-ai';

const router = createCostOptimizedRouter({
  providers: { fast: gpt4oMini, smart: gpt4o },
});

// Task type auto-detected: simple → fast, coding → smart
const { text } = await router.run('Explain async/await in JavaScript');
```

Four built-in strategies: `balanced`, `cost`, `quality`, `speed`. Custom override rules supported.

---

## RAG & Knowledge

```ts
import { KnowledgeEngine, TextLoader, URLLoader, OpenAIEmbeddingProvider, InMemoryVectorStore } from 'confused-ai/knowledge';

const knowledge = new KnowledgeEngine({
  embeddingProvider: new OpenAIEmbeddingProvider({ apiKey: process.env.OPENAI_API_KEY! }),
  vectorStore:       new InMemoryVectorStore(),
});

await knowledge.ingest([
  ...await new TextLoader('./docs/policy.md').load(),
  ...await new URLLoader('https://example.com/faq').load(),
]);

const agent = createAgent({
  instructions: 'Answer questions using the knowledge base.',
  ragEngine:    knowledge,
});
```

---

## Sessions & Memory

```ts
import { createSqliteSessionStore } from 'confused-ai/session';

const agent = createAgent({
  instructions: 'You are a helpful assistant.',
  sessionStore: createSqliteSessionStore('./sessions.db'),
});

const sessionId = await agent.createSession('user-123');
const r1 = await agent.run('My name is Alice.', { sessionId });
const r2 = await agent.run('What is my name?', { sessionId }); // → "Alice"
```

---

## Guardrails

```ts
import { GuardrailValidator, createSensitiveDataRule } from 'confused-ai/guardrails';

const agent = createAgent({
  instructions: 'You are a support agent.',
  guardrails:   new GuardrailValidator({ rules: [createSensitiveDataRule()] }),
});
```

---

## Production Hardening

### Circuit Breakers & Rate Limits

```ts
import { withResilience } from 'confused-ai/production';

const resilient = withResilience(agent, {
  circuitBreaker: { threshold: 5, timeout: 30_000 },
  rateLimit:      { maxRequests: 100, windowMs: 60_000 },
  retry:          { maxAttempts: 3, backoff: 'exponential' },
});
```

### Budget Enforcement

```ts
const agent = createAgent({
  instructions: 'You are a helpful assistant.',
  budget: {
    maxUsdPerRun:  0.10,   // $0.10 per run hard cap
    maxUsdPerUser: 5.00,   // $5.00 per user per month
  },
});
// Throws BudgetExceededError before limit is crossed
```

### Human-in-the-Loop (HITL)

```ts
import { requireApprovalTool, InMemoryApprovalStore } from 'confused-ai/tools';
import { createHttpService } from 'confused-ai/runtime';

const service = createHttpService({
  agents: { admin: adminAgent },
  approvalStore: new InMemoryApprovalStore(),
  // GET  /v1/approvals        — list pending
  // POST /v1/approvals/:id    — { approved: true, decidedBy: 'admin' }
});
```

### Multi-Tenancy

```ts
import { createTenantContext } from 'confused-ai';

const ctx = createTenantContext({ tenantId: 'acme-corp', ... });
await agent.run(prompt, { context: ctx });
```

### Audit Log & Idempotency

```ts
import { createHttpService } from 'confused-ai/runtime';
import { SqliteAuditStore } from 'confused-ai/observability';

const service = createHttpService({
  agents:     { support: supportAgent },
  auditStore: new SqliteAuditStore('./audit.db'),
  // X-Idempotency-Key header → deduplicates retries automatically
});
```

---

## HTTP Runtime

```ts
import { createHttpService, listenService } from 'confused-ai/runtime';

const service = createHttpService({
  agents:   { support: supportAgent },
  cors:     '*',
  openApi:  { title: 'My Agent API', version: '1.0.0' },
  adminApi: true,
  websocket: true,
});

listenService(service, { port: 3000 });
```

Routes: `GET /v1/health` · `GET /v1/agents` · `POST /v1/sessions` · `POST /v1/chat` (JSON + SSE stream) · `GET /v1/openapi.json` · `GET /v1/approvals` · `POST /v1/approvals/:id` · `/admin/*`

---

## Observability & Tracing

```ts
import { OTLPTraceExporter } from 'confused-ai/observability';

const service = createHttpService({
  agents:  { support: supportAgent },
  tracer:  new OTLPTraceExporter({ endpoint: 'http://jaeger:4318/v1/traces' }),
  metrics: new OTLPMetricsExporter({ endpoint: 'http://prometheus:4318/v1/metrics' }),
});
// W3C traceparent propagated across all agent-to-agent HTTP calls automatically
// Grafana dashboard: /templates/grafana-dashboard.json
```

---

## MCP Client & Server

```ts
import { loadMcpToolsFromUrl } from 'confused-ai/tools';

const mcpTools = await loadMcpToolsFromUrl('http://mcp-server:3001');
const agent = createAgent({ tools: mcpTools, instructions: 'Use MCP filesystem tools.' });
```

---

## Voice (TTS & STT)

```ts
import { createVoiceProvider, OpenAIVoiceAdapter } from 'confused-ai/voice';

const voice = createVoiceProvider(new OpenAIVoiceAdapter({ apiKey: process.env.OPENAI_API_KEY! }));
const audio = await voice.textToSpeech('Hello, how can I help you?');
const text  = await voice.speechToText(audio);
```

---

## Deployment

Production-ready templates in [`/templates`](./templates/):

```bash
# Docker
docker build -t my-agent . && docker run -e OPENAI_API_KEY=$KEY -p 3000:3000 my-agent

# Fly.io
fly launch && fly secrets set OPENAI_API_KEY=sk-... && fly deploy

# Kubernetes
kubectl apply -f templates/k8s.yaml
```

Includes: `Dockerfile`, `docker-compose.yml`, `fly.toml`, `render.yaml`, `k8s.yaml` with health probes, resource limits, and rolling updates.

---

## Subpath Packages

| Import | Contents |
|--------|---------|
| `confused-ai` | Main barrel |
| `confused-ai/create-agent` | Lean createAgent + env resolver |
| `confused-ai/llm` | Providers, model resolution, embeddings |
| `confused-ai/tools` | BaseTool, registries, 50+ built-in tools |
| `confused-ai/orchestration` | Pipelines, supervisor, swarm, router, consensus |
| `confused-ai/knowledge` | RAG engine, loaders, vector store |
| `confused-ai/session` | Session stores (in-memory, SQL, SQLite) |
| `confused-ai/memory` | Memory stores + vector-backed long-term memory |
| `confused-ai/guardrails` | Validators, rules, content safety |
| `confused-ai/production` | Circuit breaker, rate limiter, health checks |
| `confused-ai/observability` | OTLP tracer, metrics, eval store, structured logger |
| `confused-ai/runtime` | HTTP service, OpenAPI, WebSocket, admin API |
| `confused-ai/adapters` | 20-category adapter system |
| `confused-ai/plugins` | Plugin registry + built-in plugins |
| `confused-ai/testing` | MockLLMProvider, MockToolRegistry, fixtures |
| `confused-ai/contracts` | Shared interfaces — zero runtime code |

---

## LLM Providers

| Provider | Environment variable |
|----------|---------------------|
| OpenAI (GPT-4o, o1, …) | `OPENAI_API_KEY` |
| Anthropic Claude | `ANTHROPIC_API_KEY` |
| Google Gemini | `GOOGLE_API_KEY` or `GEMINI_API_KEY` |
| OpenRouter (100+ models) | `OPENROUTER_API_KEY` |
| Azure OpenAI | `OPENAI_API_KEY` + `OPENAI_BASE_URL` |
| AWS Bedrock | `@aws-sdk/client-bedrock-runtime` peer dep |
| Any OpenAI-compatible | Pass `apiKey` + `baseURL` to `createAgent` |

---

## Testing

```ts
import { MockLLMProvider } from 'confused-ai/testing';

const mockLLM = new MockLLMProvider([{ text: 'The answer is 42', tool_calls: [] }]);
const agent = createAgenticAgent({ name: 'Test', llm: mockLLM, tools: new MockToolRegistry() });
const { text } = await agent.run({ prompt: 'What is the answer?' });
expect(text).toBe('The answer is 42');
```

99 passing tests covering circuit breakers, rate limiters, JWT RBAC, LLM caching, guardrails, and more. See [`/tests`](./tests/).

---

## CLI

```bash
npx confused-ai --help   # after npm install or npm run build
```

---

## Enterprise Checklist

- [x] **Security** — Guardrails, JWT RBAC, secret-manager adapters (AWS, Azure Key Vault, HashiCorp Vault, GCP), Zod-validated tool inputs
- [x] **Reliability** — Circuit breakers, retry with backoff, Redis distributed rate limiting, graceful shutdown, checkpoint/resume
- [x] **Compliance** — Persistent audit log, idempotency keys, per-user USD budget caps, W3C trace-context
- [x] **Observability** — OTLP tracing, structured logging, eval store, health endpoints, Grafana dashboard template
- [x] **Deployment** — Docker, Compose, Kubernetes, Fly.io, Render templates with health probes
- [x] **Testing** — MockLLMProvider, MockToolRegistry, Vitest-compatible fixtures, 99 passing tests

---

## Contributing

```bash
git clone https://github.com/your-org/agent-framework
cd agent-framework && bun install
bun test          # 99 tests
bun run build     # tsup
bun run docs:dev  # VitePress docs site
```

See [CONTRIBUTING.md](./CONTRIBUTING.md).

---

## Telemetry

**Off by default.** Set `CONFUSED_AI_TELEMETRY=1` to send a minimal framework startup event. No prompts, no PII ever.

---

## License

[MIT](./LICENSE) — Copyright © 2024-present confused-ai contributors
