/**
 * Performance Monitoring Utilities
 *
 * Track performance metrics for key operations:
 * - Page load times
 * - Query durations
 * - Component render times
 * - User interactions
 */

import { FEATURES } from '@/config/features';

interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private marks: Map<string, number> = new Map();

  /**
   * Start timing an operation
   */
  start(name: string): void {
    if (!FEATURES.PERFORMANCE_MONITORING) return;

    this.marks.set(name, performance.now());
  }

  /**
   * End timing and record metric
   */
  end(name: string, metadata?: Record<string, any>): number | null {
    if (!FEATURES.PERFORMANCE_MONITORING) return null;

    const startTime = this.marks.get(name);
    if (!startTime) {
      console.warn(`No start mark found for: ${name}`);
      return null;
    }

    const duration = performance.now() - startTime;
    this.marks.delete(name);

    const metric: PerformanceMetric = {
      name,
      duration,
      timestamp: Date.now(),
      metadata,
    };

    this.metrics.push(metric);

    // Log in development
    if (import.meta.env.DEV) {
      console.log(`⚡ ${name}: ${duration.toFixed(2)}ms`, metadata || '');
    }

    return duration;
  }

  /**
   * Measure a function execution time
   */
  async measure<T>(
    name: string,
    fn: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> {
    this.start(name);
    try {
      const result = await fn();
      this.end(name, metadata);
      return result;
    } catch (error) {
      this.end(name, { ...metadata, error: true });
      throw error;
    }
  }

  /**
   * Get all recorded metrics
   */
  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  /**
   * Get metrics by name
   */
  getMetricsByName(name: string): PerformanceMetric[] {
    return this.metrics.filter(m => m.name === name);
  }

  /**
   * Get average duration for a metric
   */
  getAverageDuration(name: string): number | null {
    const metrics = this.getMetricsByName(name);
    if (metrics.length === 0) return null;

    const total = metrics.reduce((sum, m) => sum + m.duration, 0);
    return total / metrics.length;
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics = [];
    this.marks.clear();
  }

  /**
   * Export metrics as CSV
   */
  exportCSV(): string {
    const headers = 'Name,Duration (ms),Timestamp,Metadata\n';
    const rows = this.metrics.map(m =>
      `${m.name},${m.duration},${m.timestamp},"${JSON.stringify(m.metadata || {})}"`
    ).join('\n');
    return headers + rows;
  }

  /**
   * Get performance summary
   */
  getSummary(): Record<string, { count: number; avg: number; min: number; max: number }> {
    const summary: Record<string, { count: number; avg: number; min: number; max: number }> = {};

    this.metrics.forEach(metric => {
      if (!summary[metric.name]) {
        summary[metric.name] = {
          count: 0,
          avg: 0,
          min: Infinity,
          max: -Infinity,
        };
      }

      const s = summary[metric.name];
      s.count++;
      s.avg = (s.avg * (s.count - 1) + metric.duration) / s.count;
      s.min = Math.min(s.min, metric.duration);
      s.max = Math.max(s.max, metric.duration);
    });

    return summary;
  }

  /**
   * Log performance summary
   */
  logSummary(): void {
    if (!import.meta.env.DEV) return;

    const summary = this.getSummary();
    console.group('📊 Performance Summary');
    console.table(summary);
    console.groupEnd();
  }
}

// Singleton instance
export const perfMonitor = new PerformanceMonitor();

// React hook for component rendering performance
export const usePerformance = (componentName: string) => {
  if (!FEATURES.PERFORMANCE_MONITORING) {
    return { start: () => {}, end: () => {} };
  }

  return {
    start: () => perfMonitor.start(`render:${componentName}`),
    end: () => perfMonitor.end(`render:${componentName}`),
  };
};

// Log summary on page unload (development only)
if (import.meta.env.DEV) {
  window.addEventListener('beforeunload', () => {
    perfMonitor.logSummary();
  });
}
