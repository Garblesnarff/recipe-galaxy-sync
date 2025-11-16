// useSyncStatus Hook for Recipe Galaxy Sync
// Provides sync queue and conflict status

import { useState, useEffect, useCallback } from 'react';
import { getPendingSyncQueue } from '@/lib/indexedDB';
import { getUnresolvedConflicts, SyncResult } from '@/services/offline/syncService';
import { addServiceWorkerListener } from '@/lib/serviceWorkerRegistration';

export function useSyncStatus() {
  const [syncQueue, setSyncQueue] = useState<any[]>([]);
  const [conflicts, setConflicts] = useState<any[]>([]);
  const [syncProgress, setSyncProgress] = useState({ current: 0, total: 0 });
  const [lastSyncResult, setLastSyncResult] = useState<SyncResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load sync queue
  const loadSyncQueue = useCallback(async () => {
    try {
      const queue = await getPendingSyncQueue();
      setSyncQueue(queue);
      setSyncProgress({ current: 0, total: queue.length });
    } catch (error) {
      console.error('[useSyncStatus] Error loading sync queue:', error);
    }
  }, []);

  // Load conflicts
  const loadConflicts = useCallback(async () => {
    try {
      const unresolvedConflicts = await getUnresolvedConflicts();
      setConflicts(unresolvedConflicts);
    } catch (error) {
      console.error('[useSyncStatus] Error loading conflicts:', error);
    }
  }, []);

  // Refresh all data
  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      await Promise.all([loadSyncQueue(), loadConflicts()]);
    } finally {
      setIsLoading(false);
    }
  }, [loadSyncQueue, loadConflicts]);

  // Initialize
  useEffect(() => {
    refresh();

    // Listen for service worker messages
    addServiceWorkerListener('SYNC_START', () => {
      console.log('[useSyncStatus] Sync started');
      setSyncProgress((prev) => ({ ...prev, current: 0 }));
    });

    addServiceWorkerListener('SYNC_COMPLETE', () => {
      console.log('[useSyncStatus] Sync completed');
      refresh();
    });

    addServiceWorkerListener('SYNC_ERROR', (data) => {
      console.error('[useSyncStatus] Sync error:', data.error);
      refresh();
    });

    // Refresh periodically
    const interval = setInterval(refresh, 30000); // Every 30 seconds

    return () => {
      clearInterval(interval);
    };
  }, [refresh]);

  return {
    syncQueue,
    conflicts,
    syncProgress,
    lastSyncResult,
    isLoading,
    refresh,
    hasPendingSync: syncQueue.length > 0,
    hasConflicts: conflicts.length > 0,
  };
}
