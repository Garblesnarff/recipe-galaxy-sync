import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, AlertCircle, CheckCircle2, AlertTriangle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { SyncLogEntry } from "@/services/wearables/syncService";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SyncHistoryListProps {
  syncHistory: SyncLogEntry[];
  onRetry: (platform: string) => void;
  isLoading?: boolean;
}

const PLATFORM_NAMES: Record<string, string> = {
  apple_health: 'Apple Health',
  google_fit: 'Google Fit',
  fitbit: 'Fitbit',
  garmin: 'Garmin',
};

export function SyncHistoryList({ syncHistory, onRetry, isLoading }: SyncHistoryListProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'partial':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-500">Success</Badge>;
      case 'partial':
        return <Badge className="bg-yellow-500">Partial</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getSyncTypeLabel = (type: string) => {
    return type === 'import' ? 'Import' : 'Export';
  };

  if (syncHistory.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Sync History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <RefreshCw className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No sync history yet</p>
            <p className="text-sm mt-1">
              Connect a device and sync to see your history here
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sync History</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-3">
            {syncHistory.map((entry) => (
              <div
                key={entry.id}
                className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex gap-3 flex-1 min-w-0">
                    <div className="mt-1">{getStatusIcon(entry.sync_status)}</div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">
                          {PLATFORM_NAMES[entry.platform] || entry.platform}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {getSyncTypeLabel(entry.sync_type)}
                        </Badge>
                      </div>

                      <div className="text-sm text-gray-600 mb-2">
                        {entry.items_synced > 0 ? (
                          <span>{entry.items_synced} items synced</span>
                        ) : (
                          <span>No items synced</span>
                        )}
                      </div>

                      {entry.error_message && (
                        <div className="text-sm text-red-600 bg-red-50 p-2 rounded mt-2">
                          {entry.error_message}
                        </div>
                      )}

                      <div className="text-xs text-gray-500 mt-2">
                        {formatDistanceToNow(new Date(entry.synced_at), { addSuffix: true })}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 items-end">
                    {getStatusBadge(entry.sync_status)}

                    {entry.sync_status === 'failed' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onRetry(entry.platform)}
                        disabled={isLoading}
                      >
                        <RefreshCw className="h-3 w-3 mr-1" />
                        Retry
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
