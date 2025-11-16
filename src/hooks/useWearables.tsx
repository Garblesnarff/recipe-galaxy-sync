import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "./useAuth";
import {
  getConnectionStatus,
  syncAllConnectedDevices,
  getSyncHistory,
  getImportedHealthData,
  updateSyncPreferences,
  toggleSyncEnabled,
  WearableConnection,
} from "@/services/wearables/syncService";
import { connectAppleHealth, disconnectAppleHealth } from "@/services/wearables/appleHealth";
import { connectGoogleFit, disconnectGoogleFit } from "@/services/wearables/googleFit";
import { toast } from "sonner";

export function useWearables() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Query: Get connection status for all platforms
  const { data: connections = [], isLoading: isLoadingConnections } = useQuery({
    queryKey: ['wearable-connections', user?.id],
    queryFn: () => getConnectionStatus(user!.id),
    enabled: !!user?.id,
  });

  // Query: Get sync history
  const { data: syncHistory = [], isLoading: isLoadingSyncHistory } = useQuery({
    queryKey: ['wearable-sync-history', user?.id],
    queryFn: () => getSyncHistory(user!.id),
    enabled: !!user?.id,
  });

  // Query: Get imported health data
  const { data: importedData = [], isLoading: isLoadingImportedData } = useQuery({
    queryKey: ['imported-health-data', user?.id],
    queryFn: () => getImportedHealthData(user!.id),
    enabled: !!user?.id,
  });

  // Mutation: Connect to a platform
  const connectMutation = useMutation({
    mutationFn: async (platform: string) => {
      if (!user?.id) throw new Error("User not authenticated");

      switch (platform) {
        case 'apple_health':
          return await connectAppleHealth();
        case 'google_fit':
          const authUrl = await connectGoogleFit();
          // For web OAuth, we need to redirect to the auth URL
          window.location.href = authUrl;
          return true;
        case 'fitbit':
          toast.info("Fitbit integration coming soon!");
          return false;
        case 'garmin':
          toast.info("Garmin integration coming soon!");
          return false;
        default:
          throw new Error("Unknown platform");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wearable-connections'] });
    },
  });

  // Mutation: Disconnect from a platform
  const disconnectMutation = useMutation({
    mutationFn: async (platform: string) => {
      if (!user?.id) throw new Error("User not authenticated");

      switch (platform) {
        case 'apple_health':
          await disconnectAppleHealth(user.id);
          break;
        case 'google_fit':
          await disconnectGoogleFit(user.id);
          break;
        default:
          throw new Error("Unknown platform");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wearable-connections'] });
      queryClient.invalidateQueries({ queryKey: ['wearable-sync-history'] });
    },
  });

  // Mutation: Sync all devices
  const syncMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("User not authenticated");
      await syncAllConnectedDevices(user.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wearable-sync-history'] });
      queryClient.invalidateQueries({ queryKey: ['imported-health-data'] });
      queryClient.invalidateQueries({ queryKey: ['wearable-connections'] });
    },
  });

  // Mutation: Sync a specific platform
  const syncPlatformMutation = useMutation({
    mutationFn: async (platform: string) => {
      if (!user?.id) throw new Error("User not authenticated");

      // Import the appropriate service and sync
      switch (platform) {
        case 'apple_health':
          const { syncFromAppleHealth } = await import("@/services/wearables/appleHealth");
          await syncFromAppleHealth(user.id);
          break;
        case 'google_fit':
          const { syncFromGoogleFit } = await import("@/services/wearables/googleFit");
          await syncFromGoogleFit(user.id);
          break;
        default:
          throw new Error("Platform sync not implemented");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wearable-sync-history'] });
      queryClient.invalidateQueries({ queryKey: ['imported-health-data'] });
      queryClient.invalidateQueries({ queryKey: ['wearable-connections'] });
    },
  });

  // Mutation: Update sync preferences
  const updatePreferencesMutation = useMutation({
    mutationFn: async ({
      platform,
      preferences,
    }: {
      platform: string;
      preferences: Partial<WearableConnection['sync_preferences']>;
    }) => {
      if (!user?.id) throw new Error("User not authenticated");
      await updateSyncPreferences(user.id, platform, preferences);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wearable-connections'] });
    },
  });

  // Mutation: Toggle sync enabled
  const toggleSyncMutation = useMutation({
    mutationFn: async ({ platform, enabled }: { platform: string; enabled: boolean }) => {
      if (!user?.id) throw new Error("User not authenticated");
      await toggleSyncEnabled(user.id, platform, enabled);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wearable-connections'] });
    },
  });

  return {
    // Data
    connections,
    syncHistory,
    importedData,

    // Loading states
    isLoadingConnections,
    isLoadingSyncHistory,
    isLoadingImportedData,

    // Mutations
    connect: connectMutation.mutate,
    disconnect: disconnectMutation.mutate,
    sync: syncMutation.mutate,
    syncPlatform: syncPlatformMutation.mutate,
    updatePreferences: updatePreferencesMutation.mutate,
    toggleSync: toggleSyncMutation.mutate,

    // Loading states for mutations
    isConnecting: connectMutation.isPending,
    isDisconnecting: disconnectMutation.isPending,
    isSyncing: syncMutation.isPending || syncPlatformMutation.isPending,
    isUpdatingPreferences: updatePreferencesMutation.isPending,
  };
}
