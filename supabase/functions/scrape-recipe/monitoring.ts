/**
 * Monitoring and Logging
 * Tracks scraping performance, success rates, and generates metrics
 */

export interface ScrapingAttempt {
  url: string;
  domain: string;
  method: 'standard' | 'enhanced' | 'firecrawl';
  startTime: number;
  endTime?: number;
  duration?: number;
  success: boolean;
  error?: string;
  errorCategory?: string;
  validationScore?: number;
  retryCount?: number;
  cacheHit?: boolean;
  circuitBreakerState?: string;
}

export interface DomainMetrics {
  domain: string;
  totalAttempts: number;
  successCount: number;
  failureCount: number;
  successRate: number;
  averageDuration: number;
  fastestDuration: number;
  slowestDuration: number;
  lastAttempt: number;
  lastSuccess?: number;
  lastFailure?: number;
  methodStats: {
    standard: { attempts: number; successes: number };
    enhanced: { attempts: number; successes: number };
    firecrawl: { attempts: number; successes: number };
  };
  commonErrors: Map<string, number>;
}

/**
 * Scraping monitor singleton
 */
class ScrapingMonitor {
  private attempts: ScrapingAttempt[] = [];
  private maxAttempts = 1000; // Keep last 1000 attempts

  /**
   * Start tracking a scraping attempt
   */
  startAttempt(
    url: string,
    method: 'standard' | 'enhanced' | 'firecrawl'
  ): string {
    const domain = new URL(url).hostname.replace(/^www\./, '');
    const attemptId = `${domain}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const attempt: ScrapingAttempt = {
      url,
      domain,
      method,
      startTime: Date.now(),
      success: false
    };

    this.attempts.push(attempt);

    // Keep only last N attempts to prevent memory issues
    if (this.attempts.length > this.maxAttempts) {
      this.attempts.shift();
    }

    console.log(`📊 [Monitor] Started tracking: ${domain} via ${method}`);
    return attemptId;
  }

  /**
   * Record successful scraping
   */
  recordSuccess(
    url: string,
    method: 'standard' | 'enhanced' | 'firecrawl',
    options: {
      validationScore?: number;
      retryCount?: number;
      cacheHit?: boolean;
      circuitBreakerState?: string;
    } = {}
  ): void {
    const domain = new URL(url).hostname.replace(/^www\./, '');
    const endTime = Date.now();

    // Find the most recent attempt for this URL
    const attempt = this.findRecentAttempt(url, method);
    if (attempt) {
      attempt.success = true;
      attempt.endTime = endTime;
      attempt.duration = endTime - attempt.startTime;
      attempt.validationScore = options.validationScore;
      attempt.retryCount = options.retryCount;
      attempt.cacheHit = options.cacheHit;
      attempt.circuitBreakerState = options.circuitBreakerState;
    }

    console.log(
      `✅ [Monitor] Success: ${domain} via ${method} ` +
      `(${attempt?.duration}ms, score: ${options.validationScore || 'N/A'})`
    );
  }

  /**
   * Record failed scraping
   */
  recordFailure(
    url: string,
    method: 'standard' | 'enhanced' | 'firecrawl',
    error: string,
    errorCategory?: string,
    options: {
      retryCount?: number;
      circuitBreakerState?: string;
    } = {}
  ): void {
    const domain = new URL(url).hostname.replace(/^www\./, '');
    const endTime = Date.now();

    const attempt = this.findRecentAttempt(url, method);
    if (attempt) {
      attempt.success = false;
      attempt.endTime = endTime;
      attempt.duration = endTime - attempt.startTime;
      attempt.error = error;
      attempt.errorCategory = errorCategory;
      attempt.retryCount = options.retryCount;
      attempt.circuitBreakerState = options.circuitBreakerState;
    }

    console.log(
      `❌ [Monitor] Failure: ${domain} via ${method} ` +
      `(${errorCategory || 'unknown'}: ${error.substring(0, 100)})`
    );
  }

  /**
   * Find most recent attempt for URL and method
   */
  private findRecentAttempt(
    url: string,
    method: string
  ): ScrapingAttempt | undefined {
    // Search backwards for efficiency
    for (let i = this.attempts.length - 1; i >= 0; i--) {
      const attempt = this.attempts[i];
      if (attempt.url === url && attempt.method === method && !attempt.endTime) {
        return attempt;
      }
    }
    return undefined;
  }

  /**
   * Get metrics for a specific domain
   */
  getDomainMetrics(domain: string): DomainMetrics | null {
    const domainAttempts = this.attempts.filter(a => a.domain === domain);
    if (domainAttempts.length === 0) return null;

    const successfulAttempts = domainAttempts.filter(a => a.success);
    const failedAttempts = domainAttempts.filter(a => !a.success);

    const durations = domainAttempts
      .filter(a => a.duration !== undefined)
      .map(a => a.duration!);

    const methodStats = {
      standard: { attempts: 0, successes: 0 },
      enhanced: { attempts: 0, successes: 0 },
      firecrawl: { attempts: 0, successes: 0 }
    };

    for (const attempt of domainAttempts) {
      methodStats[attempt.method].attempts++;
      if (attempt.success) {
        methodStats[attempt.method].successes++;
      }
    }

    const commonErrors = new Map<string, number>();
    for (const attempt of failedAttempts) {
      if (attempt.errorCategory) {
        commonErrors.set(
          attempt.errorCategory,
          (commonErrors.get(attempt.errorCategory) || 0) + 1
        );
      }
    }

    return {
      domain,
      totalAttempts: domainAttempts.length,
      successCount: successfulAttempts.length,
      failureCount: failedAttempts.length,
      successRate: successfulAttempts.length / domainAttempts.length,
      averageDuration: durations.length > 0
        ? durations.reduce((a, b) => a + b, 0) / durations.length
        : 0,
      fastestDuration: durations.length > 0 ? Math.min(...durations) : 0,
      slowestDuration: durations.length > 0 ? Math.max(...durations) : 0,
      lastAttempt: domainAttempts[domainAttempts.length - 1].startTime,
      lastSuccess: successfulAttempts.length > 0
        ? successfulAttempts[successfulAttempts.length - 1].startTime
        : undefined,
      lastFailure: failedAttempts.length > 0
        ? failedAttempts[failedAttempts.length - 1].startTime
        : undefined,
      methodStats,
      commonErrors
    };
  }

  /**
   * Get overall metrics across all domains
   */
  getOverallMetrics(): {
    totalAttempts: number;
    successCount: number;
    failureCount: number;
    successRate: number;
    averageDuration: number;
    topDomains: Array<{ domain: string; attempts: number; successRate: number }>;
    methodStats: Record<string, { attempts: number; successes: number; rate: number }>;
  } {
    const successfulAttempts = this.attempts.filter(a => a.success);
    const durations = this.attempts
      .filter(a => a.duration !== undefined)
      .map(a => a.duration!);

    // Calculate per-domain stats
    const domainMap = new Map<string, { attempts: number; successes: number }>();
    for (const attempt of this.attempts) {
      const stats = domainMap.get(attempt.domain) || { attempts: 0, successes: 0 };
      stats.attempts++;
      if (attempt.success) stats.successes++;
      domainMap.set(attempt.domain, stats);
    }

    const topDomains = Array.from(domainMap.entries())
      .map(([domain, stats]) => ({
        domain,
        attempts: stats.attempts,
        successRate: stats.attempts > 0 ? stats.successes / stats.attempts : 0
      }))
      .sort((a, b) => b.attempts - a.attempts)
      .slice(0, 10);

    // Calculate method stats
    const methodStats: Record<string, { attempts: number; successes: number; rate: number }> = {
      standard: { attempts: 0, successes: 0, rate: 0 },
      enhanced: { attempts: 0, successes: 0, rate: 0 },
      firecrawl: { attempts: 0, successes: 0, rate: 0 }
    };

    for (const attempt of this.attempts) {
      methodStats[attempt.method].attempts++;
      if (attempt.success) {
        methodStats[attempt.method].successes++;
      }
    }

    for (const method of Object.keys(methodStats)) {
      const stats = methodStats[method];
      stats.rate = stats.attempts > 0 ? stats.successes / stats.attempts : 0;
    }

    return {
      totalAttempts: this.attempts.length,
      successCount: successfulAttempts.length,
      failureCount: this.attempts.length - successfulAttempts.length,
      successRate: this.attempts.length > 0
        ? successfulAttempts.length / this.attempts.length
        : 0,
      averageDuration: durations.length > 0
        ? durations.reduce((a, b) => a + b, 0) / durations.length
        : 0,
      topDomains,
      methodStats
    };
  }

  /**
   * Generate human-readable report
   */
  generateReport(): string {
    const overall = this.getOverallMetrics();
    const lines: string[] = [
      '📊 Scraping Monitor Report',
      '=' .repeat(50),
      '',
      '📈 Overall Statistics:',
      `  Total Attempts: ${overall.totalAttempts}`,
      `  Successes: ${overall.successCount}`,
      `  Failures: ${overall.failureCount}`,
      `  Success Rate: ${(overall.successRate * 100).toFixed(1)}%`,
      `  Average Duration: ${Math.round(overall.averageDuration)}ms`,
      '',
      '🔧 Method Performance:',
    ];

    for (const [method, stats] of Object.entries(overall.methodStats)) {
      lines.push(
        `  ${method.padEnd(10)}: ${stats.attempts} attempts, ` +
        `${(stats.rate * 100).toFixed(1)}% success`
      );
    }

    lines.push('', '🏆 Top Domains:');
    for (const domain of overall.topDomains) {
      lines.push(
        `  ${domain.domain.padEnd(30)}: ${domain.attempts} attempts, ` +
        `${(domain.successRate * 100).toFixed(1)}% success`
      );
    }

    return lines.join('\n');
  }

  /**
   * Clear all tracking data
   */
  clear(): void {
    const count = this.attempts.length;
    this.attempts = [];
    console.log(`🗑️ [Monitor] Cleared ${count} tracked attempts`);
  }

  /**
   * Get recent failures for debugging
   */
  getRecentFailures(limit: number = 10): ScrapingAttempt[] {
    return this.attempts
      .filter(a => !a.success)
      .slice(-limit)
      .reverse();
  }
}

// Global singleton
export const scrapingMonitor = new ScrapingMonitor();

/**
 * Performance timer utility
 */
export class PerformanceTimer {
  private startTime: number;
  private checkpoints: Map<string, number> = new Map();

  constructor(private name: string) {
    this.startTime = Date.now();
    console.log(`⏱️ [Timer] Started: ${name}`);
  }

  /**
   * Record a checkpoint
   */
  checkpoint(label: string): void {
    const elapsed = Date.now() - this.startTime;
    this.checkpoints.set(label, elapsed);
    console.log(`⏱️ [Timer] ${this.name} - ${label}: ${elapsed}ms`);
  }

  /**
   * End timer and return duration
   */
  end(): number {
    const duration = Date.now() - this.startTime;
    console.log(`⏱️ [Timer] ${this.name} completed: ${duration}ms`);
    return duration;
  }

  /**
   * Get summary of all checkpoints
   */
  getSummary(): string {
    const lines = [`⏱️ Timer: ${this.name}`];
    for (const [label, elapsed] of this.checkpoints.entries()) {
      lines.push(`  ${label}: ${elapsed}ms`);
    }
    lines.push(`  Total: ${Date.now() - this.startTime}ms`);
    return lines.join('\n');
  }
}
