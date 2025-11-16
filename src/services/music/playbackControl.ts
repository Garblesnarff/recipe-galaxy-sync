/**
 * Playback Control Service
 * Manages music playback during workouts
 */

import { supabase } from '@/integrations/supabase/client';
import * as spotifyService from './spotify';
import * as spotifyApi from '@/lib/spotifyApi';

/**
 * Start workout playback
 * Automatically plays default playlist or workout-specific playlist
 */
export async function startWorkoutPlayback(
  userId: string,
  workoutId?: string
): Promise<void> {
  try {
    // Get user's music preferences
    const preferences = await getMusicPreferences(userId);

    if (!preferences?.auto_play_on_workout_start) {
      return; // Don't auto-play if preference is disabled
    }

    // Find appropriate playlist
    let playlistUri: string | undefined;

    if (workoutId) {
      // Try to find playlist specific to this workout
      const { data: workoutPlaylist } = await supabase
        .from('workout_playlists')
        .select('*')
        .eq('user_id', userId)
        .eq('workout_id', workoutId)
        .eq('platform', 'spotify')
        .single();

      if (workoutPlaylist) {
        playlistUri = `spotify:playlist:${workoutPlaylist.platform_playlist_id}`;
      }
    }

    // If no workout-specific playlist, find default
    if (!playlistUri) {
      const { data: defaultPlaylist } = await supabase
        .from('workout_playlists')
        .select('*')
        .eq('user_id', userId)
        .eq('is_default_for_workouts', true)
        .eq('platform', 'spotify')
        .single();

      if (defaultPlaylist) {
        playlistUri = `spotify:playlist:${defaultPlaylist.platform_playlist_id}`;
      }
    }

    // Start playback with fade-in
    if (playlistUri) {
      await spotifyService.play(userId, playlistUri);

      // Apply fade-in if configured
      if (preferences.fade_in_duration_seconds > 0) {
        await fadeInVolume(
          userId,
          preferences.default_volume,
          preferences.fade_in_duration_seconds
        );
      } else {
        await spotifyService.setVolume(userId, preferences.default_volume);
      }
    }
  } catch (error) {
    console.error('Failed to start workout playback:', error);
    throw error;
  }
}

/**
 * Pause workout playback
 */
export async function pauseWorkoutPlayback(userId: string): Promise<void> {
  try {
    await spotifyService.pause(userId);
  } catch (error) {
    console.error('Failed to pause workout playback:', error);
    throw error;
  }
}

/**
 * Resume workout playback
 */
export async function resumeWorkoutPlayback(userId: string): Promise<void> {
  try {
    const preferences = await getMusicPreferences(userId);
    await spotifyService.play(userId);

    // Restore volume
    if (preferences) {
      await spotifyService.setVolume(userId, preferences.default_volume);
    }
  } catch (error) {
    console.error('Failed to resume workout playback:', error);
    throw error;
  }
}

/**
 * Stop workout playback with fade-out
 */
export async function stopWorkoutPlayback(userId: string): Promise<void> {
  try {
    const preferences = await getMusicPreferences(userId);

    // Fade out before stopping
    if (preferences?.fade_in_duration_seconds) {
      await fadeOutVolume(userId, preferences.fade_in_duration_seconds);
    }

    await spotifyService.pause(userId);
  } catch (error) {
    console.error('Failed to stop workout playback:', error);
    throw error;
  }
}

/**
 * Get current playback state
 */
export async function getPlaybackState(userId: string): Promise<any> {
  try {
    return await spotifyApi.getPlaybackState(userId);
  } catch (error) {
    console.error('Failed to get playback state:', error);
    return null;
  }
}

/**
 * Fade in volume
 */
async function fadeInVolume(
  userId: string,
  targetVolume: number,
  durationSeconds: number
): Promise<void> {
  const steps = 10;
  const stepDuration = (durationSeconds * 1000) / steps;
  const volumeIncrement = targetVolume / steps;

  // Start at 0
  await spotifyService.setVolume(userId, 0);

  for (let i = 1; i <= steps; i++) {
    await new Promise((resolve) => setTimeout(resolve, stepDuration));
    await spotifyService.setVolume(userId, volumeIncrement * i);
  }
}

/**
 * Fade out volume
 */
async function fadeOutVolume(userId: string, durationSeconds: number): Promise<void> {
  const steps = 10;
  const stepDuration = (durationSeconds * 1000) / steps;

  // Get current volume
  const state = await spotifyApi.getPlaybackState(userId);
  const currentVolume = state?.device?.volume_percent || 70;
  const volumeDecrement = currentVolume / steps;

  for (let i = 1; i <= steps; i++) {
    await new Promise((resolve) => setTimeout(resolve, stepDuration));
    await spotifyService.setVolume(userId, currentVolume - volumeDecrement * i);
  }
}

/**
 * Get user's music preferences
 */
export async function getMusicPreferences(userId: string): Promise<any> {
  try {
    const { data, error } = await supabase
      .from('music_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      // Create default preferences if not found
      if (error.code === 'PGRST116') {
        return await createDefaultPreferences(userId);
      }
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Failed to get music preferences:', error);
    return null;
  }
}

/**
 * Update user's music preferences
 */
export async function updateMusicPreferences(
  userId: string,
  preferences: {
    auto_play_on_workout_start?: boolean;
    default_volume?: number;
    fade_in_duration_seconds?: number;
    preferred_genres?: string[];
    energy_level_preference?: 'low' | 'medium' | 'high' | 'mixed';
  }
): Promise<void> {
  try {
    const { error } = await supabase
      .from('music_preferences')
      .upsert(
        {
          user_id: userId,
          ...preferences,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id',
        }
      );

    if (error) throw error;
  } catch (error) {
    console.error('Failed to update music preferences:', error);
    throw error;
  }
}

/**
 * Create default preferences for user
 */
async function createDefaultPreferences(userId: string) {
  const defaultPrefs = {
    user_id: userId,
    auto_play_on_workout_start: false,
    default_volume: 70,
    fade_in_duration_seconds: 3,
    preferred_genres: [],
    energy_level_preference: 'mixed' as const,
  };

  const { error } = await supabase.from('music_preferences').insert(defaultPrefs);

  if (error) throw error;

  return defaultPrefs;
}

/**
 * Set playlist as default for workouts
 */
export async function setDefaultWorkoutPlaylist(
  userId: string,
  playlistId: string
): Promise<void> {
  try {
    // First, unset any existing defaults
    await supabase
      .from('workout_playlists')
      .update({ is_default_for_workouts: false })
      .eq('user_id', userId);

    // Then set the new default
    const { error } = await supabase
      .from('workout_playlists')
      .update({ is_default_for_workouts: true })
      .eq('user_id', userId)
      .eq('platform_playlist_id', playlistId);

    if (error) throw error;
  } catch (error) {
    console.error('Failed to set default workout playlist:', error);
    throw error;
  }
}

/**
 * Link playlist to specific workout
 */
export async function linkPlaylistToWorkout(
  userId: string,
  playlistId: string,
  workoutId: string
): Promise<void> {
  try {
    const { error } = await supabase
      .from('workout_playlists')
      .update({ workout_id: workoutId })
      .eq('user_id', userId)
      .eq('platform_playlist_id', playlistId);

    if (error) throw error;
  } catch (error) {
    console.error('Failed to link playlist to workout:', error);
    throw error;
  }
}
