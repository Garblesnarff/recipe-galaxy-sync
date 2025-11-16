/**
 * GPS Workouts Service
 * Manages GPS workout data storage and retrieval
 */

import { supabase } from '@/integrations/supabase/client';
import { GPSCoordinate } from '@/utils/geomath';
import { encodePolyline } from '@/lib/polyline';

export interface GPSWorkout {
  id: string;
  workout_log_id: string;
  route_name?: string;
  total_distance_meters: number;
  total_elevation_gain_meters: number;
  total_elevation_loss_meters: number;
  average_pace?: string;
  max_speed_kmh?: number;
  route_polyline: string;
  start_location?: string;
  end_location?: string;
  created_at: string;
}

export interface GPSWaypoint {
  id: string;
  gps_workout_id: string;
  timestamp: string;
  latitude: number;
  longitude: number;
  altitude?: number;
  accuracy: number;
  speed?: number;
  heart_rate?: number;
  sequence_number: number;
}

export interface SaveGPSWorkoutData {
  workout_log_id: string;
  route_name?: string;
  coordinates: GPSCoordinate[];
  total_distance_meters: number;
  total_elevation_gain_meters: number;
  total_elevation_loss_meters: number;
  average_pace?: string;
  max_speed_kmh?: number;
}

/**
 * Save GPS workout data
 * @param workoutLogId Workout log ID to associate with
 * @param routeData GPS route data
 */
export async function saveGPSWorkout(
  workoutLogId: string,
  routeData: SaveGPSWorkoutData
): Promise<void> {
  try {
    // Encode polyline
    const polyline = encodePolyline(
      routeData.coordinates.map((c) => ({ lat: c.latitude, lng: c.longitude }))
    );

    // Get start and end locations
    const startCoord = routeData.coordinates[0];
    const endCoord = routeData.coordinates[routeData.coordinates.length - 1];

    const startLocation = `POINT(${startCoord.longitude} ${startCoord.latitude})`;
    const endLocation = `POINT(${endCoord.longitude} ${endCoord.latitude})`;

    // Insert GPS workout
    const { data: gpsWorkout, error: workoutError } = await supabase
      .from('gps_workouts')
      .insert({
        workout_log_id: workoutLogId,
        route_name: routeData.route_name,
        total_distance_meters: routeData.total_distance_meters,
        total_elevation_gain_meters: routeData.total_elevation_gain_meters,
        total_elevation_loss_meters: routeData.total_elevation_loss_meters,
        average_pace: routeData.average_pace,
        max_speed_kmh: routeData.max_speed_kmh,
        route_polyline: polyline,
        start_location: startLocation,
        end_location: endLocation,
      })
      .select()
      .single();

    if (workoutError) throw workoutError;

    // Insert waypoints in batches (to avoid payload size limits)
    const batchSize = 100;
    for (let i = 0; i < routeData.coordinates.length; i += batchSize) {
      const batch = routeData.coordinates.slice(i, i + batchSize);
      const waypoints = batch.map((coord, index) => ({
        gps_workout_id: gpsWorkout.id,
        timestamp: new Date(coord.timestamp).toISOString(),
        latitude: coord.latitude,
        longitude: coord.longitude,
        altitude: coord.altitude,
        accuracy: coord.accuracy,
        speed: coord.speed,
        sequence_number: i + index,
      }));

      const { error: waypointsError } = await supabase
        .from('gps_waypoints')
        .insert(waypoints);

      if (waypointsError) throw waypointsError;
    }
  } catch (error) {
    console.error('Error saving GPS workout:', error);
    throw error;
  }
}

/**
 * Get GPS workout data by workout log ID
 * @param workoutLogId Workout log ID
 * @returns GPS workout data or null
 */
export async function getGPSWorkout(workoutLogId: string): Promise<GPSWorkout | null> {
  try {
    const { data, error } = await supabase
      .from('gps_workouts')
      .select('*')
      .eq('workout_log_id', workoutLogId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        return null;
      }
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error fetching GPS workout:', error);
    throw error;
  }
}

/**
 * Get GPS workout with waypoints
 * @param workoutLogId Workout log ID
 * @returns GPS workout with waypoints or null
 */
export async function getGPSWorkoutWithWaypoints(
  workoutLogId: string
): Promise<{ workout: GPSWorkout; waypoints: GPSWaypoint[] } | null> {
  try {
    const workout = await getGPSWorkout(workoutLogId);
    if (!workout) return null;

    const waypoints = await getWaypoints(workout.id);

    return { workout, waypoints };
  } catch (error) {
    console.error('Error fetching GPS workout with waypoints:', error);
    throw error;
  }
}

/**
 * Get waypoints for a GPS workout
 * @param gpsWorkoutId GPS workout ID
 * @returns Array of waypoints
 */
export async function getWaypoints(gpsWorkoutId: string): Promise<GPSWaypoint[]> {
  try {
    const { data, error } = await supabase
      .from('gps_waypoints')
      .select('*')
      .eq('gps_workout_id', gpsWorkoutId)
      .order('sequence_number', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching waypoints:', error);
    throw error;
  }
}

/**
 * Get all GPS workouts for a user
 * @param userId User ID
 * @returns Array of GPS workouts with workout log data
 */
export async function getAllGPSWorkouts(userId: string): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('gps_workouts')
      .select(`
        *,
        workout_log:workout_logs(*)
      `)
      .eq('workout_log.user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching GPS workouts:', error);
    throw error;
  }
}

/**
 * Delete GPS workout data
 * @param workoutLogId Workout log ID
 */
export async function deleteGPSWorkout(workoutLogId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('gps_workouts')
      .delete()
      .eq('workout_log_id', workoutLogId);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting GPS workout:', error);
    throw error;
  }
}

/**
 * Compare performance on a specific route across multiple attempts
 * @param routeId Saved route ID
 * @param userId User ID
 * @returns Performance comparison data
 */
export async function compareRoutePerformance(
  routeId: string,
  userId: string
): Promise<any> {
  try {
    // Get all completions for this route
    const { data: completions, error } = await supabase
      .from('route_completions')
      .select(`
        *,
        gps_workout:gps_workouts(*)
      `)
      .eq('saved_route_id', routeId)
      .eq('user_id', userId)
      .order('completed_at', { ascending: false });

    if (error) throw error;

    if (!completions || completions.length === 0) {
      return {
        total_attempts: 0,
        best_time: null,
        worst_time: null,
        average_time: null,
        best_pace: null,
        improvement: null,
      };
    }

    // Calculate statistics
    const times = completions.map((c) => parseInterval(c.completion_time));
    const paces = completions
      .map((c) => c.average_pace)
      .filter((p): p is string => p !== null);

    const bestTime = Math.min(...times);
    const worstTime = Math.max(...times);
    const averageTime = times.reduce((a, b) => a + b, 0) / times.length;

    const bestPace = paces.reduce((best, current) => {
      return paceToSeconds(current) < paceToSeconds(best) ? current : best;
    }, paces[0]);

    // Calculate improvement (first attempt vs latest)
    const improvement =
      completions.length > 1
        ? ((times[times.length - 1] - times[0]) / times[times.length - 1]) * 100
        : 0;

    return {
      total_attempts: completions.length,
      best_time: bestTime,
      worst_time: worstTime,
      average_time: averageTime,
      best_pace: bestPace,
      improvement: improvement.toFixed(1),
      recent_completions: completions.slice(0, 5),
    };
  } catch (error) {
    console.error('Error comparing route performance:', error);
    throw error;
  }
}

/**
 * Record a route completion
 * @param savedRouteId Saved route ID
 * @param gpsWorkoutId GPS workout ID
 * @param userId User ID
 * @param completionTime Completion time in seconds
 * @param averagePace Average pace string
 */
export async function recordRouteCompletion(
  savedRouteId: string,
  gpsWorkoutId: string,
  userId: string,
  completionTime: number,
  averagePace?: string
): Promise<void> {
  try {
    // Convert completion time to PostgreSQL interval
    const interval = `${completionTime} seconds`;

    const { error } = await supabase.from('route_completions').insert({
      saved_route_id: savedRouteId,
      gps_workout_id: gpsWorkoutId,
      user_id: userId,
      completion_time: interval,
      average_pace: averagePace,
    });

    if (error) throw error;
  } catch (error) {
    console.error('Error recording route completion:', error);
    throw error;
  }
}

/**
 * Parse PostgreSQL interval to seconds
 */
function parseInterval(interval: string): number {
  // Simple parser for intervals like "01:23:45" or "3600 seconds"
  if (interval.includes('seconds')) {
    return parseFloat(interval);
  }

  const parts = interval.split(':');
  if (parts.length === 3) {
    const [hours, minutes, seconds] = parts.map(parseFloat);
    return hours * 3600 + minutes * 60 + seconds;
  }

  return 0;
}

/**
 * Convert pace string to seconds per km
 */
function paceToSeconds(pace: string): number {
  const [minutes, seconds] = pace.split(':').map(Number);
  return minutes * 60 + seconds;
}

/**
 * Update GPS workout route name
 * @param workoutLogId Workout log ID
 * @param routeName New route name
 */
export async function updateGPSWorkoutRouteName(
  workoutLogId: string,
  routeName: string
): Promise<void> {
  try {
    const { error } = await supabase
      .from('gps_workouts')
      .update({ route_name: routeName })
      .eq('workout_log_id', workoutLogId);

    if (error) throw error;
  } catch (error) {
    console.error('Error updating GPS workout route name:', error);
    throw error;
  }
}
