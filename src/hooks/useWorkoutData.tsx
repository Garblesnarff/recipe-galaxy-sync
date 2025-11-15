
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { WorkoutFilters, WorkoutSortOption } from "@/types/workout";

export const useWorkoutData = (filters: WorkoutFilters, sortOption: WorkoutSortOption) => {
  return useQuery({
    queryKey: ['workouts', filters, sortOption],
    queryFn: async () => {
      let query = supabase
        .from('workouts')
        .select('*');

      // Apply search filter
      if (filters.searchQuery) {
        query = query.or(`title.ilike.%${filters.searchQuery}%,description.ilike.%${filters.searchQuery}%`);
      }

      // Apply workout types filter
      if (filters.workout_types.length > 0) {
        query = query.in('workout_type', filters.workout_types);
      }

      // Apply difficulty filter
      if (filters.difficulty) {
        query = query.eq('difficulty', filters.difficulty);
      }

      // Apply target muscle groups filter
      if (filters.target_muscle_groups.length > 0) {
        query = query.overlaps('target_muscle_groups', filters.target_muscle_groups);
      }

      // Apply equipment filter
      if (filters.equipment_needed.length > 0) {
        query = query.overlaps('equipment_needed', filters.equipment_needed);
      }

      // Apply favorites filter
      if (filters.favorite_only) {
        query = query.eq('is_favorite', true);
      }

      // Apply template filter
      if (filters.template_only) {
        query = query.eq('is_template', true);
      }

      // Apply sorting
      query = query.order(sortOption.value, { ascending: sortOption.direction === 'asc' });

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    }
  });
};
