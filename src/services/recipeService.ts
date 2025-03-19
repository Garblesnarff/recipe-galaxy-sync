
import { supabase } from "@/integrations/supabase/client";
import { ImportedRecipeData } from "@/types/recipe";

export const uploadImage = async (file: File): Promise<string> => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${crypto.randomUUID()}.${fileExt}`;
    const { error: uploadError } = await supabase.storage
      .from('recipe-images')
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('recipe-images')
      .getPublicUrl(fileName);

    return publicUrl;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw new Error('Failed to upload image');
  }
};

const isYouTubeUrl = (url: string): boolean => {
  return url.includes('youtube.com') || url.includes('youtu.be');
};

export const validateUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// Function to extract domain from URL for error handling
const getDomain = (url: string): string => {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.hostname.replace('www.', '');
  } catch {
    return "";
  }
};

export const importRecipeFromUrl = async (url: string): Promise<ImportedRecipeData> => {
  if (!url || !validateUrl(url)) {
    console.error('Invalid URL provided:', url);
    throw new Error('Please enter a valid URL');
  }

  const endpoint = isYouTubeUrl(url) ? 'extract-youtube-recipe' : 'scrape-recipe';
  const domain = getDomain(url);
  console.log(`Calling ${endpoint} function with URL:`, url);
  
  // Create request body object
  const requestBody = { url };
  console.log('Request payload:', JSON.stringify(requestBody));
  
  try {
    console.log(`Invoking ${endpoint} function with payload:`, JSON.stringify(requestBody));
    
    // Pass the object directly, not stringified
    const { data, error } = await supabase.functions.invoke(endpoint, {
      body: requestBody
    });
    
    console.log(`Response from ${endpoint}:`, { data, error });
    
    if (error) {
      console.error(`Error response from ${endpoint}:`, error);
      
      // Extract detailed error information if available
      let errorMessage = `Error from ${endpoint}`;
      if (error.message) {
        errorMessage = error.message;
      }
      
      // Check if there are additional details in the error
      if (error.details) {
        errorMessage += `: ${error.details}`;
      }
      
      // Special handling for HelloFresh
      if (domain === 'hellofresh.com') {
        errorMessage = `HelloFresh recipes are currently difficult to import automatically. Please try copying the ingredients and instructions manually.`;
      }
      
      throw new Error(errorMessage);
    }

    if (!data) {
      console.error(`No data received from ${endpoint}`);
      throw new Error(`No recipe data found. Please try a different URL or enter the recipe manually.`);
    }

    console.log(`Successfully received data from ${endpoint}:`, data);
    return data;
  } catch (error) {
    console.error(`Error in importRecipeFromUrl (${endpoint}):`, error);
    
    // Provide more meaningful error messages
    if (error instanceof Error) {
      if (error.message.includes('timeout') || error.message.includes('fetch')) {
        throw new Error(`Failed to access the recipe website. It might be temporarily unavailable or blocking our request.`);
      } else if (error.message.includes('parse') || error.message.includes('JSON')) {
        throw new Error(`The recipe couldn't be extracted from this website format. Please try another URL or enter it manually.`);
      } else if (error.message.includes('compute resources')) {
        throw new Error(`The recipe is too complex to process automatically. Please try copying the recipe details manually.`);
      } else if (error.message.includes('blocking')) {
        throw new Error(`This website appears to be blocking our recipe extractor. Please try copying the recipe details manually.`);
      }
      throw error;
    } else {
      throw new Error(`Failed to import recipe from ${url}. Please try again later or enter it manually.`);
    }
  }
};

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
