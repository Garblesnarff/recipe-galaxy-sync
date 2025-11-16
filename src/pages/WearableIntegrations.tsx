import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { WearableConnectionCard } from "@/components/wearables/WearableConnectionCard";
import { SyncPreferencesDialog } from "@/components/wearables/SyncPreferencesDialog";
import { SyncHistoryList } from "@/components/wearables/SyncHistoryList";
import { ImportedDataViewer } from "@/components/wearables/ImportedDataViewer";
import { useWearables } from "@/hooks/useWearables";
import { WearableConnection } from "@/services/wearables/syncService";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function WearableIntegrations() {
  const navigate = useNavigate();
  const {
    connections,
    syncHistory,
    importedData,
    isLoadingConnections,
    isSyncing,
    connect,
    disconnect,
    sync,
    syncPlatform,
    updatePreferences,
    toggleSync,
  } = useWearables();

  const [preferencesDialogOpen, setPreferencesDialogOpen] = useState(false);
  const [selectedConnection, setSelectedConnection] = useState<WearableConnection | null>(null);

  const handleConnect = (platform: string) => {
    connect(platform);
  };

  const handleDisconnect = (platform: string) => {
    disconnect(platform);
  };

  const handleToggleSync = (platform: string, enabled: boolean) => {
    toggleSync({ platform, enabled });
  };

  const handleConfigurePreferences = (platform: string) => {
    const connection = connections.find(c => c.platform === platform);
    if (connection) {
      setSelectedConnection(connection);
      setPreferencesDialogOpen(true);
    }
  };

  const handleSavePreferences = (preferences: WearableConnection['sync_preferences']) => {
    if (selectedConnection) {
      updatePreferences({
        platform: selectedConnection.platform,
        preferences,
      });
    }
  };

  const handleRetrySync = (platform: string) => {
    syncPlatform(platform);
  };

  const handleSyncAll = () => {
    sync();
  };

  if (isLoadingConnections) {
    return (
      <div className="container mx-auto max-w-6xl px-4 py-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-6xl px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Wearable Integrations</h1>
            <p className="text-gray-600">
              Connect your fitness devices to sync workouts and health data
            </p>
          </div>

          <Button
            onClick={handleSyncAll}
            disabled={isSyncing || connections.filter(c => c.is_connected).length === 0}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
            Sync All
          </Button>
        </div>
      </div>

      <Tabs defaultValue="devices" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="devices">Devices</TabsTrigger>
          <TabsTrigger value="data">Imported Data</TabsTrigger>
          <TabsTrigger value="history">Sync History</TabsTrigger>
        </TabsList>

        {/* Devices Tab */}
        <TabsContent value="devices">
          <div className="grid md:grid-cols-2 gap-4">
            {connections.map((connection) => (
              <WearableConnectionCard
                key={connection.platform}
                connection={connection}
                onConnect={handleConnect}
                onDisconnect={handleDisconnect}
                onToggleSync={handleToggleSync}
                onConfigurePreferences={handleConfigurePreferences}
              />
            ))}
          </div>

          {/* Privacy Notice */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">Privacy & Security</h3>
            <div className="text-sm text-blue-800 space-y-1">
              <p>
                • Your health data is encrypted and stored securely
              </p>
              <p>
                • You can disconnect and delete your data at any time
              </p>
              <p>
                • We never share your health data with third parties
              </p>
              <p>
                • Sync is opt-in and can be disabled for any data type
              </p>
            </div>
          </div>
        </TabsContent>

        {/* Imported Data Tab */}
        <TabsContent value="data">
          <ImportedDataViewer
            importedData={importedData}
            onCreateWorkout={(data) => {
              // TODO: Implement workout creation from imported data
              console.log('Create workout from:', data);
            }}
          />
        </TabsContent>

        {/* Sync History Tab */}
        <TabsContent value="history">
          <SyncHistoryList
            syncHistory={syncHistory}
            onRetry={handleRetrySync}
            isLoading={isSyncing}
          />
        </TabsContent>
      </Tabs>

      {/* Sync Preferences Dialog */}
      <SyncPreferencesDialog
        open={preferencesDialogOpen}
        onOpenChange={setPreferencesDialogOpen}
        connection={selectedConnection}
        onSave={handleSavePreferences}
      />
    </div>
  );
}
