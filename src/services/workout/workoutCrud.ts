import { supabase } from "@/integrations/supabase/client";
import type { Workout, WorkoutFilters, WorkoutSortOption } from "@/types/workout";

/**
 * Fetches user's workouts with optional filters and sorting
 */
export const fetchWorkouts = async (
  userId: string,
  filters?: Partial<WorkoutFilters>,
  sortOption?: WorkoutSortOption
) => {
  try {
    let query = supabase
      .from("workouts")
      .select(`
        *,
        exercises:workout_exercises(*)
      `)
      .eq("user_id", userId);

    // Apply filters
    if (filters?.workout_types && filters.workout_types.length > 0) {
      query = query.in("workout_type", filters.workout_types);
    }

    if (filters?.difficulty) {
      query = query.eq("difficulty", filters.difficulty);
    }

    if (filters?.favorite_only) {
      query = query.eq("is_favorite", true);
    }

    if (filters?.template_only) {
      query = query.eq("is_template", true);
    }

    if (filters?.target_muscle_groups && filters.target_muscle_groups.length > 0) {
      query = query.overlaps("target_muscle_groups", filters.target_muscle_groups);
    }

    if (filters?.equipment_needed && filters.equipment_needed.length > 0) {
      query = query.overlaps("equipment_needed", filters.equipment_needed);
    }

    if (filters?.searchQuery) {
      query = query.or(
        `title.ilike.%${filters.searchQuery}%,description.ilike.%${filters.searchQuery}%`
      );
    }

    // Apply sorting
    if (sortOption) {
      query = query.order(sortOption.value, { ascending: sortOption.direction === "asc" });
    } else {
      query = query.order("created_at", { ascending: false });
    }

    const { data, error } = await query;

    if (error) throw error;
    return data as Workout[];
  } catch (error) {
    console.error("Exception fetching workouts:", error);
    throw error;
  }
};

/**
 * Fetches a single workout by ID with all exercises
 */
export const fetchWorkoutById = async (workoutId: string) => {
  try {
    const { data, error } = await supabase
      .from("workouts")
      .select(`
        *,
        exercises:workout_exercises(*)
      `)
      .eq("id", workoutId)
      .order("order_index", { foreignTable: "workout_exercises", ascending: true })
      .single();

    if (error) throw error;
    return data as Workout;
  } catch (error) {
    console.error("Exception fetching workout by ID:", error);
    throw error;
  }
};

/**
 * Creates a new workout with exercises
 */
export const createWorkout = async (workoutData: {
  workout: Omit<Workout, "id" | "created_at" | "updated_at">;
  exercises: Array<{
    exercise_name: string;
    sets?: number;
    reps?: number;
    duration_seconds?: number;
    rest_seconds?: number;
    weight_kg?: number;
    notes?: string;
    order_index: number;
  }>;
}) => {
  try {
    // Create the workout
    const { data: workout, error: workoutError } = await supabase
      .from("workouts")
      .insert(workoutData.workout)
      .select()
      .single();

    if (workoutError) throw workoutError;

    // Create the exercises if provided
    if (workoutData.exercises && workoutData.exercises.length > 0) {
      const exercisesToInsert = workoutData.exercises.map((exercise) => ({
        ...exercise,
        workout_id: workout.id,
      }));

      const { error: exercisesError } = await supabase
        .from("workout_exercises")
        .insert(exercisesToInsert);

      if (exercisesError) throw exercisesError;
    }

    // Fetch the complete workout with exercises
    return await fetchWorkoutById(workout.id);
  } catch (error) {
    console.error("Exception creating workout:", error);
    throw error;
  }
};

/**
 * Updates an existing workout and its exercises
 */
export const updateWorkout = async (
  workoutId: string,
  workoutData: {
    workout?: Partial<Omit<Workout, "id" | "user_id" | "created_at" | "updated_at">>;
    exercises?: Array<{
      id?: string;
      exercise_name: string;
      sets?: number;
      reps?: number;
      duration_seconds?: number;
      rest_seconds?: number;
      weight_kg?: number;
      notes?: string;
      order_index: number;
    }>;
  }
) => {
  try {
    // Update the workout if workout data is provided
    if (workoutData.workout) {
      const { error: workoutError } = await supabase
        .from("workouts")
        .update({
          ...workoutData.workout,
          updated_at: new Date().toISOString(),
        })
        .eq("id", workoutId);

      if (workoutError) throw workoutError;
    }

    // Update exercises if provided
    if (workoutData.exercises) {
      // Delete existing exercises
      const { error: deleteError } = await supabase
        .from("workout_exercises")
        .delete()
        .eq("workout_id", workoutId);

      if (deleteError) throw deleteError;

      // Insert new exercises
      if (workoutData.exercises.length > 0) {
        const exercisesToInsert = workoutData.exercises.map((exercise) => ({
          exercise_name: exercise.exercise_name,
          sets: exercise.sets,
          reps: exercise.reps,
          duration_seconds: exercise.duration_seconds,
          rest_seconds: exercise.rest_seconds,
          weight_kg: exercise.weight_kg,
          notes: exercise.notes,
          order_index: exercise.order_index,
          workout_id: workoutId,
        }));

        const { error: insertError } = await supabase
          .from("workout_exercises")
          .insert(exercisesToInsert);

        if (insertError) throw insertError;
      }
    }

    // Fetch and return the updated workout
    return await fetchWorkoutById(workoutId);
  } catch (error) {
    console.error("Exception updating workout:", error);
    throw error;
  }
};

/**
 * Deletes a workout and all associated exercises
 */
export const deleteWorkout = async (workoutId: string) => {
  try {
    const { error } = await supabase
      .from("workouts")
      .delete()
      .eq("id", workoutId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error("Exception deleting workout:", error);
    throw error;
  }
};

/**
 * Toggles the favorite status of a workout
 */
export const toggleWorkoutFavorite = async (
  workoutId: string,
  isFavorite: boolean
) => {
  try {
    const { data, error } = await supabase
      .from("workouts")
      .update({ is_favorite: isFavorite })
      .eq("id", workoutId)
      .select()
      .single();

    if (error) throw error;
    return data as Workout;
  } catch (error) {
    console.error("Exception toggling workout favorite:", error);
    throw error;
  }
};
