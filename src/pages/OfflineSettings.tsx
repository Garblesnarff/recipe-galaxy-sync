// OfflineSettings Page for Recipe Galaxy Sync
// Main offline settings and management page

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { OfflineSettings as OfflineSettingsComponent } from '@/components/offline/OfflineSettings';
import { SyncStatusDialog } from '@/components/offline/SyncStatusDialog';
import { StorageQuotaWarning } from '@/components/offline/StorageQuotaWarning';
import { useOffline } from '@/hooks/useOffline';
import { useSyncStatus } from '@/hooks/useSyncStatus';

export default function OfflineSettings() {
  const navigate = useNavigate();
  const [showSyncDialog, setShowSyncDialog] = useState(false);
  const { pendingOperations } = useOffline();
  const { hasConflicts } = useSyncStatus();

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="container py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Offline Mode Settings</h1>
              <p className="text-sm text-gray-500">
                Manage offline data and synchronization
              </p>
            </div>
          </div>

          <Button onClick={() => setShowSyncDialog(true)}>
            View Sync Status
            {pendingOperations > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-blue-600 text-white text-xs rounded-full">
                {pendingOperations}
              </span>
            )}
          </Button>
        </div>
      </header>

      <main className="container max-w-4xl py-8 space-y-6">
        {/* Storage Warning */}
        <StorageQuotaWarning />

        {/* Conflicts Alert */}
        {hasConflicts && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-800 font-medium">
              You have unresolved sync conflicts. Click "View Sync Status" to resolve them.
            </p>
          </div>
        )}

        {/* Settings */}
        <OfflineSettingsComponent />
      </main>

      {/* Sync Status Dialog */}
      <SyncStatusDialog open={showSyncDialog} onOpenChange={setShowSyncDialog} />
    </div>
  );
}
