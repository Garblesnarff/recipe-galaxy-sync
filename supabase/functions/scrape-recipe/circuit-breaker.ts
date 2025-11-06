/**
 * Circuit Breaker Pattern Implementation
 * Prevents repeated requests to failing services by tracking failure rates
 * and temporarily "opening" the circuit when too many failures occur.
 */

export enum CircuitState {
  CLOSED = 'CLOSED',      // Normal operation, requests pass through
  OPEN = 'OPEN',          // Too many failures, reject requests immediately
  HALF_OPEN = 'HALF_OPEN' // Testing if service recovered
}

export interface CircuitBreakerOptions {
  failureThreshold: number;      // Number of failures before opening circuit
  successThreshold: number;      // Number of successes in HALF_OPEN to close circuit
  timeout: number;               // Time in ms before trying HALF_OPEN state
  resetTimeout: number;          // Time in ms to reset failure count in CLOSED state
}

export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount: number = 0;
  private successCount: number = 0;
  private nextAttempt: number = Date.now();
  private lastFailureTime: number = 0;
  private lastSuccessTime: number = 0;

  constructor(
    private domain: string,
    private options: CircuitBreakerOptions = {
      failureThreshold: 5,
      successThreshold: 2,
      timeout: 60000,        // 1 minute
      resetTimeout: 300000   // 5 minutes
    }
  ) {}

  /**
   * Check if request should be allowed through
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    // Check if circuit should transition states
    this.updateState();

    if (this.state === CircuitState.OPEN) {
      const waitTime = Math.round((this.nextAttempt - Date.now()) / 1000);
      throw new Error(
        `Circuit breaker OPEN for ${this.domain}. ` +
        `Too many failures (${this.failureCount}). ` +
        `Retry in ${waitTime}s.`
      );
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  /**
   * Record successful request
   */
  private onSuccess(): void {
    this.lastSuccessTime = Date.now();

    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++;
      console.log(
        `✅ Circuit breaker HALF_OPEN success for ${this.domain}: ` +
        `${this.successCount}/${this.options.successThreshold}`
      );

      if (this.successCount >= this.options.successThreshold) {
        this.close();
      }
    } else if (this.state === CircuitState.CLOSED) {
      // Reset failure count after successful request
      if (this.failureCount > 0) {
        console.log(`🔄 Resetting failure count for ${this.domain} after success`);
        this.failureCount = 0;
      }
    }
  }

  /**
   * Record failed request
   */
  private onFailure(): void {
    this.lastFailureTime = Date.now();
    this.failureCount++;

    console.log(
      `❌ Circuit breaker failure for ${this.domain}: ` +
      `${this.failureCount}/${this.options.failureThreshold}`
    );

    if (this.state === CircuitState.HALF_OPEN) {
      // Single failure in HALF_OPEN reopens circuit
      this.open();
    } else if (this.failureCount >= this.options.failureThreshold) {
      this.open();
    }
  }

  /**
   * Update circuit state based on time and conditions
   */
  private updateState(): void {
    const now = Date.now();

    if (this.state === CircuitState.CLOSED) {
      // Reset failure count if enough time has passed since last failure
      if (this.failureCount > 0 &&
          now - this.lastFailureTime > this.options.resetTimeout) {
        console.log(`🔄 Auto-resetting failure count for ${this.domain}`);
        this.failureCount = 0;
      }
    } else if (this.state === CircuitState.OPEN) {
      // Try transitioning to HALF_OPEN after timeout
      if (now >= this.nextAttempt) {
        this.halfOpen();
      }
    }
  }

  /**
   * Open the circuit (block requests)
   */
  private open(): void {
    this.state = CircuitState.OPEN;
    this.nextAttempt = Date.now() + this.options.timeout;
    console.log(
      `🚫 Circuit breaker OPENED for ${this.domain}. ` +
      `Next attempt at ${new Date(this.nextAttempt).toISOString()}`
    );
  }

  /**
   * Half-open the circuit (allow test requests)
   */
  private halfOpen(): void {
    this.state = CircuitState.HALF_OPEN;
    this.successCount = 0;
    console.log(`🔶 Circuit breaker HALF_OPEN for ${this.domain}. Testing recovery...`);
  }

  /**
   * Close the circuit (resume normal operation)
   */
  private close(): void {
    this.state = CircuitState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    console.log(`✅ Circuit breaker CLOSED for ${this.domain}. Resuming normal operation.`);
  }

  /**
   * Get current state for monitoring
   */
  public getState(): {
    state: CircuitState;
    failureCount: number;
    successCount: number;
    nextAttempt: number;
  } {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      nextAttempt: this.nextAttempt
    };
  }

  /**
   * Force reset the circuit breaker (for testing/admin purposes)
   */
  public reset(): void {
    this.state = CircuitState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.nextAttempt = Date.now();
    console.log(`🔄 Circuit breaker manually reset for ${this.domain}`);
  }
}

/**
 * Global circuit breaker registry
 * Maintains circuit breakers per domain
 */
class CircuitBreakerRegistry {
  private breakers: Map<string, CircuitBreaker> = new Map();

  /**
   * Get or create circuit breaker for domain
   */
  public getBreaker(domain: string, options?: CircuitBreakerOptions): CircuitBreaker {
    if (!this.breakers.has(domain)) {
      this.breakers.set(domain, new CircuitBreaker(domain, options));
    }
    return this.breakers.get(domain)!;
  }

  /**
   * Get all circuit breaker states (for monitoring)
   */
  public getAllStates(): Map<string, ReturnType<CircuitBreaker['getState']>> {
    const states = new Map();
    for (const [domain, breaker] of this.breakers.entries()) {
      states.set(domain, breaker.getState());
    }
    return states;
  }

  /**
   * Reset a specific circuit breaker
   */
  public reset(domain: string): void {
    const breaker = this.breakers.get(domain);
    if (breaker) {
      breaker.reset();
    }
  }

  /**
   * Reset all circuit breakers
   */
  public resetAll(): void {
    for (const breaker of this.breakers.values()) {
      breaker.reset();
    }
  }
}

// Global singleton instance
export const circuitBreakerRegistry = new CircuitBreakerRegistry();
