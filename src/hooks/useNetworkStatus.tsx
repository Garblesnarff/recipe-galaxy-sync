// useNetworkStatus Hook for Recipe Galaxy Sync
// Provides detailed network connection information

import { useState, useEffect } from 'react';
import {
  isOnline,
  getConnectionType,
  estimateConnectionSpeed,
  getDownlink,
  getRTT,
  addOnlineListener,
  addOfflineListener,
  removeOnlineListener,
  removeOfflineListener,
} from '@/services/offline/networkMonitor';

export function useNetworkStatus() {
  const [online, setOnline] = useState(isOnline());
  const [connectionType, setConnectionType] = useState(getConnectionType());
  const [effectiveType, setEffectiveType] = useState(estimateConnectionSpeed());
  const [downlink, setDownlink] = useState(getDownlink());
  const [rtt, setRtt] = useState(getRTT());

  // Update network info
  const updateNetworkInfo = () => {
    setOnline(isOnline());
    setConnectionType(getConnectionType());
    setEffectiveType(estimateConnectionSpeed());
    setDownlink(getDownlink());
    setRtt(getRTT());
  };

  useEffect(() => {
    // Initial update
    updateNetworkInfo();

    // Add listeners
    addOnlineListener(updateNetworkInfo);
    addOfflineListener(updateNetworkInfo);

    // Listen for connection changes
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      if (connection) {
        connection.addEventListener('change', updateNetworkInfo);
      }
    }

    // Cleanup
    return () => {
      removeOnlineListener(updateNetworkInfo);
      removeOfflineListener(updateNetworkInfo);

      if ('connection' in navigator) {
        const connection = (navigator as any).connection;
        if (connection) {
          connection.removeEventListener('change', updateNetworkInfo);
        }
      }
    };
  }, []);

  return {
    online,
    connectionType,
    effectiveType,
    downlink,
    rtt,
    isSlowConnection: effectiveType === 'slow',
    isFastConnection: effectiveType === 'fast',
  };
}
