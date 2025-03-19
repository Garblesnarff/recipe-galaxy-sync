
import { supabase } from "@/integrations/supabase/client";

/**
 * Saves a new recipe to the database
 */
export const saveRecipe = async (recipeData: any) => {
  // Ensure ingredients is an array and not null
  const ingredientsArray = Array.isArray(recipeData.ingredients) 
    ? recipeData.ingredients 
    : [];
  
  console.log('Saving recipe data:', recipeData);
  
  // Prepare data for insertion
  const dataToInsert = {
    ...recipeData,
    ingredients: ingredientsArray
  };
  
  console.log('Formatted data for insertion:', dataToInsert);
  
  try {
    const { data, error } = await supabase.from("recipes").insert(dataToInsert).select();
    
    if (error) {
      console.error('Error saving recipe:', error);
      throw error;
    }
    
    console.log('Recipe saved successfully:', data);
    return data;
  } catch (error) {
    console.error('Exception saving recipe:', error);
    throw error;
  }
};

/**
 * Updates an existing recipe in the database
 */
export const updateRecipe = async (id: string, updates: any) => {
  // Ensure ingredients is an array and not null
  const ingredientsArray = updates.ingredients && Array.isArray(updates.ingredients) 
    ? updates.ingredients 
    : [];
  
  console.log('Updating recipe data:', { id, ...updates });
  
  // Prepare data for update
  const dataToUpdate = {
    ...updates,
    ingredients: ingredientsArray
  };
  
  console.log('Formatted data for update:', dataToUpdate);
  
  try {
    const { data, error } = await supabase
      .from("recipes")
      .update(dataToUpdate)
      .eq("id", id)
      .select();
    
    if (error) {
      console.error('Error updating recipe:', error);
      throw error;
    }
    
    console.log('Recipe updated successfully:', data);
    return data;
  } catch (error) {
    console.error('Exception updating recipe:', error);
    throw error;
  }
};
