
import { supabase } from "@/integrations/supabase/client";
import { Collection } from "@/types/collection";
import { toast } from "sonner";

export const fetchCollections = async (): Promise<Collection[]> => {
  try {
    // Get collections with recipe count
    const { data, error } = await supabase
      .from('collections')
      .select(`
        *,
        collection_recipes:collection_recipes(count)
      `)
      .order('name');

    if (error) throw error;

    // Format the data to extract recipe count
    return data.map(collection => ({
      ...collection,
      recipe_count: collection.collection_recipes?.[0]?.count || 0
    })) as Collection[];
  } catch (error) {
    console.error("Error fetching collections:", error);
    toast.error("Failed to fetch collections");
    return [];
  }
};

export const fetchCollectionById = async (id: string): Promise<Collection | null> => {
  try {
    const { data, error } = await supabase
      .from('collections')
      .select(`
        *,
        collection_recipes:collection_recipes(count)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;

    return {
      ...data,
      recipe_count: data.collection_recipes?.[0]?.count || 0
    } as Collection;
  } catch (error) {
    console.error("Error fetching collection:", error);
    toast.error("Failed to fetch collection");
    return null;
  }
};

export const fetchCollectionRecipes = async (collectionId: string) => {
  try {
    const { data, error } = await supabase
      .from('collection_recipes')
      .select(`
        recipe_id,
        recipes:recipe_id(*)
      `)
      .eq('collection_id', collectionId);

    if (error) throw error;
    
    // Extract the recipe objects from the nested structure
    return data.map(item => item.recipes);
  } catch (error) {
    console.error("Error fetching collection recipes:", error);
    toast.error("Failed to fetch recipes in this collection");
    return [];
  }
};

export const fetchRecipeCollections = async (recipeId: string): Promise<Collection[]> => {
  try {
    const { data, error } = await supabase
      .from('collection_recipes')
      .select(`
        collections:collection_id(*)
      `)
      .eq('recipe_id', recipeId);

    if (error) throw error;
    
    // Extract the collection objects from the nested structure
    return data.map(item => item.collections as Collection);
  } catch (error) {
    console.error("Error fetching recipe collections:", error);
    toast.error("Failed to fetch collections for this recipe");
    return [];
  }
};
