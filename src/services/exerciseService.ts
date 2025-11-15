import { toast } from "sonner";
import {
  fetchExercises as fetchExercisesFromWorkout,
  createCustomExercise,
  deleteCustomExercise,
} from "@/services/workout";
import type { Exercise, ExerciseFilters } from "@/types/workout";

/**
 * Fetches exercises with filters
 */
export const fetchExercises = async (
  filters?: Partial<ExerciseFilters>
): Promise<Exercise[]> => {
  try {
    // Get current user ID if needed (can be passed as parameter in the future)
    const userId = undefined; // You can get this from auth context if needed
    return await fetchExercisesFromWorkout(userId, filters);
  } catch (error) {
    console.error("Error fetching exercises:", error);
    toast.error("Failed to load exercises");
    return [];
  }
};

/**
 * Creates a new custom exercise
 */
export const createExercise = async (
  exerciseData: Partial<Exercise>,
  userId: string
): Promise<string | null> => {
  try {
    const data = await createCustomExercise({
      name: exerciseData.name || "",
      description: exerciseData.description,
      category: exerciseData.category || "Strength",
      difficulty: exerciseData.difficulty,
      muscle_groups: exerciseData.muscle_groups || [],
      equipment: exerciseData.equipment || [],
      video_url: exerciseData.video_url,
      instructions: exerciseData.instructions,
      user_id: userId,
    });
    toast.success(`Exercise "${exerciseData.name}" created successfully`);
    return data.id;
  } catch (error) {
    console.error("Error creating exercise:", error);
    toast.error("Failed to create exercise");
    return null;
  }
};

/**
 * Deletes a custom exercise
 */
export const deleteExercise = async (exerciseId: string): Promise<boolean> => {
  try {
    await deleteCustomExercise(exerciseId);
    toast.success("Exercise deleted successfully");
    return true;
  } catch (error) {
    console.error("Error deleting exercise:", error);
    toast.error("Failed to delete exercise");
    return false;
  }
};
