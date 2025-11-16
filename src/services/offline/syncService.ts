// Sync Service for Recipe Galaxy Sync
// Handles synchronization of offline data with the server

import { supabase } from '@/integrations/supabase/client';
import {
  getPendingSyncQueue,
  markAsSynced,
  markAsFailed,
  clearSyncQueue,
} from '@/lib/indexedDB';
import { getOfflineWorkouts, getOfflineExercises, getOfflineRecipes } from '@/lib/offlineStorage';

export interface SyncResult {
  success: boolean;
  synced: number;
  failed: number;
  conflicts: number;
  errors: string[];
}

export interface SyncConflict {
  id: string;
  tableName: string;
  recordId: string;
  localData: any;
  serverData: any;
}

// Main sync function
export async function syncOfflineData(): Promise<SyncResult> {
  console.log('[SyncService] Starting offline data sync...');

  const result: SyncResult = {
    success: true,
    synced: 0,
    failed: 0,
    conflicts: 0,
    errors: [],
  };

  try {
    const syncQueue = await getPendingSyncQueue();
    console.log(`[SyncService] Found ${syncQueue.length} items to sync`);

    for (const item of syncQueue) {
      try {
        await processSyncItem(item);
        await markAsSynced(item.id!);
        result.synced++;
      } catch (error) {
        console.error('[SyncService] Error syncing item:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        await markAsFailed(item.id!, errorMessage);
        result.failed++;
        result.errors.push(errorMessage);
        result.success = false;
      }
    }

    console.log('[SyncService] Sync completed:', result);
    return result;
  } catch (error) {
    console.error('[SyncService] Sync failed:', error);
    result.success = false;
    result.errors.push(error instanceof Error ? error.message : 'Unknown error');
    return result;
  }
}

// Process individual sync item
async function processSyncItem(item: any): Promise<void> {
  const { operation, tableName, data } = item;

  switch (operation) {
    case 'insert':
      await syncInsert(tableName, data);
      break;
    case 'update':
      await syncUpdate(tableName, data);
      break;
    case 'delete':
      await syncDelete(tableName, data);
      break;
    default:
      throw new Error(`Unknown operation: ${operation}`);
  }
}

// Sync insert operation
async function syncInsert(tableName: string, data: any): Promise<void> {
  console.log(`[SyncService] Inserting into ${tableName}:`, data.id);

  // Remove offline flag and update timestamp
  const { offline, ...cleanData } = data;
  cleanData.updated_at = new Date().toISOString();

  const { error } = await supabase.from(tableName).insert(cleanData);

  if (error) {
    if (error.code === '23505') {
      // Unique constraint violation - item already exists
      console.log(`[SyncService] Item already exists, updating instead`);
      await syncUpdate(tableName, data);
    } else {
      throw error;
    }
  }
}

// Sync update operation
async function syncUpdate(tableName: string, data: any): Promise<void> {
  console.log(`[SyncService] Updating ${tableName}:`, data.id);

  const { offline, id, ...updates } = data;
  updates.updated_at = new Date().toISOString();

  // Check for conflicts
  const { data: serverData, error: fetchError } = await supabase
    .from(tableName)
    .select('*')
    .eq('id', id)
    .single();

  if (fetchError && fetchError.code !== 'PGRST116') {
    throw fetchError;
  }

  if (serverData) {
    const hasConflict = await detectConflicts(data, serverData);
    if (hasConflict) {
      await createConflict(tableName, id, data, serverData);
      throw new Error('Conflict detected');
    }
  }

  const { error } = await supabase.from(tableName).update(updates).eq('id', id);

  if (error) {
    throw error;
  }
}

// Sync delete operation
async function syncDelete(tableName: string, data: any): Promise<void> {
  console.log(`[SyncService] Deleting from ${tableName}:`, data.id);

  const { error } = await supabase.from(tableName).delete().eq('id', data.id);

  if (error && error.code !== 'PGRST116') {
    // Ignore if record doesn't exist
    throw error;
  }
}

// Sync specific data types

export async function syncWorkouts(): Promise<void> {
  console.log('[SyncService] Syncing workouts...');

  const offlineWorkouts = await getOfflineWorkouts();

  for (const workout of offlineWorkouts) {
    const { offline, ...cleanWorkout } = workout;
    cleanWorkout.updated_at = new Date().toISOString();

    const { error } = await supabase.from('workouts').upsert(cleanWorkout);

    if (error) {
      console.error('[SyncService] Error syncing workout:', error);
      throw error;
    }
  }

  console.log(`[SyncService] Synced ${offlineWorkouts.length} workouts`);
}

export async function syncExercises(): Promise<void> {
  console.log('[SyncService] Syncing exercises...');

  const offlineExercises = await getOfflineExercises();

  for (const exercise of offlineExercises) {
    const { offline, ...cleanExercise } = exercise;
    cleanExercise.updated_at = new Date().toISOString();

    const { error } = await supabase.from('exercises').upsert(cleanExercise);

    if (error) {
      console.error('[SyncService] Error syncing exercise:', error);
      throw error;
    }
  }

  console.log(`[SyncService] Synced ${offlineExercises.length} exercises`);
}

export async function syncRecipes(): Promise<void> {
  console.log('[SyncService] Syncing recipes...');

  const offlineRecipes = await getOfflineRecipes();

  for (const recipe of offlineRecipes) {
    const { offline, ...cleanRecipe } = recipe;
    cleanRecipe.updated_at = new Date().toISOString();

    const { error } = await supabase.from('recipes').upsert(cleanRecipe);

    if (error) {
      console.error('[SyncService] Error syncing recipe:', error);
      throw error;
    }
  }

  console.log(`[SyncService] Synced ${offlineRecipes.length} recipes`);
}

// Conflict detection and resolution

export function detectConflicts(localData: any, serverData: any): boolean {
  // Compare updated_at timestamps
  const localTime = new Date(localData.updated_at);
  const serverTime = new Date(serverData.updated_at);

  // If server data is newer, we have a conflict
  if (serverTime > localTime) {
    console.log('[SyncService] Conflict detected:', {
      local: localTime,
      server: serverTime,
    });
    return true;
  }

  return false;
}

async function createConflict(
  tableName: string,
  recordId: string,
  localData: any,
  serverData: any
): Promise<void> {
  const { data: session } = await supabase.auth.getSession();
  if (!session?.session?.user) {
    throw new Error('User not authenticated');
  }

  const { error } = await supabase.from('sync_conflicts').insert({
    user_id: session.session.user.id,
    table_name: tableName,
    record_id: recordId,
    local_data: localData,
    server_data: serverData,
    detected_at: new Date().toISOString(),
  });

  if (error) {
    console.error('[SyncService] Error creating conflict:', error);
    throw error;
  }
}

export async function resolveConflict(
  conflictId: string,
  strategy: 'local' | 'server'
): Promise<void> {
  console.log(`[SyncService] Resolving conflict ${conflictId} with strategy: ${strategy}`);

  // Get the conflict
  const { data: conflict, error: fetchError } = await supabase
    .from('sync_conflicts')
    .select('*')
    .eq('id', conflictId)
    .single();

  if (fetchError) {
    throw fetchError;
  }

  if (!conflict) {
    throw new Error('Conflict not found');
  }

  const dataToUse = strategy === 'local' ? conflict.local_data : conflict.server_data;

  // Update the record with chosen data
  const { offline, ...cleanData } = dataToUse;
  cleanData.updated_at = new Date().toISOString();

  const { error: updateError } = await supabase
    .from(conflict.table_name)
    .update(cleanData)
    .eq('id', conflict.record_id);

  if (updateError) {
    throw updateError;
  }

  // Mark conflict as resolved
  const { error: resolveError } = await supabase
    .from('sync_conflicts')
    .update({
      resolved_at: new Date().toISOString(),
      resolution_strategy: strategy === 'local' ? 'use_local' : 'use_server',
    })
    .eq('id', conflictId);

  if (resolveError) {
    throw resolveError;
  }

  console.log('[SyncService] Conflict resolved');
}

// Get unresolved conflicts
export async function getUnresolvedConflicts(): Promise<SyncConflict[]> {
  const { data, error } = await supabase
    .from('sync_conflicts')
    .select('*')
    .is('resolved_at', null)
    .order('detected_at', { ascending: false });

  if (error) {
    console.error('[SyncService] Error fetching conflicts:', error);
    return [];
  }

  return (data || []).map((conflict) => ({
    id: conflict.id,
    tableName: conflict.table_name,
    recordId: conflict.record_id,
    localData: conflict.local_data,
    serverData: conflict.server_data,
  }));
}

// Register background sync
export async function registerBackgroundSync(): Promise<void> {
  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    try {
      const registration = await navigator.serviceWorker.ready;
      await (registration as any).sync.register('sync-workouts');
      console.log('[SyncService] Background sync registered');
    } catch (error) {
      console.error('[SyncService] Failed to register background sync:', error);
    }
  } else {
    console.log('[SyncService] Background sync not supported');
  }
}

// Manual sync trigger
export async function triggerManualSync(): Promise<SyncResult> {
  console.log('[SyncService] Manual sync triggered');
  return await syncOfflineData();
}

// Clear sync queue (for testing or reset)
export async function clearAllSyncData(): Promise<void> {
  await clearSyncQueue();
  console.log('[SyncService] Sync queue cleared');
}
