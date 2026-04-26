/**
 * Plugin System — Extensible hooks for cross-cutting concerns
 *
 * Plugins intercept execution lifecycle events without modifying core logic.
 * Built-in plugins: Telemetry, Logging, Retry, Timeout, Cache
 *
 * Design: Plugins implement GraphPlugin interface. Multiple plugins compose.
 * Order matters: plugins run in registration order.
 */

import {
  type GraphPlugin,
  type GraphEvent,
  type GraphState,
  type GraphDef,
  type NodeContext,
  type NodeId,
  type ExecutionId,
  GraphEventType,
} from './types.js';

// ── Telemetry Plugin ────────────────────────────────────────────────────────

/**
 * Collects metrics: execution time, node duration, success/failure rates.
 * Exposes metrics via getMetrics() for scraping by Prometheus, DataDog, etc.
 */
export class TelemetryPlugin implements GraphPlugin {
  name = 'telemetry';
  private metrics: MetricsData = {
    totalExecutions: 0,
    completedExecutions: 0,
    failedExecutions: 0,
    totalNodes: 0,
    completedNodes: 0,
    failedNodes: 0,
    nodeTimings: new Map(),
    executionTimings: [],
  };

  async onExecutionStart(_executionId: ExecutionId): Promise<void> {
    this.metrics.totalExecutions++;
  }

  async onExecutionComplete(_executionId: ExecutionId, _state: GraphState, durationMs: number): Promise<void> {
    this.metrics.completedExecutions++;
    this.metrics.executionTimings.push(durationMs);
    // Keep only last 1000 timings
    if (this.metrics.executionTimings.length > 1000) {
      this.metrics.executionTimings.shift();
    }
  }

  async onNodeStart(_nodeId: NodeId): Promise<void> {
    this.metrics.totalNodes++;
  }

  async onNodeComplete(nodeId: NodeId, _result: unknown, durationMs: number): Promise<void> {
    this.metrics.completedNodes++;
    const timings = this.metrics.nodeTimings.get(nodeId) ?? [];
    timings.push(durationMs);
    if (timings.length > 100) timings.shift();
    this.metrics.nodeTimings.set(nodeId, timings);
  }

  async onNodeError(_nodeId: NodeId): Promise<void> {
    this.metrics.failedNodes++;
  }

  getMetrics(): MetricsSummary {
    const avgExecution = this.metrics.executionTimings.length > 0
      ? this.metrics.executionTimings.reduce((a, b) => a + b, 0) / this.metrics.executionTimings.length
      : 0;

    const p99Execution = this._percentile(this.metrics.executionTimings, 0.99);

    return {
      totalExecutions: this.metrics.totalExecutions,
      completedExecutions: this.metrics.completedExecutions,
      failedExecutions: this.metrics.failedExecutions,
      successRate: this.metrics.totalExecutions > 0
        ? this.metrics.completedExecutions / this.metrics.totalExecutions
        : 0,
      avgExecutionMs: avgExecution,
      p99ExecutionMs: p99Execution,
      totalNodes: this.metrics.totalNodes,
      completedNodes: this.metrics.completedNodes,
      failedNodes: this.metrics.failedNodes,
    };
  }

  private _percentile(arr: number[], p: number): number {
    if (arr.length === 0) return 0;
    const sorted = [...arr].sort((a, b) => a - b);
    const idx = Math.ceil(sorted.length * p) - 1;
    return sorted[Math.max(0, idx)];
  }
}

interface MetricsData {
  totalExecutions: number;
  completedExecutions: number;
  failedExecutions: number;
  totalNodes: number;
  completedNodes: number;
  failedNodes: number;
  nodeTimings: Map<string, number[]>;
  executionTimings: number[];
}

export interface MetricsSummary {
  totalExecutions: number;
  completedExecutions: number;
  failedExecutions: number;
  successRate: number;
  avgExecutionMs: number;
  p99ExecutionMs: number;
  totalNodes: number;
  completedNodes: number;
  failedNodes: number;
}

// ── Logging Plugin ──────────────────────────────────────────────────────────

/**
 * Structured JSON logging for all execution events.
 */
export class LoggingPlugin implements GraphPlugin {
  name = 'logging';
  private logger: (entry: LogEntry) => void;
  private level: LogLevel;

  constructor(options?: {
    logger?: (entry: LogEntry) => void;
    level?: LogLevel;
  }) {
    this.logger = options?.logger ?? ((entry) => {
      const line = JSON.stringify({
        timestamp: new Date(entry.timestamp).toISOString(),
        level: entry.level,
        event: entry.event,
        executionId: entry.executionId,
        nodeId: entry.nodeId,
        ...entry.data,
      });
      console.log(line);
    });
    this.level = options?.level ?? 'info';
  }

  async onExecutionStart(executionId: ExecutionId, graph: GraphDef): Promise<void> {
    this._log('info', 'execution.started', executionId, undefined, {
      graphName: graph.name,
      nodeCount: graph.nodes.size,
    });
  }

  async onExecutionComplete(executionId: ExecutionId, state: GraphState, durationMs: number): Promise<void> {
    this._log('info', 'execution.completed', executionId, undefined, {
      status: state.status,
      durationMs,
    });
  }

  async onNodeStart(nodeId: NodeId, ctx: NodeContext): Promise<void> {
    this._log('debug', 'node.started', ctx.executionId, nodeId, {
      nodeName: ctx.nodeName,
      attempt: ctx.attempt,
    });
  }

  async onNodeComplete(nodeId: NodeId, _result: unknown, durationMs: number): Promise<void> {
    this._log('debug', 'node.completed', undefined, nodeId, { durationMs });
  }

  async onNodeError(nodeId: NodeId, error: unknown, attempt: number): Promise<void> {
    this._log('error', 'node.error', undefined, nodeId, {
      error: error instanceof Error ? error.message : String(error),
      attempt,
    });
  }

  private _log(
    level: LogLevel,
    event: string,
    executionId?: ExecutionId,
    nodeId?: NodeId,
    data?: Record<string, unknown>
  ): void {
    const levels: Record<LogLevel, number> = { debug: 0, info: 1, warn: 2, error: 3 };
    if (levels[level] < levels[this.level]) return;

    this.logger({
      timestamp: Date.now(),
      level,
      event,
      executionId,
      nodeId,
      data,
    });
  }
}

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  timestamp: number;
  level: LogLevel;
  event: string;
  executionId?: ExecutionId;
  nodeId?: NodeId;
  data?: Record<string, unknown>;
}

// ── OpenTelemetry Plugin ────────────────────────────────────────────────────

/**
 * Emits OpenTelemetry-compatible spans for distributed tracing.
 * Requires: @opentelemetry/api (optional peer dependency)
 */
export class OpenTelemetryPlugin implements GraphPlugin {
  name = 'opentelemetry';
  private tracer: any; // otel.Tracer
  private spans: Map<string, any> = new Map();

  constructor(options?: { serviceName?: string; tracer?: any }) {
    // Lazy load OpenTelemetry to avoid hard dependency
    this.tracer = options?.tracer;
  }

  async onExecutionStart(executionId: ExecutionId, graph: GraphDef): Promise<void> {
    if (!this.tracer) {
      try {
        const otel = await import('@opentelemetry/api' as string);
        this.tracer = otel.trace.getTracer('graph-engine');
      } catch {
        return; // OpenTelemetry not available
      }
    }

    const span = this.tracer.startSpan(`graph.execute`, {
      attributes: {
        'graph.id': graph.id,
        'graph.name': graph.name,
        'execution.id': executionId,
      },
    });
    this.spans.set(`exec:${executionId}`, span);
  }

  async onNodeStart(nodeId: NodeId, ctx: NodeContext): Promise<void> {
    if (!this.tracer) return;

    const parentSpan = this.spans.get(`exec:${ctx.executionId}`);
    const spanCtx = parentSpan
      ? (await import('@opentelemetry/api' as string)).trace.setSpan(
          (await import('@opentelemetry/api' as string)).context.active(),
          parentSpan
        )
      : undefined;

    const span = this.tracer.startSpan(
      `node.${ctx.nodeName}`,
      {
        attributes: {
          'node.id': nodeId,
          'node.name': ctx.nodeName,
          'node.attempt': ctx.attempt,
        },
      },
      spanCtx
    );
    this.spans.set(`node:${nodeId}`, span);
  }

  async onNodeComplete(nodeId: NodeId, _result: unknown, durationMs: number): Promise<void> {
    const span = this.spans.get(`node:${nodeId}`);
    if (span) {
      span.setAttribute('node.duration_ms', durationMs);
      span.setStatus({ code: 1 }); // OK
      span.end();
      this.spans.delete(`node:${nodeId}`);
    }
  }

  async onNodeError(nodeId: NodeId, error: unknown): Promise<void> {
    const span = this.spans.get(`node:${nodeId}`);
    if (span) {
      span.setStatus({
        code: 2, // ERROR
        message: error instanceof Error ? error.message : String(error),
      });
      span.recordException(error instanceof Error ? error : new Error(String(error)));
      span.end();
      this.spans.delete(`node:${nodeId}`);
    }
  }

  async onExecutionComplete(executionId: ExecutionId, state: GraphState, durationMs: number): Promise<void> {
    const span = this.spans.get(`exec:${executionId}`);
    if (span) {
      span.setAttribute('execution.duration_ms', durationMs);
      span.setAttribute('execution.status', state.status);
      span.setStatus({ code: state.status === 'completed' ? 1 : 2 });
      span.end();
      this.spans.delete(`exec:${executionId}`);
    }
  }
}

// ── Event Audit Plugin ──────────────────────────────────────────────────────

/**
 * Records all events into an append-only audit log.
 * Useful for compliance, debugging, and replay.
 */
export class AuditPlugin implements GraphPlugin {
  name = 'audit';
  private events: GraphEvent[] = [];
  private maxEvents: number;

  constructor(options?: { maxEvents?: number }) {
    this.maxEvents = options?.maxEvents ?? 10000;
  }

  async onEvent(event: GraphEvent): Promise<void> {
    this.events.push(event);
    if (this.events.length > this.maxEvents) {
      this.events.shift();
    }
  }

  getAuditLog(): readonly GraphEvent[] {
    return this.events;
  }

  getEventsByType(type: GraphEventType): GraphEvent[] {
    return this.events.filter(e => e.type === type);
  }

  getEventsForNode(nodeId: NodeId): GraphEvent[] {
    return this.events.filter(e => e.nodeId === nodeId);
  }

  getEventsForExecution(executionId: ExecutionId): GraphEvent[] {
    return this.events.filter(e => e.executionId === executionId);
  }
}

// ── Rate Limit Plugin ───────────────────────────────────────────────────────

/**
 * Limits execution rate (useful for LLM API rate limits).
 */
export class RateLimitPlugin implements GraphPlugin {
  name = 'rate-limit';
  private tokens: number;
  private maxTokens: number;
  private refillRate: number; // tokens per second
  private lastRefill: number;

  constructor(options: { maxTokensPerSecond: number; burst?: number }) {
    this.maxTokens = options.burst ?? options.maxTokensPerSecond;
    this.tokens = this.maxTokens;
    this.refillRate = options.maxTokensPerSecond;
    this.lastRefill = Date.now();
  }

  async onNodeStart(): Promise<void> {
    await this._acquire();
  }

  private async _acquire(): Promise<void> {
    this._refill();
    while (this.tokens < 1) {
      await new Promise(resolve => setTimeout(resolve, 100));
      this._refill();
    }
    this.tokens--;
  }

  private _refill(): void {
    const now = Date.now();
    const elapsed = (now - this.lastRefill) / 1000;
    this.tokens = Math.min(this.maxTokens, this.tokens + elapsed * this.refillRate);
    this.lastRefill = now;
  }
}
