// useOffline Hook for Recipe Galaxy Sync
// Provides offline state and sync functionality

import { useState, useEffect, useCallback } from 'react';
import { isOnline, addOnlineListener, addOfflineListener, removeOnlineListener, removeOfflineListener } from '@/services/offline/networkMonitor';
import { syncOfflineData, SyncResult } from '@/services/offline/syncService';
import { getPendingSyncQueue } from '@/lib/indexedDB';
import { clearAllData } from '@/lib/indexedDB';

export function useOffline() {
  const [isOffline, setIsOffline] = useState(!isOnline());
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingOperations, setPendingOperations] = useState(0);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [lastSyncResult, setLastSyncResult] = useState<SyncResult | null>(null);

  // Update pending operations count
  const updatePendingCount = useCallback(async () => {
    try {
      const queue = await getPendingSyncQueue();
      setPendingOperations(queue.length);
    } catch (error) {
      console.error('[useOffline] Error updating pending count:', error);
    }
  }, []);

  // Handle online event
  const handleOnline = useCallback(async () => {
    console.log('[useOffline] Connection restored');
    setIsOffline(false);

    // Auto-sync when coming back online
    const autoSync = localStorage.getItem('offline-auto-sync');
    if (autoSync !== 'false') {
      await manualSync();
    }
  }, []);

  // Handle offline event
  const handleOffline = useCallback(() => {
    console.log('[useOffline] Connection lost');
    setIsOffline(true);
  }, []);

  // Manual sync function
  const manualSync = useCallback(async () => {
    if (isSyncing) {
      console.log('[useOffline] Sync already in progress');
      return;
    }

    setIsSyncing(true);

    try {
      console.log('[useOffline] Starting manual sync...');
      const result = await syncOfflineData();

      setLastSyncTime(new Date());
      setLastSyncResult(result);
      await updatePendingCount();

      console.log('[useOffline] Sync completed:', result);
    } catch (error) {
      console.error('[useOffline] Sync failed:', error);
      setLastSyncResult({
        success: false,
        synced: 0,
        failed: 0,
        conflicts: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      });
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing, updatePendingCount]);

  // Clear offline data
  const clearOfflineData = useCallback(async () => {
    try {
      await clearAllData();
      await updatePendingCount();
      console.log('[useOffline] Offline data cleared');
    } catch (error) {
      console.error('[useOffline] Error clearing offline data:', error);
      throw error;
    }
  }, [updatePendingCount]);

  // Initialize
  useEffect(() => {
    // Set initial state
    setIsOffline(!isOnline());

    // Add network listeners
    addOnlineListener(handleOnline);
    addOfflineListener(handleOffline);

    // Update pending count
    updatePendingCount();

    // Load last sync time from localStorage
    const lastSync = localStorage.getItem('last-sync-time');
    if (lastSync) {
      setLastSyncTime(new Date(lastSync));
    }

    // Cleanup
    return () => {
      removeOnlineListener(handleOnline);
      removeOfflineListener(handleOffline);
    };
  }, [handleOnline, handleOffline, updatePendingCount]);

  // Save last sync time to localStorage
  useEffect(() => {
    if (lastSyncTime) {
      localStorage.setItem('last-sync-time', lastSyncTime.toISOString());
    }
  }, [lastSyncTime]);

  return {
    isOffline,
    isSyncing,
    pendingOperations,
    lastSyncTime,
    lastSyncResult,
    manualSync,
    clearOfflineData,
    updatePendingCount,
  };
}
