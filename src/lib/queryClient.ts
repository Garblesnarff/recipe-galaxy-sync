import { QueryClient, QueryCache, MutationCache } from '@tanstack/react-query';
import {
  logError,
  getUserFriendlyMessage,
  shouldRetry,
  getRetryDelay,
  parseSupabaseError,
  categorizeError,
  ErrorCategory,
} from './errors';
import { toast } from 'sonner';

/**
 * Global error handler for queries
 */
function handleQueryError(error: any): void {
  const parsedError = parseSupabaseError(error);
  const userMessage = getUserFriendlyMessage(parsedError);
  const category = categorizeError(parsedError);

  // Log the error
  logError(parsedError, {
    action: 'query',
    metadata: { category },
  });

  // Show user-friendly error message
  // Don't show toasts for auth errors (handled by auth flow)
  if (category !== ErrorCategory.AUTH) {
    toast.error(userMessage, {
      duration: 5000,
      description: import.meta.env.DEV ? parsedError.message : undefined,
    });
  }
}

/**
 * Global error handler for mutations
 */
function handleMutationError(error: any, variables: any, context: any): void {
  const parsedError = parseSupabaseError(error);
  const userMessage = getUserFriendlyMessage(parsedError);
  const category = categorizeError(parsedError);

  // Log the error
  logError(parsedError, {
    action: 'mutation',
    metadata: { category, variables },
  });

  // Show user-friendly error message
  toast.error(userMessage, {
    duration: 5000,
    description: import.meta.env.DEV ? parsedError.message : undefined,
  });
}

/**
 * Custom retry function with exponential backoff
 */
function retryFunction(failureCount: number, error: any): boolean {
  return shouldRetry(error, failureCount, 3);
}

/**
 * Custom retry delay with exponential backoff
 */
function retryDelay(attemptIndex: number): number {
  return getRetryDelay(attemptIndex, 1000);
}

/**
 * Create and configure the Query Client
 */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    queryCache: new QueryCache({
      onError: handleQueryError,
    }),
    mutationCache: new MutationCache({
      onError: handleMutationError,
    }),
    defaultOptions: {
      queries: {
        // Retry configuration
        retry: retryFunction,
        retryDelay: retryDelay,

        // Timeout configuration (30 seconds)
        // Note: React Query doesn't have a built-in timeout, but we can handle it in the queryFn
        staleTime: 5 * 60 * 1000, // 5 minutes - data is considered fresh
        gcTime: 10 * 60 * 1000, // 10 minutes - cache time (formerly cacheTime)

        // Refetch configuration
        refetchOnWindowFocus: false, // Don't refetch on window focus to avoid unnecessary requests
        refetchOnMount: true, // Refetch when component mounts if data is stale
        refetchOnReconnect: true, // Refetch when network reconnects

        // Network mode
        networkMode: 'online', // Only run queries when online

        // Error handling
        throwOnError: false, // Don't throw errors, handle them globally
      },
      mutations: {
        // Retry configuration for mutations (more conservative)
        retry: (failureCount, error) => {
          // Only retry mutations for network errors, not for validation or auth errors
          const category = categorizeError(error);
          if (
            category === ErrorCategory.NETWORK ||
            category === ErrorCategory.TIMEOUT ||
            category === ErrorCategory.SERVER
          ) {
            return failureCount < 2; // Max 2 retries for mutations
          }
          return false;
        },
        retryDelay: retryDelay,

        // Network mode
        networkMode: 'online',

        // Error handling
        throwOnError: false,
      },
    },
  });
}

/**
 * Singleton query client instance
 */
let queryClientInstance: QueryClient | null = null;

export function getQueryClient(): QueryClient {
  if (!queryClientInstance) {
    queryClientInstance = createQueryClient();
  }
  return queryClientInstance;
}

/**
 * Custom query function wrapper with timeout
 */
export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number = 30000,
  timeoutError?: Error
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(timeoutError || new Error('Request timed out'));
    }, timeoutMs);

    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });
}

/**
 * Utility to check if user is online
 */
export function isOnline(): boolean {
  return typeof navigator !== 'undefined' && navigator.onLine;
}

/**
 * Utility to wait for network to be online
 */
export function waitForOnline(timeoutMs: number = 30000): Promise<void> {
  return new Promise((resolve, reject) => {
    if (isOnline()) {
      resolve();
      return;
    }

    const timer = setTimeout(() => {
      window.removeEventListener('online', onlineHandler);
      reject(new Error('Network timeout: Still offline after waiting'));
    }, timeoutMs);

    const onlineHandler = () => {
      clearTimeout(timer);
      window.removeEventListener('online', onlineHandler);
      resolve();
    };

    window.addEventListener('online', onlineHandler);
  });
}

/**
 * Prefetch helper with error handling
 */
export async function safePrefetch<T>(
  queryClient: QueryClient,
  queryKey: any[],
  queryFn: () => Promise<T>
): Promise<void> {
  try {
    await queryClient.prefetchQuery({
      queryKey,
      queryFn,
    });
  } catch (error) {
    // Silently fail prefetch errors
    logError(error, {
      action: 'prefetch',
      metadata: { queryKey },
    });
  }
}

/**
 * Invalidate queries with error handling
 */
export async function safeInvalidateQueries(
  queryClient: QueryClient,
  queryKey: any[]
): Promise<void> {
  try {
    await queryClient.invalidateQueries({ queryKey });
  } catch (error) {
    logError(error, {
      action: 'invalidate',
      metadata: { queryKey },
    });
  }
}
