/**
 * Spotify Integration Service
 * Handles connection, playlists, and track management
 */

import { supabase } from '@/integrations/supabase/client';
import { initiateSpotifyAuth, exchangeCodeForToken, encryptToken } from '@/lib/spotifyAuth';
import * as spotifyApi from '@/lib/spotifyApi';

export interface SpotifyPlaylist {
  id: string;
  name: string;
  tracks: { total: number };
  images: Array<{ url: string }>;
  external_urls: { spotify: string };
  description?: string;
}

export interface SpotifyTrack {
  id: string;
  name: string;
  artists: Array<{ name: string }>;
  duration_ms: number;
  album: { name: string; images: Array<{ url: string }> };
  uri: string;
  external_urls: { spotify: string };
}

/**
 * Initiate Spotify connection - returns OAuth URL
 */
export async function connectSpotify(): Promise<string> {
  try {
    const authUrl = await initiateSpotifyAuth();
    return authUrl;
  } catch (error) {
    console.error('Failed to initiate Spotify connection:', error);
    throw error;
  }
}

/**
 * Handle OAuth callback and save connection to database
 */
export async function handleSpotifyCallback(code: string, userId: string): Promise<void> {
  try {
    // Exchange code for tokens
    const tokenData = await exchangeCodeForToken(code);

    // Calculate expiration time
    const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000);

    // Store encrypted tokens in database
    const { error } = await supabase.from('music_connections').upsert(
      {
        user_id: userId,
        platform: 'spotify',
        is_connected: true,
        access_token_encrypted: encryptToken(tokenData.access_token),
        refresh_token_encrypted: encryptToken(tokenData.refresh_token),
        token_expires_at: expiresAt.toISOString(),
        connected_at: new Date().toISOString(),
        last_used_at: new Date().toISOString(),
      },
      {
        onConflict: 'user_id',
      }
    );

    if (error) throw error;
  } catch (error) {
    console.error('Failed to handle Spotify callback:', error);
    throw error;
  }
}

/**
 * Disconnect Spotify account
 */
export async function disconnectSpotify(userId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('music_connections')
      .update({
        is_connected: false,
        access_token_encrypted: null,
        refresh_token_encrypted: null,
        token_expires_at: null,
      })
      .eq('user_id', userId)
      .eq('platform', 'spotify');

    if (error) throw error;

    // Also delete all playlists for this user
    await supabase
      .from('workout_playlists')
      .delete()
      .eq('user_id', userId)
      .eq('platform', 'spotify');
  } catch (error) {
    console.error('Failed to disconnect Spotify:', error);
    throw error;
  }
}

/**
 * Get user's Spotify playlists
 */
export async function getUserPlaylists(userId: string): Promise<SpotifyPlaylist[]> {
  try {
    const data = await spotifyApi.getUserPlaylists(userId);
    return data.items || [];
  } catch (error) {
    console.error('Failed to fetch user playlists:', error);
    throw error;
  }
}

/**
 * Get tracks from a playlist
 */
export async function getPlaylistTracks(
  userId: string,
  playlistId: string
): Promise<SpotifyTrack[]> {
  try {
    const data = await spotifyApi.getPlaylistTracks(userId, playlistId);
    return data.items?.map((item: any) => item.track) || [];
  } catch (error) {
    console.error('Failed to fetch playlist tracks:', error);
    throw error;
  }
}

/**
 * Create a new workout playlist
 */
export async function createWorkoutPlaylist(
  userId: string,
  name: string,
  trackUris: string[],
  description = 'Created with WorkoutApp'
): Promise<SpotifyPlaylist> {
  try {
    // Create playlist on Spotify
    const playlist = await spotifyApi.createPlaylist(userId, name, description, true);

    // Add tracks if provided
    if (trackUris.length > 0) {
      await spotifyApi.addTracksToPlaylist(userId, playlist.id, trackUris);
    }

    // Save to our database
    await savePlaylistToDatabase(userId, playlist, null);

    return playlist;
  } catch (error) {
    console.error('Failed to create workout playlist:', error);
    throw error;
  }
}

/**
 * Save playlist reference to database
 */
export async function savePlaylistToDatabase(
  userId: string,
  playlist: SpotifyPlaylist,
  workoutId: string | null
): Promise<void> {
  try {
    const { error } = await supabase.from('workout_playlists').upsert(
      {
        user_id: userId,
        workout_id: workoutId,
        playlist_name: playlist.name,
        platform_playlist_id: playlist.id,
        platform: 'spotify',
        track_count: playlist.tracks.total,
        playlist_url: playlist.external_urls.spotify,
        cover_image_url: playlist.images[0]?.url || null,
      },
      {
        onConflict: 'user_id,platform_playlist_id,platform',
      }
    );

    if (error) throw error;
  } catch (error) {
    console.error('Failed to save playlist to database:', error);
    throw error;
  }
}

/**
 * Get currently playing track
 */
export async function getCurrentlyPlaying(userId: string): Promise<any> {
  try {
    return await spotifyApi.getCurrentlyPlaying(userId);
  } catch (error) {
    console.error('Failed to get currently playing:', error);
    return null;
  }
}

/**
 * Start playback
 */
export async function play(userId: string, playlistUri?: string): Promise<void> {
  try {
    await spotifyApi.play(userId, playlistUri);

    // Update last_used_at
    await supabase
      .from('music_connections')
      .update({ last_used_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('platform', 'spotify');
  } catch (error) {
    console.error('Failed to start playback:', error);
    throw error;
  }
}

/**
 * Pause playback
 */
export async function pause(userId: string): Promise<void> {
  try {
    await spotifyApi.pause(userId);
  } catch (error) {
    console.error('Failed to pause playback:', error);
    throw error;
  }
}

/**
 * Skip to next track
 */
export async function skipToNext(userId: string): Promise<void> {
  try {
    await spotifyApi.skipToNext(userId);
  } catch (error) {
    console.error('Failed to skip to next:', error);
    throw error;
  }
}

/**
 * Skip to previous track
 */
export async function skipToPrevious(userId: string): Promise<void> {
  try {
    await spotifyApi.skipToPrevious(userId);
  } catch (error) {
    console.error('Failed to skip to previous:', error);
    throw error;
  }
}

/**
 * Set volume
 */
export async function setVolume(userId: string, volumePercent: number): Promise<void> {
  try {
    await spotifyApi.setVolume(userId, volumePercent);
  } catch (error) {
    console.error('Failed to set volume:', error);
    throw error;
  }
}

/**
 * Get recommended workout tracks based on energy level
 */
export async function getRecommendedWorkoutTracks(
  userId: string,
  energy: 'low' | 'medium' | 'high'
): Promise<SpotifyTrack[]> {
  try {
    // Get user's top tracks as seeds
    const topTracks = await spotifyApi.getUserTopTracks(userId, 5);
    const seedTracks = topTracks.items.slice(0, 2).map((track: any) => track.id);

    // Energy mapping
    const energyMap = {
      low: 0.3,
      medium: 0.6,
      high: 0.9,
    };

    // Tempo mapping
    const tempoMap = {
      low: 100,
      medium: 130,
      high: 160,
    };

    const recommendations = await spotifyApi.getRecommendations(userId, {
      seed_tracks: seedTracks,
      seed_genres: ['work-out', 'power-workout'],
      target_energy: energyMap[energy],
      target_tempo: tempoMap[energy],
      limit: 20,
    });

    return recommendations.tracks || [];
  } catch (error) {
    console.error('Failed to get recommended tracks:', error);
    throw error;
  }
}

/**
 * Search for tracks
 */
export async function searchTracks(userId: string, query: string): Promise<SpotifyTrack[]> {
  try {
    const data = await spotifyApi.searchTracks(userId, query);
    return data.tracks?.items || [];
  } catch (error) {
    console.error('Failed to search tracks:', error);
    throw error;
  }
}

/**
 * Check if Spotify is connected for user
 */
export async function isSpotifyConnected(userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('music_connections')
      .select('is_connected')
      .eq('user_id', userId)
      .eq('platform', 'spotify')
      .single();

    if (error) return false;
    return data?.is_connected || false;
  } catch (error) {
    return false;
  }
}

/**
 * Get Spotify connection details
 */
export async function getSpotifyConnection(userId: string) {
  try {
    const { data, error } = await supabase
      .from('music_connections')
      .select('*')
      .eq('user_id', userId)
      .eq('platform', 'spotify')
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Failed to get Spotify connection:', error);
    return null;
  }
}
