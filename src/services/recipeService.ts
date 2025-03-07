
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
  
  // Create request body object (don't stringify it)
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
  const { error } = await supabase.from("recipes").insert(recipeData);
  if (error) throw error;
  return true;
};
