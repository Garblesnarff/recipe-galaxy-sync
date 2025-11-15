
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ExerciseFilters, Exercise } from "@/types/workout";
import { toast } from "sonner";

export const useExerciseLibrary = (userId: string | null) => {
  const queryClient = useQueryClient();

  const [filters, setFilters] = useState<ExerciseFilters>({
    categories: [],
    muscle_groups: [],
    equipment: [],
    difficulty: null,
    custom_only: false,
    searchQuery: "",
  });

  const { data: exercises, isLoading, error } = useQuery({
    queryKey: ['exercises', filters, userId],
    queryFn: async () => {
      let query = supabase
        .from('exercises')
        .select('*');

      // Apply search filter
      if (filters.searchQuery) {
        query = query.or(`name.ilike.%${filters.searchQuery}%,description.ilike.%${filters.searchQuery}%`);
      }

      // Apply category filter
      if (filters.categories.length > 0) {
        query = query.in('category', filters.categories);
      }

      // Apply muscle groups filter
      if (filters.muscle_groups.length > 0) {
        query = query.overlaps('muscle_groups', filters.muscle_groups);
      }

      // Apply equipment filter
      if (filters.equipment.length > 0) {
        query = query.overlaps('equipment', filters.equipment);
      }

      // Apply difficulty filter
      if (filters.difficulty) {
        query = query.eq('difficulty', filters.difficulty);
      }

      // Apply custom only filter
      if (filters.custom_only && userId) {
        query = query.eq('user_id', userId);
      } else if (userId) {
        // Show both global exercises and user's custom exercises
        query = query.or(`is_custom.eq.false,user_id.eq.${userId}`);
      } else {
        // Show only global exercises for non-authenticated users
        query = query.eq('is_custom', false);
      }

      // Sort by name
      query = query.order('name', { ascending: true });

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    }
  });

  const createExerciseMutation = useMutation({
    mutationFn: async (exerciseData: Omit<Exercise, 'id' | 'created_at' | 'updated_at'>) => {
      if (!userId) throw new Error("User must be logged in to create custom exercises");

      const { data, error } = await supabase
        .from("exercises")
        .insert({
          ...exerciseData,
          user_id: userId,
          is_custom: true,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exercises"] });
      toast.success("Custom exercise created successfully!");
    },
    onError: (error) => {
      console.error("Error creating exercise:", error);
      toast.error(error instanceof Error ? error.message : "Failed to create exercise");
    },
  });

  const updateFiltersMutation = (newFilters: Partial<ExerciseFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  return {
    exercises: exercises || [],
    isLoading,
    error,
    filters,
    setFilters,
    updateFilters: updateFiltersMutation,
    createExercise: createExerciseMutation.mutate,
    isCreatingExercise: createExerciseMutation.isPending,
  };
};
