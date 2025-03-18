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

export const importRecipeFromUrl = async (url: string): Promise<ImportedRecipeData> => {
  if (!url || !validateUrl(url)) {
    console.error('Invalid URL provided:', url);
    throw new Error('Please enter a valid URL');
  }

  const endpoint = isYouTubeUrl(url) ? 'extract-youtube-recipe' : 'scrape-recipe';
  console.log(`Calling ${endpoint} function with URL:`, url);
  
  // Create request body object
  const requestBody = { url };
  console.log('Request payload:', JSON.stringify(requestBody));
  
  try {
    console.log(`Invoking ${endpoint} function with payload:`, JSON.stringify(requestBody));
    
    // Pass the object directly, not stringified
    const response = await supabase.functions.invoke(endpoint, {
      body: requestBody
    });
    
    console.log(`Response from ${endpoint}:`, response);
    
    if (response.error) {
      console.error(`Error response from ${endpoint}:`, response.error);
      throw new Error(response.error.message || `Error from ${endpoint}`);
    }

    if (!response.data) {
      console.error(`No data received from ${endpoint}`);
      throw new Error(`No data received from ${endpoint}`);
    }

    console.log(`Successfully received data from ${endpoint}:`, response.data);
    return response.data;
  } catch (error) {
    console.error(`Error in importRecipeFromUrl (${endpoint}):`, error);
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error(`Failed to import recipe from ${url}`);
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
