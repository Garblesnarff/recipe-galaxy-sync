
import { supabase } from "@/integrations/supabase/client";
import { Collection, CollectionRecipe } from "@/types/collection";
import { toast } from "sonner";

export const fetchCollections = async (): Promise<Collection[]> => {
  try {
    // Get collections with recipe count
    const { data, error } = await supabase
      .from('collections')
      .select(`
        *,
        recipe_count:collection_recipes(count)
      `)
      .order('name');

    if (error) throw error;

    // Format the data to extract recipe count
    return data.map(collection => ({
      ...collection,
      recipe_count: collection.recipe_count?.[0]?.count || 0
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
        recipe_count:collection_recipes(count)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;

    return {
      ...data,
      recipe_count: data.recipe_count?.[0]?.count || 0
    };
  } catch (error) {
    console.error("Error fetching collection:", error);
    toast.error("Failed to fetch collection");
    return null;
  }
};

export const createCollection = async (collection: Partial<Collection>): Promise<string | null> => {
  try {
    const { data, error } = await supabase
      .from('collections')
      .insert({
        name: collection.name,
        description: collection.description || '',
        cover_image_url: collection.cover_image_url
      })
      .select('id')
      .single();

    if (error) throw error;
    
    toast.success("Collection created successfully");
    return data.id;
  } catch (error) {
    console.error("Error creating collection:", error);
    toast.error("Failed to create collection");
    return null;
  }
};

export const updateCollection = async (id: string, updates: Partial<Collection>): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('collections')
      .update({
        name: updates.name,
        description: updates.description,
        cover_image_url: updates.cover_image_url
      })
      .eq('id', id);

    if (error) throw error;
    
    toast.success("Collection updated successfully");
    return true;
  } catch (error) {
    console.error("Error updating collection:", error);
    toast.error("Failed to update collection");
    return false;
  }
};

export const deleteCollection = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('collections')
      .delete()
      .eq('id', id);

    if (error) throw error;
    
    toast.success("Collection deleted successfully");
    return true;
  } catch (error) {
    console.error("Error deleting collection:", error);
    toast.error("Failed to delete collection");
    return false;
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

export const addRecipeToCollection = async (
  collectionId: string, 
  recipeId: string
): Promise<boolean> => {
  try {
    // Check if the recipe is already in the collection to avoid duplicates
    const { data: existingData } = await supabase
      .from('collection_recipes')
      .select('*')
      .eq('collection_id', collectionId)
      .eq('recipe_id', recipeId);

    if (existingData && existingData.length > 0) {
      // Recipe is already in the collection
      toast.info("Recipe is already in this collection");
      return true;
    }

    // Add recipe to collection
    const { error } = await supabase
      .from('collection_recipes')
      .insert({
        collection_id: collectionId,
        recipe_id: recipeId
      });

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
    const { error } = await supabase
      .from('collection_recipes')
      .delete()
      .eq('collection_id', collectionId)
      .eq('recipe_id', recipeId);

    if (error) throw error;
    
    toast.success("Recipe removed from collection");
    return true;
  } catch (error) {
    console.error("Error removing recipe from collection:", error);
    toast.error("Failed to remove recipe from collection");
    return false;
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
    return data.map(item => item.collections);
  } catch (error) {
    console.error("Error fetching recipe collections:", error);
    toast.error("Failed to fetch collections for this recipe");
    return [];
  }
};
