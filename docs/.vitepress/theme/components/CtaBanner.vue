<script setup lang="ts">
</script>

<template>
  <section class="ca-cta-section">
    <div class="ca-cta-glow" />
    <div class="ca-cta-inner">
      <h2 class="ca-cta-title">Start building in 30 seconds</h2>
      <p class="ca-cta-sub">
        One package. From prototype to enterprise without changing frameworks.
      </p>

      <div class="ca-cta-install">
        <code class="ca-cta-cmd">npm install confused-ai</code>
      </div>

      <div class="ca-cta-actions">
        <a href="/guide/getting-started" class="ca-btn-primary">
          Get Started →
        </a>
        <a href="https://github.com/confused-ai/confused-ai" target="_blank" rel="noopener" class="ca-btn-ghost">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38l-.01-1.49c-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48l-.01 2.2c0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
          </svg>
          View on GitHub
        </a>
      </div>

      <div class="ca-cta-trust">
        <span>MIT License</span>
        <span class="ca-dot">·</span>
        <span>No telemetry by default</span>
        <span class="ca-dot">·</span>
        <span>TypeScript-first</span>
        <span class="ca-dot">·</span>
        <span>Zero lock-in</span>
      </div>
    </div>
  </section>
</template>

<style scoped>
.ca-cta-section {
  position: relative;
  padding: 100px 24px;
  overflow: hidden;
  text-align: center;
}

.ca-cta-glow {
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse 70% 60% at 50% 50%, rgba(168, 85, 247, 0.12), rgba(34, 211, 238, 0.06), transparent 70%);
  pointer-events: none;
}

.ca-cta-inner {
  position: relative;
  z-index: 1;
  max-width: 640px;
  margin: 0 auto;
}

.ca-cta-title {
  font-size: 2.5rem;
  font-weight: 900;
  letter-spacing: -0.04em;
  background: linear-gradient(135deg, #a855f7 0%, #22d3ee 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 16px;
  border-top: none !important;
  padding-top: 0 !important;
}

.ca-cta-sub {
  font-size: 1.1rem;
  color: var(--vp-c-text-2);
  margin-bottom: 36px;
  line-height: 1.6;
}

.ca-cta-install {
  display: inline-flex;
  margin-bottom: 32px;
}

.ca-cta-cmd {
  padding: 12px 28px;
  border-radius: 10px;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg-soft);
  font-family: ui-monospace, 'Fira Code', monospace;
  font-size: 15px;
  color: var(--vp-c-brand-1);
  letter-spacing: 0.02em;
}

.ca-cta-actions {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14px;
  flex-wrap: wrap;
  margin-bottom: 36px;
}

.ca-btn-primary {
  display: inline-flex;
  align-items: center;
  padding: 12px 28px;
  border-radius: 10px;
  background: linear-gradient(135deg, #a855f7 0%, #22d3ee 100%);
  color: #fff;
  font-weight: 700;
  font-size: 15px;
  text-decoration: none;
  letter-spacing: 0.01em;
  transition: opacity 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
}

.ca-btn-primary:hover {
  opacity: 0.88;
  transform: translateY(-2px);
  box-shadow: 0 8px 28px rgba(139, 92, 246, 0.4);
}

.ca-btn-ghost {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  border-radius: 10px;
  border: 1px solid var(--vp-c-divider);
  color: var(--vp-c-text-1);
  font-weight: 600;
  font-size: 15px;
  text-decoration: none;
  transition: border-color 0.2s ease, background 0.2s ease;
}

.ca-btn-ghost:hover {
  border-color: var(--vp-c-brand-1);
  background: var(--vp-c-brand-soft);
}

.ca-cta-trust {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 8px;
  font-size: 12.5px;
  color: var(--vp-c-text-3);
}

.ca-dot {
  opacity: 0.4;
}
</style>
