
import { supabase } from "@/integrations/supabase/client";

/**
 * Saves a new recipe to the database
 * Requires user_id
 */
export const saveRecipe = async (recipeData: any, userId: string) => {
  const ingredientsArray = Array.isArray(recipeData.ingredients) 
    ? recipeData.ingredients 
    : [];
  const dataToInsert = {
    ...recipeData,
    ingredients: ingredientsArray,
    user_id: userId
  };
  try {
    const { data, error } = await supabase.from("recipes").insert(dataToInsert).select();
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Exception saving recipe:', error);
    throw error;
  }
};

/**
 * Updates an existing recipe in the database
 * Requires user_id to verify RLS, but do not update user_id after creation.
 */
export const updateRecipe = async (id: string, updates: any) => {
  const ingredientsArray = updates.ingredients && Array.isArray(updates.ingredients) 
    ? updates.ingredients 
    : [];
  const dataToUpdate = {
    ...updates,
    ingredients: ingredientsArray
  };
  try {
    const { data, error } = await supabase
      .from("recipes")
      .update(dataToUpdate)
      .eq("id", id)
      .select();
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Exception updating recipe:', error);
    throw error;
  }
};
