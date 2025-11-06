import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useNetworkStatus, NetworkStatusBanner, useNetworkPause } from '../useNetworkStatus';
import { toast } from 'sonner';
import { render, screen } from '@testing-library/react';

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    dismiss: vi.fn(),
  },
}));

describe('useNetworkStatus', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });

    // Reset navigator.onLine
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true,
    });

    vi.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it('should return online status when online', () => {
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true,
    });

    const { result } = renderHook(() => useNetworkStatus(), { wrapper });

    expect(result.current.isOnline).toBe(true);
    expect(result.current.wasOffline).toBe(false);
  });

  it('should return offline status when offline', () => {
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: false,
    });

    const { result } = renderHook(() => useNetworkStatus(), { wrapper });

    expect(result.current.isOnline).toBe(false);
  });

  it('should show error toast when going offline', async () => {
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true,
    });

    const { result } = renderHook(() => useNetworkStatus(), { wrapper });

    expect(result.current.isOnline).toBe(true);

    // Simulate going offline
    act(() => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false,
      });
      window.dispatchEvent(new Event('offline'));
    });

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        'Connection Lost',
        expect.objectContaining({
          description: 'Please check your internet connection.',
        })
      );
    });
  });

  it('should show success toast when coming back online', async () => {
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: false,
    });

    const { result } = renderHook(() => useNetworkStatus(), { wrapper });

    expect(result.current.isOnline).toBe(false);

    // Simulate going online
    act(() => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true,
      });
      window.dispatchEvent(new Event('online'));
    });

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(
        'Back Online',
        expect.objectContaining({
          description: 'Your connection has been restored.',
        })
      );
    });
  });

  it('should refetch queries when coming back online', async () => {
    const refetchSpy = vi.spyOn(queryClient, 'refetchQueries');

    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: false,
    });

    renderHook(() => useNetworkStatus(), { wrapper });

    // Simulate going online
    act(() => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true,
      });
      window.dispatchEvent(new Event('online'));
    });

    await waitFor(() => {
      expect(refetchSpy).toHaveBeenCalled();
    });
  });

  it('should invalidate queries when coming back online', async () => {
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: false,
    });

    renderHook(() => useNetworkStatus(), { wrapper });

    // Simulate going online
    act(() => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true,
      });
      window.dispatchEvent(new Event('online'));
    });

    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalled();
    });
  });

  it('should track wasOffline state', async () => {
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true,
    });

    const { result } = renderHook(() => useNetworkStatus(), { wrapper });

    expect(result.current.wasOffline).toBe(false);

    // Go offline
    act(() => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false,
      });
      window.dispatchEvent(new Event('offline'));
    });

    await waitFor(() => {
      expect(result.current.isOnline).toBe(false);
      expect(result.current.wasOffline).toBe(true);
    });

    // Go back online
    act(() => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true,
      });
      window.dispatchEvent(new Event('online'));
    });

    await waitFor(() => {
      expect(result.current.isOnline).toBe(true);
      expect(result.current.wasOffline).toBe(true); // Still true, remembers being offline
    });
  });

  it('should dismiss offline toast when unmounted', () => {
    const { unmount } = renderHook(() => useNetworkStatus(), { wrapper });

    unmount();

    expect(toast.dismiss).toHaveBeenCalledWith('offline-toast');
  });
});

describe('NetworkStatusBanner', () => {
  beforeEach(() => {
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true,
    });
  });

  it('should not render when online', () => {
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true,
    });

    const queryClient = new QueryClient();
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    render(<NetworkStatusBanner />, { wrapper });

    expect(screen.queryByText(/internet connection/i)).not.toBeInTheDocument();
  });

  it('should render when offline', async () => {
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: false,
    });

    const queryClient = new QueryClient();
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    render(<NetworkStatusBanner />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText(/No internet connection/i)).toBeInTheDocument();
    });
  });
});

describe('useNetworkPause', () => {
  beforeEach(() => {
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true,
    });
  });

  it('should return enabled:true when online', () => {
    const queryClient = new QueryClient();
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useNetworkPause(), { wrapper });

    expect(result.current.enabled).toBe(true);
  });

  it('should return enabled:false when offline', () => {
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: false,
    });

    const queryClient = new QueryClient();
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useNetworkPause(), { wrapper });

    expect(result.current.enabled).toBe(false);
  });

  it('should update enabled state when network status changes', async () => {
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true,
    });

    const queryClient = new QueryClient();
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useNetworkPause(), { wrapper });

    expect(result.current.enabled).toBe(true);

    // Go offline
    act(() => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false,
      });
      window.dispatchEvent(new Event('offline'));
    });

    await waitFor(() => {
      expect(result.current.enabled).toBe(false);
    });
  });
});
