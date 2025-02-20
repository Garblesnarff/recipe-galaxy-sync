
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

export const importRecipeFromUrl = async (url: string): Promise<ImportedRecipeData> => {
  const endpoint = isYouTubeUrl(url) ? 'extract-youtube-recipe' : 'scrape-recipe';
  
  const { data, error } = await supabase.functions.invoke(endpoint, {
    body: { url }
  });

  if (error) {
    console.error(`Error importing recipe from ${endpoint}:`, error);
    throw error;
  }

  if (!data) {
    throw new Error(`No data received from ${endpoint}`);
  }

  return data;
};

export const saveRecipe = async (recipeData: any) => {
  const { error } = await supabase.from("recipes").insert(recipeData);
  if (error) throw error;
  return true;
};
