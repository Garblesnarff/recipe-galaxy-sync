import { supabase } from "@/integrations/supabase/client";
import type {
  WorkoutRecipe,
  MealTiming,
  RecipeSuggestion,
  CalorieMatchResult,
  Workout
} from "@/types/workout";
import type { Recipe } from "@/types/recipe";

/**
 * Links a recipe to a workout with specific meal timing
 */
export const linkRecipeToWorkout = async (
  workoutId: string,
  recipeId: string,
  mealTiming: MealTiming
): Promise<WorkoutRecipe> => {
  try {
    const { data, error } = await supabase
      .from("workout_recipes")
      .insert({
        workout_id: workoutId,
        recipe_id: recipeId,
        meal_timing: mealTiming,
      })
      .select()
      .single();

    if (error) throw error;
    return data as WorkoutRecipe;
  } catch (error) {
    console.error("Exception linking recipe to workout:", error);
    throw error;
  }
};

/**
 * Removes a recipe link from a workout
 */
export const unlinkRecipeFromWorkout = async (
  workoutRecipeId: string
): Promise<{ success: boolean }> => {
  try {
    const { error } = await supabase
      .from("workout_recipes")
      .delete()
      .eq("id", workoutRecipeId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error("Exception unlinking recipe from workout:", error);
    throw error;
  }
};

/**
 * Gets all recipes linked to a workout
 */
export const getWorkoutRecipes = async (
  workoutId: string
): Promise<WorkoutRecipe[]> => {
  try {
    const { data, error } = await supabase
      .from("workout_recipes")
      .select(`
        *,
        recipe:recipes(*)
      `)
      .eq("workout_id", workoutId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data as WorkoutRecipe[];
  } catch (error) {
    console.error("Exception fetching workout recipes:", error);
    throw error;
  }
};

/**
 * Suggests recipes for a workout based on calories burned and workout type
 */
export const suggestRecipesForWorkout = async (
  workout: Workout,
  userId: string
): Promise<RecipeSuggestion[]> => {
  try {
    // Fetch user's recipes
    const { data: recipes, error } = await supabase
      .from("recipes")
      .select("*")
      .eq("user_id", userId)
      .limit(50);

    if (error) throw error;
    if (!recipes || recipes.length === 0) return [];

    const workoutCalories = workout.calories_estimate || 300;
    const suggestions: RecipeSuggestion[] = [];

    // Calculate suggestions based on workout characteristics
    for (const recipe of recipes) {
      const recipeCalories = estimateRecipeCalories(recipe);
      const match = calculateCalorieMatch(workoutCalories, recipe);

      // Pre-workout: 50-75% of calories burned, light and carb-focused
      if (recipeCalories >= workoutCalories * 0.5 && recipeCalories <= workoutCalories * 0.75) {
        suggestions.push({
          recipe,
          match_score: match.percentage_match,
          reason: `Good pre-workout fuel (${recipeCalories} cal)`,
          recommended_timing: 'pre_workout'
        });
      }

      // Post-workout: 75-125% of calories burned, protein-focused
      if (recipeCalories >= workoutCalories * 0.75 && recipeCalories <= workoutCalories * 1.25) {
        const hasProtein = checkProteinContent(recipe);
        suggestions.push({
          recipe,
          match_score: match.percentage_match + (hasProtein ? 10 : 0),
          reason: `Perfect post-workout recovery (${recipeCalories} cal)${hasProtein ? ', high protein' : ''}`,
          recommended_timing: 'post_workout'
        });
      }

      // Recovery: Any meal that supports overall recovery
      if (recipeCalories >= workoutCalories * 0.5) {
        suggestions.push({
          recipe,
          match_score: match.percentage_match * 0.8,
          reason: `Supports recovery (${recipeCalories} cal)`,
          recommended_timing: 'recovery'
        });
      }
    }

    // Remove duplicates, keeping the best match for each recipe
    const uniqueSuggestions = suggestions.reduce((acc, current) => {
      const existing = acc.find(s => s.recipe.id === current.recipe.id);
      if (!existing || current.match_score > existing.match_score) {
        return [...acc.filter(s => s.recipe.id !== current.recipe.id), current];
      }
      return acc;
    }, [] as RecipeSuggestion[]);

    // Sort by match score and return top suggestions
    return uniqueSuggestions
      .sort((a, b) => b.match_score - a.match_score)
      .slice(0, 6);
  } catch (error) {
    console.error("Exception suggesting recipes for workout:", error);
    throw error;
  }
};

/**
 * Calculates how well a recipe's calories match the workout's calorie burn
 */
export const calculateCalorieMatch = (
  workoutCalories: number,
  recipe: Recipe
): CalorieMatchResult => {
  const recipeCalories = estimateRecipeCalories(recipe);

  // Calculate percentage match (100% = exact match, lower = bigger difference)
  const difference = Math.abs(workoutCalories - recipeCalories);
  const percentageDifference = (difference / workoutCalories) * 100;
  const percentageMatch = Math.max(0, 100 - percentageDifference);

  let recommendation = "";
  let isMatch = false;

  if (percentageMatch >= 80) {
    recommendation = "Excellent match for post-workout recovery";
    isMatch = true;
  } else if (percentageMatch >= 60) {
    recommendation = "Good match for this workout";
    isMatch = true;
  } else if (percentageMatch >= 40) {
    recommendation = "Moderate match - consider adjusting portions";
    isMatch = true;
  } else if (recipeCalories < workoutCalories * 0.5) {
    recommendation = "Too light - consider as a pre-workout snack";
  } else {
    recommendation = "Too heavy - better for rest days or split into meals";
  }

  return {
    is_match: isMatch,
    recipe_calories: recipeCalories,
    workout_calories: workoutCalories,
    percentage_match: Math.round(percentageMatch),
    recommendation
  };
};

/**
 * Estimates recipe calories based on ingredients and servings
 * This is a simplified estimation - in production, you'd want more detailed nutrition data
 */
const estimateRecipeCalories = (recipe: Recipe): number => {
  // If the recipe has explicit calorie data, use it
  if ((recipe as any).calories) {
    return (recipe as any).calories;
  }

  // Otherwise, estimate based on ingredients count and servings
  const ingredientCount = recipe.ingredients?.length || 5;
  const servings = recipe.servings || 4;

  // Rough estimate: ~100 calories per ingredient, divided by servings
  const totalCalories = ingredientCount * 100;
  return Math.round(totalCalories / servings);
};

/**
 * Checks if a recipe likely contains protein
 * This is a simplified check - in production, you'd want structured nutrition data
 */
const checkProteinContent = (recipe: Recipe): boolean => {
  const proteinKeywords = [
    'chicken', 'beef', 'pork', 'fish', 'salmon', 'tuna', 'turkey',
    'eggs', 'tofu', 'beans', 'lentils', 'quinoa', 'protein',
    'greek yogurt', 'cottage cheese', 'chickpeas'
  ];

  const searchText = (
    recipe.title + ' ' +
    recipe.description + ' ' +
    (recipe.ingredients?.map(i => typeof i === 'string' ? i : i.name || '').join(' ') || '')
  ).toLowerCase();

  return proteinKeywords.some(keyword => searchText.includes(keyword));
};

/**
 * Gets recipes by meal timing for a specific workout
 */
export const getRecipesByMealTiming = async (
  workoutId: string,
  mealTiming: MealTiming
): Promise<WorkoutRecipe[]> => {
  try {
    const { data, error } = await supabase
      .from("workout_recipes")
      .select(`
        *,
        recipe:recipes(*)
      `)
      .eq("workout_id", workoutId)
      .eq("meal_timing", mealTiming)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data as WorkoutRecipe[];
  } catch (error) {
    console.error("Exception fetching recipes by meal timing:", error);
    throw error;
  }
};

/**
 * Updates the meal timing for a workout recipe
 */
export const updateWorkoutRecipeTiming = async (
  workoutRecipeId: string,
  newTiming: MealTiming
): Promise<WorkoutRecipe> => {
  try {
    const { data, error } = await supabase
      .from("workout_recipes")
      .update({ meal_timing: newTiming })
      .eq("id", workoutRecipeId)
      .select()
      .single();

    if (error) throw error;
    return data as WorkoutRecipe;
  } catch (error) {
    console.error("Exception updating workout recipe timing:", error);
    throw error;
  }
};
