/**
 * Rate Limiter Implementation
 * Controls request rate to prevent overwhelming target servers
 * and avoid getting blocked
 */

interface RateLimitConfig {
  maxRequests: number;    // Maximum requests in window
  windowMs: number;       // Time window in milliseconds
  minDelay: number;       // Minimum delay between requests in ms
}

interface QueuedRequest<T> {
  execute: () => Promise<T>;
  resolve: (value: T) => void;
  reject: (error: any) => void;
  timestamp: number;
}

export class RateLimiter {
  private queue: QueuedRequest<any>[] = [];
  private processing: boolean = false;
  private requestTimestamps: number[] = [];
  private lastRequestTime: number = 0;

  constructor(
    private domain: string,
    private config: RateLimitConfig = {
      maxRequests: 10,
      windowMs: 60000,     // 1 minute
      minDelay: 1000       // 1 second between requests
    }
  ) {}

  /**
   * Execute a function with rate limiting
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const request: QueuedRequest<T> = {
        execute: fn,
        resolve,
        reject,
        timestamp: Date.now()
      };

      this.queue.push(request);
      console.log(`📋 Queued request for ${this.domain}. Queue length: ${this.queue.length}`);

      // Start processing if not already running
      if (!this.processing) {
        this.processQueue();
      }
    });
  }

  /**
   * Process queued requests with rate limiting
   */
  private async processQueue(): Promise<void> {
    if (this.processing) return;
    this.processing = true;

    while (this.queue.length > 0) {
      // Clean up old timestamps outside window
      const now = Date.now();
      this.requestTimestamps = this.requestTimestamps.filter(
        ts => now - ts < this.config.windowMs
      );

      // Check if we can make a request
      if (this.requestTimestamps.length >= this.config.maxRequests) {
        const oldestTimestamp = this.requestTimestamps[0];
        const waitTime = this.config.windowMs - (now - oldestTimestamp);

        console.log(
          `⏱️ Rate limit reached for ${this.domain}. ` +
          `Waiting ${Math.round(waitTime / 1000)}s...`
        );

        await this.sleep(waitTime);
        continue;
      }

      // Enforce minimum delay between requests
      const timeSinceLastRequest = now - this.lastRequestTime;
      if (timeSinceLastRequest < this.config.minDelay) {
        const delayNeeded = this.config.minDelay - timeSinceLastRequest;
        console.log(
          `⏸️ Enforcing minimum delay for ${this.domain}. ` +
          `Waiting ${delayNeeded}ms...`
        );
        await this.sleep(delayNeeded);
      }

      // Get next request from queue
      const request = this.queue.shift();
      if (!request) continue;

      // Check if request has been in queue too long
      const queueTime = Date.now() - request.timestamp;
      if (queueTime > 300000) { // 5 minutes
        console.log(
          `⚠️ Request expired after ${Math.round(queueTime / 1000)}s in queue`
        );
        request.reject(new Error('Request timeout: too long in queue'));
        continue;
      }

      // Execute request
      try {
        console.log(
          `🚀 Executing request for ${this.domain}. ` +
          `Remaining in queue: ${this.queue.length}`
        );

        this.lastRequestTime = Date.now();
        this.requestTimestamps.push(this.lastRequestTime);

        const result = await request.execute();
        request.resolve(result);

      } catch (error) {
        console.error(`❌ Request failed for ${this.domain}:`, error);
        request.reject(error);
      }
    }

    this.processing = false;
    console.log(`✅ Queue processing completed for ${this.domain}`);
  }

  /**
   * Helper to sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get current queue status
   */
  public getStatus(): {
    queueLength: number;
    recentRequests: number;
    isProcessing: boolean;
  } {
    const now = Date.now();
    const recentRequests = this.requestTimestamps.filter(
      ts => now - ts < this.config.windowMs
    ).length;

    return {
      queueLength: this.queue.length,
      recentRequests,
      isProcessing: this.processing
    };
  }

  /**
   * Clear the queue (emergency stop)
   */
  public clearQueue(): void {
    const clearedCount = this.queue.length;
    this.queue.forEach(request => {
      request.reject(new Error('Queue cleared by administrator'));
    });
    this.queue = [];
    console.log(`🗑️ Cleared ${clearedCount} requests from queue for ${this.domain}`);
  }
}

/**
 * Rate limiter registry for managing rate limiters per domain
 */
class RateLimiterRegistry {
  private limiters: Map<string, RateLimiter> = new Map();

  // Site-specific configurations
  private siteConfigs: Map<string, Partial<RateLimitConfig>> = new Map([
    ['hellofresh.com', { maxRequests: 3, windowMs: 60000, minDelay: 3000 }],
    ['foodnetwork.com', { maxRequests: 5, windowMs: 60000, minDelay: 2000 }],
    ['allrecipes.com', { maxRequests: 10, windowMs: 60000, minDelay: 1000 }],
  ]);

  /**
   * Get or create rate limiter for domain
   */
  public getLimiter(domain: string): RateLimiter {
    if (!this.limiters.has(domain)) {
      // Check for site-specific config
      const customConfig = this.siteConfigs.get(domain);
      const config = customConfig ? {
        maxRequests: 10,
        windowMs: 60000,
        minDelay: 1000,
        ...customConfig
      } : undefined;

      this.limiters.set(domain, new RateLimiter(domain, config));
      console.log(`🆕 Created rate limiter for ${domain}`, config || 'default config');
    }
    return this.limiters.get(domain)!;
  }

  /**
   * Get all rate limiter statuses
   */
  public getAllStatuses(): Map<string, ReturnType<RateLimiter['getStatus']>> {
    const statuses = new Map();
    for (const [domain, limiter] of this.limiters.entries()) {
      statuses.set(domain, limiter.getStatus());
    }
    return statuses;
  }

  /**
   * Clear queue for specific domain
   */
  public clearQueue(domain: string): void {
    const limiter = this.limiters.get(domain);
    if (limiter) {
      limiter.clearQueue();
    }
  }

  /**
   * Clear all queues
   */
  public clearAllQueues(): void {
    for (const limiter of this.limiters.values()) {
      limiter.clearQueue();
    }
  }
}

// Global singleton instance
export const rateLimiterRegistry = new RateLimiterRegistry();
