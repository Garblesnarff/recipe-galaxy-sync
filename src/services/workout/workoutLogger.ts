import { supabase } from "@/integrations/supabase/client";
import type { WorkoutLog } from "@/types/workout";
import { autoDetectAndSavePRs } from "./personalRecords";
import { updateUserStats, checkAchievements, type Achievement } from "./gamification";

/**
 * Creates a workout log with exercise performance data
 * Returns the workout log and any newly earned achievements
 */
export const logWorkout = async (workoutLogData: {
  log: {
    workout_id?: string;
    user_id: string;
    completed_at?: string;
    duration_minutes?: number;
    notes?: string;
    calories_burned?: number;
  };
  exercises: Array<{
    exercise_name: string;
    sets_completed?: number;
    reps_achieved: number[];
    weight_used: number[];
    duration_seconds?: number;
    notes?: string;
  }>;
}): Promise<{ log: WorkoutLog; newAchievements: Achievement[] }> => {
  try {
    // Create the workout log
    const { data: log, error: logError } = await supabase
      .from("workout_logs")
      .insert(workoutLogData.log)
      .select()
      .single();

    if (logError) throw logError;

    // Create the exercise logs if provided
    if (workoutLogData.exercises && workoutLogData.exercises.length > 0) {
      const exercisesToInsert = workoutLogData.exercises.map((exercise) => ({
        ...exercise,
        workout_log_id: log.id,
      }));

      const { error: exercisesError } = await supabase
        .from("workout_log_exercises")
        .insert(exercisesToInsert);

      if (exercisesError) throw exercisesError;
    }

    // Fetch the complete log with exercises and workout
    const { data: completeLog, error: fetchError } = await supabase
      .from("workout_logs")
      .select(`
        *,
        exercises:workout_log_exercises(*),
        workout:workouts(*)
      `)
      .eq("id", log.id)
      .single();

    if (fetchError) throw fetchError;

    // Auto-detect and save personal records
    let hasPR = false;
    if (workoutLogData.exercises && workoutLogData.exercises.length > 0) {
      const prs = await autoDetectAndSavePRs(
        workoutLogData.log.user_id,
        log.id,
        workoutLogData.exercises
      );
      hasPR = prs && prs.length > 0;
    }

    // Update gamification stats
    await updateUserStats(workoutLogData.log.user_id, {
      duration_minutes: workoutLogData.log.duration_minutes,
      calories_burned: workoutLogData.log.calories_burned,
      is_pr: hasPR,
    });

    // Check for new achievements
    const newAchievements = await checkAchievements(workoutLogData.log.user_id);

    return {
      log: completeLog as WorkoutLog,
      newAchievements,
    };
  } catch (error) {
    console.error("Exception logging workout:", error);
    throw error;
  }
};

/**
 * Fetches user's workout logs with optional filters
 */
export const fetchWorkoutLogs = async (
  userId: string,
  filters?: {
    startDate?: string;
    endDate?: string;
    workoutId?: string;
    limit?: number;
  }
) => {
  try {
    let query = supabase
      .from("workout_logs")
      .select(`
        *,
        exercises:workout_log_exercises(*),
        workout:workouts(*)
      `)
      .eq("user_id", userId);

    // Apply filters
    if (filters?.workoutId) {
      query = query.eq("workout_id", filters.workoutId);
    }

    if (filters?.startDate) {
      query = query.gte("completed_at", filters.startDate);
    }

    if (filters?.endDate) {
      query = query.lte("completed_at", filters.endDate);
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    // Order by most recent first
    query = query.order("completed_at", { ascending: false });

    const { data, error } = await query;

    if (error) throw error;
    return data as WorkoutLog[];
  } catch (error) {
    console.error("Exception fetching workout logs:", error);
    throw error;
  }
};

/**
 * Updates a workout log and its exercises
 */
export const updateWorkoutLog = async (
  logId: string,
  logData: {
    log?: {
      duration_minutes?: number;
      notes?: string;
      calories_burned?: number;
      completed_at?: string;
    };
    exercises?: Array<{
      id?: string;
      exercise_name: string;
      sets_completed?: number;
      reps_achieved: number[];
      weight_used: number[];
      duration_seconds?: number;
      notes?: string;
    }>;
  }
) => {
  try {
    // Update the log if log data is provided
    if (logData.log) {
      const { error: logError } = await supabase
        .from("workout_logs")
        .update(logData.log)
        .eq("id", logId);

      if (logError) throw logError;
    }

    // Update exercises if provided
    if (logData.exercises) {
      // Delete existing exercises
      const { error: deleteError } = await supabase
        .from("workout_log_exercises")
        .delete()
        .eq("workout_log_id", logId);

      if (deleteError) throw deleteError;

      // Insert new exercises
      if (logData.exercises.length > 0) {
        const exercisesToInsert = logData.exercises.map((exercise) => ({
          workout_log_id: logId,
          exercise_name: exercise.exercise_name,
          sets_completed: exercise.sets_completed,
          reps_achieved: exercise.reps_achieved,
          weight_used: exercise.weight_used,
          duration_seconds: exercise.duration_seconds,
          notes: exercise.notes,
        }));

        const { error: insertError } = await supabase
          .from("workout_log_exercises")
          .insert(exercisesToInsert);

        if (insertError) throw insertError;
      }
    }

    // Fetch and return the updated log
    const { data, error: fetchError } = await supabase
      .from("workout_logs")
      .select(`
        *,
        exercises:workout_log_exercises(*),
        workout:workouts(*)
      `)
      .eq("id", logId)
      .single();

    if (fetchError) throw fetchError;
    return data as WorkoutLog;
  } catch (error) {
    console.error("Exception updating workout log:", error);
    throw error;
  }
};

/**
 * Deletes a workout log and all associated exercise logs
 */
export const deleteWorkoutLog = async (logId: string) => {
  try {
    const { error } = await supabase
      .from("workout_logs")
      .delete()
      .eq("id", logId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error("Exception deleting workout log:", error);
    throw error;
  }
};
