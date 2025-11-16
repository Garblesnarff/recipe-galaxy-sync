// OfflineIndicator Component for Recipe Galaxy Sync
// Shows offline status banner and sync controls

import { useOffline } from '@/hooks/useOffline';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { WifiOff, RefreshCw, Clock, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface OfflineIndicatorProps {
  className?: string;
  showDetails?: boolean;
}

export function OfflineIndicator({ className, showDetails = true }: OfflineIndicatorProps) {
  const { isOffline, isSyncing, pendingOperations, lastSyncTime, manualSync } = useOffline();
  const { effectiveType } = useNetworkStatus();

  // Don't show if online and no pending operations
  if (!isOffline && pendingOperations === 0 && !isSyncing) {
    return null;
  }

  return (
    <Card
      className={cn(
        'fixed top-4 right-4 z-50 p-4 shadow-lg border-l-4',
        isOffline ? 'border-l-orange-500 bg-orange-50' : 'border-l-blue-500 bg-blue-50',
        className
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          {isOffline ? (
            <WifiOff className="h-5 w-5 text-orange-600" />
          ) : isSyncing ? (
            <RefreshCw className="h-5 w-5 text-blue-600 animate-spin" />
          ) : (
            <AlertCircle className="h-5 w-5 text-blue-600" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-sm">
              {isOffline
                ? 'Offline Mode'
                : isSyncing
                ? 'Syncing...'
                : 'Sync Available'}
            </h3>
          </div>

          {showDetails && (
            <div className="mt-1 space-y-1">
              <p className="text-xs text-gray-600">
                {isOffline
                  ? 'Changes will sync when online'
                  : isSyncing
                  ? `Syncing ${pendingOperations} items...`
                  : `${pendingOperations} items pending sync`}
              </p>

              {lastSyncTime && !isSyncing && (
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Last synced {formatDistanceToNow(lastSyncTime, { addSuffix: true })}
                </p>
              )}

              {!isOffline && effectiveType === 'slow' && (
                <p className="text-xs text-amber-600">
                  Slow connection detected
                </p>
              )}
            </div>
          )}
        </div>

        {!isOffline && !isSyncing && pendingOperations > 0 && (
          <Button
            size="sm"
            variant="outline"
            onClick={manualSync}
            disabled={isSyncing}
            className="flex-shrink-0"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Sync Now
          </Button>
        )}
      </div>
    </Card>
  );
}
