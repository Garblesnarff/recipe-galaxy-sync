/**
 * Custom Error Classes for Application-wide Error Handling
 */

// Base application error
export class AppError extends Error {
  constructor(
    message: string,
    public code?: string,
    public statusCode?: number,
    public context?: Record<string, any>
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Network-related errors
export class NetworkError extends AppError {
  constructor(message: string = 'Network connection failed', context?: Record<string, any>) {
    super(message, 'NETWORK_ERROR', 0, context);
  }
}

// Authentication errors
export class AuthError extends AppError {
  constructor(message: string = 'Authentication failed', statusCode: number = 401, context?: Record<string, any>) {
    super(message, 'AUTH_ERROR', statusCode, context);
  }
}

// Authorization errors
export class PermissionError extends AppError {
  constructor(message: string = 'You do not have permission to perform this action', context?: Record<string, any>) {
    super(message, 'PERMISSION_ERROR', 403, context);
  }
}

// Validation errors
export class ValidationError extends AppError {
  constructor(
    message: string = 'Validation failed',
    public fieldErrors?: Record<string, string[]>,
    context?: Record<string, any>
  ) {
    super(message, 'VALIDATION_ERROR', 422, context);
  }
}

// Not found errors
export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found', context?: Record<string, any>) {
    super(message, 'NOT_FOUND', 404, context);
  }
}

// Server errors
export class ServerError extends AppError {
  constructor(message: string = 'Internal server error', statusCode: number = 500, context?: Record<string, any>) {
    super(message, 'SERVER_ERROR', statusCode, context);
  }
}

// Timeout errors
export class TimeoutError extends AppError {
  constructor(message: string = 'Request timed out', context?: Record<string, any>) {
    super(message, 'TIMEOUT_ERROR', 408, context);
  }
}

// Rate limit errors
export class RateLimitError extends AppError {
  constructor(message: string = 'Too many requests. Please try again later.', context?: Record<string, any>) {
    super(message, 'RATE_LIMIT_ERROR', 429, context);
  }
}

// Database errors
export class DatabaseError extends AppError {
  constructor(message: string = 'Database operation failed', context?: Record<string, any>) {
    super(message, 'DATABASE_ERROR', 500, context);
  }
}

// File upload errors
export class FileUploadError extends AppError {
  constructor(message: string = 'File upload failed', context?: Record<string, any>) {
    super(message, 'FILE_UPLOAD_ERROR', 400, context);
  }
}

/**
 * Error categorization
 */
export enum ErrorCategory {
  NETWORK = 'network',
  AUTH = 'auth',
  VALIDATION = 'validation',
  NOT_FOUND = 'not_found',
  SERVER = 'server',
  TIMEOUT = 'timeout',
  RATE_LIMIT = 'rate_limit',
  DATABASE = 'database',
  FILE_UPLOAD = 'file_upload',
  UNKNOWN = 'unknown',
}

/**
 * Categorize an error based on its type and properties
 */
export function categorizeError(error: any): ErrorCategory {
  if (error instanceof NetworkError) return ErrorCategory.NETWORK;
  if (error instanceof AuthError) return ErrorCategory.AUTH;
  if (error instanceof ValidationError) return ErrorCategory.VALIDATION;
  if (error instanceof NotFoundError) return ErrorCategory.NOT_FOUND;
  if (error instanceof TimeoutError) return ErrorCategory.TIMEOUT;
  if (error instanceof RateLimitError) return ErrorCategory.RATE_LIMIT;
  if (error instanceof DatabaseError) return ErrorCategory.DATABASE;
  if (error instanceof FileUploadError) return ErrorCategory.FILE_UPLOAD;
  if (error instanceof ServerError) return ErrorCategory.SERVER;

  // Check for Supabase/PostgreSQL errors
  if (error?.code) {
    const code = error.code;
    if (code === 'PGRST116' || code === 'PGRST301') return ErrorCategory.NOT_FOUND;
    if (code === '23505') return ErrorCategory.VALIDATION; // Unique constraint violation
    if (code === '23503') return ErrorCategory.VALIDATION; // Foreign key violation
    if (code.startsWith('22')) return ErrorCategory.VALIDATION; // Data exception
    if (code.startsWith('42')) return ErrorCategory.VALIDATION; // Syntax/access errors
  }

  // Check for HTTP status codes
  if (error?.statusCode || error?.status) {
    const status = error.statusCode || error.status;
    if (status === 401 || status === 403) return ErrorCategory.AUTH;
    if (status === 404) return ErrorCategory.NOT_FOUND;
    if (status === 408) return ErrorCategory.TIMEOUT;
    if (status === 422) return ErrorCategory.VALIDATION;
    if (status === 429) return ErrorCategory.RATE_LIMIT;
    if (status >= 500) return ErrorCategory.SERVER;
  }

  // Check for network errors
  if (error?.message) {
    const msg = error.message.toLowerCase();
    if (msg.includes('network') || msg.includes('fetch') || msg.includes('connection')) {
      return ErrorCategory.NETWORK;
    }
    if (msg.includes('timeout')) return ErrorCategory.TIMEOUT;
  }

  return ErrorCategory.UNKNOWN;
}

/**
 * User-friendly error message mapping
 */
export const ERROR_MESSAGES: Record<string, string> = {
  // Network errors
  NETWORK_ERROR: 'Connection lost. Please check your internet connection.',
  FETCH_FAILED: 'Unable to connect. Please try again.',
  CONNECTION_REFUSED: 'Cannot reach the server. Please try again later.',

  // Authentication errors
  AUTH_ERROR: 'Authentication failed. Please sign in again.',
  INVALID_CREDENTIALS: 'Invalid email or password.',
  SESSION_EXPIRED: 'Your session has expired. Please sign in again.',
  UNAUTHORIZED: 'You need to be signed in to access this.',

  // Permission errors
  PERMISSION_ERROR: 'You do not have permission to perform this action.',
  FORBIDDEN: 'Access denied.',

  // Validation errors
  VALIDATION_ERROR: 'Please check your input and try again.',
  INVALID_EMAIL: 'Please enter a valid email address.',
  REQUIRED_FIELD: 'This field is required.',
  DUPLICATE_ENTRY: 'This entry already exists.',

  // Not found errors
  NOT_FOUND: 'The requested item could not be found.',
  RECIPE_NOT_FOUND: 'Recipe not found.',
  COLLECTION_NOT_FOUND: 'Collection not found.',

  // Server errors
  SERVER_ERROR: 'Something went wrong on our end. Please try again.',
  INTERNAL_ERROR: 'An unexpected error occurred.',
  SERVICE_UNAVAILABLE: 'Service temporarily unavailable. Please try again later.',

  // Timeout errors
  TIMEOUT_ERROR: 'Request took too long. Trying again...',
  REQUEST_TIMEOUT: 'The request timed out. Please try again.',

  // Rate limit errors
  RATE_LIMIT_ERROR: 'Too many requests. Please wait a moment and try again.',

  // Database errors
  DATABASE_ERROR: 'Database operation failed. Please try again.',
  QUERY_FAILED: 'Failed to retrieve data. Please try again.',

  // File upload errors
  FILE_UPLOAD_ERROR: 'File upload failed. Please try again.',
  FILE_TOO_LARGE: 'File is too large. Please choose a smaller file.',
  INVALID_FILE_TYPE: 'Invalid file type. Please choose a different file.',

  // Default
  UNKNOWN_ERROR: 'An unexpected error occurred. Please try again.',
};

/**
 * Convert technical error to user-friendly message
 */
export function getUserFriendlyMessage(error: any): string {
  // If it's already an AppError with a message, use it
  if (error instanceof AppError && error.message) {
    return error.message;
  }

  // Try to get message from error code
  if (error?.code && ERROR_MESSAGES[error.code]) {
    return ERROR_MESSAGES[error.code];
  }

  // Map based on category
  const category = categorizeError(error);
  switch (category) {
    case ErrorCategory.NETWORK:
      return ERROR_MESSAGES.NETWORK_ERROR;
    case ErrorCategory.AUTH:
      return ERROR_MESSAGES.AUTH_ERROR;
    case ErrorCategory.VALIDATION:
      return ERROR_MESSAGES.VALIDATION_ERROR;
    case ErrorCategory.NOT_FOUND:
      return ERROR_MESSAGES.NOT_FOUND;
    case ErrorCategory.TIMEOUT:
      return ERROR_MESSAGES.TIMEOUT_ERROR;
    case ErrorCategory.RATE_LIMIT:
      return ERROR_MESSAGES.RATE_LIMIT_ERROR;
    case ErrorCategory.DATABASE:
      return ERROR_MESSAGES.DATABASE_ERROR;
    case ErrorCategory.FILE_UPLOAD:
      return ERROR_MESSAGES.FILE_UPLOAD_ERROR;
    case ErrorCategory.SERVER:
      return ERROR_MESSAGES.SERVER_ERROR;
    default:
      return ERROR_MESSAGES.UNKNOWN_ERROR;
  }
}

/**
 * Error logging utility
 */
export interface ErrorLogContext {
  component?: string;
  action?: string;
  userId?: string;
  metadata?: Record<string, any>;
}

export function logError(error: any, context?: ErrorLogContext): void {
  const isDev = import.meta.env.DEV;
  const category = categorizeError(error);

  const logData = {
    timestamp: new Date().toISOString(),
    category,
    message: error?.message || 'Unknown error',
    code: error?.code,
    statusCode: error?.statusCode || error?.status,
    stack: error?.stack,
    context,
  };

  if (isDev) {
    // In development, log detailed error information
    console.group(`🔴 Error: ${category.toUpperCase()}`);
    console.error('Message:', logData.message);
    console.error('Category:', logData.category);
    if (logData.code) console.error('Code:', logData.code);
    if (logData.statusCode) console.error('Status:', logData.statusCode);
    if (context) console.error('Context:', context);
    if (error?.stack) console.error('Stack:', error.stack);
    console.groupEnd();
  } else {
    // In production, send to monitoring service
    // TODO: Integrate with monitoring service (e.g., Sentry, LogRocket)
    console.error('Error:', logData.message);

    // Example: Send to monitoring service
    // if (window.Sentry) {
    //   window.Sentry.captureException(error, {
    //     tags: { category },
    //     extra: context,
    //   });
    // }
  }
}

/**
 * Check if an error should be retried
 */
export function shouldRetry(error: any, attemptNumber: number, maxRetries: number = 3): boolean {
  if (attemptNumber >= maxRetries) return false;

  const category = categorizeError(error);

  // Retry network errors, timeouts, and server errors
  if (
    category === ErrorCategory.NETWORK ||
    category === ErrorCategory.TIMEOUT ||
    category === ErrorCategory.SERVER
  ) {
    return true;
  }

  // Check for specific HTTP status codes that should be retried
  const status = error?.statusCode || error?.status;
  if (status === 408 || status === 429 || status === 503 || status >= 500) {
    return true;
  }

  return false;
}

/**
 * Calculate exponential backoff delay
 */
export function getRetryDelay(attemptNumber: number, baseDelay: number = 1000): number {
  // Exponential backoff: baseDelay * 2^attemptNumber with jitter
  const exponentialDelay = baseDelay * Math.pow(2, attemptNumber);
  const jitter = Math.random() * 0.3 * exponentialDelay; // Add up to 30% jitter
  return Math.min(exponentialDelay + jitter, 30000); // Max 30 seconds
}

/**
 * Parse Supabase error to AppError
 */
export function parseSupabaseError(error: any): AppError {
  if (!error) return new ServerError('An unknown error occurred');

  // Network/connection errors
  if (error.message?.includes('fetch') || error.message?.includes('network')) {
    return new NetworkError('Unable to connect to the server');
  }

  // PostgreSQL errors
  if (error.code) {
    const code = error.code;

    // Unique constraint violation
    if (code === '23505') {
      return new ValidationError('This entry already exists', undefined, { postgresCode: code });
    }

    // Foreign key violation
    if (code === '23503') {
      return new ValidationError('Referenced item does not exist', undefined, { postgresCode: code });
    }

    // Not found
    if (code === 'PGRST116' || code === 'PGRST301') {
      return new NotFoundError('Item not found', { postgresCode: code });
    }
  }

  // HTTP status codes
  const status = error.statusCode || error.status;
  if (status) {
    if (status === 401) return new AuthError('Authentication required');
    if (status === 403) return new PermissionError('Access forbidden');
    if (status === 404) return new NotFoundError('Item not found');
    if (status === 408) return new TimeoutError('Request timed out');
    if (status === 422) return new ValidationError(error.message || 'Validation failed');
    if (status === 429) return new RateLimitError('Too many requests');
    if (status >= 500) return new ServerError(error.message || 'Server error', status);
  }

  // Default to server error
  return new ServerError(error.message || 'An error occurred');
}
