# Framework Review: `confused-ai`

> Reviewed: April 24, 2026  
> Reviewer: GitHub Copilot (Claude Sonnet 4.6)

---

## Ambition: Build the Best TypeScript Agent Framework

This review is written as a **living spec** — honest about today's state, explicit about what's needed to be #1 across every dimension that production teams care about. No other single-package TypeScript framework covers the surface area already here. The gaps below are the delta between "very good" and "industry best."

---

## Current Rating: 7.2 / 10 → Target: 9.5 / 10

---

## Full Competitive Comparison

| Capability | confused-ai | **Agno** | Mastra | LangGraph | Vercel AI SDK | OpenAI SDK |
|---|---|---|---|---|---|---|
| **Language** | TypeScript | Python | TypeScript | Python | TypeScript | TypeScript/Python |
| Agent creation ergonomics | ✅✅ (4 levels) | ✅ (1 level) | ✅ | Average | ✅ | ✅ |
| LLM provider breadth | ✅✅ (7+ + smart router) | ✅ (30+) | ✅ | Average | ✅ | ❌ (OpenAI only) |
| Smart LLM routing (cost/speed/task) | ✅✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Guardrails (PII/injection/moderation) | ✅✅ | ✅ | Partial | ❌ | ❌ | ❌ |
| Orchestration patterns | ✅✅ (6 patterns) | ✅ (teams/workflows) | ✅ | ✅ | ❌ | Partial |
| Background queue adapters | ✅✅ (5 backends) | ❌ | Partial | ❌ | ❌ | ❌ |
| Built-in cost tracking | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Circuit breaker + rate limiter | ✅ | ❌ | Partial | ❌ | ❌ | ❌ |
| MCP (client + server + stdio) | ✅ | ✅ | ✅ | Partial | ✅ | ✅ |
| Voice (TTS/STT) | ✅ (OpenAI + ElevenLabs) | ❌ | ❌ | ❌ | ❌ | ❌ |
| Video generation | ✅ (ffmpeg + Pexels) | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Durable execution** | ❌ | ✅ (DB-persisted sessions) | ✅ (Inngest) | ✅ | ❌ | ❌ |
| **Multi-tenancy (per-user isolation)** | ❌ | ✅✅ (built-in) | Partial | Partial | ❌ | ❌ |
| **Persistent audit log** | ❌ (500-entry RAM) | ✅ (your DB) | Partial | Partial | ❌ | ❌ |
| **Human-in-the-loop + approval flows** | Partial (no persistence) | ✅ | Partial | ✅ | ❌ | ❌ |
| **JWT RBAC + per-agent auth** | ❌ | ✅ (hierarchical scopes) | Partial | Partial | ❌ | ❌ |
| **Control plane / monitoring UI** | ❌ | ✅ (AgentOS UI) | Partial | ✅ (LangSmith) | ❌ | ❌ |
| Persistent memory across sessions | ❌ (in-memory only) | ✅ (auto + agentic modes) | ✅ | ✅ | ❌ | ❌ |
| Eval dataset management | Partial | Partial | Partial | ✅ (LangSmith) | ❌ | ❌ |
| Deployment artifacts | ❌ | ✅ (FastAPI, Docker ready) | ✅ | ✅ | ✅ (Vercel) | ❌ |
| GitHub stars | — | 39.6k ⭐ | ~12k | ~50k | ~45k | ~20k |

**confused-ai leads on:** TypeScript-native, smart LLM routing, guardrails depth, background queue ecosystem, built-in cost tracking, circuit breaker, voice/video multimodal — unique in the entire landscape.

**Agno leads on:** multi-tenancy, RBAC, persistent memory, durable sessions, HITL approvals, audit logs, monitoring UI — everything that matters for running agents reliably in production at scale.

---

## Head-to-Head: confused-ai vs Agno

Agno (39.6k GitHub stars, Python, v2.6.0) is the closest architectural peer. Both target production-grade agents. Neither is a winner in every category.

### Where confused-ai wins

| Area | confused-ai advantage |
|------|----------------------|
| **Language** | TypeScript — frontend teams, Node.js stacks, full-stack products |
| **LLM Smart Router** | Task-type + cost + speed routing with automatic fallback — Agno has no equivalent |
| **Background queues** | BullMQ, Kafka, RabbitMQ, SQS, Redis PubSub behind a single interface — Agno has no queue layer |
| **Cost tracking** | Per-model pricing for 50+ models built in — Agno has no cost tracker |
| **Resilience primitives** | Circuit breaker, rate limiter, `withResilience()` one-liner — Agno has none |
| **Guardrail depth** | LLM-based injection classifier, URL allowlists, moderation + PII in one engine |
| **Orchestration variety** | Pipeline + supervisor + swarm + team + handoff + consensus — Agno has teams and workflows only |
| **Voice** | OpenAI TTS/STT + ElevenLabs — Agno has no voice module |
| **Video** | ffmpeg + Pexels video orchestration — Agno has no video module |
| **Single-package install** | One `npm install`, no separate runtime container required |

### Where Agno wins (and confused-ai must close the gap)

| Area | Agno advantage | confused-ai status |
|------|---------------|-------------------|
| **Multi-tenancy** | Per-user, per-session isolation is built into the `Agent()` constructor — just pass `user_id` | DIY — no `tenantId` in session/rate limiter interfaces |
| **Persistent memory** | Automatic and agentic memory modes backed by SQLite/Postgres/MongoDB with `update_memory_on_run=True` | `InMemoryUserProfileStore` only — not persisted |
| **Durable sessions** | All sessions stored to DB by default — restarts are safe | `InMemorySessionStore` is the default; Redis/SQL stores exist but aren't the zero-config default |
| **JWT RBAC** | `AgentOS` ships JWT-based RBAC with hierarchical scopes out of the box | API key / bearer only; no role-based access, no JWT claims routing |
| **HITL approvals** | First-class approval workflows with persistence and timeout policies | `HumanInTheLoopHooks` exist but block the loop in-memory; no persistence |
| **Persistent audit log** | All traces, sessions, memory, and runs stored to your own DB by default | 500-entry in-memory array, wiped on restart |
| **Monitoring UI** | AgentOS control plane — visual session browser, memory inspector, trace viewer | No UI; logs only |
| **Deployment** | FastAPI runtime, Docker-ready, runs as a container in your infra | No Dockerfile, no deploy templates |
| **Three-tier architecture** | Framework + Runtime (FastAPI) + Control Plane cleanly separated | Single runtime layer, no separation of concerns |

### The Key Architectural Difference

Agno's design philosophy: **everything persists to your database by default**. Sessions, memory, traces, and audit logs all go to SQLite/Postgres on day one. confused-ai's design philosophy: **you wire in persistence when you need it**. This makes confused-ai easier to prototype but harder to trust in production — you have to remember to attach the right stores everywhere.

The fix is to **make durable stores the default**, not the opt-in.

---

## What's Solid (Keep and Protect)

### Agent Creation — Best-in-Class Ergonomics
Four entry points covering every skill level:
- `createAgent()` — production default, one call, batteries included
- `defineAgent()` — fluent builder chain, great DX
- `defineTypedAgent` — Zod I/O for typed pipelines
- `Agent` class — subclassing / custom lifecycle

Agno has one entry point (`Agent()`). confused-ai is more flexible for TypeScript teams.

### LLM Layer — Widest Coverage + Unique Smart Router
OpenAI, Anthropic, Google (Gemini), AWS Bedrock, OpenRouter, Ollama, plus 20+ OpenAI-compat providers. The `LLMRouter` with task-type classification (simple / coding / reasoning / creative / long_context / multimodal), cost tiers, speed tiers, and automatic fallback is **unique in any agent framework, Python or TypeScript**.

### Resilience Primitives — Best in Class
Circuit breaker (CLOSED/OPEN/HALF_OPEN), token-bucket rate limiter, Redis distributed rate limiter, fallback chain with 4 strategies, `ResilientAgent` one-liner wrapper. Agno has none of this. Neither does LangGraph or Vercel AI SDK.

### Guardrails — Deepest Native Implementation
PII detection with pattern library, prompt injection detection (heuristic + LLM classifier), OpenAI moderation, forbidden topics, URL allowlists, content rules. Agno ships the same three built-in guardrails (PII, injection, moderation) but confused-ai's injection classifier with LLM fallback is more sophisticated.

### Background Queue Ecosystem — Uniquely Differentiated
In-memory, BullMQ, Kafka, RabbitMQ, SQS, Redis PubSub — all behind a unified `BackgroundQueue` interface with `queueHook()`. No other agent framework in any language ships this.

### Voice + Video — No Competitor Has This
OpenAI TTS/STT + ElevenLabs via `VoiceProvider`. `VideoOrchestrator` with ffmpeg + Pexels. Genuinely unique.

---

## Gaps to Close (Ranked by Impact)

### P0 — Must Fix to Match Agno's Production Story

---

**1. Make Durable Storage the Default** `[CRITICAL]`

**The gap:** Agno stores sessions, memory, and traces to a database by default — you opt *out* of persistence. confused-ai does the opposite — you opt *in*. This means a developer who doesn't read the docs ships with in-memory everything.

**What to build:**
- Auto-detect a SQLite database path from `AGENT_DB_PATH` env var or default to `./agent.db`
- When no `sessionStore` is provided, default to `createSqliteSessionStore('./agent.db')` instead of in-memory
- When no `userProfileStore` is provided, default to `SqliteUserProfileStore`
- Document the upgrade path: "want Redis in production? Pass `sessionStore: new RedisSessionStore(...)`"

**Effort:** Low (2–3 days). **Impact:** Matches Agno's zero-config persistence story.

---

**2. Durable / Resumable Agent Execution** `[CRITICAL]`

**The gap:** Agno persists all run state to the DB — if a process restarts, sessions resume cleanly. confused-ai's `ResumableStreamManager` checkpoints stream output but not agentic loop state. A crash at step 7 of 20 means restart from step 1.

**What to build:**
```ts
interface AgentCheckpointStore {
  save(runId: string, step: number, state: AgentRunState): Promise<void>;
  load(runId: string): Promise<{ step: number; state: AgentRunState } | null>;
  delete(runId: string): Promise<void>;
}

const agent = createAgent({
  name: 'LongRunning',
  checkpointStore: createSqliteCheckpointStore('./agent.db'),
});
```

Wire into `src/agentic/runner.ts` — save after each step, resume from last checkpoint if `runId` exists.

**Effort:** High (2–3 weeks). **Impact:** Unlocks long-running agents; closes Agno's biggest structural advantage.

---

**3. Idempotency Keys** `[CRITICAL]`

**The gap:** Retrying `POST /chat` re-executes the agent — can send an email twice, charge a card twice. Agno's session-scoped DB layer naturally deduplicates by `session_id`. confused-ai has no deduplication.

**What to build:**
- Accept `X-Idempotency-Key` in `createHttpService`
- Store request hash → response in SQLite/Redis with configurable TTL
- Return cached response on duplicate within TTL window

**Effort:** Medium (3–5 days).

---

**4. Budget Enforcement** `[CRITICAL]`

**The gap:** `CostTracker` computes costs but never stops execution. Agno has no cost tracker at all — so this remains a differentiator if wired as an enforcement mechanism.

```ts
const agent = createAgent({
  budget: {
    maxUsdPerRun: 0.50,
    maxUsdPerUser: 10.00,
    maxUsdPerMonth: 500.00,
    onExceeded: 'throw', // or 'warn' | 'truncate'
  },
});
// Throws BudgetExceededError with full usage breakdown
```

**Effort:** Medium (1 week). **Impact:** unique vs all competitors — nobody else ships budget enforcement natively.

---

### P1 — Close Agno's Native Advantages

---

**5. Per-Tenant Isolation Primitives** `[HIGH]`

**The gap:** Agno handles `user_id` and `session_id` as first-class fields in every storage operation — isolation is automatic. confused-ai requires manually namespacing every store.

**What to build:**
- Add `tenantId` to `SessionStore`, `RateLimiter`, `RedisRateLimiter`, `CostTracker`, and audit log interfaces
- `createTenantContext(tenantId)` returns a pre-scoped set of stores
- `RedisRateLimiter.forTenant(tenantId)` for per-tenant rate limits

**Effort:** Medium (1–2 weeks).

---

**6. Persistent + Structured Audit Log** `[HIGH]`

**The gap:** Agno stores all traces, sessions, and run metadata to your database by default. confused-ai's `RequestAuditEntry[]` is capped at 500, in-memory, gone on restart.

```ts
interface AuditStore {
  append(entry: AuditEntry): Promise<void>;
  query(filter: AuditFilter): Promise<AuditEntry[]>;
}
// AuditEntry: timestamp, userId, tenantId, agentName, prompt hash, tool calls,
//             finishReason, durationMs, cost, ip, idempotencyKey
```

Default to `SqliteAuditStore('./agent.db')`. This also satisfies SOC 2 / HIPAA requirements Agno claims to address.

**Effort:** Medium (1 week).

---

**7. JWT RBAC with Per-Agent Scopes** `[HIGH]`

**The gap:** Agno's `AgentOS` ships JWT-based RBAC with hierarchical scopes out of the box. confused-ai's HTTP runtime supports `api-key`, `bearer`, `basic` — but no role-based access control, no JWT claims routing, no per-agent authorization.

```ts
createHttpService({
  auth: {
    type: 'jwt',
    secret: process.env.JWT_SECRET,
    claimsToContext: ['userId', 'tenantId', 'role'],
  },
  rbac: {
    'support-agent': ['role:support', 'role:admin'],
    'billing-agent': ['role:admin'],
  },
});
```

**Effort:** Medium (1 week).

---

**8. Durable Human-in-the-Loop Approvals** `[HIGH]`

**The gap:** Agno has first-class approval workflows with persistence, timeout policies, and a visual approval queue in AgentOS UI. confused-ai has `HumanInTheLoopHooks` that block the event loop synchronously with no persistence.

**What to build:**
- `ApprovalStore` interface (`SqliteApprovalStore` default)
- Agentic runner pauses, persists state, emits SSE `approval_required` event
- `POST /approvals/:runId` accepts the decision and resumes
- Approval payload: `runId`, `agentName`, `toolName`, `arguments`, `riskLevel`, `expiresAt`
- Timeout policy: auto-reject or auto-approve after N minutes

**Effort:** High (2–3 weeks).

---

### P2 — Turn Advantages into Dominance

---

**9. Distributed Trace Context Propagation** `[MEDIUM]`

Agno stores traces in your DB natively and connects them visually in AgentOS. confused-ai's OTLP exporter emits spans but doesn't propagate W3C `traceparent` across agent-to-agent HTTP calls. Fix: inject `traceparent` in `HttpA2AClient` requests and extract from incoming `createHttpService` headers.

---

**10. Evaluation Dataset Persistence** `[MEDIUM]`

`runLlmAsJudge` and `EvalAggregator` are solid but there's no dataset versioning, no run history, no regression detection. Build:
- `EvalStore` interface + `SqliteEvalStore`
- `runEvalSuite(dataset, agent, criteria)` with regression comparison
- CLI: `confused-ai eval run --dataset ./evals/qa.json`
- Fail CI if score drops >N% from baseline

This would make confused-ai the only framework with **built-in, self-hosted eval regression tracking** — beating both Agno and Mastra.

---

**11. Monitoring UI (AgentOS Equivalent)** `[MEDIUM]`

Agno's AgentOS control plane is a major differentiator: visual session browser, memory inspector, approval queue, trace viewer. confused-ai has no UI.

**Practical path:** Don't build a custom UI. Instead:
- Expose a rich `/admin` API (sessions, runs, costs, audit log, pending approvals) with an OpenAPI spec
- Provide an official Grafana dashboard JSON for OTLP metrics
- Provide an optional React-based admin panel as a separate `confused-ai-dashboard` package

**Effort:** High (3–4 weeks for basic version).

---

### P3 — Polish and Ecosystem

---

**12. WebSocket Transport** `[LOW-MEDIUM]`

Agno uses SSE (same as confused-ai). Neither has WebSocket. Adding WS to confused-ai first creates a genuine differentiator for voice agents and real-time bidirectional control (pause/cancel/steer mid-run).

---

**13. Secret Manager Adapters** `[LOW]`

`loadConfig` reads from `process.env`. Agno has the same limitation. First mover wins: ship Vault, AWS Secrets Manager, Azure Key Vault, GCP Secret Manager adapters behind a `ConfigLoader` interface.

---

**14. Deployment Templates** `[LOW]`

Agno deploys as a standard FastAPI container — it's Docker-ready by default. confused-ai has no deployment artifacts. Add a `templates/` directory (not published to npm) with Dockerfile, `fly.toml`, `render.yaml`, Kubernetes manifests, and a Helm chart.

---

**15. Persistent Learning / User Profiles** `[LOW-MEDIUM]`

Agno's automatic and agentic memory modes are backed by SQLite/Postgres out of the box. confused-ai's `InMemoryUserProfileStore` is not persisted. Add `SqliteUserProfileStore` and `RedisUserProfileStore` to match Agno's default behavior.

---

## Projected Rating After Roadmap Completion

| Phase | Items | Projected Rating | vs Agno |
|-------|-------|-----------------|---------|
| **Today** | Current state | **7.2 / 10** | Agno wins production story |
| **After P0** | Default-durable + checkpoint + idempotency + budget | **8.5 / 10** | Matched on persistence; unique on cost enforcement |
| **After P1** | Multi-tenancy + audit log + JWT RBAC + HITL | **9.0 / 10** | Matched on governance; still leads on routing + queues + voice |
| **After P2** | Tracing + evals + monitoring UI | **9.3 / 10** | Leads on TypeScript, routing, queues, voice, cost; matched on observability |
| **After P3** | WebSocket + secrets + deployment + learning | **9.6 / 10** | Best-in-class across all dimensions in TS ecosystem; strong vs Agno overall |

---

## Where to Start

**The single change that closes the most ground against Agno fastest** is making the SQLite session store the default when no store is provided. It's a one-line change in `createAgent()` + one new file (`src/session/default-store.ts`). Zero breaking changes. Immediately matches Agno's "sessions survive restarts" story.

After that, in order:
1. **Durable checkpoint store** in `src/agentic/runner.ts` — the structural gap for long-running agents
2. **Idempotency keys** in `src/runtime/server.ts` — 3–5 days, eliminates worst production footgun
3. **Budget enforcement** in the agentic runner — unique feature no competitor has, high enterprise value
4. **JWT RBAC** in `src/runtime/auth.ts` — closes Agno's most visible governance advantage

Those four together — achievable in ~6 weeks — move confused-ai from "TypeScript favorite" to "the TypeScript agent framework that matches Agno on governance while beating everyone on LLM intelligence, queues, resilience, and multimodal."
