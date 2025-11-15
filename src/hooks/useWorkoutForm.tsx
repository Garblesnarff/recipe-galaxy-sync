
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { WorkoutFormData, ExerciseFormData } from "@/types/workout";
import { toast } from "sonner";

export const useWorkoutForm = (userId: string | null, initialWorkout?: any) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<WorkoutFormData>({
    title: initialWorkout?.title || "",
    description: initialWorkout?.description || "",
    duration_minutes: initialWorkout?.duration_minutes || 30,
    difficulty: initialWorkout?.difficulty || "Beginner",
    workout_type: initialWorkout?.workout_type || "Strength",
    target_muscle_groups: initialWorkout?.target_muscle_groups || [],
    equipment_needed: initialWorkout?.equipment_needed || [],
    calories_estimate: initialWorkout?.calories_estimate || 0,
    image_url: initialWorkout?.image_url || "",
    is_template: initialWorkout?.is_template || false,
  });

  const [exercises, setExercises] = useState<ExerciseFormData[]>(
    initialWorkout?.exercises?.map((ex: any, index: number) => ({
      exercise_name: ex.exercise_name,
      sets: ex.sets || 3,
      reps: ex.reps || 10,
      duration_seconds: ex.duration_seconds || 0,
      rest_seconds: ex.rest_seconds || 60,
      weight_kg: ex.weight_kg || 0,
      notes: ex.notes || "",
      order_index: index,
    })) || []
  );

  const addExercise = (exercise: Omit<ExerciseFormData, 'order_index'>) => {
    setExercises(prev => [
      ...prev,
      { ...exercise, order_index: prev.length }
    ]);
  };

  const removeExercise = (index: number) => {
    setExercises(prev =>
      prev
        .filter((_, i) => i !== index)
        .map((ex, i) => ({ ...ex, order_index: i }))
    );
  };

  const reorderExercises = (startIndex: number, endIndex: number) => {
    setExercises(prev => {
      const result = Array.from(prev);
      const [removed] = result.splice(startIndex, 1);
      result.splice(endIndex, 0, removed);
      return result.map((ex, i) => ({ ...ex, order_index: i }));
    });
  };

  const updateExercise = (index: number, updates: Partial<ExerciseFormData>) => {
    setExercises(prev =>
      prev.map((ex, i) => i === index ? { ...ex, ...updates } : ex)
    );
  };

  const saveWorkoutMutation = useMutation({
    mutationFn: async ({ workoutData, exercises }: { workoutData: WorkoutFormData; exercises: ExerciseFormData[] }) => {
      if (!userId) throw new Error("User ID is required");

      // Create or update workout
      const workoutPayload = {
        ...workoutData,
        user_id: userId,
      };

      let workoutId: string;

      if (initialWorkout?.id) {
        // Update existing workout
        const { data, error } = await supabase
          .from("workouts")
          .update(workoutPayload)
          .eq("id", initialWorkout.id)
          .select()
          .single();

        if (error) throw error;
        workoutId = data.id;

        // Delete existing exercises
        await supabase
          .from("workout_exercises")
          .delete()
          .eq("workout_id", workoutId);
      } else {
        // Create new workout
        const { data, error } = await supabase
          .from("workouts")
          .insert(workoutPayload)
          .select()
          .single();

        if (error) throw error;
        workoutId = data.id;
      }

      // Insert exercises
      if (exercises.length > 0) {
        const exercisePayload = exercises.map(ex => ({
          workout_id: workoutId,
          exercise_name: ex.exercise_name,
          sets: ex.sets,
          reps: ex.reps,
          duration_seconds: ex.duration_seconds,
          rest_seconds: ex.rest_seconds,
          weight_kg: ex.weight_kg,
          notes: ex.notes,
          order_index: ex.order_index,
        }));

        const { error: exercisesError } = await supabase
          .from("workout_exercises")
          .insert(exercisePayload);

        if (exercisesError) throw exercisesError;
      }

      return workoutId;
    },
    onSuccess: (workoutId) => {
      queryClient.invalidateQueries({ queryKey: ["workouts"] });
      queryClient.invalidateQueries({ queryKey: ["workout", workoutId] });
      toast.success(initialWorkout ? "Workout updated successfully!" : "Workout created successfully!");
      navigate(`/workouts/${workoutId}`);
    },
    onError: (error) => {
      console.error("Error saving workout:", error);
      toast.error(error instanceof Error ? error.message : "Failed to save workout");
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) {
      toast.error("You must be logged in to create a workout.");
      return;
    }
    setIsSubmitting(true);

    try {
      await saveWorkoutMutation.mutateAsync({ workoutData: formData, exercises });
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    formData,
    setFormData,
    exercises,
    addExercise,
    removeExercise,
    reorderExercises,
    updateExercise,
    handleSubmit,
    isSubmitting,
  };
};
