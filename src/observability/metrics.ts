/**
 * Metrics Collector Implementation
 *
 * In-memory metrics collection for monitoring and observability
 */

import { MetricsCollector, MetricValue, MetricType } from './types.js';

/**
 * Metrics collector implementation
 */
export class MetricsCollectorImpl implements MetricsCollector {
    private metrics: MetricValue[] = [];

    counter(name: string, value = 1, labels: Record<string, string> = {}): void {
        this.metrics.push({
            name,
            type: MetricType.COUNTER,
            value,
            labels,
            timestamp: new Date(),
        });
    }

    gauge(name: string, value: number, labels: Record<string, string> = {}): void {
        // Remove previous gauge with same name and labels
        this.metrics = this.metrics.filter(m =>
            !(m.name === name &&
                m.type === MetricType.GAUGE &&
                JSON.stringify(m.labels) === JSON.stringify(labels))
        );

        this.metrics.push({
            name,
            type: MetricType.GAUGE,
            value,
            labels,
            timestamp: new Date(),
        });
    }

    histogram(name: string, value: number, labels: Record<string, string> = {}): void {
        this.metrics.push({
            name,
            type: MetricType.HISTOGRAM,
            value,
            labels,
            timestamp: new Date(),
        });
    }

    getMetrics(): MetricValue[] {
        return [...this.metrics];
    }

    clear(): void {
        this.metrics = [];
    }

    /**
     * Get metrics by name
     */
    getMetricsByName(name: string): MetricValue[] {
        return this.metrics.filter(m => m.name === name);
    }

    /**
     * Get metrics by type
     */
    getMetricsByType(type: MetricType): MetricValue[] {
        return this.metrics.filter(m => m.type === type);
    }

    /**
     * Get the latest value for a metric
     */
    getLatestValue(name: string): number | undefined {
        const metrics = this.getMetricsByName(name);
        if (metrics.length === 0) return undefined;

        return metrics.sort((a, b) =>
            b.timestamp.getTime() - a.timestamp.getTime()
        )[0].value;
    }
}
