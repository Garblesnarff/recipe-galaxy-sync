// SyncStatusDialog Component for Recipe Galaxy Sync
// Detailed sync status and management dialog

import { useState } from 'react';
import { useSyncStatus } from '@/hooks/useSyncStatus';
import { useOffline } from '@/hooks/useOffline';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Trash2,
  Clock,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface SyncStatusDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SyncStatusDialog({ open, onOpenChange }: SyncStatusDialogProps) {
  const { syncQueue, conflicts, isLoading, refresh, hasPendingSync, hasConflicts } = useSyncStatus();
  const { manualSync, isSyncing, lastSyncTime, lastSyncResult, clearOfflineData } = useOffline();
  const [showClearDialog, setShowClearDialog] = useState(false);

  const handleSync = async () => {
    await manualSync();
    await refresh();
  };

  const handleClearQueue = async () => {
    try {
      await clearOfflineData();
      await refresh();
      setShowClearDialog(false);
    } catch (error) {
      console.error('Error clearing offline data:', error);
    }
  };

  const getSyncProgress = () => {
    if (!lastSyncResult) return 0;
    const total = lastSyncResult.synced + lastSyncResult.failed;
    if (total === 0) return 0;
    return (lastSyncResult.synced / total) * 100;
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Sync Status</DialogTitle>
            <DialogDescription>
              View and manage offline data synchronization
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Sync Overview */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm">Sync Overview</h3>
                <Button
                  size="sm"
                  onClick={handleSync}
                  disabled={isSyncing || !hasPendingSync}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
                  {isSyncing ? 'Syncing...' : 'Sync Now'}
                </Button>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-xs text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-blue-600">{syncQueue.length}</p>
                </div>

                <div className="p-3 bg-green-50 rounded-lg">
                  <p className="text-xs text-gray-600">Synced</p>
                  <p className="text-2xl font-bold text-green-600">
                    {lastSyncResult?.synced || 0}
                  </p>
                </div>

                <div className="p-3 bg-red-50 rounded-lg">
                  <p className="text-xs text-gray-600">Failed</p>
                  <p className="text-2xl font-bold text-red-600">
                    {lastSyncResult?.failed || 0}
                  </p>
                </div>
              </div>

              {lastSyncTime && (
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Last synced {formatDistanceToNow(lastSyncTime, { addSuffix: true })}
                </p>
              )}

              {isSyncing && (
                <div className="space-y-2">
                  <Progress value={getSyncProgress()} />
                  <p className="text-xs text-center text-gray-500">
                    Syncing data...
                  </p>
                </div>
              )}
            </div>

            {/* Pending Operations */}
            {syncQueue.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm">Pending Operations</h3>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowClearDialog(true)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear Queue
                  </Button>
                </div>

                <ScrollArea className="h-40 border rounded-lg p-2">
                  <div className="space-y-2">
                    {syncQueue.map((item, index) => (
                      <div
                        key={item.id || index}
                        className="p-2 bg-gray-50 rounded flex items-center justify-between"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {item.operation.toUpperCase()} {item.tableName}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(item.timestamp).toLocaleString()}
                          </p>
                        </div>
                        <Badge variant={item.synced ? 'default' : 'secondary'}>
                          {item.synced ? 'Synced' : 'Pending'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}

            {/* Conflicts */}
            {hasConflicts && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <h3 className="font-semibold text-sm">Conflicts ({conflicts.length})</h3>
                </div>

                <ScrollArea className="h-32 border rounded-lg p-2">
                  <div className="space-y-2">
                    {conflicts.map((conflict) => (
                      <div
                        key={conflict.id}
                        className="p-2 bg-amber-50 rounded flex items-center justify-between"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {conflict.tableName} - {conflict.recordId}
                          </p>
                          <p className="text-xs text-gray-500">
                            Requires manual resolution
                          </p>
                        </div>
                        <Button size="sm" variant="outline">
                          Resolve
                        </Button>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}

            {/* Last Sync Result */}
            {lastSyncResult && (
              <div className="p-3 bg-gray-50 rounded-lg space-y-2">
                <h3 className="font-semibold text-sm">Last Sync Result</h3>

                <div className="flex items-center gap-2">
                  {lastSyncResult.success ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600" />
                  )}
                  <span className="text-sm">
                    {lastSyncResult.success ? 'Success' : 'Failed'}
                  </span>
                </div>

                {lastSyncResult.errors.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-red-600">Errors:</p>
                    {lastSyncResult.errors.map((error, index) => (
                      <p key={index} className="text-xs text-red-600">
                        {error}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Empty State */}
            {!hasPendingSync && !hasConflicts && !isLoading && (
              <div className="py-8 text-center text-gray-500">
                <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
                <p className="text-sm">All data is synced</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Clear Queue Confirmation */}
      <AlertDialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear Sync Queue?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove all pending sync operations. This action cannot be undone.
              Offline data will be permanently lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleClearQueue} className="bg-red-500 hover:bg-red-600">
              Clear Queue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
