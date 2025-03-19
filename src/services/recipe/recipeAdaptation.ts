
import { supabase } from "@/integrations/supabase/client";

/**
 * Adapts a recipe for specific dietary restrictions using AI
 */
export const adaptRecipeForDietaryRestrictions = async (
  recipeId: string, 
  restrictions: string[]
) => {
  if (!restrictions || restrictions.length === 0) {
    console.log('No restrictions provided, skipping adaptation');
    return null;
  }

  try {
    // First get the recipe
    const { data: recipe, error } = await supabase
      .from("recipes")
      .select("*")
      .eq("id", recipeId)
      .single();
    
    if (error) {
      console.error('Error fetching recipe for adaptation:', error);
      throw error;
    }

    if (!recipe) {
      throw new Error('Recipe not found');
    }

    // Call edge function to adapt the recipe using Groq
    console.log('Calling adapt-recipe-for-restrictions with:', { recipeId, restrictions });
    const response = await supabase.functions.invoke('adapt-recipe-for-restrictions', {
      body: { 
        recipe, 
        restrictions 
      }
    });
    
    if (response.error) {
      console.error('Error adapting recipe:', response.error);
      throw new Error(response.error.message || 'Error adapting recipe');
    }

    console.log('Adaptation response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error in adaptRecipeForDietaryRestrictions:', error);
    throw error;
  }
};
