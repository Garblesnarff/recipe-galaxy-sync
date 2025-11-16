/**
 * Spotify Web API Client
 * Handles all Spotify API requests with automatic token refresh
 */

import { refreshAccessToken, decryptToken, encryptToken } from './spotifyAuth';
import { supabase } from '@/integrations/supabase/client';

const SPOTIFY_API_BASE = 'https://api.spotify.com/v1';

export interface SpotifyApiError extends Error {
  status?: number;
  spotifyError?: any;
}

/**
 * Get valid access token for user
 * Automatically refreshes if expired
 */
async function getValidAccessToken(userId: string): Promise<string> {
  // Fetch connection from database
  const { data: connection, error } = await supabase
    .from('music_connections')
    .select('*')
    .eq('user_id', userId)
    .eq('platform', 'spotify')
    .single();

  if (error || !connection) {
    throw new Error('Spotify not connected');
  }

  const now = new Date();
  const expiresAt = new Date(connection.token_expires_at);

  // Check if token is expired or about to expire (within 5 minutes)
  if (expiresAt.getTime() - now.getTime() < 5 * 60 * 1000) {
    // Token expired, refresh it
    const refreshToken = decryptToken(connection.refresh_token_encrypted);
    const refreshedData = await refreshAccessToken(refreshToken);

    // Update database with new access token
    const newExpiresAt = new Date(now.getTime() + refreshedData.expires_in * 1000);

    await supabase
      .from('music_connections')
      .update({
        access_token_encrypted: encryptToken(refreshedData.access_token),
        token_expires_at: newExpiresAt.toISOString(),
        updated_at: now.toISOString(),
      })
      .eq('user_id', userId)
      .eq('platform', 'spotify');

    return refreshedData.access_token;
  }

  return decryptToken(connection.access_token_encrypted);
}

/**
 * Make authenticated request to Spotify API
 */
async function spotifyFetch(
  userId: string,
  endpoint: string,
  options: RequestInit = {}
): Promise<any> {
  const accessToken = await getValidAccessToken(userId);

  const url = endpoint.startsWith('http') ? endpoint : `${SPOTIFY_API_BASE}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  // Handle rate limiting
  if (response.status === 429) {
    const retryAfter = response.headers.get('Retry-After');
    const error: SpotifyApiError = new Error(
      `Rate limited. Retry after ${retryAfter} seconds`
    );
    error.status = 429;
    throw error;
  }

  // Handle unauthorized (shouldn't happen with auto-refresh, but just in case)
  if (response.status === 401) {
    const error: SpotifyApiError = new Error('Unauthorized. Please reconnect Spotify.');
    error.status = 401;
    throw error;
  }

  // No content responses (like 204 for some control endpoints)
  if (response.status === 204) {
    return null;
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const error: SpotifyApiError = new Error(
      errorData.error?.message || `Spotify API error: ${response.status}`
    );
    error.status = response.status;
    error.spotifyError = errorData;
    throw error;
  }

  return await response.json();
}

// ===== User Profile =====

export async function getCurrentUserProfile(userId: string) {
  return await spotifyFetch(userId, '/me');
}

// ===== Playlists =====

export async function getUserPlaylists(userId: string, limit = 50) {
  return await spotifyFetch(userId, `/me/playlists?limit=${limit}`);
}

export async function getPlaylist(userId: string, playlistId: string) {
  return await spotifyFetch(userId, `/playlists/${playlistId}`);
}

export async function getPlaylistTracks(userId: string, playlistId: string) {
  return await spotifyFetch(userId, `/playlists/${playlistId}/tracks`);
}

export async function createPlaylist(
  userId: string,
  name: string,
  description?: string,
  isPublic = true
) {
  const profile = await getCurrentUserProfile(userId);
  return await spotifyFetch(userId, `/users/${profile.id}/playlists`, {
    method: 'POST',
    body: JSON.stringify({
      name,
      description,
      public: isPublic,
    }),
  });
}

export async function addTracksToPlaylist(
  userId: string,
  playlistId: string,
  trackUris: string[]
) {
  return await spotifyFetch(userId, `/playlists/${playlistId}/tracks`, {
    method: 'POST',
    body: JSON.stringify({
      uris: trackUris,
    }),
  });
}

// ===== Playback Control =====

export async function getPlaybackState(userId: string) {
  return await spotifyFetch(userId, '/me/player');
}

export async function getCurrentlyPlaying(userId: string) {
  return await spotifyFetch(userId, '/me/player/currently-playing');
}

export async function play(userId: string, contextUri?: string, uris?: string[]) {
  const body: any = {};
  if (contextUri) body.context_uri = contextUri;
  if (uris) body.uris = uris;

  return await spotifyFetch(userId, '/me/player/play', {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

export async function pause(userId: string) {
  return await spotifyFetch(userId, '/me/player/pause', {
    method: 'PUT',
  });
}

export async function skipToNext(userId: string) {
  return await spotifyFetch(userId, '/me/player/next', {
    method: 'POST',
  });
}

export async function skipToPrevious(userId: string) {
  return await spotifyFetch(userId, '/me/player/previous', {
    method: 'POST',
  });
}

export async function setVolume(userId: string, volumePercent: number) {
  return await spotifyFetch(
    userId,
    `/me/player/volume?volume_percent=${Math.round(volumePercent)}`,
    {
      method: 'PUT',
    }
  );
}

export async function seek(userId: string, positionMs: number) {
  return await spotifyFetch(
    userId,
    `/me/player/seek?position_ms=${positionMs}`,
    {
      method: 'PUT',
    }
  );
}

// ===== Search =====

export async function searchTracks(userId: string, query: string, limit = 20) {
  const encodedQuery = encodeURIComponent(query);
  return await spotifyFetch(
    userId,
    `/search?q=${encodedQuery}&type=track&limit=${limit}`
  );
}

// ===== Recommendations =====

export async function getRecommendations(
  userId: string,
  params: {
    seed_tracks?: string[];
    seed_artists?: string[];
    seed_genres?: string[];
    target_energy?: number;
    target_tempo?: number;
    limit?: number;
  }
) {
  const queryParams = new URLSearchParams();

  if (params.seed_tracks) queryParams.append('seed_tracks', params.seed_tracks.join(','));
  if (params.seed_artists) queryParams.append('seed_artists', params.seed_artists.join(','));
  if (params.seed_genres) queryParams.append('seed_genres', params.seed_genres.join(','));
  if (params.target_energy !== undefined) queryParams.append('target_energy', params.target_energy.toString());
  if (params.target_tempo !== undefined) queryParams.append('target_tempo', params.target_tempo.toString());
  if (params.limit) queryParams.append('limit', params.limit.toString());

  return await spotifyFetch(userId, `/recommendations?${queryParams.toString()}`);
}

export async function getAvailableGenreSeeds(userId: string) {
  return await spotifyFetch(userId, '/recommendations/available-genre-seeds');
}

// ===== User's Top Items =====

export async function getUserTopTracks(userId: string, limit = 20, timeRange: 'short_term' | 'medium_term' | 'long_term' = 'medium_term') {
  return await spotifyFetch(userId, `/me/top/tracks?limit=${limit}&time_range=${timeRange}`);
}

// ===== Devices =====

export async function getAvailableDevices(userId: string) {
  return await spotifyFetch(userId, '/me/player/devices');
}

export async function transferPlayback(userId: string, deviceId: string, play = false) {
  return await spotifyFetch(userId, '/me/player', {
    method: 'PUT',
    body: JSON.stringify({
      device_ids: [deviceId],
      play,
    }),
  });
}
