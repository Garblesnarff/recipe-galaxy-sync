/**
 * Enhanced Error Handling and Recovery
 * Categorizes errors and determines appropriate recovery strategies
 */

export enum ErrorCategory {
  NETWORK = 'NETWORK',                   // Network connectivity issues
  TIMEOUT = 'TIMEOUT',                   // Request timeout
  RATE_LIMIT = 'RATE_LIMIT',            // Rate limiting by server
  BLOCKED = 'BLOCKED',                   // Bot detection / blocking
  NOT_FOUND = 'NOT_FOUND',              // 404 errors
  SERVER_ERROR = 'SERVER_ERROR',         // 5xx errors
  INVALID_RESPONSE = 'INVALID_RESPONSE', // Invalid/unexpected response
  PARSE_ERROR = 'PARSE_ERROR',          // Failed to parse content
  VALIDATION_ERROR = 'VALIDATION_ERROR', // Data validation failed
  UNKNOWN = 'UNKNOWN'                    // Unknown error type
}

export enum RecoveryStrategy {
  RETRY = 'RETRY',                       // Retry with same method
  RETRY_WITH_DELAY = 'RETRY_WITH_DELAY', // Retry after delay
  FALLBACK = 'FALLBACK',                 // Try alternative method
  FAIL = 'FAIL',                         // Give up
  CIRCUIT_BREAK = 'CIRCUIT_BREAK'        // Activate circuit breaker
}

export interface CategorizedError {
  category: ErrorCategory;
  originalError: Error;
  message: string;
  isRetryable: boolean;
  recoveryStrategy: RecoveryStrategy;
  suggestedDelay?: number;
  context?: Record<string, any>;
}

/**
 * Categorize an error and determine recovery strategy
 */
export function categorizeError(
  error: any,
  context: { url?: string; domain?: string; attempt?: number } = {}
): CategorizedError {
  const errorMessage = error.message || String(error);
  const errorMessageLower = errorMessage.toLowerCase();

  // Network errors
  if (
    errorMessageLower.includes('network') ||
    errorMessageLower.includes('fetch failed') ||
    errorMessageLower.includes('connection') ||
    error.name === 'NetworkError'
  ) {
    return {
      category: ErrorCategory.NETWORK,
      originalError: error,
      message: 'Network connectivity issue',
      isRetryable: true,
      recoveryStrategy: RecoveryStrategy.RETRY_WITH_DELAY,
      suggestedDelay: 2000,
      context
    };
  }

  // Timeout errors
  if (
    errorMessageLower.includes('timeout') ||
    error.name === 'AbortError' ||
    error.name === 'TimeoutError'
  ) {
    return {
      category: ErrorCategory.TIMEOUT,
      originalError: error,
      message: 'Request timed out',
      isRetryable: true,
      recoveryStrategy: context.attempt && context.attempt > 2
        ? RecoveryStrategy.FALLBACK
        : RecoveryStrategy.RETRY_WITH_DELAY,
      suggestedDelay: 3000,
      context
    };
  }

  // Rate limiting
  if (
    errorMessageLower.includes('rate limit') ||
    errorMessageLower.includes('too many requests') ||
    errorMessageLower.includes('429')
  ) {
    return {
      category: ErrorCategory.RATE_LIMIT,
      originalError: error,
      message: 'Rate limited by server',
      isRetryable: true,
      recoveryStrategy: RecoveryStrategy.RETRY_WITH_DELAY,
      suggestedDelay: 10000, // Wait longer for rate limits
      context
    };
  }

  // Bot detection / blocking
  if (
    errorMessageLower.includes('blocked') ||
    errorMessageLower.includes('captcha') ||
    errorMessageLower.includes('cloudflare') ||
    errorMessageLower.includes('access denied') ||
    errorMessageLower.includes('forbidden') ||
    errorMessageLower.includes('403')
  ) {
    return {
      category: ErrorCategory.BLOCKED,
      originalError: error,
      message: 'Request blocked by anti-bot measures',
      isRetryable: false,
      recoveryStrategy: RecoveryStrategy.FALLBACK,
      context
    };
  }

  // Not found errors
  if (
    errorMessageLower.includes('not found') ||
    errorMessageLower.includes('404')
  ) {
    return {
      category: ErrorCategory.NOT_FOUND,
      originalError: error,
      message: 'Resource not found (404)',
      isRetryable: false,
      recoveryStrategy: RecoveryStrategy.FAIL,
      context
    };
  }

  // Server errors
  if (
    errorMessageLower.includes('500') ||
    errorMessageLower.includes('502') ||
    errorMessageLower.includes('503') ||
    errorMessageLower.includes('504') ||
    errorMessageLower.includes('internal server error') ||
    errorMessageLower.includes('bad gateway') ||
    errorMessageLower.includes('service unavailable')
  ) {
    return {
      category: ErrorCategory.SERVER_ERROR,
      originalError: error,
      message: 'Server error (5xx)',
      isRetryable: true,
      recoveryStrategy: RecoveryStrategy.RETRY_WITH_DELAY,
      suggestedDelay: 5000,
      context
    };
  }

  // Invalid response
  if (
    errorMessageLower.includes('invalid') ||
    errorMessageLower.includes('unexpected') ||
    errorMessageLower.includes('malformed')
  ) {
    return {
      category: ErrorCategory.INVALID_RESPONSE,
      originalError: error,
      message: 'Invalid or unexpected response',
      isRetryable: true,
      recoveryStrategy: RecoveryStrategy.FALLBACK,
      context
    };
  }

  // Parse errors
  if (
    errorMessageLower.includes('parse') ||
    errorMessageLower.includes('json') ||
    errorMessageLower.includes('syntax')
  ) {
    return {
      category: ErrorCategory.PARSE_ERROR,
      originalError: error,
      message: 'Failed to parse response',
      isRetryable: false,
      recoveryStrategy: RecoveryStrategy.FALLBACK,
      context
    };
  }

  // Validation errors
  if (
    errorMessageLower.includes('validation') ||
    errorMessageLower.includes('missing') ||
    errorMessageLower.includes('empty')
  ) {
    return {
      category: ErrorCategory.VALIDATION_ERROR,
      originalError: error,
      message: 'Data validation failed',
      isRetryable: false,
      recoveryStrategy: RecoveryStrategy.FALLBACK,
      context
    };
  }

  // Unknown errors
  return {
    category: ErrorCategory.UNKNOWN,
    originalError: error,
    message: errorMessage || 'Unknown error occurred',
    isRetryable: true,
    recoveryStrategy: RecoveryStrategy.RETRY,
    suggestedDelay: 1000,
    context
  };
}

/**
 * Enhanced retry logic with exponential backoff and jitter
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: {
    maxAttempts?: number;
    baseDelay?: number;
    maxDelay?: number;
    onRetry?: (attempt: number, error: CategorizedError) => void;
    context?: Record<string, any>;
  } = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    baseDelay = 1000,
    maxDelay = 30000,
    onRetry,
    context = {}
  } = options;

  let lastError: CategorizedError | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      const categorized = categorizeError(error, { ...context, attempt });
      lastError = categorized;

      console.log(
        `❌ Attempt ${attempt}/${maxAttempts} failed:`,
        `[${categorized.category}] ${categorized.message}`
      );

      // Check if we should retry
      if (attempt === maxAttempts) {
        console.log('🛑 Max attempts reached, giving up');
        throw categorized;
      }

      if (!categorized.isRetryable) {
        console.log('🛑 Error not retryable, giving up');
        throw categorized;
      }

      if (categorized.recoveryStrategy === RecoveryStrategy.FAIL) {
        console.log('🛑 Recovery strategy is FAIL, giving up');
        throw categorized;
      }

      // Calculate delay
      const exponentialDelay = Math.min(
        baseDelay * Math.pow(2, attempt - 1),
        maxDelay
      );
      const delay = categorized.suggestedDelay || exponentialDelay;
      const jitter = Math.random() * 1000;
      const totalDelay = delay + jitter;

      console.log(`⏳ Waiting ${Math.round(totalDelay)}ms before retry...`);

      // Call retry callback if provided
      if (onRetry) {
        onRetry(attempt, categorized);
      }

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, totalDelay));
    }
  }

  // Should not reach here, but TypeScript needs it
  throw lastError || new Error('Retry failed');
}

/**
 * Error recovery coordinator
 * Manages fallback chains and recovery strategies
 */
export class ErrorRecoveryCoordinator {
  private failureHistory: Map<string, CategorizedError[]> = new Map();

  /**
   * Record an error for a domain
   */
  recordError(domain: string, error: CategorizedError): void {
    if (!this.failureHistory.has(domain)) {
      this.failureHistory.set(domain, []);
    }

    const history = this.failureHistory.get(domain)!;
    history.push(error);

    // Keep only last 20 errors per domain
    if (history.length > 20) {
      history.shift();
    }
  }

  /**
   * Get error statistics for a domain
   */
  getErrorStats(domain: string): {
    totalErrors: number;
    errorsByCategory: Record<string, number>;
    recentErrors: CategorizedError[];
    shouldCircuitBreak: boolean;
  } {
    const history = this.failureHistory.get(domain) || [];
    const errorsByCategory: Record<string, number> = {};

    for (const error of history) {
      errorsByCategory[error.category] = (errorsByCategory[error.category] || 0) + 1;
    }

    // Check if we should circuit break
    const recentErrors = history.slice(-5);
    const shouldCircuitBreak = recentErrors.length >= 5 &&
      recentErrors.every(e => e.category === ErrorCategory.BLOCKED);

    return {
      totalErrors: history.length,
      errorsByCategory,
      recentErrors: history.slice(-5),
      shouldCircuitBreak
    };
  }

  /**
   * Clear error history for a domain
   */
  clearHistory(domain: string): void {
    this.failureHistory.delete(domain);
    console.log(`🗑️ Cleared error history for ${domain}`);
  }

  /**
   * Get all domains with errors
   */
  getDomainsWithErrors(): string[] {
    return Array.from(this.failureHistory.keys());
  }
}

// Global singleton
export const errorRecoveryCoordinator = new ErrorRecoveryCoordinator();

/**
 * Create a user-friendly error message
 */
export function formatUserErrorMessage(error: CategorizedError): string {
  const messages: Record<ErrorCategory, string> = {
    [ErrorCategory.NETWORK]: 'Network connection issue. Please check your internet connection and try again.',
    [ErrorCategory.TIMEOUT]: 'Request timed out. The website may be slow or unresponsive. Try again later.',
    [ErrorCategory.RATE_LIMIT]: 'Too many requests. Please wait a moment before trying again.',
    [ErrorCategory.BLOCKED]: 'Access blocked by the website. This site may have anti-bot protection. Try using the Firecrawl method or import manually.',
    [ErrorCategory.NOT_FOUND]: 'Recipe not found. Please check the URL and try again.',
    [ErrorCategory.SERVER_ERROR]: 'The recipe website is experiencing issues. Please try again later.',
    [ErrorCategory.INVALID_RESPONSE]: 'Received invalid response from website. The site may have changed its structure.',
    [ErrorCategory.PARSE_ERROR]: 'Failed to parse recipe data. The website structure may not be supported.',
    [ErrorCategory.VALIDATION_ERROR]: 'The extracted recipe data is incomplete or invalid. Try a different source or import manually.',
    [ErrorCategory.UNKNOWN]: 'An unexpected error occurred. Please try again or use a different import method.'
  };

  return messages[error.category] || error.message;
}
