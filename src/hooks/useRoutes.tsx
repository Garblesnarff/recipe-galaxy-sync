/**
 * useRoutes Hook
 * Manages saved routes and route operations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getSavedRoutes,
  getSavedRoute,
  saveRoute,
  updateRoute,
  deleteRoute,
  duplicateRoute,
  findNearbyRoutes,
  getPopularRoutes,
  searchRoutes,
  getRouteCompletions,
  type SavedRoute,
  type SaveRouteData,
} from '@/services/gps/savedRoutes';
import { useAuth } from './useAuth';

/**
 * Hook for fetching saved routes
 */
export function useSavedRoutes() {
  const { session } = useAuth();
  const userId = session?.user?.id;

  return useQuery({
    queryKey: ['saved-routes', userId],
    queryFn: () => {
      if (!userId) throw new Error('User not authenticated');
      return getSavedRoutes(userId);
    },
    enabled: !!userId,
  });
}

/**
 * Hook for fetching a single saved route
 */
export function useSavedRoute(routeId: string | undefined) {
  return useQuery({
    queryKey: ['saved-route', routeId],
    queryFn: () => {
      if (!routeId) throw new Error('Route ID required');
      return getSavedRoute(routeId);
    },
    enabled: !!routeId,
  });
}

/**
 * Hook for saving a new route
 */
export function useSaveRoute() {
  const { session } = useAuth();
  const userId = session?.user?.id;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (routeData: SaveRouteData) => {
      if (!userId) throw new Error('User not authenticated');
      return await saveRoute(userId, routeData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-routes'] });
    },
  });
}

/**
 * Hook for updating a route
 */
export function useUpdateRoute() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      routeId,
      updates,
    }: {
      routeId: string;
      updates: Partial<Omit<SavedRoute, 'id' | 'user_id' | 'created_at'>>;
    }) => {
      return await updateRoute(routeId, updates);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['saved-routes'] });
      queryClient.invalidateQueries({ queryKey: ['saved-route', variables.routeId] });
    },
  });
}

/**
 * Hook for deleting a route
 */
export function useDeleteRoute() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (routeId: string) => {
      return await deleteRoute(routeId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-routes'] });
    },
  });
}

/**
 * Hook for duplicating a route
 */
export function useDuplicateRoute() {
  const { session } = useAuth();
  const userId = session?.user?.id;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (routeId: string) => {
      if (!userId) throw new Error('User not authenticated');
      return await duplicateRoute(routeId, userId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-routes'] });
    },
  });
}

/**
 * Hook for finding nearby routes
 */
export function useNearbyRoutes(
  location: { lat: number; lng: number } | null,
  radiusKm: number = 10
) {
  return useQuery({
    queryKey: ['nearby-routes', location, radiusKm],
    queryFn: () => {
      if (!location) throw new Error('Location required');
      return findNearbyRoutes(location, radiusKm);
    },
    enabled: !!location,
  });
}

/**
 * Hook for fetching popular routes
 */
export function usePopularRoutes(limit: number = 10) {
  return useQuery({
    queryKey: ['popular-routes', limit],
    queryFn: () => getPopularRoutes(limit),
  });
}

/**
 * Hook for searching routes
 */
export function useSearchRoutes(query: string) {
  const { session } = useAuth();
  const userId = session?.user?.id;

  return useQuery({
    queryKey: ['search-routes', userId, query],
    queryFn: () => {
      if (!userId) throw new Error('User not authenticated');
      return searchRoutes(userId, query);
    },
    enabled: !!userId && query.length > 0,
  });
}

/**
 * Hook for fetching route completions
 */
export function useRouteCompletions(routeId: string | undefined) {
  const { session } = useAuth();
  const userId = session?.user?.id;

  return useQuery({
    queryKey: ['route-completions', routeId, userId],
    queryFn: () => {
      if (!routeId || !userId) throw new Error('Route ID and user required');
      return getRouteCompletions(routeId, userId);
    },
    enabled: !!routeId && !!userId,
  });
}

/**
 * Combined hook with all route operations
 */
export function useRoutes() {
  const savedRoutes = useSavedRoutes();
  const saveRouteMutation = useSaveRoute();
  const updateRouteMutation = useUpdateRoute();
  const deleteRouteMutation = useDeleteRoute();
  const duplicateRouteMutation = useDuplicateRoute();

  return {
    // Queries
    routes: savedRoutes.data,
    isLoading: savedRoutes.isLoading,
    error: savedRoutes.error,

    // Mutations
    saveRoute: saveRouteMutation.mutate,
    updateRoute: updateRouteMutation.mutate,
    deleteRoute: deleteRouteMutation.mutate,
    duplicateRoute: duplicateRouteMutation.mutate,

    // Loading states
    isSaving: saveRouteMutation.isPending,
    isUpdating: updateRouteMutation.isPending,
    isDeleting: deleteRouteMutation.isPending,
    isDuplicating: duplicateRouteMutation.isPending,
  };
}
