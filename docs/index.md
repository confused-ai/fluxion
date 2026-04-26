---
layout: home

hero:
  name: "confused-ai"
  text: "Build AI Agents That Ship"
  tagline: TypeScript framework with smart defaults and zero magic. From hello world to production in minutes — every capability wired up, every escape hatch open.
  image:
    src: /logo.svg
    alt: confused-ai
  actions:
    - theme: brand
      text: Get Started →
      link: /guide/getting-started
    - theme: alt
      text: Examples
      link: /examples/
    - theme: alt
      text: GitHub
      link: https://github.com/your-org/agent-framework

features:
  - icon: ⚡
    title: Zero to agent in 3 lines
    details: agent('You are helpful.') + .run(prompt) + result.text. Smart defaults for LLM, session, and tools — override anything you want, keep what you don't.
  - icon: 🔧
    title: 50+ production-ready tools
    details: Web, browser, HTTP, email, Slack, Discord, GitHub, PostgreSQL, MySQL, SQLite, Redis, Stripe, CSV, DuckDuckGo, Wikipedia, and more. All with Zod validation.
  - icon: 🔀
    title: Multi-agent orchestration
    details: compose(), pipe(), AgentRouter, HandoffProtocol, ConsensusProtocol, createSupervisor(), createSwarm(). Any topology, any strategy — no framework lock-in.
  - icon: 🪝
    title: 8 lifecycle hook points
    details: beforeRun, afterRun, beforeStep, afterStep, beforeToolCall, afterToolCall, buildSystemPrompt, onError. Inject logic at any point without touching agent internals.
  - icon: 🧠
    title: RAG in one call
    details: KnowledgeEngine + TextLoader / JSONLoader / CSVLoader / URLLoader + OpenAI embeddings + InMemoryVectorStore. Semantic search baked into every agent run.
  - icon: 🚀
    title: Production-hardened
    details: Circuit breakers, rate limiting, Redis distributed rate limits, budget enforcement (USD caps), OTLP tracing, health checks, graceful shutdown — all opt-in.
  - icon: 🤖
    title: Intelligent LLM router
    details: Auto-route requests to the right model by task type and complexity. coding → GPT-4o, simple → GPT-4o-mini. Four strategies, override rules, full decision history.
  - icon: 🔌
    title: MCP client + server
    details: Connect to any Model Context Protocol server. All MCP tools become first-class citizens of the agent tool loop — or expose your own tools as an MCP server.
  - icon: 🏛️
    title: Multi-tenant out of the box
    details: createTenantContext() scopes sessions, rate limits, and cost tracking per tenant without separate databases. Zero boilerplate isolation.
  - icon: 🔒
    title: Human-in-the-Loop (HITL)
    details: Pause execution at high-risk tool calls. requireApprovalTool() + ApprovalStore + HTTP endpoint. Approve or reject from any UI.
  - icon: 📋
    title: Audit log + Idempotency
    details: SOC 2 / HIPAA-grade audit trail for every run. X-Idempotency-Key deduplication prevents duplicate charges and emails on client retries.
  - icon: 🎙️
    title: Voice (TTS & STT)
    details: OpenAI and ElevenLabs voice providers out of the box. Wire TTS/STT into any agent pipeline with createVoiceProvider().
---

## From zero to production

::: code-group

```ts [Hello World]
import { agent } from 'confused-ai';

const ai = agent('You are a helpful assistant.');
const { text } = await ai.run('What is 2 + 2?');
console.log(text); // "4"
```

```ts [Custom Tool]
import { agent, defineTool } from 'confused-ai';
import { z } from 'zod';

const getWeather = defineTool()
  .name('getWeather')
  .description('Get current weather for a city')
  .parameters(z.object({ city: z.string() }))
  .execute(async ({ city }) => ({ city, temp: 22, condition: 'sunny' }))
  .build();

const ai = agent({ instructions: 'Help with weather.', tools: [getWeather] });
const { text } = await ai.run('What is the weather in Paris?');
```

```ts [Multi-Agent Pipeline]
import { agent, compose } from 'confused-ai';

const researcher = agent('Research topics thoroughly and return key findings.');
const writer     = agent('Turn research notes into polished, engaging reports.');

const pipeline = compose(researcher, writer);
const { text } = await pipeline.run('Report on TypeScript 5.5 features');
```

```ts [Lifecycle Hooks]
import { agent } from 'confused-ai';

const ai = agent({
  instructions: 'You are a helpful assistant.',
  hooks: {
    beforeRun:      async (prompt) => `Today is ${new Date().toDateString()}\n\n${prompt}`,
    beforeToolCall: async (name, args, step) => { console.log(`→ ${name}`, args); return args; },
    onError:        async (error, step) => console.error(`Step ${step} failed:`, error.message),
  },
});
```

```ts [LLM Router]
import { createCostOptimizedRouter } from 'confused-ai';

// Automatically sends coding tasks to GPT-4o, simple Q&A to GPT-4o-mini
const router = createCostOptimizedRouter({
  providers: { fast: gpt4oMini, smart: gpt4o },
});
const { text } = await router.run('What is 2+2?'); // → routed to fast
```

:::

## What it looks like in production

```ts
import { agent, defineTool } from 'confused-ai';
import { createSqliteSessionStore } from 'confused-ai/session';
import { KnowledgeEngine, TextLoader, OpenAIEmbeddingProvider, InMemoryVectorStore } from 'confused-ai/knowledge';
import { GuardrailValidator, createSensitiveDataRule } from 'confused-ai/guardrails';
import { z } from 'zod';

// 1. Knowledge base from your docs
const knowledge = new KnowledgeEngine({
  embeddingProvider: new OpenAIEmbeddingProvider({ apiKey: process.env.OPENAI_API_KEY! }),
  vectorStore: new InMemoryVectorStore(),
});
await knowledge.ingest(await new TextLoader('./docs/policy.md').load());

// 2. Sessions, guardrails, and a custom tool
const sessions = createSqliteSessionStore('./data/sessions.db');

const guardrails = new GuardrailValidator({ rules: [createSensitiveDataRule()] });

const lookupOrder = defineTool()
  .name('lookupOrder')
  .description('Look up an order by ID')
  .parameters(z.object({ orderId: z.string() }))
  .execute(async ({ orderId }) => db.orders.findById(orderId))
  .build();

// 3. One agent — everything wired up
const support = agent({
  name:         'SupportBot',
  instructions: 'You are a helpful support agent. Use the knowledge base for policies.',
  model:        'gpt-4o-mini',
  tools:        [lookupOrder],
  sessionStore: sessions,
  ragEngine:    knowledge,
  guardrails,
  hooks: {
    afterRun: async (result) => { await analytics.track('support_run', { steps: result.steps }); return result; },
  },
});

// 4. Run with session continuity
const sessionId = await support.createSession('user-42');
const { text } = await support.run('What is your return policy?', { sessionId });
```
