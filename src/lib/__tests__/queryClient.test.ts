import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { QueryClient } from '@tanstack/react-query';
import {
  createQueryClient,
  getQueryClient,
  withTimeout,
  isOnline,
  waitForOnline,
  safePrefetch,
  safeInvalidateQueries,
} from '../queryClient';
import { NetworkError, TimeoutError } from '../errors';

describe('createQueryClient', () => {
  it('should create a QueryClient instance', () => {
    const queryClient = createQueryClient();
    expect(queryClient).toBeInstanceOf(QueryClient);
  });

  it('should configure retry logic', () => {
    const queryClient = createQueryClient();
    const defaultOptions = queryClient.getDefaultOptions();

    expect(defaultOptions.queries?.retry).toBeDefined();
    expect(defaultOptions.queries?.retryDelay).toBeDefined();
  });

  it('should configure staleTime to 5 minutes', () => {
    const queryClient = createQueryClient();
    const defaultOptions = queryClient.getDefaultOptions();

    expect(defaultOptions.queries?.staleTime).toBe(5 * 60 * 1000);
  });

  it('should configure gcTime (cacheTime) to 10 minutes', () => {
    const queryClient = createQueryClient();
    const defaultOptions = queryClient.getDefaultOptions();

    expect(defaultOptions.queries?.gcTime).toBe(10 * 60 * 1000);
  });

  it('should configure networkMode to online', () => {
    const queryClient = createQueryClient();
    const defaultOptions = queryClient.getDefaultOptions();

    expect(defaultOptions.queries?.networkMode).toBe('online');
    expect(defaultOptions.mutations?.networkMode).toBe('online');
  });

  it('should not refetch on window focus', () => {
    const queryClient = createQueryClient();
    const defaultOptions = queryClient.getDefaultOptions();

    expect(defaultOptions.queries?.refetchOnWindowFocus).toBe(false);
  });

  it('should refetch on mount when data is stale', () => {
    const queryClient = createQueryClient();
    const defaultOptions = queryClient.getDefaultOptions();

    expect(defaultOptions.queries?.refetchOnMount).toBe(true);
  });

  it('should refetch on reconnect', () => {
    const queryClient = createQueryClient();
    const defaultOptions = queryClient.getDefaultOptions();

    expect(defaultOptions.queries?.refetchOnReconnect).toBe(true);
  });
});

describe('getQueryClient', () => {
  it('should return a singleton instance', () => {
    const client1 = getQueryClient();
    const client2 = getQueryClient();

    expect(client1).toBe(client2);
  });

  it('should return a QueryClient instance', () => {
    const queryClient = getQueryClient();
    expect(queryClient).toBeInstanceOf(QueryClient);
  });
});

describe('withTimeout', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should resolve when promise resolves before timeout', async () => {
    const promise = Promise.resolve('success');
    const result = withTimeout(promise, 1000);

    await expect(result).resolves.toBe('success');
  });

  it('should reject with timeout error when promise takes too long', async () => {
    const promise = new Promise((resolve) => {
      setTimeout(() => resolve('late'), 2000);
    });

    const timeoutPromise = withTimeout(promise, 1000);

    // Fast-forward time
    vi.advanceTimersByTime(1000);

    await expect(timeoutPromise).rejects.toThrow('Request timed out');
  });

  it('should use custom timeout error message', async () => {
    const promise = new Promise((resolve) => {
      setTimeout(() => resolve('late'), 2000);
    });

    const customError = new Error('Custom timeout message');
    const timeoutPromise = withTimeout(promise, 1000, customError);

    // Fast-forward time
    vi.advanceTimersByTime(1000);

    await expect(timeoutPromise).rejects.toThrow('Custom timeout message');
  });

  it('should reject when promise rejects', async () => {
    const error = new Error('Promise error');
    const promise = Promise.reject(error);

    await expect(withTimeout(promise, 1000)).rejects.toThrow('Promise error');
  });

  it('should clear timeout when promise resolves', async () => {
    const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');
    const promise = Promise.resolve('success');

    await withTimeout(promise, 1000);

    expect(clearTimeoutSpy).toHaveBeenCalled();
  });

  it('should clear timeout when promise rejects', async () => {
    const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');
    const promise = Promise.reject(new Error('error'));

    try {
      await withTimeout(promise, 1000);
    } catch (e) {
      // Expected to throw
    }

    expect(clearTimeoutSpy).toHaveBeenCalled();
  });
});

describe('isOnline', () => {
  it('should return true when navigator.onLine is true', () => {
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true,
    });

    expect(isOnline()).toBe(true);
  });

  it('should return false when navigator.onLine is false', () => {
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: false,
    });

    expect(isOnline()).toBe(false);
  });
});

describe('waitForOnline', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should resolve immediately if already online', async () => {
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true,
    });

    await expect(waitForOnline(1000)).resolves.toBeUndefined();
  });

  it('should wait for online event', async () => {
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: false,
    });

    const waitPromise = waitForOnline(5000);

    // Simulate going online
    setTimeout(() => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true,
      });
      window.dispatchEvent(new Event('online'));
    }, 1000);

    vi.advanceTimersByTime(1000);

    await expect(waitPromise).resolves.toBeUndefined();
  });

  it('should reject after timeout', async () => {
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: false,
    });

    const waitPromise = waitForOnline(1000);

    vi.advanceTimersByTime(1000);

    await expect(waitPromise).rejects.toThrow('Network timeout');
  });
});

describe('safePrefetch', () => {
  it('should prefetch successfully', async () => {
    const queryClient = new QueryClient();
    const prefetchSpy = vi.spyOn(queryClient, 'prefetchQuery');

    const queryFn = vi.fn().mockResolvedValue('data');
    await safePrefetch(queryClient, ['test'], queryFn);

    expect(prefetchSpy).toHaveBeenCalledWith({
      queryKey: ['test'],
      queryFn,
    });
  });

  it('should handle prefetch errors silently', async () => {
    const queryClient = new QueryClient();
    const queryFn = vi.fn().mockRejectedValue(new Error('Prefetch error'));

    // Should not throw
    await expect(safePrefetch(queryClient, ['test'], queryFn)).resolves.toBeUndefined();
  });

  it('should log errors on prefetch failure', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const queryClient = new QueryClient();
    const queryFn = vi.fn().mockRejectedValue(new Error('Prefetch error'));

    await safePrefetch(queryClient, ['test'], queryFn);

    // Error should be logged
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });
});

describe('safeInvalidateQueries', () => {
  it('should invalidate queries successfully', async () => {
    const queryClient = new QueryClient();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    await safeInvalidateQueries(queryClient, ['test']);

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['test'] });
  });

  it('should handle invalidation errors silently', async () => {
    const queryClient = new QueryClient();
    const invalidateSpy = vi
      .spyOn(queryClient, 'invalidateQueries')
      .mockRejectedValue(new Error('Invalidation error'));

    // Should not throw
    await expect(safeInvalidateQueries(queryClient, ['test'])).resolves.toBeUndefined();
  });

  it('should log errors on invalidation failure', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const queryClient = new QueryClient();

    vi.spyOn(queryClient, 'invalidateQueries').mockRejectedValue(
      new Error('Invalidation error')
    );

    await safeInvalidateQueries(queryClient, ['test']);

    // Error should be logged
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });
});

describe('Retry Logic', () => {
  it('should retry network errors up to 3 times', () => {
    const queryClient = createQueryClient();
    const retryFn = queryClient.getDefaultOptions().queries?.retry;

    if (typeof retryFn === 'function') {
      const networkError = new NetworkError();

      expect(retryFn(0, networkError)).toBe(true); // First retry
      expect(retryFn(1, networkError)).toBe(true); // Second retry
      expect(retryFn(2, networkError)).toBe(true); // Third retry
      expect(retryFn(3, networkError)).toBe(false); // No more retries
    }
  });

  it('should not retry validation errors', () => {
    const queryClient = createQueryClient();
    const retryFn = queryClient.getDefaultOptions().queries?.retry;

    if (typeof retryFn === 'function') {
      const validationError = { statusCode: 422 };

      expect(retryFn(0, validationError)).toBe(false);
    }
  });

  it('should calculate exponential backoff delay', () => {
    const queryClient = createQueryClient();
    const retryDelayFn = queryClient.getDefaultOptions().queries?.retryDelay;

    if (typeof retryDelayFn === 'function') {
      const delay1 = retryDelayFn(0);
      const delay2 = retryDelayFn(1);
      const delay3 = retryDelayFn(2);

      // Delays should increase exponentially
      expect(delay2).toBeGreaterThan(delay1);
      expect(delay3).toBeGreaterThan(delay2);

      // Should have jitter (randomness)
      expect(delay1).toBeGreaterThanOrEqual(1000);
      expect(delay1).toBeLessThanOrEqual(1300); // Base + 30% jitter
    }
  });
});
