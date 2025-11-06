import { describe, it, expect } from 'vitest';
import {
  NetworkError,
  AuthError,
  ValidationError,
  NotFoundError,
  ServerError,
  TimeoutError,
  RateLimitError,
  categorizeError,
  getUserFriendlyMessage,
  shouldRetry,
  getRetryDelay,
  parseSupabaseError,
  ErrorCategory,
} from '../errors';

describe('Error Classes', () => {
  it('should create NetworkError correctly', () => {
    const error = new NetworkError('Connection failed');
    expect(error.name).toBe('NetworkError');
    expect(error.message).toBe('Connection failed');
    expect(error.code).toBe('NETWORK_ERROR');
    expect(error.statusCode).toBe(0);
  });

  it('should create AuthError correctly', () => {
    const error = new AuthError('Invalid token', 401);
    expect(error.name).toBe('AuthError');
    expect(error.code).toBe('AUTH_ERROR');
    expect(error.statusCode).toBe(401);
  });

  it('should create ValidationError with field errors', () => {
    const error = new ValidationError('Validation failed', {
      email: ['Invalid email format'],
      password: ['Password too short'],
    });
    expect(error.name).toBe('ValidationError');
    expect(error.fieldErrors).toHaveProperty('email');
    expect(error.fieldErrors).toHaveProperty('password');
  });
});

describe('categorizeError', () => {
  it('should categorize NetworkError', () => {
    const error = new NetworkError();
    expect(categorizeError(error)).toBe(ErrorCategory.NETWORK);
  });

  it('should categorize AuthError', () => {
    const error = new AuthError();
    expect(categorizeError(error)).toBe(ErrorCategory.AUTH);
  });

  it('should categorize by status code', () => {
    expect(categorizeError({ statusCode: 404 })).toBe(ErrorCategory.NOT_FOUND);
    expect(categorizeError({ statusCode: 401 })).toBe(ErrorCategory.AUTH);
    expect(categorizeError({ statusCode: 429 })).toBe(ErrorCategory.RATE_LIMIT);
    expect(categorizeError({ statusCode: 500 })).toBe(ErrorCategory.SERVER);
  });

  it('should categorize by error message', () => {
    expect(categorizeError({ message: 'network error occurred' })).toBe(ErrorCategory.NETWORK);
    expect(categorizeError({ message: 'request timeout' })).toBe(ErrorCategory.TIMEOUT);
  });

  it('should categorize Supabase errors', () => {
    expect(categorizeError({ code: 'PGRST116' })).toBe(ErrorCategory.NOT_FOUND);
    expect(categorizeError({ code: '23505' })).toBe(ErrorCategory.VALIDATION);
  });

  it('should return UNKNOWN for unrecognized errors', () => {
    expect(categorizeError({})).toBe(ErrorCategory.UNKNOWN);
  });
});

describe('getUserFriendlyMessage', () => {
  it('should return friendly message for NetworkError', () => {
    const error = new NetworkError();
    const message = getUserFriendlyMessage(error);
    // NetworkError has a default message, so it should return that
    expect(message).toBe('Network connection failed');
  });

  it('should return friendly message for AuthError', () => {
    const error = new AuthError();
    const message = getUserFriendlyMessage(error);
    expect(message).toContain('Authentication failed');
  });

  it('should return friendly message for NotFoundError', () => {
    const error = new NotFoundError();
    const message = getUserFriendlyMessage(error);
    expect(message).toContain('not found');
  });

  it('should return default message for unknown errors', () => {
    const message = getUserFriendlyMessage(new Error('Random error'));
    expect(message).toContain('unexpected error');
  });
});

describe('shouldRetry', () => {
  it('should retry network errors', () => {
    const error = new NetworkError();
    expect(shouldRetry(error, 0, 3)).toBe(true);
    expect(shouldRetry(error, 1, 3)).toBe(true);
    expect(shouldRetry(error, 2, 3)).toBe(true);
    expect(shouldRetry(error, 3, 3)).toBe(false);
  });

  it('should retry timeout errors', () => {
    const error = new TimeoutError();
    expect(shouldRetry(error, 0, 3)).toBe(true);
  });

  it('should retry server errors', () => {
    const error = new ServerError();
    expect(shouldRetry(error, 0, 3)).toBe(true);
  });

  it('should not retry auth errors', () => {
    const error = new AuthError();
    expect(shouldRetry(error, 0, 3)).toBe(false);
  });

  it('should not retry validation errors', () => {
    const error = new ValidationError();
    expect(shouldRetry(error, 0, 3)).toBe(false);
  });

  it('should not retry not found errors', () => {
    const error = new NotFoundError();
    expect(shouldRetry(error, 0, 3)).toBe(false);
  });

  it('should not retry beyond max attempts', () => {
    const error = new NetworkError();
    expect(shouldRetry(error, 5, 3)).toBe(false);
  });

  it('should retry based on status codes', () => {
    expect(shouldRetry({ statusCode: 503 }, 0, 3)).toBe(true);
    expect(shouldRetry({ statusCode: 500 }, 0, 3)).toBe(true);
    expect(shouldRetry({ statusCode: 429 }, 0, 3)).toBe(true);
    expect(shouldRetry({ statusCode: 404 }, 0, 3)).toBe(false);
  });
});

describe('getRetryDelay', () => {
  it('should calculate exponential backoff', () => {
    const baseDelay = 1000;

    // First attempt: ~1000ms
    const delay1 = getRetryDelay(0, baseDelay);
    expect(delay1).toBeGreaterThanOrEqual(1000);
    expect(delay1).toBeLessThanOrEqual(1300); // 1000 + 30% jitter

    // Second attempt: ~2000ms
    const delay2 = getRetryDelay(1, baseDelay);
    expect(delay2).toBeGreaterThanOrEqual(2000);
    expect(delay2).toBeLessThanOrEqual(2600);

    // Third attempt: ~4000ms
    const delay3 = getRetryDelay(2, baseDelay);
    expect(delay3).toBeGreaterThanOrEqual(4000);
    expect(delay3).toBeLessThanOrEqual(5200);
  });

  it('should cap at 30 seconds', () => {
    // Very high attempt number should still cap at 30000ms
    const delay = getRetryDelay(10, 1000);
    expect(delay).toBeLessThanOrEqual(30000);
  });
});

describe('parseSupabaseError', () => {
  it('should parse null/undefined to ServerError', () => {
    const error = parseSupabaseError(null);
    expect(error).toBeInstanceOf(ServerError);
  });

  it('should parse network errors', () => {
    const error = parseSupabaseError({ message: 'fetch failed' });
    expect(error).toBeInstanceOf(NetworkError);
  });

  it('should parse unique constraint violations', () => {
    const error = parseSupabaseError({ code: '23505' });
    expect(error).toBeInstanceOf(ValidationError);
  });

  it('should parse not found errors', () => {
    const error = parseSupabaseError({ code: 'PGRST116' });
    expect(error).toBeInstanceOf(NotFoundError);
  });

  it('should parse auth errors', () => {
    const error = parseSupabaseError({ statusCode: 401 });
    expect(error).toBeInstanceOf(AuthError);
  });

  it('should parse permission errors', () => {
    const error = parseSupabaseError({ statusCode: 403 });
    expect(error).toBeInstanceOf(Error); // PermissionError extends AppError
  });

  it('should parse timeout errors', () => {
    const error = parseSupabaseError({ statusCode: 408 });
    expect(error).toBeInstanceOf(TimeoutError);
  });

  it('should parse rate limit errors', () => {
    const error = parseSupabaseError({ statusCode: 429 });
    expect(error).toBeInstanceOf(RateLimitError);
  });

  it('should parse server errors', () => {
    const error = parseSupabaseError({ statusCode: 500, message: 'Server error' });
    expect(error).toBeInstanceOf(ServerError);
    expect(error.statusCode).toBe(500);
  });
});

describe('Error Context and Metadata', () => {
  it('should store context in errors', () => {
    const context = { userId: '123', action: 'save' };
    const error = new NetworkError('Connection failed', context);
    expect(error.context).toEqual(context);
  });

  it('should capture stack trace', () => {
    const error = new NetworkError();
    expect(error.stack).toBeDefined();
  });
});
