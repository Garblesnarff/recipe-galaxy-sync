/**
 * Saved Routes Service
 * Manages user-saved routes for reuse
 */

import { supabase } from '@/integrations/supabase/client';
import { encodePolyline } from '@/lib/polyline';
import { GPSCoordinate } from '@/utils/geomath';

export interface SavedRoute {
  id: string;
  user_id: string;
  route_name: string;
  description?: string;
  distance_meters: number;
  elevation_gain_meters: number;
  route_polyline: string;
  start_location: string; // WKT format
  difficulty_level?: 'easy' | 'moderate' | 'hard';
  terrain_type?: 'road' | 'trail' | 'mixed';
  times_completed: number;
  average_completion_time?: string; // interval
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface SaveRouteData {
  route_name: string;
  description?: string;
  coordinates: GPSCoordinate[];
  distance_meters: number;
  elevation_gain_meters: number;
  difficulty_level?: 'easy' | 'moderate' | 'hard';
  terrain_type?: 'road' | 'trail' | 'mixed';
  is_public?: boolean;
}

/**
 * Save a new route
 * @param userId User ID
 * @param routeData Route data to save
 * @returns Saved route ID
 */
export async function saveRoute(userId: string, routeData: SaveRouteData): Promise<string> {
  try {
    // Encode polyline
    const polyline = encodePolyline(
      routeData.coordinates.map((c) => ({ lat: c.latitude, lng: c.longitude }))
    );

    // Get start location
    const startCoord = routeData.coordinates[0];
    const startLocation = `POINT(${startCoord.longitude} ${startCoord.latitude})`;

    const { data, error } = await supabase
      .from('saved_routes')
      .insert({
        user_id: userId,
        route_name: routeData.route_name,
        description: routeData.description,
        distance_meters: routeData.distance_meters,
        elevation_gain_meters: routeData.elevation_gain_meters,
        route_polyline: polyline,
        start_location: startLocation,
        difficulty_level: routeData.difficulty_level,
        terrain_type: routeData.terrain_type,
        is_public: routeData.is_public ?? false,
      })
      .select()
      .single();

    if (error) throw error;
    return data.id;
  } catch (error) {
    console.error('Error saving route:', error);
    throw error;
  }
}

/**
 * Get all saved routes for a user
 * @param userId User ID
 * @returns Array of saved routes
 */
export async function getSavedRoutes(userId: string): Promise<SavedRoute[]> {
  try {
    const { data, error } = await supabase
      .from('saved_routes')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching saved routes:', error);
    throw error;
  }
}

/**
 * Get a single saved route by ID
 * @param routeId Route ID
 * @returns Saved route or null
 */
export async function getSavedRoute(routeId: string): Promise<SavedRoute | null> {
  try {
    const { data, error } = await supabase
      .from('saved_routes')
      .select('*')
      .eq('id', routeId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching saved route:', error);
    throw error;
  }
}

/**
 * Update a saved route
 * @param routeId Route ID
 * @param updates Route updates
 */
export async function updateRoute(
  routeId: string,
  updates: Partial<Omit<SavedRoute, 'id' | 'user_id' | 'created_at'>>
): Promise<void> {
  try {
    const { error } = await supabase
      .from('saved_routes')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', routeId);

    if (error) throw error;
  } catch (error) {
    console.error('Error updating route:', error);
    throw error;
  }
}

/**
 * Delete a saved route
 * @param routeId Route ID
 */
export async function deleteRoute(routeId: string): Promise<void> {
  try {
    const { error } = await supabase.from('saved_routes').delete().eq('id', routeId);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting route:', error);
    throw error;
  }
}

/**
 * Duplicate a route (create a copy)
 * @param routeId Route ID to duplicate
 * @param userId User ID
 * @returns New route ID
 */
export async function duplicateRoute(routeId: string, userId: string): Promise<string> {
  try {
    // Get original route
    const original = await getSavedRoute(routeId);
    if (!original) {
      throw new Error('Route not found');
    }

    // Create duplicate
    const { data, error } = await supabase
      .from('saved_routes')
      .insert({
        user_id: userId,
        route_name: `${original.route_name} (Copy)`,
        description: original.description,
        distance_meters: original.distance_meters,
        elevation_gain_meters: original.elevation_gain_meters,
        route_polyline: original.route_polyline,
        start_location: original.start_location,
        difficulty_level: original.difficulty_level,
        terrain_type: original.terrain_type,
        is_public: false, // Duplicates are private by default
      })
      .select()
      .single();

    if (error) throw error;
    return data.id;
  } catch (error) {
    console.error('Error duplicating route:', error);
    throw error;
  }
}

/**
 * Find routes near a specific location
 * @param location Location to search near
 * @param radiusKm Search radius in kilometers
 * @returns Array of nearby routes
 */
export async function findNearbyRoutes(
  location: { lat: number; lng: number },
  radiusKm: number = 10
): Promise<SavedRoute[]> {
  try {
    // Use PostGIS ST_DWithin for geospatial search
    // Note: ST_DWithin expects distance in degrees for geography type
    // Approximate conversion: 1 degree ≈ 111km
    const radiusDegrees = radiusKm / 111;

    const { data, error } = await supabase.rpc('find_nearby_routes', {
      search_lat: location.lat,
      search_lng: location.lng,
      radius_km: radiusKm,
    });

    if (error) {
      // Fallback: fetch all public routes and filter client-side
      console.warn('RPC function not available, using fallback:', error);
      const { data: allRoutes, error: fetchError } = await supabase
        .from('saved_routes')
        .select('*')
        .eq('is_public', true);

      if (fetchError) throw fetchError;
      return allRoutes || [];
    }

    return data || [];
  } catch (error) {
    console.error('Error finding nearby routes:', error);
    throw error;
  }
}

/**
 * Get popular public routes
 * @param limit Number of routes to return
 * @returns Array of popular routes
 */
export async function getPopularRoutes(limit: number = 10): Promise<SavedRoute[]> {
  try {
    const { data, error } = await supabase
      .from('saved_routes')
      .select('*')
      .eq('is_public', true)
      .order('times_completed', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching popular routes:', error);
    throw error;
  }
}

/**
 * Increment route completions counter
 * @param routeId Route ID
 * @param completionTime Completion time in seconds
 */
export async function incrementRouteCompletions(
  routeId: string,
  completionTime: number
): Promise<void> {
  try {
    // Get current route data
    const route = await getSavedRoute(routeId);
    if (!route) {
      throw new Error('Route not found');
    }

    // Update times_completed
    const { error } = await supabase
      .from('saved_routes')
      .update({
        times_completed: route.times_completed + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', routeId);

    if (error) throw error;
  } catch (error) {
    console.error('Error incrementing route completions:', error);
    throw error;
  }
}

/**
 * Search routes by name or description
 * @param userId User ID
 * @param query Search query
 * @returns Array of matching routes
 */
export async function searchRoutes(userId: string, query: string): Promise<SavedRoute[]> {
  try {
    const { data, error } = await supabase
      .from('saved_routes')
      .select('*')
      .eq('user_id', userId)
      .or(`route_name.ilike.%${query}%,description.ilike.%${query}%`)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error searching routes:', error);
    throw error;
  }
}

/**
 * Get route completions for a specific route
 * @param routeId Route ID
 * @param userId User ID
 * @returns Array of route completions
 */
export async function getRouteCompletions(
  routeId: string,
  userId: string
): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('route_completions')
      .select('*')
      .eq('saved_route_id', routeId)
      .eq('user_id', userId)
      .order('completed_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching route completions:', error);
    throw error;
  }
}
