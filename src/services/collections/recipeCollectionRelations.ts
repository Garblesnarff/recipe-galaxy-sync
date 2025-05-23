
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const addRecipeToCollection = async (
  collectionId: string, 
  recipeId: string
): Promise<boolean> => {
  try {
    // Check if the recipe is already in the collection to avoid duplicates
    const { data: existingData } = await (supabase
      .from('collection_recipes' as any)
      .select('*')
      .eq('collection_id', collectionId)
      .eq('recipe_id', recipeId)) as unknown as { data: any[], error: any };

    if (existingData && existingData.length > 0) {
      // Recipe is already in the collection
      toast.info("Recipe is already in this collection");
      return true;
    }

    // Add recipe to collection with proper casting
    const { error } = await (supabase
      .from('collection_recipes' as any)
      .insert({
        collection_id: collectionId,
        recipe_id: recipeId
      } as any)) as unknown as { error: any };

    if (error) throw error;
    
    toast.success("Recipe added to collection");
    return true;
  } catch (error) {
    console.error("Error adding recipe to collection:", error);
    toast.error("Failed to add recipe to collection");
    return false;
  }
};

export const removeRecipeFromCollection = async (
  collectionId: string, 
  recipeId: string
): Promise<boolean> => {
  try {
    // Cast properly for the delete operation
    const { error } = await (supabase
      .from('collection_recipes' as any)
      .delete()
      .eq('collection_id', collectionId)
      .eq('recipe_id', recipeId)) as unknown as { error: any };

    if (error) throw error;
    
    toast.success("Recipe removed from collection");
    return true;
  } catch (error) {
    console.error("Error removing recipe from collection:", error);
    toast.error("Failed to remove recipe from collection");
    return false;
  }
};
