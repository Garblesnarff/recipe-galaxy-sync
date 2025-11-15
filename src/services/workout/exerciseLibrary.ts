import { supabase } from "@/integrations/supabase/client";
import type { Exercise, ExerciseFilters } from "@/types/workout";

/**
 * Fetches all exercises (pre-populated + user's custom exercises)
 * with optional filters
 */
export const fetchExercises = async (
  userId?: string,
  filters?: Partial<ExerciseFilters>
) => {
  try {
    let query = supabase.from("exercise_library").select("*");

    // Filter to show only non-custom exercises OR user's custom exercises
    if (userId) {
      query = query.or(`is_custom.eq.false,user_id.eq.${userId}`);
    } else {
      query = query.eq("is_custom", false);
    }

    // Apply filters
    if (filters?.categories && filters.categories.length > 0) {
      query = query.in("category", filters.categories);
    }

    if (filters?.muscle_groups && filters.muscle_groups.length > 0) {
      query = query.overlaps("muscle_groups", filters.muscle_groups);
    }

    if (filters?.equipment && filters.equipment.length > 0) {
      query = query.overlaps("equipment", filters.equipment);
    }

    if (filters?.difficulty) {
      query = query.eq("difficulty", filters.difficulty);
    }

    if (filters?.custom_only && userId) {
      query = query.eq("is_custom", true).eq("user_id", userId);
    }

    if (filters?.searchQuery) {
      query = query.or(
        `name.ilike.%${filters.searchQuery}%,description.ilike.%${filters.searchQuery}%`
      );
    }

    if (filters?.has_video) {
      query = query.not("video_url", "is", null);
    }

    // Order by name
    query = query.order("name", { ascending: true });

    const { data, error } = await query;

    if (error) throw error;
    return data as Exercise[];
  } catch (error) {
    console.error("Exception fetching exercises:", error);
    throw error;
  }
};

/**
 * Fetches a single exercise by name
 */
export const fetchExerciseByName = async (name: string): Promise<Exercise | null> => {
  try {
    const { data, error } = await supabase
      .from("exercise_library")
      .select("*")
      .ilike("name", name)
      .single();

    if (error) {
      // If not found, return null instead of throwing
      if (error.code === 'PGRST116') {
        return null;
      }
      throw error;
    }
    return data as Exercise;
  } catch (error) {
    console.error("Exception fetching exercise by name:", error);
    return null;
  }
};

/**
 * Creates a user's custom exercise
 */
export const createCustomExercise = async (
  exerciseData: Omit<Exercise, "id" | "created_at" | "updated_at" | "is_custom"> & {
    user_id: string;
  }
) => {
  try {
    const dataToInsert = {
      ...exerciseData,
      is_custom: true,
    };

    const { data, error } = await supabase
      .from("exercise_library")
      .insert(dataToInsert)
      .select()
      .single();

    if (error) throw error;
    return data as Exercise;
  } catch (error) {
    console.error("Exception creating custom exercise:", error);
    throw error;
  }
};

/**
 * Updates a user's custom exercise
 */
export const updateCustomExercise = async (
  exerciseId: string,
  exerciseData: Partial<Omit<Exercise, "id" | "user_id" | "is_custom" | "created_at" | "updated_at">>
) => {
  try {
    const { data, error } = await supabase
      .from("exercise_library")
      .update({
        ...exerciseData,
        updated_at: new Date().toISOString(),
      })
      .eq("id", exerciseId)
      .eq("is_custom", true)
      .select()
      .single();

    if (error) throw error;
    return data as Exercise;
  } catch (error) {
    console.error("Exception updating custom exercise:", error);
    throw error;
  }
};

/**
 * Deletes a user's custom exercise
 */
export const deleteCustomExercise = async (exerciseId: string) => {
  try {
    const { error } = await supabase
      .from("exercise_library")
      .delete()
      .eq("id", exerciseId)
      .eq("is_custom", true);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error("Exception deleting custom exercise:", error);
    throw error;
  }
};
