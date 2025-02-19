
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

export const importRecipeFromUrl = async (url: string): Promise<ImportedRecipeData> => {
  const { data, error } = await supabase.functions.invoke('scrape-recipe', {
    body: { url }
  });

  if (error) {
    console.error('Error importing recipe:', error);
    throw error;
  }

  if (!data) {
    throw new Error('No data received from recipe import');
  }

  return data;
};

export const saveRecipe = async (recipeData: any) => {
  const { error } = await supabase.from("recipes").insert(recipeData);
  if (error) throw error;
  return true;
};
