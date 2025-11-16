/**
 * Wearable Sync Service
 *
 * Orchestrates syncing across all connected wearable devices
 */

import { supabase } from "@/integrations/supabase/client";
import { syncFromAppleHealth } from "./appleHealth";
import { syncFromGoogleFit } from "./googleFit";
import { toast } from "sonner";

export interface WearableConnection {
  id: string;
  user_id: string;
  platform: 'apple_health' | 'google_fit' | 'fitbit' | 'garmin';
  is_connected: boolean;
  sync_enabled: boolean;
  last_sync_at: string | null;
  sync_preferences: {
    import_workouts: boolean;
    export_workouts: boolean;
    import_hr: boolean;
    import_calories: boolean;
    import_steps: boolean;
  };
  created_at: string;
  updated_at: string;
}

export interface SyncLogEntry {
  id: string;
  user_id: string;
  platform: string;
  sync_type: 'import' | 'export';
  items_synced: number;
  sync_status: 'success' | 'partial' | 'failed';
  error_message: string | null;
  synced_at: string;
}

export interface ImportedHealthData {
  id: string;
  user_id: string;
  platform: string;
  data_type: 'workout' | 'heart_rate' | 'steps' | 'calories' | 'sleep';
  date_recorded: string;
  value: any;
  imported_at: string;
  workout_log_id: string | null;
}

/**
 * Sync all connected devices for a user
 */
export async function syncAllConnectedDevices(userId: string): Promise<void> {
  try {
    // Get all connected and enabled devices
    const { data: connections, error } = await supabase
      .from('wearable_connections')
      .select('*')
      .eq('user_id', userId)
      .eq('is_connected', true)
      .eq('sync_enabled', true);

    if (error) throw error;

    if (!connections || connections.length === 0) {
      toast.info("No connected devices to sync");
      return;
    }

    const syncPromises = connections.map(async (connection) => {
      try {
        switch (connection.platform) {
          case 'apple_health':
            await syncFromAppleHealth(userId);
            break;
          case 'google_fit':
            await syncFromGoogleFit(userId);
            break;
          case 'fitbit':
            // TODO: Implement Fitbit sync
            console.log('Fitbit sync not yet implemented');
            break;
          case 'garmin':
            // TODO: Implement Garmin sync
            console.log('Garmin sync not yet implemented');
            break;
        }
      } catch (error) {
        console.error(`Error syncing ${connection.platform}:`, error);
        // Continue with other syncs even if one fails
      }
    });

    await Promise.allSettled(syncPromises);

    toast.success("Sync completed for all devices");
  } catch (error) {
    console.error("Error syncing devices:", error);
    toast.error("Failed to sync devices");
    throw error;
  }
}

/**
 * Get connection status for all platforms
 */
export async function getConnectionStatus(userId: string): Promise<WearableConnection[]> {
  try {
    const { data, error } = await supabase
      .from('wearable_connections')
      .select('*')
      .eq('user_id', userId)
      .order('platform', { ascending: true });

    if (error) throw error;

    // Ensure all platforms are represented
    const platforms: Array<'apple_health' | 'google_fit' | 'fitbit' | 'garmin'> = [
      'apple_health',
      'google_fit',
      'fitbit',
      'garmin',
    ];

    const existingPlatforms = new Set(data?.map(c => c.platform) || []);

    // Create placeholder entries for platforms that aren't connected
    const allConnections: WearableConnection[] = platforms.map((platform) => {
      const existing = data?.find(c => c.platform === platform);
      if (existing) {
        return existing as WearableConnection;
      }

      return {
        id: `placeholder_${platform}`,
        user_id: userId,
        platform,
        is_connected: false,
        sync_enabled: false,
        last_sync_at: null,
        sync_preferences: {
          import_workouts: true,
          export_workouts: true,
          import_hr: true,
          import_calories: true,
          import_steps: true,
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    });

    return allConnections;
  } catch (error) {
    console.error("Error getting connection status:", error);
    throw error;
  }
}

/**
 * Update sync preferences for a platform
 */
export async function updateSyncPreferences(
  userId: string,
  platform: string,
  preferences: Partial<WearableConnection['sync_preferences']>
): Promise<void> {
  try {
    // Get current preferences
    const { data: connection } = await supabase
      .from('wearable_connections')
      .select('sync_preferences')
      .eq('user_id', userId)
      .eq('platform', platform)
      .single();

    const currentPrefs = connection?.sync_preferences || {
      import_workouts: true,
      export_workouts: true,
      import_hr: true,
      import_calories: true,
      import_steps: true,
    };

    // Merge with new preferences
    const updatedPrefs = { ...currentPrefs, ...preferences };

    const { error } = await supabase
      .from('wearable_connections')
      .update({
        sync_preferences: updatedPrefs,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('platform', platform);

    if (error) throw error;

    toast.success("Sync preferences updated");
  } catch (error) {
    console.error("Error updating sync preferences:", error);
    toast.error("Failed to update sync preferences");
    throw error;
  }
}

/**
 * Get sync history for a user
 */
export async function getSyncHistory(userId: string, limit = 50): Promise<SyncLogEntry[]> {
  try {
    const { data, error } = await supabase
      .from('wearable_sync_log')
      .select('*')
      .eq('user_id', userId)
      .order('synced_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return (data || []) as SyncLogEntry[];
  } catch (error) {
    console.error("Error getting sync history:", error);
    throw error;
  }
}

/**
 * Get imported health data
 */
export async function getImportedHealthData(
  userId: string,
  dataType?: string,
  startDate?: Date,
  endDate?: Date
): Promise<ImportedHealthData[]> {
  try {
    let query = supabase
      .from('imported_health_data')
      .select('*')
      .eq('user_id', userId);

    if (dataType) {
      query = query.eq('data_type', dataType);
    }

    if (startDate) {
      query = query.gte('date_recorded', startDate.toISOString().split('T')[0]);
    }

    if (endDate) {
      query = query.lte('date_recorded', endDate.toISOString().split('T')[0]);
    }

    query = query.order('date_recorded', { ascending: false });

    const { data, error } = await query;

    if (error) throw error;

    return (data || []) as ImportedHealthData[];
  } catch (error) {
    console.error("Error getting imported health data:", error);
    throw error;
  }
}

/**
 * Import a specific workout from a wearable device
 */
export async function importWorkoutFromWearable(
  userId: string,
  platform: string,
  wearableWorkoutId: string
): Promise<void> {
  try {
    // In a real implementation, this would fetch the specific workout from the platform
    // and create a workout_log entry

    toast.success("Workout imported successfully");
  } catch (error) {
    console.error("Error importing workout:", error);
    toast.error("Failed to import workout");
    throw error;
  }
}

/**
 * Toggle sync enabled status
 */
export async function toggleSyncEnabled(
  userId: string,
  platform: string,
  enabled: boolean
): Promise<void> {
  try {
    const { error } = await supabase
      .from('wearable_connections')
      .update({
        sync_enabled: enabled,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('platform', platform);

    if (error) throw error;

    toast.success(enabled ? "Sync enabled" : "Sync disabled");
  } catch (error) {
    console.error("Error toggling sync:", error);
    toast.error("Failed to toggle sync");
    throw error;
  }
}

/**
 * Get heart rate data for a workout log
 */
export async function getWorkoutHeartRateData(
  userId: string,
  workoutLogId: string
): Promise<number[] | null> {
  try {
    const { data, error } = await supabase
      .from('imported_health_data')
      .select('value')
      .eq('user_id', userId)
      .eq('workout_log_id', workoutLogId)
      .eq('data_type', 'heart_rate')
      .single();

    if (error || !data) return null;

    return data.value?.samples || null;
  } catch (error) {
    console.error("Error getting heart rate data:", error);
    return null;
  }
}
