
import { supabase } from "@/integrations/supabase/client";
import { ImportedRecipeData } from "@/types/recipe";
import { validateUrl, getDomain, isYouTubeUrl } from "./recipeUtils";

/**
 * Imports recipe data from a URL (webpage or YouTube)
 */
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
