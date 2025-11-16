/**
 * useGPSTracking Hook
 * Manages GPS tracking sessions for workouts
 */

import { useState, useEffect, useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  startGPSTracking as startTracking,
  stopGPSTracking as stopTracking,
  pauseTracking as pauseTrackingSession,
  resumeTracking as resumeTrackingSession,
  getActiveSession,
  clearSession,
  type GPSTrackingSession,
} from '@/services/gps/locationTracking';
import { analyzeRoute } from '@/services/gps/routeAnalysis';
import { saveGPSWorkout } from '@/services/gps/gpsWorkouts';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface UseGPSTrackingReturn {
  session: GPSTrackingSession | null;
  isTracking: boolean;
  isPaused: boolean;
  startTracking: () => Promise<void>;
  stopTracking: () => Promise<void>;
  pauseTracking: () => Promise<void>;
  resumeTracking: () => Promise<void>;
  saveWorkout: (workoutType: string, notes?: string) => Promise<string>;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Hook for managing GPS tracking during workouts
 */
export function useGPSTracking(): UseGPSTrackingReturn {
  const { session: authSession } = useAuth();
  const userId = authSession?.user?.id;
  const queryClient = useQueryClient();
  const [error, setError] = useState<Error | null>(null);

  // Query active session (poll every 2 seconds when tracking)
  const {
    data: session,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['gps-session'],
    queryFn: getActiveSession,
    refetchInterval: (data) => (data?.isActive ? 2000 : false),
    enabled: true,
  });

  const isTracking = session?.isActive ?? false;
  const isPaused = session?.isPaused ?? false;

  // Start tracking mutation
  const startTrackingMutation = useMutation({
    mutationFn: async () => {
      const sessionId = await startTracking(true);
      return sessionId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gps-session'] });
      setError(null);
    },
    onError: (err) => {
      setError(err as Error);
    },
  });

  // Stop tracking mutation
  const stopTrackingMutation = useMutation({
    mutationFn: async () => {
      if (!session) throw new Error('No active session');
      await stopTracking(session.sessionId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gps-session'] });
      setError(null);
    },
    onError: (err) => {
      setError(err as Error);
    },
  });

  // Pause tracking mutation
  const pauseTrackingMutation = useMutation({
    mutationFn: async () => {
      if (!session) throw new Error('No active session');
      await pauseTrackingSession(session.sessionId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gps-session'] });
      setError(null);
    },
    onError: (err) => {
      setError(err as Error);
    },
  });

  // Resume tracking mutation
  const resumeTrackingMutation = useMutation({
    mutationFn: async () => {
      if (!session) throw new Error('No active session');
      await resumeTrackingSession(session.sessionId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gps-session'] });
      setError(null);
    },
    onError: (err) => {
      setError(err as Error);
    },
  });

  /**
   * Save completed workout
   */
  const saveWorkout = useCallback(
    async (workoutType: string, notes?: string): Promise<string> => {
      if (!session || !userId) {
        throw new Error('No active session or user');
      }

      try {
        const endTime = new Date();
        const stats = analyzeRoute(
          session.coordinates,
          session.startTime,
          endTime,
          70, // Default weight, should come from user profile
          workoutType
        );

        // Create workout log
        const { data: workoutLog, error: logError } = await supabase
          .from('workout_logs')
          .insert({
            user_id: userId,
            completed_at: endTime.toISOString(),
            duration_minutes: Math.round(stats.totalTime / 60),
            notes: notes,
            calories_burned: stats.calories,
          })
          .select()
          .single();

        if (logError) throw logError;

        // Save GPS workout data
        await saveGPSWorkout(workoutLog.id, {
          workout_log_id: workoutLog.id,
          coordinates: session.coordinates,
          total_distance_meters: stats.totalDistance,
          total_elevation_gain_meters: stats.elevationGain,
          total_elevation_loss_meters: stats.elevationLoss,
          average_pace: stats.averagePace,
          max_speed_kmh: stats.maxSpeed,
        });

        // Clear session
        clearSession(session.sessionId);
        queryClient.invalidateQueries({ queryKey: ['gps-session'] });
        queryClient.invalidateQueries({ queryKey: ['workout-logs'] });

        return workoutLog.id;
      } catch (err) {
        console.error('Error saving workout:', err);
        throw err;
      }
    },
    [session, userId, queryClient]
  );

  return {
    session: session ?? null,
    isTracking,
    isPaused,
    startTracking: startTrackingMutation.mutate,
    stopTracking: stopTrackingMutation.mutate,
    pauseTracking: pauseTrackingMutation.mutate,
    resumeTracking: resumeTrackingMutation.mutate,
    saveWorkout,
    isLoading: isLoading || startTrackingMutation.isPending || stopTrackingMutation.isPending,
    error,
  };
}

/**
 * Hook for checking GPS permissions
 */
export function useGPSPermissions() {
  const [permissionState, setPermissionState] = useState<'granted' | 'denied' | 'prompt' | 'unsupported'>('prompt');
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkPermission = async () => {
      if (!navigator.geolocation) {
        setPermissionState('unsupported');
        setIsChecking(false);
        return;
      }

      if (navigator.permissions && navigator.permissions.query) {
        try {
          const result = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
          setPermissionState(result.state as 'granted' | 'denied' | 'prompt');
        } catch (error) {
          setPermissionState('prompt');
        }
      } else {
        setPermissionState('prompt');
      }

      setIsChecking(false);
    };

    checkPermission();
  }, []);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        () => {
          setPermissionState('granted');
          resolve(true);
        },
        (error) => {
          if (error.code === error.PERMISSION_DENIED) {
            setPermissionState('denied');
          }
          resolve(false);
        }
      );
    });
  }, []);

  return {
    permissionState,
    isChecking,
    requestPermission,
  };
}
