# ── Builder stage ─────────────────────────────────────────────────────────────
FROM oven/bun:1-alpine AS builder
WORKDIR /app

# Copy manifests first for layer caching
COPY package.json bun.lockb* ./
RUN bun install --frozen-lockfile --production

# Copy source and build
COPY . .
RUN bun run build 2>/dev/null || true   # skip if no build step (ts-node / bun run directly)

# ── Runtime stage ─────────────────────────────────────────────────────────────
FROM oven/bun:1-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8787

# Copy production dependencies
COPY --from=builder /app/node_modules ./node_modules
# Copy built output (dist/) or source (if running TypeScript directly with bun)
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src ./src
COPY --from=builder /app/package.json ./package.json

# Non-root user for security
RUN addgroup -S agent && adduser -S agent -G agent
USER agent

EXPOSE $PORT

# Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget -qO- http://localhost:${PORT}/health || exit 1

CMD ["bun", "run", "src/server.ts"]
