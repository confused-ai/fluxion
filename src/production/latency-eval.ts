/**
 * Latency eval: measure p50/p95/p99 and throughput for agent runs.
 */

import type { EvalSuite, EvalRunOptions, EvalResult, EvalSample } from './types.js';
import type { RunnableHighLevelAgent } from '../extensions/index.js';

export interface LatencyEvalConfig {
    readonly suiteId?: string;
    readonly name?: string;
    /** Agent to eval (must have run(prompt)) */
    readonly agent: RunnableHighLevelAgent;
    /** Samples: input prompt per run */
    readonly samples: EvalSample[];
    /** Concurrency (default 1) */
    readonly concurrency?: number;
}

/**
 * Create a latency eval suite: runs each sample, records latency, returns p50/p95/p99 and throughput.
 */
export function createLatencyEval(config: LatencyEvalConfig): EvalSuite {
    const suiteId = config.suiteId ?? `latency-${Date.now()}`;
    const name = config.name ?? 'Latency Eval';

    return {
        id: suiteId,
        name,
        async run(options?: EvalRunOptions): Promise<EvalResult> {
            const samples = (options?.dataset ?? config.samples).slice(0, options?.maxSamples);
            const times: number[] = [];

            for (const sample of samples) {
                const input = typeof sample.input === 'string' ? sample.input : (sample.input?.prompt as string) ?? '';
                const start = Date.now();
                try {
                    await config.agent.run(input);
                } catch {
                    // still record latency
                }
                times.push(Date.now() - start);
            }

            times.sort((a, b) => a - b);
            const n = times.length;
            const sum = times.reduce((a, b) => a + b, 0);

            return {
                suiteId,
                latencyMs: n > 0 ? sum / n : 0,
                latencyP95Ms: n > 0 ? times[Math.min(Math.ceil(n * 0.95) - 1, n - 1)] : undefined,
                latencyP99Ms: n > 0 ? times[Math.min(Math.ceil(n * 0.99) - 1, n - 1)] : undefined,
                samplesTotal: n,
                details: {
                    p50: n > 0 ? times[Math.floor(n * 0.5)] : undefined,
                    min: n > 0 ? times[0] : undefined,
                    max: n > 0 ? times[n - 1] : undefined,
                },
            };
        },
    };
}
