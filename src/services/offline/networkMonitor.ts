// Network Monitor Service for Recipe Galaxy Sync
// Monitors network status and connection quality

type NetworkCallback = () => void;

const onlineListeners: Set<NetworkCallback> = new Set();
const offlineListeners: Set<NetworkCallback> = new Set();

let isInitialized = false;

// Initialize network monitoring
function initialize() {
  if (isInitialized) return;

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  isInitialized = true;
  console.log('[NetworkMonitor] Initialized');
}

// Handle online event
function handleOnline() {
  console.log('[NetworkMonitor] Connection restored');
  onlineListeners.forEach((callback) => {
    try {
      callback();
    } catch (error) {
      console.error('[NetworkMonitor] Error in online callback:', error);
    }
  });
}

// Handle offline event
function handleOffline() {
  console.log('[NetworkMonitor] Connection lost');
  offlineListeners.forEach((callback) => {
    try {
      callback();
    } catch (error) {
      console.error('[NetworkMonitor] Error in offline callback:', error);
    }
  });
}

// Check if online
export function isOnline(): boolean {
  return navigator.onLine;
}

// Add online listener
export function addOnlineListener(callback: NetworkCallback): void {
  initialize();
  onlineListeners.add(callback);
}

// Add offline listener
export function addOfflineListener(callback: NetworkCallback): void {
  initialize();
  offlineListeners.add(callback);
}

// Remove online listener
export function removeOnlineListener(callback: NetworkCallback): void {
  onlineListeners.delete(callback);
}

// Remove offline listener
export function removeOfflineListener(callback: NetworkCallback): void {
  offlineListeners.delete(callback);
}

// Get connection type
export function getConnectionType(): string {
  if ('connection' in navigator) {
    const connection = (navigator as any).connection;
    return connection?.effectiveType || 'unknown';
  }
  return 'unknown';
}

// Estimate connection speed
export function estimateConnectionSpeed(): 'slow' | 'medium' | 'fast' {
  if ('connection' in navigator) {
    const connection = (navigator as any).connection;
    const effectiveType = connection?.effectiveType;

    if (!effectiveType) return 'medium';

    switch (effectiveType) {
      case 'slow-2g':
      case '2g':
        return 'slow';
      case '3g':
        return 'medium';
      case '4g':
      case '5g':
        return 'fast';
      default:
        return 'medium';
    }
  }

  return 'medium';
}

// Get downlink speed (Mbps)
export function getDownlink(): number {
  if ('connection' in navigator) {
    const connection = (navigator as any).connection;
    return connection?.downlink || 0;
  }
  return 0;
}

// Get round trip time (ms)
export function getRTT(): number {
  if ('connection' in navigator) {
    const connection = (navigator as any).connection;
    return connection?.rtt || 0;
  }
  return 0;
}

// Check if connection is slow
export function isSlowConnection(): boolean {
  const speed = estimateConnectionSpeed();
  return speed === 'slow';
}

// Check if connection is metered (cellular)
export function isMeteredConnection(): boolean {
  if ('connection' in navigator) {
    const connection = (navigator as any).connection;
    return connection?.saveData === true;
  }
  return false;
}

// Get network information
export function getNetworkInfo(): {
  online: boolean;
  connectionType: string;
  speed: 'slow' | 'medium' | 'fast';
  downlink: number;
  rtt: number;
  metered: boolean;
} {
  return {
    online: isOnline(),
    connectionType: getConnectionType(),
    speed: estimateConnectionSpeed(),
    downlink: getDownlink(),
    rtt: getRTT(),
    metered: isMeteredConnection(),
  };
}

// Wait for online status
export function waitForOnline(timeout?: number): Promise<void> {
  return new Promise((resolve, reject) => {
    if (isOnline()) {
      resolve();
      return;
    }

    const onlineCallback = () => {
      cleanup();
      resolve();
    };

    const timeoutId = timeout
      ? setTimeout(() => {
          cleanup();
          reject(new Error('Timeout waiting for online status'));
        }, timeout)
      : null;

    const cleanup = () => {
      removeOnlineListener(onlineCallback);
      if (timeoutId) clearTimeout(timeoutId);
    };

    addOnlineListener(onlineCallback);
  });
}

// Test connection with a HEAD request
export async function testConnection(url: string = 'https://www.google.com'): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(url, {
      method: 'HEAD',
      mode: 'no-cors',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    return true;
  } catch (error) {
    console.log('[NetworkMonitor] Connection test failed:', error);
    return false;
  }
}

// Monitor connection changes
export function monitorConnection(
  onStatusChange: (isOnline: boolean) => void
): () => void {
  const onlineCallback = () => onStatusChange(true);
  const offlineCallback = () => onStatusChange(false);

  addOnlineListener(onlineCallback);
  addOfflineListener(offlineCallback);

  // Return cleanup function
  return () => {
    removeOnlineListener(onlineCallback);
    removeOfflineListener(offlineCallback);
  };
}

// Cleanup all listeners
export function cleanup() {
  onlineListeners.clear();
  offlineListeners.clear();

  if (isInitialized) {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
    isInitialized = false;
  }

  console.log('[NetworkMonitor] Cleaned up');
}
