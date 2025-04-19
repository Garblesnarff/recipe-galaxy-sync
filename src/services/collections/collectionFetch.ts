
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
        collection_recipes(count)
      `)
      .order('name') as any;

    if (error) throw error;

    // Format the data to extract recipe count
    return data.map((collection: any) => ({
      id: collection.id,
      name: collection.name,
      description: collection.description,
      cover_image_url: collection.cover_image_url,
      created_at: collection.created_at,
      updated_at: collection.updated_at,
      recipe_count: collection.collection_recipes?.[0]?.count || 0
    }));
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
        collection_recipes(count)
      `)
      .eq('id', id)
      .single() as any;

    if (error) throw error;

    return {
      id: data.id,
      name: data.name,
      description: data.description,
      cover_image_url: data.cover_image_url,
      created_at: data.created_at,
      updated_at: data.updated_at,
      recipe_count: data.collection_recipes?.[0]?.count || 0
    };
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
      .eq('collection_id', collectionId) as any;

    if (error) throw error;
    
    // Extract the recipe objects from the nested structure
    return data.map((item: any) => item.recipes);
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
      .eq('recipe_id', recipeId) as any;

    if (error) throw error;
    
    // Extract the collection objects and map them to our Collection type
    return data.map((item: any) => ({
      id: item.collections.id,
      name: item.collections.name,
      description: item.collections.description,
      cover_image_url: item.collections.cover_image_url,
      created_at: item.collections.created_at,
      updated_at: item.collections.updated_at
    }));
  } catch (error) {
    console.error("Error fetching recipe collections:", error);
    toast.error("Failed to fetch collections for this recipe");
    return [];
  }
};
