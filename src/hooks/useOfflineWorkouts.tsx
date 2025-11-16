// useOfflineWorkouts Hook for Recipe Galaxy Sync
// Enhanced workout hooks that work offline and online

import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { isOnline } from '@/services/offline/networkMonitor';
import {
  saveWorkoutOffline,
  getOfflineWorkouts,
  updateWorkoutOffline,
  deleteWorkoutOffline,
  mergeWorkouts,
} from '@/lib/offlineStorage';
import { useAuth } from '@/hooks/useAuth';

export function useOfflineWorkouts() {
  const { userId } = useAuth();
  const queryClient = useQueryClient();
  const [isOfflineMode, setIsOfflineMode] = useState(!isOnline());

  // Fetch workouts (online and offline)
  const {
    data: workouts,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['workouts', userId],
    queryFn: async () => {
      if (!userId) return [];

      if (isOnline()) {
        // Fetch from server
        const { data, error } = await supabase
          .from('workouts')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (error) throw error;

        // Merge with offline data
        const merged = await mergeWorkouts(data || []);
        return merged;
      } else {
        // Return only offline data
        return await getOfflineWorkouts();
      }
    },
    enabled: !!userId,
  });

  // Create workout (works offline)
  const createWorkout = useMutation({
    mutationFn: async (workoutData: any) => {
      if (isOnline()) {
        const { data, error } = await supabase
          .from('workouts')
          .insert({ ...workoutData, user_id: userId })
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Save offline
        const id = await saveWorkoutOffline({ ...workoutData, user_id: userId });
        return { id, ...workoutData, user_id: userId, offline: true };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workouts', userId] });
    },
  });

  // Update workout (works offline)
  const updateWorkout = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      if (isOnline()) {
        const { data, error } = await supabase
          .from('workouts')
          .update(updates)
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Update offline
        await updateWorkoutOffline(id, updates);
        return { id, ...updates, offline: true };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workouts', userId] });
    },
  });

  // Delete workout (works offline)
  const deleteWorkout = useMutation({
    mutationFn: async (id: string) => {
      if (isOnline()) {
        const { error } = await supabase.from('workouts').delete().eq('id', id);
        if (error) throw error;
      } else {
        // Delete offline
        await deleteWorkoutOffline(id);
      }
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workouts', userId] });
    },
  });

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOfflineMode(false);
      refetch(); // Refetch when coming online
    };

    const handleOffline = () => {
      setIsOfflineMode(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [refetch]);

  return {
    workouts: workouts || [],
    isLoading,
    error,
    isOfflineMode,
    createWorkout: createWorkout.mutateAsync,
    updateWorkout: updateWorkout.mutateAsync,
    deleteWorkout: deleteWorkout.mutateAsync,
    isCreating: createWorkout.isPending,
    isUpdating: updateWorkout.isPending,
    isDeleting: deleteWorkout.isPending,
    refetch,
  };
}
