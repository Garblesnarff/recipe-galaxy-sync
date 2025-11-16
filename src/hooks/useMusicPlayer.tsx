/**
 * Music Player Hook
 * Manages music playback during workouts with auto-play and preferences
 */

import { useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import * as playbackControl from '@/services/music/playbackControl';
import { toast } from '@/hooks/use-toast';

interface UseMusicPlayerOptions {
  workoutId?: string;
  autoPlay?: boolean;
  onPlaybackStart?: () => void;
  onPlaybackStop?: () => void;
}

export function useMusicPlayer(options: UseMusicPlayerOptions = {}) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const userId = user?.id || '';
  const hasStartedRef = useRef(false);

  // Get music preferences
  const { data: preferences, refetch: refetchPreferences } = useQuery({
    queryKey: ['music', 'preferences', userId],
    queryFn: () => playbackControl.getMusicPreferences(userId),
    enabled: !!userId,
  });

  // Update preferences mutation
  const updatePreferencesMutation = useMutation({
    mutationFn: (newPreferences: any) =>
      playbackControl.updateMusicPreferences(userId, newPreferences),
    onSuccess: () => {
      refetchPreferences();
      queryClient.invalidateQueries({ queryKey: ['music', 'preferences'] });
      toast({
        title: 'Preferences Updated',
        description: 'Your music preferences have been saved',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Update Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Start workout playback mutation
  const startPlaybackMutation = useMutation({
    mutationFn: () => playbackControl.startWorkoutPlayback(userId, options.workoutId),
    onSuccess: () => {
      options.onPlaybackStart?.();
    },
    onError: (error: Error) => {
      console.error('Failed to start workout playback:', error);
      // Don't show error toast for music - it's not critical to workout
    },
  });

  // Pause playback mutation
  const pausePlaybackMutation = useMutation({
    mutationFn: () => playbackControl.pauseWorkoutPlayback(userId),
  });

  // Resume playback mutation
  const resumePlaybackMutation = useMutation({
    mutationFn: () => playbackControl.resumeWorkoutPlayback(userId),
  });

  // Stop playback mutation
  const stopPlaybackMutation = useMutation({
    mutationFn: () => playbackControl.stopWorkoutPlayback(userId),
    onSuccess: () => {
      options.onPlaybackStop?.();
    },
  });

  // Auto-start playback when component mounts (if enabled)
  useEffect(() => {
    const shouldAutoPlay =
      options.autoPlay !== false && preferences?.auto_play_on_workout_start;

    if (userId && shouldAutoPlay && !hasStartedRef.current) {
      hasStartedRef.current = true;
      startPlaybackMutation.mutate();
    }
  }, [userId, preferences, options.autoPlay]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Optionally stop playback when workout ends
      // This can be controlled by the component
    };
  }, []);

  return {
    // Preferences
    preferences,
    updatePreferences: updatePreferencesMutation.mutate,
    isUpdatingPreferences: updatePreferencesMutation.isPending,

    // Playback controls
    startPlayback: startPlaybackMutation.mutate,
    pausePlayback: pausePlaybackMutation.mutate,
    resumePlayback: resumePlaybackMutation.mutate,
    stopPlayback: stopPlaybackMutation.mutate,

    // Loading states
    isStarting: startPlaybackMutation.isPending,
    isPausing: pausePlaybackMutation.isPending,
    isResuming: resumePlaybackMutation.isPending,
    isStopping: stopPlaybackMutation.isPending,
  };
}

/**
 * Hook for managing workout playlist assignments
 */
export function useWorkoutPlaylists(workoutId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const userId = user?.id || '';

  // Get playlists for user
  const { data: playlists, isLoading } = useQuery({
    queryKey: ['workoutPlaylists', userId],
    queryFn: async () => {
      // This would be a Supabase query to fetch workout_playlists
      const { data } = await import('@/integrations/supabase/client').then(
        (mod) =>
          mod.supabase
            .from('workout_playlists')
            .select('*')
            .eq('user_id', userId)
      );
      return data || [];
    },
    enabled: !!userId,
  });

  // Get playlist for specific workout
  const { data: workoutPlaylist } = useQuery({
    queryKey: ['workoutPlaylist', userId, workoutId],
    queryFn: async () => {
      const { data } = await import('@/integrations/supabase/client').then(
        (mod) =>
          mod.supabase
            .from('workout_playlists')
            .select('*')
            .eq('user_id', userId)
            .eq('workout_id', workoutId)
            .single()
      );
      return data;
    },
    enabled: !!userId && !!workoutId,
  });

  // Link playlist to workout mutation
  const linkPlaylistMutation = useMutation({
    mutationFn: ({
      playlistId,
      workoutId,
    }: {
      playlistId: string;
      workoutId: string;
    }) => playbackControl.linkPlaylistToWorkout(userId, playlistId, workoutId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workoutPlaylists'] });
      queryClient.invalidateQueries({ queryKey: ['workoutPlaylist'] });
      toast({
        title: 'Playlist Linked',
        description: 'Playlist has been linked to this workout',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Link Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Set default playlist mutation
  const setDefaultPlaylistMutation = useMutation({
    mutationFn: (playlistId: string) =>
      playbackControl.setDefaultWorkoutPlaylist(userId, playlistId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workoutPlaylists'] });
      toast({
        title: 'Default Playlist Set',
        description: 'This playlist will be used for all workouts by default',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Update Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    playlists,
    workoutPlaylist,
    isLoading,
    linkPlaylist: linkPlaylistMutation.mutate,
    setDefaultPlaylist: setDefaultPlaylistMutation.mutate,
    isLinkingPlaylist: linkPlaylistMutation.isPending,
    isSettingDefault: setDefaultPlaylistMutation.isPending,
  };
}
