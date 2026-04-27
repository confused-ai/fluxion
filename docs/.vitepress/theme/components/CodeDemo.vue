<script setup lang="ts">
import { ref, computed } from 'vue';

interface Tab {
  icon: string;
  label: string;
  desc: string;
  filename: string;
  code: string;
}

const tabs: Tab[] = [
  {
    icon: '⚡',
    label: 'Zero to Agent',
    desc: 'One call. Smart defaults for model, session, tools, and guardrails. Override anything.',
    filename: 'hello.ts',
    code: `import { agent } from 'confused-ai';

// That's it. Model, session & guardrails wired automatically.
const ai = agent('You are a helpful assistant.');

const { text } = await ai.run(
  'Summarize the Rust ownership model in 3 bullets.',
);

console.log(text);`,
  },
  {
    icon: '🔧',
    label: 'Custom Tools',
    desc: 'Zod-validated, fully typed tools. Drop them into any agent with zero boilerplate.',
    filename: 'weather-agent.ts',
    code: `import { agent, defineTool } from 'confused-ai';
import { z } from 'zod';

const getWeather = defineTool()
  .name('getWeather')
  .description('Get current weather for a city')
  .parameters(z.object({ city: z.string() }))
  .execute(async ({ city }) => ({ city, temp: 22, unit: 'C' }))
  .build();

const ai = agent({
  instructions: 'Help with weather queries.',
  tools: [getWeather],
});

const { text } = await ai.run('Is it warm in Tokyo right now?');`,
  },
  {
    icon: '🔀',
    label: 'Multi-Agent',
    desc: 'compose(), pipe(), supervisor, swarm. Any topology — no lock-in.',
    filename: 'pipeline.ts',
    code: `import { agent, compose, createSupervisor } from 'confused-ai';

const researcher = agent('Research topics thoroughly.');
const writer     = agent('Turn research into polished prose.');
const reviewer   = agent('Improve clarity and fix errors.');

// Sequential pipeline — output of each feeds the next
const pipeline = compose(researcher, writer, reviewer);

const { text } = await pipeline.run(
  'Write a report on quantum computing trends in 2026',
);`,
  },
  {
    icon: '🚀',
    label: 'Production',
    desc: 'Circuit breakers, retries, rate limits, and USD budget caps — all composable.',
    filename: 'production.ts',
    code: `import { createAgent } from 'confused-ai';
import { withResilience } from 'confused-ai/guard';
import { createSqliteSessionStore } from 'confused-ai/session';

const base = createAgent({
  name:         'SupportBot',
  instructions: 'You are a helpful support agent.',
  budget:       { maxUsdPerRun: 0.05, maxUsdPerUser: 5.0 },
  guardrails:   true,
  sessionStore: createSqliteSessionStore('./sessions.db'),
});

export default withResilience(base, {
  circuitBreaker: { threshold: 5, timeout: 30_000 },
  rateLimit:      { maxRequests: 100, windowMs: 60_000 },
  retry:          { maxAttempts: 3, backoff: 'exponential' },
});`,
  },
  {
    icon: '🧠',
    label: 'RAG in One Call',
    desc: 'KnowledgeEngine + loaders + vector store. Full semantic retrieval, zero wiring.',
    filename: 'rag-agent.ts',
    code: `import { createAgent } from 'confused-ai';
import { KnowledgeEngine, TextLoader } from 'confused-ai/knowledge';
import { InMemoryVectorStore } from 'confused-ai/knowledge';
import { OpenAIEmbeddingProvider } from 'confused-ai/memory';

const knowledge = new KnowledgeEngine({
  embeddingProvider: new OpenAIEmbeddingProvider(),
  vectorStore:       new InMemoryVectorStore(),
});

// Ingest your docs once at startup
await knowledge.ingest(await new TextLoader('./docs/policy.md').load());

const ai = createAgent({
  instructions: 'Answer using the company knowledge base.',
  ragEngine:    knowledge,
});

const { text } = await ai.run('What is the refund policy?');`,
  },
];

const active = ref(0);

// ── Syntax highlighter ───────────────────────────────────────
// Processes one token category at a time using placeholders so
// strings/comments are extracted first and never re-processed.
function highlight(code: string): string {
  return code
    .split('\n')
    .map((rawLine) => {
      // 1. HTML-escape
      let line = rawLine
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

      // 2. Extract strings & comments into placeholders
      const slots: string[] = [];
      const ph = (html: string) => {
        slots.push(html);
        return `\x00${slots.length - 1}\x00`;
      };

      // Line comments first
      line = line.replace(/(\/\/.*)$/, (m) =>
        ph(`<span class="t-cm">${m}</span>`),
      );

      // Template / single / double-quoted strings
      line = line.replace(
        /(`(?:[^`\\]|\\.)*`|'(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*")/g,
        (m) => ph(`<span class="t-s">${m}</span>`),
      );

      // 3. Keywords
      const kw = [
        'import','export','from','default','const','let','var',
        'await','async','return','new','true','false','null',
        'undefined','type','interface','extends','implements',
        'class','function','of','in','if','else','for','while',
        'throw','try','catch','as',
      ];
      kw.forEach((k) => {
        line = line.replace(
          new RegExp(`\\b(${k})\\b`, 'g'),
          `<span class="t-kw">$1</span>`,
        );
      });

      // 4. Numbers
      line = line.replace(
        /\b(\d[\d_]*(?:\.\d+)?)\b/g,
        `<span class="t-n">$1</span>`,
      );

      // 5. PascalCase identifiers (types / classes / constructors)
      line = line.replace(
        /\b([A-Z][a-zA-Z0-9]+)\b/g,
        `<span class="t-t">$1</span>`,
      );

      // 6. Function / method calls
      line = line.replace(
        /\b([a-z_$][a-zA-Z0-9_$]*)(?=\()/g,
        `<span class="t-fn">$1</span>`,
      );

      // 7. Object keys  (word followed by colon)
      line = line.replace(
        /\b([a-zA-Z_$][a-zA-Z0-9_$]*)(\s*:)/g,
        `<span class="t-k">$1</span>$2`,
      );

      // 8. Restore placeholders
      line = line.replace(/\x00(\d+)\x00/g, (_, i) => slots[+i]);

      return `<span class="ln">${line}</span>`;
    })
    .join('\n');
}

const highlighted = computed(() => highlight(tabs[active.value].code));
const lineCount   = computed(() => tabs[active.value].code.split('\n').length);
</script>

<template>
  <section class="ca-showcase">
    <div class="ca-showcase-inner">
      <!-- Section label -->
      <div class="ca-showcase-head">
        <div class="ca-section-label">SEE IT IN ACTION</div>
        <h2 class="ca-section-title">From idea to production, in minutes</h2>
        <p class="ca-section-sub">
          Every pattern you'll ever need — from a one-liner to a hardened enterprise agent.
        </p>
      </div>

      <div class="ca-showcase-body">
        <!-- Left: feature tabs -->
        <nav class="ca-stabs" aria-label="Code examples">
          <button
            v-for="(tab, i) in tabs"
            :key="tab.label"
            :class="['ca-stab', { 'is-active': active === i }]"
            role="tab"
            :aria-selected="active === i"
            @click="active = i"
          >
            <span class="ca-stab-icon">{{ tab.icon }}</span>
            <div class="ca-stab-body">
              <span class="ca-stab-label">{{ tab.label }}</span>
              <span class="ca-stab-desc">{{ tab.desc }}</span>
            </div>
            <svg class="ca-stab-arrow" width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M3 7h8M7.5 3.5L11 7l-3.5 3.5"
                    stroke="currentColor" stroke-width="1.5"
                    stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </nav>

        <!-- Right: code window -->
        <div class="ca-win" role="tabpanel">
          <!-- macOS chrome -->
          <div class="ca-win-bar">
            <div class="ca-win-dots">
              <span class="d-red" /><span class="d-yellow" /><span class="d-green" />
            </div>
            <span class="ca-win-name">{{ tabs[active].filename }}</span>
            <span class="ca-win-lang">TypeScript</span>
          </div>

          <!-- Code area -->
          <div class="ca-win-body">
            <div class="ca-line-nums" aria-hidden="true">
              <span v-for="n in lineCount" :key="n">{{ n }}</span>
            </div>
            <Transition name="cf" mode="out-in">
              <pre :key="active" class="ca-win-pre"><code v-html="highlighted" /></pre>
            </Transition>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
/* ── Section wrapper ────────────────────────────────────── */
.ca-showcase {
  padding: 88px 24px;
}

.ca-showcase-inner {
  max-width: 1060px;
  margin: 0 auto;
}

.ca-showcase-head {
  text-align: center;
  margin-bottom: 52px;
}

.ca-section-label {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.13em;
  text-transform: uppercase;
  color: var(--vp-c-brand-1);
  margin-bottom: 12px;
}

.ca-section-title {
  font-size: 2rem;
  font-weight: 800;
  letter-spacing: -0.03em;
  color: var(--vp-c-text-1);
  margin-bottom: 10px;
  border-top: none !important;
  padding-top: 0 !important;
}

.ca-section-sub {
  font-size: 1rem;
  color: var(--vp-c-text-2);
  max-width: 520px;
  margin: 0 auto;
}

/* ── Two-column layout ──────────────────────────────────── */
.ca-showcase-body {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 24px;
  align-items: start;
}

@media (max-width: 800px) {
  .ca-showcase-body {
    grid-template-columns: 1fr;
  }
}

/* ── Left: feature tab list ─────────────────────────────── */
.ca-stabs {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

@media (max-width: 800px) {
  .ca-stabs {
    flex-direction: row;
    overflow-x: auto;
    gap: 6px;
    padding-bottom: 4px;
    scrollbar-width: none;
  }
  .ca-stabs::-webkit-scrollbar { display: none; }
}

.ca-stab {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 14px 14px 16px;
  border-radius: 12px;
  border: 1px solid transparent;
  background: transparent;
  cursor: pointer;
  text-align: left;
  position: relative;
  transition: all 0.2s ease;
  width: 100%;
}

.ca-stab::before {
  content: '';
  position: absolute;
  left: 0;
  top: 16%;
  height: 68%;
  width: 3px;
  border-radius: 0 2px 2px 0;
  background: var(--vp-c-brand-1);
  opacity: 0;
  transition: opacity 0.2s ease;
}

.ca-stab:hover {
  background: var(--vp-c-bg-soft);
  border-color: var(--vp-c-divider);
}

.ca-stab.is-active {
  background: var(--vp-c-brand-soft);
  border-color: rgba(139, 92, 246, 0.25);
}

.ca-stab.is-active::before {
  opacity: 1;
}

.ca-stab-icon {
  font-size: 1.2rem;
  line-height: 1;
  flex-shrink: 0;
  margin-top: 1px;
}

.ca-stab-body {
  display: flex;
  flex-direction: column;
  gap: 3px;
  flex: 1;
  min-width: 0;
}

.ca-stab-label {
  font-size: 13.5px;
  font-weight: 700;
  letter-spacing: -0.01em;
  color: var(--vp-c-text-1);
  line-height: 1.3;
}

.ca-stab-desc {
  font-size: 12px;
  color: var(--vp-c-text-3);
  line-height: 1.45;
  display: none;
}

.ca-stab.is-active .ca-stab-desc {
  display: block;
  color: var(--vp-c-text-2);
}

.ca-stab-arrow {
  flex-shrink: 0;
  color: var(--vp-c-text-3);
  margin-top: 2px;
  opacity: 0;
  transform: translateX(-4px);
  transition: opacity 0.2s, transform 0.2s;
}

.ca-stab.is-active .ca-stab-arrow {
  opacity: 1;
  color: var(--vp-c-brand-1);
  transform: translateX(0);
}

@media (max-width: 800px) {
  .ca-stab { flex-shrink: 0; width: auto; padding: 10px 14px; }
  .ca-stab-desc { display: none !important; }
  .ca-stab-arrow { display: none; }
}

/* ── Right: code window ─────────────────────────────────── */
.ca-win {
  border-radius: 14px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: #0d0d14;
  box-shadow:
    0 0 0 1px rgba(139, 92, 246, 0.12),
    0 32px 80px rgba(0, 0, 0, 0.5),
    0 0 60px rgba(139, 92, 246, 0.06) inset;
}

/* macOS titlebar */
.ca-win-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 18px;
  background: #16161f;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.ca-win-dots {
  display: flex;
  gap: 6px;
  flex-shrink: 0;
}

.ca-win-dots span {
  width: 11px;
  height: 11px;
  border-radius: 50%;
}

.d-red    { background: #ff5f57; }
.d-yellow { background: #ffbd2e; }
.d-green  { background: #28c840; }

.ca-win-name {
  flex: 1;
  font-family: ui-monospace, monospace;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.45);
  letter-spacing: 0.02em;
}

.ca-win-lang {
  font-size: 10.5px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(139, 92, 246, 0.7);
  padding: 3px 9px;
  border-radius: 5px;
  background: rgba(139, 92, 246, 0.1);
  border: 1px solid rgba(139, 92, 246, 0.2);
}

/* Code + line numbers */
.ca-win-body {
  display: flex;
  overflow-x: auto;
  padding: 22px 0;
  scrollbar-width: thin;
  scrollbar-color: rgba(139,92,246,0.2) transparent;
}

.ca-line-nums {
  display: flex;
  flex-direction: column;
  padding: 0 16px 0 20px;
  flex-shrink: 0;
  user-select: none;
}

.ca-line-nums span {
  font-family: ui-monospace, monospace;
  font-size: 13px;
  line-height: 1.75;
  color: rgba(255, 255, 255, 0.18);
  text-align: right;
  min-width: 20px;
}

.ca-win-pre {
  flex: 1;
  margin: 0;
  padding: 0 24px 0 0;
  background: transparent;
  border: none;
  overflow: visible;
}

.ca-win-pre code {
  display: block;
  font-family: 'Fira Code', 'JetBrains Mono', 'Cascadia Code', ui-monospace, monospace;
  font-size: 13.5px;
  line-height: 1.75;
  color: #cdd6f4;
  white-space: pre;
  background: transparent;
  padding: 0;
}

/* Line wrapper */
:deep(.ln) {
  display: block;
  min-width: max-content;
}

/* ── Syntax tokens ──────────────────────────────────────── */
:deep(.t-kw)  { color: #c084fc; }           /* keywords   — purple   */
:deep(.t-s)   { color: #a6e3a1; }           /* strings    — green    */
:deep(.t-cm)  { color: #585b70; font-style: italic; } /* comments — gray */
:deep(.t-n)   { color: #fab387; }           /* numbers    — orange   */
:deep(.t-t)   { color: #89dceb; }           /* types      — cyan     */
:deep(.t-fn)  { color: #89b4fa; }           /* functions  — blue     */
:deep(.t-k)   { color: #cba6f7; }           /* obj keys   — lilac    */

/* ── Transition ─────────────────────────────────────────── */
.cf-enter-active,
.cf-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}

.cf-enter-from {
  opacity: 0;
  transform: translateY(6px);
}

.cf-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
