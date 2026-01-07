import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface RecentlyViewedItem {
  id: string;
  title: string;
  image_url?: string;
  viewed_at: string;
}

const RECENTLY_VIEWED_KEY = 'recipecache_recently_viewed';
const MAX_RECENT_ITEMS = 10;

export const useRecentlyViewed = () => {
  const [recentlyViewed, setRecentlyViewed] = useState<RecentlyViewedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load recently viewed from localStorage on mount
  useEffect(() => {
    const loadRecentlyViewed = async () => {
      try {
        const stored = localStorage.getItem(RECENTLY_VIEWED_KEY);
        if (stored) {
          const viewedItems: RecentlyViewedItem[] = JSON.parse(stored);
          setRecentlyViewed(viewedItems);
        }
      } catch (error) {
        console.error('Error loading recently viewed items:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadRecentlyViewed();
  }, []);

  // Save recently viewed to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(recentlyViewed));
    } catch (error) {
      console.error('Error saving recently viewed items:', error);
    }
  }, [recentlyViewed]);

  const addToRecentlyViewed = (recipeId: string, title: string, image_url?: string) => {
    const now = new Date().toISOString();
    const newItem: RecentlyViewedItem = {
      id: recipeId,
      title,
      image_url,
      viewed_at: now
    };

    setRecentlyViewed(prev => {
      // Remove existing entry if it exists
      const filtered = prev.filter(item => item.id !== recipeId);
      // Add new item to the beginning
      const updated = [newItem, ...filtered];
      // Keep only the most recent MAX_RECENT_ITEMS
      return updated.slice(0, MAX_RECENT_ITEMS);
    });
  };

  const removeFromRecentlyViewed = (recipeId: string) => {
    setRecentlyViewed(prev => prev.filter(item => item.id !== recipeId));
  };

  const clearRecentlyViewed = () => {
    setRecentlyViewed([]);
  };

  return {
    recentlyViewed,
    isLoading,
    addToRecentlyViewed,
    removeFromRecentlyViewed,
    clearRecentlyViewed
  };
};
