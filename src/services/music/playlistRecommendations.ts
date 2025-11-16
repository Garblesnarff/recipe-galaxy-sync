/**
 * Playlist Recommendations Service
 * Recommends playlists based on workout type and characteristics
 */

import * as spotifyApi from '@/lib/spotifyApi';

/**
 * Workout type to genre mapping
 */
const WORKOUT_GENRE_MAP: Record<string, string[]> = {
  HIIT: ['work-out', 'power-workout', 'edm', 'hip-hop'],
  Cardio: ['running', 'work-out', 'dance', 'pop'],
  Strength: ['rock', 'metal', 'power-workout', 'hip-hop'],
  Yoga: ['chill', 'ambient', 'classical', 'acoustic'],
  Pilates: ['chill', 'acoustic', 'indie'],
  CrossFit: ['rock', 'metal', 'power-workout', 'hardcore'],
  Running: ['running', 'edm', 'pop', 'dance'],
  Cycling: ['electronic', 'edm', 'techno', 'dance'],
  Swimming: ['chill', 'electronic', 'ambient'],
  Stretching: ['chill', 'ambient', 'acoustic', 'classical'],
  Powerlifting: ['metal', 'rock', 'hardcore'],
  Bodybuilding: ['rock', 'hip-hop', 'power-workout'],
  Circuit: ['work-out', 'edm', 'hip-hop', 'rock'],
  Sports: ['work-out', 'rock', 'hip-hop', 'pop'],
  default: ['work-out', 'power-workout', 'edm'],
};

/**
 * Workout type to energy level mapping
 */
const WORKOUT_ENERGY_MAP: Record<string, 'low' | 'medium' | 'high'> = {
  HIIT: 'high',
  Cardio: 'high',
  Strength: 'medium',
  Yoga: 'low',
  Pilates: 'low',
  CrossFit: 'high',
  Running: 'high',
  Cycling: 'high',
  Swimming: 'medium',
  Stretching: 'low',
  Powerlifting: 'medium',
  Bodybuilding: 'medium',
  Circuit: 'high',
  Sports: 'high',
  default: 'medium',
};

/**
 * Get genres for a workout type
 */
export function getGenresByWorkoutType(workoutType: string): string[] {
  return WORKOUT_GENRE_MAP[workoutType] || WORKOUT_GENRE_MAP.default;
}

/**
 * Get energy level for a workout type
 */
export function getEnergyLevelForWorkout(
  workoutType: string
): 'low' | 'medium' | 'high' {
  return WORKOUT_ENERGY_MAP[workoutType] || WORKOUT_ENERGY_MAP.default;
}

/**
 * Calculate target tempo based on energy level
 */
function getTargetTempo(energyLevel: 'low' | 'medium' | 'high'): number {
  const tempoMap = {
    low: 90,
    medium: 120,
    high: 150,
  };
  return tempoMap[energyLevel];
}

/**
 * Calculate target energy value
 */
function getTargetEnergy(energyLevel: 'low' | 'medium' | 'high'): number {
  const energyMap = {
    low: 0.3,
    medium: 0.6,
    high: 0.85,
  };
  return energyMap[energyLevel];
}

/**
 * Recommend playlists for a workout
 */
export async function recommendPlaylistsForWorkout(
  userId: string,
  workoutType: string,
  durationMinutes: number
): Promise<any[]> {
  try {
    // Get appropriate genres and energy for this workout type
    const genres = getGenresByWorkoutType(workoutType);
    const energyLevel = getEnergyLevelForWorkout(workoutType);

    // Get user's top tracks for seed
    const topTracks = await spotifyApi.getUserTopTracks(userId, 5);
    const seedTracks = topTracks.items?.slice(0, 2).map((track: any) => track.id) || [];

    // Get recommendations
    const recommendations = await spotifyApi.getRecommendations(userId, {
      seed_tracks: seedTracks.length > 0 ? seedTracks : undefined,
      seed_genres: genres.slice(0, 3), // Spotify allows max 5 seeds total
      target_energy: getTargetEnergy(energyLevel),
      target_tempo: getTargetTempo(energyLevel),
      limit: 50,
    });

    // Also get user's existing playlists that might match
    const userPlaylists = await spotifyApi.getUserPlaylists(userId, 50);

    // Filter playlists that might be workout-related
    const workoutKeywords = [
      'workout',
      'gym',
      'fitness',
      'running',
      'cardio',
      'training',
      'exercise',
      'power',
      workoutType.toLowerCase(),
    ];

    const relevantPlaylists = userPlaylists.items?.filter((playlist: any) => {
      const name = playlist.name.toLowerCase();
      return workoutKeywords.some((keyword) => name.includes(keyword));
    });

    return [
      {
        type: 'recommendations',
        tracks: recommendations.tracks || [],
        suggestedName: `${workoutType} Workout Mix`,
      },
      ...(relevantPlaylists || []).map((playlist: any) => ({
        type: 'existing',
        playlist,
      })),
    ];
  } catch (error) {
    console.error('Failed to recommend playlists for workout:', error);
    return [];
  }
}

/**
 * Get recommended tracks for a specific workout characteristic
 */
export async function getTracksForWorkoutPhase(
  userId: string,
  phase: 'warmup' | 'main' | 'cooldown'
): Promise<any[]> {
  try {
    const phaseConfig = {
      warmup: {
        energy: 0.4,
        tempo: 100,
        genres: ['chill', 'pop', 'indie'],
      },
      main: {
        energy: 0.8,
        tempo: 140,
        genres: ['work-out', 'edm', 'rock'],
      },
      cooldown: {
        energy: 0.3,
        tempo: 80,
        genres: ['chill', 'ambient', 'acoustic'],
      },
    };

    const config = phaseConfig[phase];

    const recommendations = await spotifyApi.getRecommendations(userId, {
      seed_genres: config.genres,
      target_energy: config.energy,
      target_tempo: config.tempo,
      limit: 15,
    });

    return recommendations.tracks || [];
  } catch (error) {
    console.error(`Failed to get tracks for ${phase} phase:`, error);
    return [];
  }
}

/**
 * Create a balanced workout playlist with warm-up, main, and cool-down sections
 */
export async function createBalancedWorkoutPlaylist(
  userId: string,
  workoutType: string,
  durationMinutes: number,
  name?: string
): Promise<any> {
  try {
    // Calculate phase durations (warm-up: 10%, main: 75%, cool-down: 15%)
    const warmupDuration = Math.ceil(durationMinutes * 0.1);
    const mainDuration = Math.ceil(durationMinutes * 0.75);
    const cooldownDuration = Math.ceil(durationMinutes * 0.15);

    // Get tracks for each phase
    const [warmupTracks, mainTracks, cooldownTracks] = await Promise.all([
      getTracksForWorkoutPhase(userId, 'warmup'),
      getTracksForWorkoutPhase(userId, 'main'),
      getTracksForWorkoutPhase(userId, 'cooldown'),
    ]);

    // Calculate how many tracks we need for each phase (assuming ~3 min per track)
    const warmupCount = Math.max(2, Math.ceil(warmupDuration / 3));
    const mainCount = Math.max(5, Math.ceil(mainDuration / 3));
    const cooldownCount = Math.max(2, Math.ceil(cooldownDuration / 3));

    // Combine tracks
    const playlistTracks = [
      ...warmupTracks.slice(0, warmupCount),
      ...mainTracks.slice(0, mainCount),
      ...cooldownTracks.slice(0, cooldownCount),
    ];

    // Create playlist name
    const playlistName =
      name || `${workoutType} Workout - ${durationMinutes} min`;

    return {
      name: playlistName,
      tracks: playlistTracks,
      structure: {
        warmup: { count: warmupCount, duration: warmupDuration },
        main: { count: mainCount, duration: mainDuration },
        cooldown: { count: cooldownCount, duration: cooldownDuration },
      },
    };
  } catch (error) {
    console.error('Failed to create balanced workout playlist:', error);
    throw error;
  }
}

/**
 * Get popular workout playlists from Spotify
 */
export async function getPopularWorkoutPlaylists(
  userId: string,
  workoutType?: string
): Promise<any[]> {
  try {
    const searchQuery = workoutType
      ? `${workoutType} workout`
      : 'workout fitness gym';

    // Note: Spotify API doesn't have a direct "search playlists" endpoint for PKCE auth
    // This would need to be implemented using the search API with type=playlist
    // For now, return empty array - this would need Spotify Web API enhancement
    return [];
  } catch (error) {
    console.error('Failed to get popular workout playlists:', error);
    return [];
  }
}
