/**
 * React Query hooks for AI workout generation
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import {
  generateWorkoutWithAI,
  saveGeneratedWorkout,
  saveAIPreferences,
  getAIPreferences,
  getAIGeneratedWorkouts,
  WorkoutGenerationParams,
  AIWorkoutPlan,
  AIWorkoutPreferences,
} from '@/services/ai/workoutGenerator';
import { useToast } from '@/hooks/use-toast';

/**
 * Hook for generating AI workouts
 */
export function useGenerateWorkout() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: Omit<WorkoutGenerationParams, 'userId'>) => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      const fullParams: WorkoutGenerationParams = {
        ...params,
        userId: user.id,
      };

      // Generate the workout
      const workoutPlan = await generateWorkoutWithAI(fullParams);

      // Save to database
      const workoutId = await saveGeneratedWorkout(
        user.id,
        workoutPlan,
        JSON.stringify(params),
        'anthropic-claude-3-5-sonnet'
      );

      return { workoutPlan, workoutId };
    },
    onSuccess: (data) => {
      toast({
        title: 'Workout Generated!',
        description: `"${data.workoutPlan.title}" has been created and saved to your workouts.`,
      });

      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
      queryClient.invalidateQueries({ queryKey: ['ai-workouts'] });
    },
    onError: (error: Error) => {
      console.error('Error generating workout:', error);
      toast({
        title: 'Generation Failed',
        description: error.message || 'Failed to generate workout. Please try again.',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook for fetching AI preferences
 */
export function useAIPreferences() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['ai-preferences', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      return await getAIPreferences(user.id);
    },
    enabled: !!user?.id,
  });
}

/**
 * Hook for saving AI preferences
 */
export function useSavePreferences() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (preferences: Omit<AIWorkoutPreferences, 'user_id'>) => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      await saveAIPreferences(user.id, preferences);
    },
    onSuccess: () => {
      toast({
        title: 'Preferences Saved',
        description: 'Your AI workout preferences have been updated.',
      });

      queryClient.invalidateQueries({ queryKey: ['ai-preferences'] });
    },
    onError: (error: Error) => {
      console.error('Error saving preferences:', error);
      toast({
        title: 'Save Failed',
        description: error.message || 'Failed to save preferences. Please try again.',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook for fetching AI-generated workouts
 */
export function useAIGeneratedWorkouts(limit: number = 10) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['ai-workouts', user?.id, limit],
    queryFn: async () => {
      if (!user?.id) return [];
      return await getAIGeneratedWorkouts(user.id, limit);
    },
    enabled: !!user?.id,
  });
}

/**
 * Hook for quick generation using saved preferences
 */
export function useQuickGenerate() {
  const { data: preferences } = useAIPreferences();
  const generateWorkout = useGenerateWorkout();

  const quickGenerate = () => {
    if (!preferences) {
      throw new Error('No preferences saved. Please set your preferences first.');
    }

    return generateWorkout.mutateAsync({
      fitnessLevel: preferences.fitness_level,
      goals: preferences.goals,
      duration: preferences.workout_duration_preference,
      equipment: preferences.available_equipment,
      injuriesLimitations: preferences.injuries_limitations,
    });
  };

  return {
    quickGenerate,
    isLoading: generateWorkout.isPending,
    hasPreferences: !!preferences,
  };
}
