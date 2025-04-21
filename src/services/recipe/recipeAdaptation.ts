
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
      throw new Error(`Failed to fetch recipe: ${error.message}`);
    }

    if (!recipe) {
      throw new Error('Recipe not found');
    }

    // Call edge function to adapt the recipe using Groq
    console.log('Calling adapt-recipe-for-restrictions with:', { recipeId, restrictions });
    
    // Add a timeout to the function call
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Request timeout after 20 seconds')), 20000)
    );
    
    const functionPromise = supabase.functions.invoke('adapt-recipe-for-restrictions', {
      body: { 
        recipe, 
        restrictions 
      }
    });
    
    const response = await Promise.race([functionPromise, timeoutPromise]);
    
    // Check for response errors
    if (response.error) {
      console.error('Error from edge function:', response.error);
      let errorMessage = 'Failed to adapt recipe';
      
      if (typeof response.error === 'string') {
        errorMessage = response.error;
      } else if (response.error.message) {
        errorMessage = response.error.message;
      } else if (response.error.error) {
        errorMessage = response.error.error;
      }
      
      // Display error to user
      toast.error(`Adaptation failed: ${errorMessage}`);
      throw new Error(errorMessage);
    }
    
    // Check for application-level errors
    if (response.data && response.data.error) {
      console.error('Application error adapting recipe:', response.data.error);
      toast.error(`Adaptation error: ${response.data.error}`);
      throw new Error(response.data.error);
    }

    console.log('Adaptation response:', response.data);
    
    // Validate that we got a proper response
    if (!response.data) {
      console.error('Empty response received from adaptation service');
      toast.error('Received empty response from adaptation service');
      throw new Error('Empty response from adaptation service');
    }
    
    if (!response.data.ingredients || !Array.isArray(response.data.ingredients)) {
      console.error('Invalid adaptation response format:', response.data);
      toast.error('Received invalid recipe adaptation format');
      throw new Error('Invalid recipe adaptation format');
    }
    
    return response.data;
  } catch (error) {
    console.error('Error in adaptRecipeForDietaryRestrictions:', error);
    
    // Show user-friendly error message
    let errorMessage = 'Failed to adapt recipe';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    // Only show toast if not already handled above
    if (!errorMessage.includes('Adaptation') && !errorMessage.includes('Received')) {
      toast.error(errorMessage);
    }
    
    throw error;
  }
};
