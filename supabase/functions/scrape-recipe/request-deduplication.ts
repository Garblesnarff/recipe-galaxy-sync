/**
 * Request Deduplication
 * Prevents duplicate requests for the same URL and provides caching
 */

interface PendingRequest<T> {
  promise: Promise<T>;
  timestamp: number;
  resolvers: Array<(value: T) => void>;
  rejectors: Array<(error: any) => void>;
}

interface CachedResult<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

/**
 * Request deduplicator and cache
 */
export class RequestDeduplicator<T = any> {
  private pendingRequests: Map<string, PendingRequest<T>> = new Map();
  private cache: Map<string, CachedResult<T>> = new Map();
  private cacheMaxAge: number;

  constructor(
    private name: string = 'RequestDeduplicator',
    cacheMaxAgeMs: number = 300000 // 5 minutes default
  ) {
    this.cacheMaxAge = cacheMaxAgeMs;
  }

  /**
   * Execute a request with deduplication and caching
   */
  async execute(
    key: string,
    fn: () => Promise<T>,
    options: {
      forceRefresh?: boolean;
      cacheMaxAge?: number;
    } = {}
  ): Promise<T> {
    const { forceRefresh = false, cacheMaxAge = this.cacheMaxAge } = options;

    // Check cache first (unless force refresh)
    if (!forceRefresh) {
      const cached = this.getFromCache(key);
      if (cached !== null) {
        console.log(`💾 [${this.name}] Cache HIT for: ${key}`);
        return cached;
      }
    }

    // Check if request is already pending
    const pending = this.pendingRequests.get(key);
    if (pending) {
      console.log(`🔄 [${this.name}] Request already pending, joining: ${key}`);
      return this.joinPendingRequest(pending);
    }

    // Create new request
    console.log(`🆕 [${this.name}] New request for: ${key}`);
    return this.createNewRequest(key, fn, cacheMaxAge);
  }

  /**
   * Join an existing pending request
   */
  private joinPendingRequest(pending: PendingRequest<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      pending.resolvers.push(resolve);
      pending.rejectors.push(reject);
    });
  }

  /**
   * Create a new request
   */
  private async createNewRequest(
    key: string,
    fn: () => Promise<T>,
    cacheMaxAge: number
  ): Promise<T> {
    const pending: PendingRequest<T> = {
      promise: fn(),
      timestamp: Date.now(),
      resolvers: [],
      rejectors: []
    };

    this.pendingRequests.set(key, pending);

    try {
      const result = await pending.promise;

      // Cache the result
      this.addToCache(key, result, cacheMaxAge);

      // Resolve all waiting promises
      console.log(
        `✅ [${this.name}] Request completed for: ${key} ` +
        `(${pending.resolvers.length} waiters)`
      );

      pending.resolvers.forEach(resolve => resolve(result));
      return result;

    } catch (error) {
      // Reject all waiting promises
      console.log(
        `❌ [${this.name}] Request failed for: ${key} ` +
        `(${pending.rejectors.length} waiters)`
      );

      pending.rejectors.forEach(reject => reject(error));
      throw error;

    } finally {
      // Clean up pending request
      this.pendingRequests.delete(key);
    }
  }

  /**
   * Get result from cache if valid
   */
  private getFromCache(key: string): T | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    const now = Date.now();
    if (now > cached.expiresAt) {
      console.log(`⏰ [${this.name}] Cache EXPIRED for: ${key}`);
      this.cache.delete(key);
      return null;
    }

    const age = Math.round((now - cached.timestamp) / 1000);
    console.log(`💾 [${this.name}] Cache valid for: ${key} (${age}s old)`);
    return cached.data;
  }

  /**
   * Add result to cache
   */
  private addToCache(key: string, data: T, maxAge: number): void {
    const now = Date.now();
    this.cache.set(key, {
      data,
      timestamp: now,
      expiresAt: now + maxAge
    });

    console.log(`💾 [${this.name}] Cached result for: ${key} (TTL: ${maxAge}ms)`);
  }

  /**
   * Manually invalidate cache entry
   */
  invalidate(key: string): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
      console.log(`🗑️ [${this.name}] Invalidated cache for: ${key}`);
    }
  }

  /**
   * Clear all cache
   */
  clearCache(): void {
    const size = this.cache.size;
    this.cache.clear();
    console.log(`🗑️ [${this.name}] Cleared ${size} cache entries`);
  }

  /**
   * Clean up expired cache entries
   */
  cleanupExpired(): void {
    const now = Date.now();
    let removed = 0;

    for (const [key, cached] of this.cache.entries()) {
      if (now > cached.expiresAt) {
        this.cache.delete(key);
        removed++;
      }
    }

    if (removed > 0) {
      console.log(`🧹 [${this.name}] Cleaned up ${removed} expired cache entries`);
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    name: string;
    cacheSize: number;
    pendingRequests: number;
    cacheKeys: string[];
  } {
    return {
      name: this.name,
      cacheSize: this.cache.size,
      pendingRequests: this.pendingRequests.size,
      cacheKeys: Array.from(this.cache.keys())
    };
  }
}

/**
 * Create a URL-normalized cache key
 */
export function createCacheKey(url: string): string {
  try {
    const urlObj = new URL(url);
    // Normalize URL by removing fragments and sorting query params
    const params = new URLSearchParams(urlObj.search);
    const sortedParams = Array.from(params.entries())
      .sort(([a], [b]) => a.localeCompare(b));

    const normalizedSearch = sortedParams.length > 0
      ? '?' + new URLSearchParams(sortedParams).toString()
      : '';

    return urlObj.origin + urlObj.pathname + normalizedSearch;
  } catch {
    // If URL parsing fails, use as-is
    return url;
  }
}

/**
 * Global recipe scraping deduplicator
 */
export const recipeDeduplicator = new RequestDeduplicator<any>(
  'RecipeScraper',
  300000 // 5 minute cache
);

/**
 * Periodic cleanup task
 * Run this periodically to clean up expired cache entries
 */
export function startCleanupTask(
  deduplicator: RequestDeduplicator,
  intervalMs: number = 60000 // 1 minute
): number {
  return setInterval(() => {
    deduplicator.cleanupExpired();
  }, intervalMs) as unknown as number;
}
