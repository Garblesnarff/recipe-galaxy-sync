
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { WorkoutLogExercise } from "@/types/workout";
import { toast } from "sonner";

interface ExerciseLog {
  exercise_name: string;
  sets_completed: number;
  reps_achieved: number[];
  weight_used: number[];
  duration_seconds?: number;
  notes?: string;
}

export const useWorkoutLogger = (workoutId: string, userId: string | null) => {
  const queryClient = useQueryClient();
  const [exerciseLogs, setExerciseLogs] = useState<ExerciseLog[]>([]);
  const [workoutNotes, setWorkoutNotes] = useState("");
  const [caloriesBurned, setCaloriesBurned] = useState<number>(0);

  const initializeExerciseLog = (exerciseName: string, setsCount: number) => {
    const existingLog = exerciseLogs.find(log => log.exercise_name === exerciseName);

    if (!existingLog) {
      setExerciseLogs(prev => [...prev, {
        exercise_name: exerciseName,
        sets_completed: 0,
        reps_achieved: Array(setsCount).fill(0),
        weight_used: Array(setsCount).fill(0),
        notes: "",
      }]);
    }
  };

  const updateExerciseLog = (
    exerciseName: string,
    updates: Partial<ExerciseLog>
  ) => {
    setExerciseLogs(prev =>
      prev.map(log =>
        log.exercise_name === exerciseName
          ? { ...log, ...updates }
          : log
      )
    );
  };

  const updateSet = (
    exerciseName: string,
    setIndex: number,
    reps: number,
    weight: number
  ) => {
    setExerciseLogs(prev =>
      prev.map(log => {
        if (log.exercise_name === exerciseName) {
          const newReps = [...log.reps_achieved];
          const newWeights = [...log.weight_used];
          newReps[setIndex] = reps;
          newWeights[setIndex] = weight;

          // Count completed sets (any set with reps > 0)
          const completedSets = newReps.filter(r => r > 0).length;

          return {
            ...log,
            reps_achieved: newReps,
            weight_used: newWeights,
            sets_completed: completedSets,
          };
        }
        return log;
      })
    );
  };

  const submitWorkoutLogMutation = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error("User must be logged in to log workouts");

      // Create workout log entry
      const { data: workoutLog, error: logError } = await supabase
        .from("workout_logs")
        .insert({
          workout_id: workoutId,
          user_id: userId,
          completed_at: new Date().toISOString(),
          notes: workoutNotes,
          calories_burned: caloriesBurned || null,
        })
        .select()
        .single();

      if (logError) throw logError;

      // Insert exercise logs
      if (exerciseLogs.length > 0) {
        const exerciseLogPayload = exerciseLogs.map(log => ({
          workout_log_id: workoutLog.id,
          exercise_name: log.exercise_name,
          sets_completed: log.sets_completed,
          reps_achieved: log.reps_achieved,
          weight_used: log.weight_used,
          duration_seconds: log.duration_seconds,
          notes: log.notes,
        }));

        const { error: exerciseError } = await supabase
          .from("workout_log_exercises")
          .insert(exerciseLogPayload);

        if (exerciseError) throw exerciseError;
      }

      return workoutLog;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workout-logs"] });
      queryClient.invalidateQueries({ queryKey: ["workout-history"] });
      queryClient.invalidateQueries({ queryKey: ["workout-stats"] });
      toast.success("Workout logged successfully!");

      // Reset state
      setExerciseLogs([]);
      setWorkoutNotes("");
      setCaloriesBurned(0);
    },
    onError: (error) => {
      console.error("Error logging workout:", error);
      toast.error(error instanceof Error ? error.message : "Failed to log workout");
    },
  });

  const handleSubmitLog = async () => {
    if (!userId) {
      toast.error("You must be logged in to log workouts.");
      return;
    }

    if (exerciseLogs.length === 0) {
      toast.error("Please complete at least one exercise before logging.");
      return;
    }

    await submitWorkoutLogMutation.mutateAsync();
  };

  return {
    exerciseLogs,
    workoutNotes,
    setWorkoutNotes,
    caloriesBurned,
    setCaloriesBurned,
    initializeExerciseLog,
    updateExerciseLog,
    updateSet,
    handleSubmitLog,
    isSubmitting: submitWorkoutLogMutation.isPending,
  };
};
