// Cache Manager Service for Recipe Galaxy Sync
// Manages service worker caches and preloading

const STATIC_CACHE = 'static-v1';
const DYNAMIC_CACHE = 'dynamic-v1';
const API_CACHE = 'api-v1';

// Clear all caches
export async function clearAllCaches(): Promise<void> {
  if (!('caches' in window)) {
    console.warn('[CacheManager] Cache API not supported');
    return;
  }

  try {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName)));
    console.log('[CacheManager] All caches cleared');
  } catch (error) {
    console.error('[CacheManager] Error clearing caches:', error);
    throw error;
  }
}

// Clear old caches (keep current versions)
export async function clearOldCaches(): Promise<void> {
  if (!('caches' in window)) {
    return;
  }

  try {
    const cacheNames = await caches.keys();
    const currentCaches = [STATIC_CACHE, DYNAMIC_CACHE, API_CACHE];

    const oldCaches = cacheNames.filter((cacheName) => !currentCaches.includes(cacheName));

    await Promise.all(oldCaches.map((cacheName) => caches.delete(cacheName)));

    console.log(`[CacheManager] Cleared ${oldCaches.length} old caches`);
  } catch (error) {
    console.error('[CacheManager] Error clearing old caches:', error);
  }
}

// Get total cache size estimate
export async function getCacheSize(): Promise<number> {
  if (!('caches' in window)) {
    return 0;
  }

  try {
    const cacheNames = await caches.keys();
    let totalSize = 0;

    for (const cacheName of cacheNames) {
      const cache = await caches.open(cacheName);
      const requests = await cache.keys();

      for (const request of requests) {
        const response = await cache.match(request);
        if (response) {
          const blob = await response.blob();
          totalSize += blob.size;
        }
      }
    }

    console.log(`[CacheManager] Total cache size: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
    return totalSize;
  } catch (error) {
    console.error('[CacheManager] Error calculating cache size:', error);
    return 0;
  }
}

// Preload essential assets
export async function preloadEssentialAssets(): Promise<void> {
  if (!('caches' in window)) {
    return;
  }

  const essentialAssets = [
    '/',
    '/index.html',
    '/manifest.json',
  ];

  try {
    const cache = await caches.open(STATIC_CACHE);
    await cache.addAll(essentialAssets);
    console.log('[CacheManager] Essential assets preloaded');
  } catch (error) {
    console.error('[CacheManager] Error preloading assets:', error);
  }
}

// Cache workout assets (exercise videos, images)
export async function cacheWorkoutAssets(workoutId: string): Promise<void> {
  if (!('caches' in window)) {
    return;
  }

  try {
    // This would cache specific workout-related assets
    // For now, this is a placeholder
    console.log(`[CacheManager] Caching assets for workout: ${workoutId}`);
  } catch (error) {
    console.error('[CacheManager] Error caching workout assets:', error);
  }
}

// Cache exercise videos
export async function cacheExerciseVideo(videoUrl: string): Promise<void> {
  if (!('caches' in window)) {
    return;
  }

  try {
    const cache = await caches.open(DYNAMIC_CACHE);
    const response = await fetch(videoUrl);

    if (response.ok) {
      await cache.put(videoUrl, response);
      console.log(`[CacheManager] Cached exercise video: ${videoUrl}`);
    }
  } catch (error) {
    console.error('[CacheManager] Error caching video:', error);
  }
}

// Cache recipe images
export async function cacheRecipeImage(imageUrl: string): Promise<void> {
  if (!('caches' in window)) {
    return;
  }

  try {
    const cache = await caches.open(DYNAMIC_CACHE);
    const response = await fetch(imageUrl);

    if (response.ok) {
      await cache.put(imageUrl, response);
      console.log(`[CacheManager] Cached recipe image: ${imageUrl}`);
    }
  } catch (error) {
    console.error('[CacheManager] Error caching image:', error);
  }
}

// Get cached URLs
export async function getCachedUrls(): Promise<string[]> {
  if (!('caches' in window)) {
    return [];
  }

  try {
    const cacheNames = await caches.keys();
    const urls: string[] = [];

    for (const cacheName of cacheNames) {
      const cache = await caches.open(cacheName);
      const requests = await cache.keys();
      urls.push(...requests.map((request) => request.url));
    }

    return urls;
  } catch (error) {
    console.error('[CacheManager] Error getting cached URLs:', error);
    return [];
  }
}

// Check if URL is cached
export async function isCached(url: string): Promise<boolean> {
  if (!('caches' in window)) {
    return false;
  }

  try {
    const cacheNames = await caches.keys();

    for (const cacheName of cacheNames) {
      const cache = await caches.open(cacheName);
      const response = await cache.match(url);
      if (response) {
        return true;
      }
    }

    return false;
  } catch (error) {
    console.error('[CacheManager] Error checking cache:', error);
    return false;
  }
}

// Remove specific URL from cache
export async function removeFromCache(url: string): Promise<void> {
  if (!('caches' in window)) {
    return;
  }

  try {
    const cacheNames = await caches.keys();

    for (const cacheName of cacheNames) {
      const cache = await caches.open(cacheName);
      await cache.delete(url);
    }

    console.log(`[CacheManager] Removed from cache: ${url}`);
  } catch (error) {
    console.error('[CacheManager] Error removing from cache:', error);
  }
}

// Get cache statistics
export async function getCacheStats(): Promise<{
  cacheCount: number;
  itemCount: number;
  totalSize: number;
  caches: Array<{ name: string; itemCount: number }>;
}> {
  if (!('caches' in window)) {
    return {
      cacheCount: 0,
      itemCount: 0,
      totalSize: 0,
      caches: [],
    };
  }

  try {
    const cacheNames = await caches.keys();
    const caches_data: Array<{ name: string; itemCount: number }> = [];
    let totalItems = 0;

    for (const cacheName of cacheNames) {
      const cache = await caches.open(cacheName);
      const requests = await cache.keys();
      caches_data.push({
        name: cacheName,
        itemCount: requests.length,
      });
      totalItems += requests.length;
    }

    const totalSize = await getCacheSize();

    return {
      cacheCount: cacheNames.length,
      itemCount: totalItems,
      totalSize,
      caches: caches_data,
    };
  } catch (error) {
    console.error('[CacheManager] Error getting cache stats:', error);
    return {
      cacheCount: 0,
      itemCount: 0,
      totalSize: 0,
      caches: [],
    };
  }
}

// Download data for offline use
export async function downloadForOffline(urls: string[]): Promise<void> {
  if (!('caches' in window)) {
    return;
  }

  try {
    const cache = await caches.open(DYNAMIC_CACHE);

    for (const url of urls) {
      try {
        const response = await fetch(url);
        if (response.ok) {
          await cache.put(url, response);
          console.log(`[CacheManager] Downloaded: ${url}`);
        }
      } catch (error) {
        console.error(`[CacheManager] Failed to download: ${url}`, error);
      }
    }

    console.log(`[CacheManager] Downloaded ${urls.length} items for offline use`);
  } catch (error) {
    console.error('[CacheManager] Error downloading for offline:', error);
  }
}
