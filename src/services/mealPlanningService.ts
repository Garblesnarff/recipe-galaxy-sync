/**
 * Meal Planning Service
 * Service for managing weekly meal plans and meal assignments
 */

import { supabase } from "@/integrations/supabase/client";
import { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

type MealPlan = Tables<"meal_plans">;
type MealPlanInsert = TablesInsert<"meal_plans">;
type MealPlanUpdate = TablesUpdate<"meal_plans">;
type MealPlanRecipe = Tables<"meal_plan_recipes">;
type MealPlanRecipeInsert = TablesInsert<"meal_plan_recipes">;
type MealPlanRecipeUpdate = TablesUpdate<"meal_plan_recipes">;

export interface CreateMealPlanData {
  name?: string;
  week_start_date: string;
  notes?: string;
}

export interface AddRecipeToMealPlanData {
  recipe_id: string;
  day_of_week: number;
  meal_type: string;
  servings?: number;
  notes?: string;
}

/**
 * Creates a new meal plan
 */
export const createMealPlan = async (
  userId: string,
  data: CreateMealPlanData
): Promise<MealPlan> => {
  const mealPlanData: MealPlanInsert = {
    user_id: userId,
    name: data.name || 'Weekly Plan',
    week_start_date: data.week_start_date,
    notes: data.notes || null,
  };

  const { data: result, error } = await supabase
    .from("meal_plans")
    .insert(mealPlanData)
    .select()
    .single();

  if (error) {
    console.error('Error creating meal plan:', error);
    throw new Error(`Failed to create meal plan: ${error.message}`);
  }

  return result;
};

/**
 * Gets all meal plans for a user with optional filtering
 */
export const getMealPlans = async (
  userId: string,
  filters?: any
): Promise<MealPlan[]> => {
  let query = supabase
    .from("meal_plans")
    .select("*")
    .eq("user_id", userId)
    .order("week_start_date", { ascending: false });

  if (filters?.status) {
    query = query.eq("status", filters.status);
  }

  if (filters?.date_range) {
    query = query
      .gte("week_start_date", filters.date_range.start)
      .lte("week_start_date", filters.date_range.end);
  }

  if (filters?.search_query) {
    query = query.ilike("name", `%${filters.search_query}%`);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching meal plans:', error);
    throw new Error(`Failed to fetch meal plans: ${error.message}`);
  }

  return data || [];
};

/**
 * Gets a specific meal plan with all its recipes
 */
export const getMealPlanWithRecipes = async (
  mealPlanId: string,
  userId: string
): Promise<any> => {
  // First get the meal plan
  const { data: mealPlan, error: mealPlanError } = await supabase
    .from("meal_plans")
    .select("*")
    .eq("id", mealPlanId)
    .eq("user_id", userId)
    .single();

  if (mealPlanError) {
    console.error('Error fetching meal plan:', mealPlanError);
    throw new Error(`Failed to fetch meal plan: ${mealPlanError.message}`);
  }

  // Then get all recipes for this meal plan
  const { data: recipes, error: recipesError } = await supabase
    .from("meal_plan_recipes")
    .select(`
      *,
      recipe:recipes(id, title, image_url, cook_time, prep_time)
    `)
    .eq("meal_plan_id", mealPlanId);

  if (recipesError) {
    console.error('Error fetching meal plan recipes:', recipesError);
    throw new Error(`Failed to fetch meal plan recipes: ${recipesError.message}`);
  }

  return {
    ...mealPlan,
    recipes: recipes || [],
  };
};

/**
 * Adds a recipe to a meal plan
 */
export const addRecipeToMealPlan = async (
  mealPlanId: string,
  userId: string,
  data: AddRecipeToMealPlanData
): Promise<MealPlanRecipe> => {
  // Verify the meal plan belongs to the user
  const { data: mealPlan, error: mealPlanError } = await supabase
    .from("meal_plans")
    .select("id")
    .eq("id", mealPlanId)
    .eq("user_id", userId)
    .single();

  if (mealPlanError || !mealPlan) {
    throw new Error("Meal plan not found or access denied");
  }

  const recipeData: MealPlanRecipeInsert = {
    meal_plan_id: mealPlanId,
    recipe_id: data.recipe_id,
    day_of_week: data.day_of_week,
    meal_type: data.meal_type,
    servings: data.servings || 1,
    notes: data.notes || null,
  };

  const { data: result, error } = await supabase
    .from("meal_plan_recipes")
    .insert(recipeData)
    .select()
    .single();

  if (error) {
    console.error('Error adding recipe to meal plan:', error);
    throw new Error(`Failed to add recipe to meal plan: ${error.message}`);
  }

  return result;
};

/**
 * Removes a recipe from a meal plan
 */
export const removeRecipeFromMealPlan = async (
  mealPlanRecipeId: string,
  userId: string
): Promise<void> => {
  const { error } = await supabase
    .from("meal_plan_recipes")
    .delete()
    .eq("id", mealPlanRecipeId);

  if (error) {
    console.error('Error removing recipe from meal plan:', error);
    throw new Error(`Failed to remove recipe from meal plan: ${error.message}`);
  }
};

/**
 * Updates a meal plan recipe (servings, notes, etc.)
 */
export const updateMealPlanRecipe = async (
  mealPlanRecipeId: string,
  userId: string,
  updates: MealPlanRecipeUpdate
): Promise<MealPlanRecipe> => {
  const { data, error } = await supabase
    .from("meal_plan_recipes")
    .update(updates)
    .eq("id", mealPlanRecipeId)
    .select()
    .single();

  if (error) {
    console.error('Error updating meal plan recipe:', error);
    throw new Error(`Failed to update meal plan recipe: ${error.message}`);
  }

  return data;
};

/**
 * Gets meal plan summary with nutrition and recipe counts
 */
export const getMealPlanSummary = async (
  mealPlanId: string,
  userId: string
): Promise<any> => {
  // Get recipe count and unique recipes
  const { data: recipeStats, error: statsError } = await supabase
    .from("meal_plan_recipes")
    .select("recipe_id", { count: "exact" })
    .eq("meal_plan_id", mealPlanId);

  if (statsError) {
    console.error('Error getting meal plan stats:', statsError);
    throw new Error(`Failed to get meal plan summary: ${statsError.message}`);
  }

  const totalRecipes = recipeStats?.length || 0;
  const uniqueRecipes = new Set(recipeStats?.map((r: any) => r.recipe_id)).size;

  // Calculate total servings
  const { data: servingsData, error: servingsError } = await supabase
    .from("meal_plan_recipes")
    .select("servings")
    .eq("meal_plan_id", mealPlanId);

  if (servingsError) {
    console.error('Error getting servings data:', servingsError);
  }

  const totalServings = servingsData?.reduce((sum: number, item: any) => sum + (item.servings || 1), 0) || 0;

  return {
    total_recipes: totalRecipes,
    unique_recipes: uniqueRecipes,
    total_servings: totalServings,
  };
};

/**
 * Duplicates a meal plan to another week
 */
export const duplicateMealPlan = async (
  sourceMealPlanId: string,
  userId: string,
  targetWeekStart: string,
  newName?: string
): Promise<MealPlan> => {
  // Get the source meal plan
  const { data: sourcePlan, error: sourceError } = await supabase
    .from("meal_plans")
    .select("*")
    .eq("id", sourceMealPlanId)
    .eq("user_id", userId)
    .single();

  if (sourceError || !sourcePlan) {
    throw new Error("Source meal plan not found");
  }

  // Create new meal plan
  const newMealPlan = await createMealPlan(userId, {
    name: newName || `${sourcePlan.name} (Copy)`,
    week_start_date: targetWeekStart,
    notes: sourcePlan.notes,
  });

  // Get all recipes from source plan
  const { data: sourceRecipes, error: recipesError } = await supabase
    .from("meal_plan_recipes")
    .select("*")
    .eq("meal_plan_id", sourceMealPlanId);

  if (recipesError) {
    console.error('Error fetching source recipes:', recipesError);
    throw new Error(`Failed to duplicate meal plan: ${recipesError.message}`);
  }

  // Copy all recipes to new plan
  if (sourceRecipes && sourceRecipes.length > 0) {
    const recipesToInsert = sourceRecipes.map((recipe: any) => ({
      meal_plan_id: newMealPlan.id,
      recipe_id: recipe.recipe_id,
      day_of_week: recipe.day_of_week,
      meal_type: recipe.meal_type,
      servings: recipe.servings,
      notes: recipe.notes,
    }));

    const { error: insertError } = await supabase
      .from("meal_plan_recipes")
      .insert(recipesToInsert);

    if (insertError) {
      console.error('Error copying recipes to new meal plan:', insertError);
      throw new Error(`Failed to copy recipes: ${insertError.message}`);
    }
  }

  return newMealPlan;
};

/**
 * Deletes a meal plan and all its recipes
 */
export const deleteMealPlan = async (
  mealPlanId: string,
  userId: string
): Promise<void> => {
  const { error } = await supabase
    .from("meal_plans")
    .delete()
    .eq("id", mealPlanId)
    .eq("user_id", userId);

  if (error) {
    console.error('Error deleting meal plan:', error);
    throw new Error(`Failed to delete meal plan: ${error.message}`);
  }
};
