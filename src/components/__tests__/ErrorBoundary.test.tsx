import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ErrorBoundary, ErrorFallback } from '../ErrorBoundary';
import {
  NetworkError,
  AuthError,
  NotFoundError,
  TimeoutError,
  ServerError,
} from '@/lib/errors';

// Component that throws an error
const ThrowError = ({ error }: { error: Error }) => {
  throw error;
};

// Component that works normally
const WorkingComponent = () => <div>Working component</div>;

describe('ErrorBoundary', () => {
  // Suppress console errors during tests
  const originalError = console.error;
  beforeEach(() => {
    console.error = vi.fn();
  });

  afterEach(() => {
    console.error = originalError;
  });

  it('should render children when there is no error', () => {
    render(
      <ErrorBoundary>
        <WorkingComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText('Working component')).toBeInTheDocument();
  });

  it('should catch and display error', () => {
    const error = new Error('Test error');

    render(
      <ErrorBoundary>
        <ThrowError error={error} />
      </ErrorBoundary>
    );

    expect(screen.getByText(/Something Went Wrong/i)).toBeInTheDocument();
    expect(screen.getByText(/unexpected error/i)).toBeInTheDocument();
  });

  it('should display network error with appropriate title', () => {
    const error = new NetworkError('Network connection failed');

    render(
      <ErrorBoundary>
        <ThrowError error={error} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Connection Problem')).toBeInTheDocument();
    expect(screen.getByText(/Connection lost/i)).toBeInTheDocument();
  });

  it('should display authentication error', () => {
    const error = new AuthError('Authentication failed');

    render(
      <ErrorBoundary>
        <ThrowError error={error} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Authentication Error')).toBeInTheDocument();
  });

  it('should display not found error', () => {
    const error = new NotFoundError('Resource not found');

    render(
      <ErrorBoundary>
        <ThrowError error={error} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Not Found')).toBeInTheDocument();
  });

  it('should display timeout error', () => {
    const error = new TimeoutError('Request timed out');

    render(
      <ErrorBoundary>
        <ThrowError error={error} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Request Timeout')).toBeInTheDocument();
  });

  it('should display server error', () => {
    const error = new ServerError('Server error');

    render(
      <ErrorBoundary>
        <ThrowError error={error} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Server Error')).toBeInTheDocument();
  });

  it('should show Try Again button', () => {
    const error = new Error('Test error');

    render(
      <ErrorBoundary>
        <ThrowError error={error} />
      </ErrorBoundary>
    );

    expect(screen.getByRole('button', { name: /Try Again/i })).toBeInTheDocument();
  });

  it('should show Go Home button', () => {
    const error = new Error('Test error');

    render(
      <ErrorBoundary>
        <ThrowError error={error} />
      </ErrorBoundary>
    );

    expect(screen.getByRole('button', { name: /Go Home/i })).toBeInTheDocument();
  });

  it('should call onReset when Try Again is clicked', async () => {
    const user = userEvent.setup();
    const onReset = vi.fn();
    const error = new Error('Test error');

    const { rerender } = render(
      <ErrorBoundary onReset={onReset}>
        <ThrowError error={error} />
      </ErrorBoundary>
    );

    const tryAgainButton = screen.getByRole('button', { name: /Try Again/i });
    await user.click(tryAgainButton);

    expect(onReset).toHaveBeenCalledTimes(1);
  });

  it('should show technical details in dev mode', () => {
    const error = new Error('Technical error message');

    render(
      <ErrorBoundary showDetails={true}>
        <ThrowError error={error} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Technical Details')).toBeInTheDocument();
  });

  it('should toggle technical details when clicked', async () => {
    const user = userEvent.setup();
    const error = new Error('Technical error message');

    render(
      <ErrorBoundary showDetails={true}>
        <ThrowError error={error} />
      </ErrorBoundary>
    );

    const detailsButton = screen.getByText('Technical Details');

    // Initially hidden
    expect(screen.queryByText('Error Message:')).not.toBeInTheDocument();

    // Click to show
    await user.click(detailsButton);
    expect(screen.getByText('Error Message:')).toBeInTheDocument();
    expect(screen.getByText('Technical error message')).toBeInTheDocument();

    // Click to hide
    await user.click(detailsButton);
    await waitFor(() => {
      expect(screen.queryByText('Error Message:')).not.toBeInTheDocument();
    });
  });

  it('should not show technical details when showDetails is false', () => {
    const error = new Error('Technical error message');

    render(
      <ErrorBoundary showDetails={false}>
        <ThrowError error={error} />
      </ErrorBoundary>
    );

    expect(screen.queryByText('Technical Details')).not.toBeInTheDocument();
  });

  it('should use custom fallback if provided', () => {
    const error = new Error('Test error');
    const customFallback = <div>Custom error UI</div>;

    render(
      <ErrorBoundary fallback={customFallback}>
        <ThrowError error={error} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Custom error UI')).toBeInTheDocument();
    expect(screen.queryByText(/Something Went Wrong/i)).not.toBeInTheDocument();
  });

  it('should reset error state when Try Again is clicked', async () => {
    const user = userEvent.setup();
    const error = new Error('Test error');
    let shouldThrow = true;

    const ConditionalError = () => {
      if (shouldThrow) {
        throw error;
      }
      return <div>Recovered component</div>;
    };

    const { rerender } = render(
      <ErrorBoundary>
        <ConditionalError />
      </ErrorBoundary>
    );

    expect(screen.getByText(/Something Went Wrong/i)).toBeInTheDocument();

    // Fix the error
    shouldThrow = false;

    // Click Try Again
    const tryAgainButton = screen.getByRole('button', { name: /Try Again/i });
    await user.click(tryAgainButton);

    // Need to rerender after state reset
    rerender(
      <ErrorBoundary>
        <ConditionalError />
      </ErrorBoundary>
    );

    expect(screen.getByText('Recovered component')).toBeInTheDocument();
  });
});

describe('ErrorFallback', () => {
  it('should render error fallback UI', () => {
    const error = new Error('Test error');
    const resetError = vi.fn();

    render(<ErrorFallback error={error} resetError={resetError} />);

    expect(screen.getByText('Something Went Wrong')).toBeInTheDocument();
  });

  it('should call resetError when Try Again is clicked', async () => {
    const user = userEvent.setup();
    const error = new Error('Test error');
    const resetError = vi.fn();

    render(<ErrorFallback error={error} resetError={resetError} />);

    const tryAgainButton = screen.getByRole('button', { name: /Try Again/i });
    await user.click(tryAgainButton);

    expect(resetError).toHaveBeenCalledTimes(1);
  });

  it('should display user-friendly error message', () => {
    const error = new NetworkError('Connection failed');
    const resetError = vi.fn();

    render(<ErrorFallback error={error} resetError={resetError} />);

    expect(screen.getByText(/Connection lost/i)).toBeInTheDocument();
  });

  it('should show technical error message in dev mode', () => {
    // Mock dev environment
    const originalEnv = import.meta.env.DEV;
    Object.defineProperty(import.meta.env, 'DEV', { value: true, writable: true });

    const error = new Error('Technical error details');
    const resetError = vi.fn();

    render(<ErrorFallback error={error} resetError={resetError} />);

    expect(screen.getByText('Technical error details')).toBeInTheDocument();

    // Restore
    Object.defineProperty(import.meta.env, 'DEV', { value: originalEnv, writable: true });
  });
});
