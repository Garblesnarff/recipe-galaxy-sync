import { supabase } from "@/integrations/supabase/client";
import type { WorkoutTemplate, WorkoutFilters, WorkoutSortOption } from "@/types/workout";
import { fetchWorkoutById } from "./workoutCrud";

/**
 * Fetches all workout templates with optional filters
 * Templates have null user_id in the database
 */
export const fetchTemplates = async (
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
      .eq("is_template", true)
      .is("user_id", null);

    // Apply filters
    if (filters?.workout_types && filters.workout_types.length > 0) {
      query = query.in("workout_type", filters.workout_types);
    }

    if (filters?.difficulty) {
      query = query.eq("difficulty", filters.difficulty);
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
      query = query.order("title", { ascending: true });
    }

    // Order exercises by order_index
    query = query.order("order_index", { foreignTable: "workout_exercises", ascending: true });

    const { data, error } = await query;

    if (error) throw error;
    return data as WorkoutTemplate[];
  } catch (error) {
    console.error("Exception fetching templates:", error);
    throw error;
  }
};

/**
 * Clones a workout template to a user's workouts
 * Creates a new workout and copies all exercises
 */
export const cloneTemplate = async (templateId: string, userId: string) => {
  try {
    // Fetch the template with exercises
    const { data: template, error: fetchError } = await supabase
      .from("workouts")
      .select(`
        *,
        exercises:workout_exercises(*)
      `)
      .eq("id", templateId)
      .eq("is_template", true)
      .order("order_index", { foreignTable: "workout_exercises", ascending: true })
      .single();

    if (fetchError) throw fetchError;

    // Create new workout for the user
    const newWorkout = {
      user_id: userId,
      title: template.title,
      description: template.description,
      duration_minutes: template.duration_minutes,
      difficulty: template.difficulty,
      workout_type: template.workout_type,
      target_muscle_groups: template.target_muscle_groups,
      equipment_needed: template.equipment_needed,
      calories_estimate: template.calories_estimate,
      image_url: template.image_url,
      is_favorite: false,
      is_template: false,
    };

    const { data: createdWorkout, error: createError } = await supabase
      .from("workouts")
      .insert(newWorkout)
      .select()
      .single();

    if (createError) throw createError;

    // Clone exercises if they exist
    if (template.exercises && template.exercises.length > 0) {
      const exercisesToInsert = template.exercises.map((exercise: any) => ({
        workout_id: createdWorkout.id,
        exercise_name: exercise.exercise_name,
        sets: exercise.sets,
        reps: exercise.reps,
        duration_seconds: exercise.duration_seconds,
        rest_seconds: exercise.rest_seconds,
        weight_kg: exercise.weight_kg,
        notes: exercise.notes,
        order_index: exercise.order_index,
      }));

      const { error: exercisesError } = await supabase
        .from("workout_exercises")
        .insert(exercisesToInsert);

      if (exercisesError) throw exercisesError;
    }

    // Fetch and return the complete cloned workout
    return await fetchWorkoutById(createdWorkout.id);
  } catch (error) {
    console.error("Exception cloning template:", error);
    throw error;
  }
};
