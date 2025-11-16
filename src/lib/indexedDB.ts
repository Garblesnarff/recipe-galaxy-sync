// IndexedDB Layer for Recipe Galaxy Sync
// Provides low-level IndexedDB operations for offline storage

const DB_NAME = 'RecipeGalaxySyncDB';
const DB_VERSION = 1;

export interface OfflineStore {
  workouts: any[];
  exercises: any[];
  recipes: any[];
  mealPlans: any[];
  syncQueue: any[];
}

interface SyncQueueItem {
  id?: string;
  operation: 'insert' | 'update' | 'delete';
  tableName: string;
  data: any;
  timestamp: number;
  synced: boolean;
  error?: string;
}

let dbInstance: IDBDatabase | null = null;

// Initialize IndexedDB
export async function initDB(): Promise<IDBDatabase> {
  if (dbInstance) {
    return dbInstance;
  }

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('[IndexedDB] Error opening database:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      dbInstance = request.result;
      console.log('[IndexedDB] Database opened successfully');
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      console.log('[IndexedDB] Upgrading database schema...');

      // Create object stores if they don't exist
      const storeNames = ['workouts', 'exercises', 'recipes', 'mealPlans', 'syncQueue'];

      storeNames.forEach((storeName) => {
        if (!db.objectStoreNames.contains(storeName)) {
          const store = db.createObjectStore(storeName, {
            keyPath: 'id',
            autoIncrement: false,
          });

          // Create indexes for better querying
          if (storeName === 'syncQueue') {
            store.createIndex('synced', 'synced', { unique: false });
            store.createIndex('timestamp', 'timestamp', { unique: false });
          } else {
            store.createIndex('created_at', 'created_at', { unique: false });
            store.createIndex('updated_at', 'updated_at', { unique: false });
          }

          console.log(`[IndexedDB] Created object store: ${storeName}`);
        }
      });
    };
  });
}

// Generic get all items from a store
export async function getAll<T>(storeName: string): Promise<T[]> {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.getAll();

    request.onsuccess = () => {
      resolve(request.result as T[]);
    };

    request.onerror = () => {
      console.error(`[IndexedDB] Error getting all from ${storeName}:`, request.error);
      reject(request.error);
    };
  });
}

// Get item by ID
export async function getById<T>(storeName: string, id: string): Promise<T | undefined> {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.get(id);

    request.onsuccess = () => {
      resolve(request.result as T | undefined);
    };

    request.onerror = () => {
      console.error(`[IndexedDB] Error getting item from ${storeName}:`, request.error);
      reject(request.error);
    };
  });
}

// Add item to store
export async function add<T extends { id?: string }>(
  storeName: string,
  data: T
): Promise<string> {
  const db = await initDB();

  // Generate ID if not provided
  if (!data.id) {
    data.id = crypto.randomUUID();
  }

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.add(data);

    request.onsuccess = () => {
      console.log(`[IndexedDB] Added item to ${storeName}:`, data.id);
      resolve(data.id as string);
    };

    request.onerror = () => {
      console.error(`[IndexedDB] Error adding to ${storeName}:`, request.error);
      reject(request.error);
    };
  });
}

// Update item in store
export async function update<T>(
  storeName: string,
  id: string,
  data: Partial<T>
): Promise<void> {
  const db = await initDB();

  return new Promise(async (resolve, reject) => {
    try {
      // Get existing item
      const existing = await getById<T>(storeName, id);
      if (!existing) {
        reject(new Error(`Item with id ${id} not found in ${storeName}`));
        return;
      }

      // Merge with updates
      const updated = { ...existing, ...data, id };

      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(updated);

      request.onsuccess = () => {
        console.log(`[IndexedDB] Updated item in ${storeName}:`, id);
        resolve();
      };

      request.onerror = () => {
        console.error(`[IndexedDB] Error updating ${storeName}:`, request.error);
        reject(request.error);
      };
    } catch (error) {
      reject(error);
    }
  });
}

// Remove item from store
export async function remove(storeName: string, id: string): Promise<void> {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.delete(id);

    request.onsuccess = () => {
      console.log(`[IndexedDB] Removed item from ${storeName}:`, id);
      resolve();
    };

    request.onerror = () => {
      console.error(`[IndexedDB] Error removing from ${storeName}:`, request.error);
      reject(request.error);
    };
  });
}

// Clear all items from a store
export async function clear(storeName: string): Promise<void> {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.clear();

    request.onsuccess = () => {
      console.log(`[IndexedDB] Cleared store: ${storeName}`);
      resolve();
    };

    request.onerror = () => {
      console.error(`[IndexedDB] Error clearing ${storeName}:`, request.error);
      reject(request.error);
    };
  });
}

// Sync Queue Operations

export async function addToSyncQueue(operation: Omit<SyncQueueItem, 'id' | 'timestamp' | 'synced'>): Promise<void> {
  const queueItem: SyncQueueItem = {
    ...operation,
    id: crypto.randomUUID(),
    timestamp: Date.now(),
    synced: false,
  };

  await add('syncQueue', queueItem);
}

export async function getSyncQueue(): Promise<SyncQueueItem[]> {
  return getAll<SyncQueueItem>('syncQueue');
}

export async function getPendingSyncQueue(): Promise<SyncQueueItem[]> {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction('syncQueue', 'readonly');
    const store = transaction.objectStore('syncQueue');
    const index = store.index('synced');
    const request = index.getAll(false);

    request.onsuccess = () => {
      resolve(request.result as SyncQueueItem[]);
    };

    request.onerror = () => {
      console.error('[IndexedDB] Error getting pending sync queue:', request.error);
      reject(request.error);
    };
  });
}

export async function clearSyncQueue(): Promise<void> {
  return clear('syncQueue');
}

export async function markAsSynced(queueId: string): Promise<void> {
  return update('syncQueue', queueId, { synced: true } as Partial<SyncQueueItem>);
}

export async function markAsFailed(queueId: string, error: string): Promise<void> {
  return update('syncQueue', queueId, { error } as Partial<SyncQueueItem>);
}

// Get database size estimate
export async function getDatabaseSize(): Promise<number> {
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    const estimate = await navigator.storage.estimate();
    return estimate.usage || 0;
  }
  return 0;
}

// Get storage quota
export async function getStorageQuota(): Promise<{ usage: number; quota: number }> {
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    const estimate = await navigator.storage.estimate();
    return {
      usage: estimate.usage || 0,
      quota: estimate.quota || 0,
    };
  }
  return { usage: 0, quota: 0 };
}

// Export all data (for backup)
export async function exportAllData(): Promise<OfflineStore> {
  const workouts = await getAll('workouts');
  const exercises = await getAll('exercises');
  const recipes = await getAll('recipes');
  const mealPlans = await getAll('mealPlans');
  const syncQueue = await getAll('syncQueue');

  return {
    workouts,
    exercises,
    recipes,
    mealPlans,
    syncQueue,
  };
}

// Clear all data
export async function clearAllData(): Promise<void> {
  await clear('workouts');
  await clear('exercises');
  await clear('recipes');
  await clear('mealPlans');
  await clear('syncQueue');
  console.log('[IndexedDB] All data cleared');
}
