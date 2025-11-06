import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { WifiOff, Wifi } from 'lucide-react';

export interface NetworkStatus {
  isOnline: boolean;
  wasOffline: boolean;
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
}

/**
 * Hook to detect and handle network status changes
 *
 * Features:
 * - Detects online/offline status
 * - Shows toast notifications on status change
 * - Automatically retries failed queries when back online
 * - Provides network quality information (if available)
 */
export function useNetworkStatus() {
  const queryClient = useQueryClient();
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>(() => ({
    isOnline: navigator.onLine,
    wasOffline: false,
  }));

  useEffect(() => {
    // Update network status
    const updateNetworkStatus = () => {
      const isOnline = navigator.onLine;

      // Get network information if available (Chrome only)
      const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;

      setNetworkStatus((prev) => ({
        isOnline,
        wasOffline: prev.wasOffline || !isOnline,
        effectiveType: connection?.effectiveType,
        downlink: connection?.downlink,
        rtt: connection?.rtt,
      }));
    };

    // Handle going online
    const handleOnline = () => {
      updateNetworkStatus();

      // Show success toast
      toast.success('Back Online', {
        description: 'Your connection has been restored.',
        icon: <Wifi className="h-4 w-4" />,
        duration: 3000,
      });

      // Retry all failed queries
      queryClient.refetchQueries({
        type: 'active',
        // Only refetch queries that are not currently fetching
        predicate: (query) => query.state.status === 'error',
      });

      // Also invalidate all queries to ensure fresh data
      queryClient.invalidateQueries();
    };

    // Handle going offline
    const handleOffline = () => {
      updateNetworkStatus();

      // Show error toast
      toast.error('Connection Lost', {
        description: 'Please check your internet connection.',
        icon: <WifiOff className="h-4 w-4" />,
        duration: Infinity, // Keep showing until back online
        id: 'offline-toast', // Use ID to prevent duplicate toasts
      });
    };

    // Handle network quality changes (Chrome only)
    const handleConnectionChange = () => {
      updateNetworkStatus();

      const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;

      if (connection?.effectiveType === 'slow-2g' || connection?.effectiveType === '2g') {
        toast.warning('Slow Connection', {
          description: 'You are on a slow network. Some features may be slower.',
          duration: 5000,
        });
      }
    };

    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Add connection change listener (Chrome only)
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    if (connection) {
      connection.addEventListener('change', handleConnectionChange);
    }

    // Initial check
    updateNetworkStatus();

    // Cleanup
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);

      if (connection) {
        connection.removeEventListener('change', handleConnectionChange);
      }

      // Dismiss the offline toast when component unmounts
      toast.dismiss('offline-toast');
    };
  }, [queryClient]);

  return networkStatus;
}

/**
 * Component to display network status banner
 */
export function NetworkStatusBanner() {
  const { isOnline, effectiveType } = useNetworkStatus();

  if (isOnline && effectiveType !== 'slow-2g' && effectiveType !== '2g') {
    return null;
  }

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-50 px-4 py-2 text-center text-sm font-medium ${
        !isOnline
          ? 'bg-destructive text-destructive-foreground'
          : 'bg-warning text-warning-foreground'
      }`}
    >
      {!isOnline ? (
        <div className="flex items-center justify-center gap-2">
          <WifiOff className="h-4 w-4" />
          <span>No internet connection. Please check your network.</span>
        </div>
      ) : (
        <div className="flex items-center justify-center gap-2">
          <Wifi className="h-4 w-4" />
          <span>Slow connection detected. Some features may be slower.</span>
        </div>
      )}
    </div>
  );
}

/**
 * Hook to check if a query should be paused based on network status
 */
export function useNetworkPause() {
  const { isOnline } = useNetworkStatus();

  return {
    // Pause queries when offline
    enabled: isOnline,
  };
}

/**
 * HOC to wrap components with network status awareness
 */
export function withNetworkStatus<P extends object>(
  Component: React.ComponentType<P & { networkStatus: NetworkStatus }>
) {
  return function NetworkStatusWrapper(props: P) {
    const networkStatus = useNetworkStatus();
    return <Component {...props} networkStatus={networkStatus} />;
  };
}
