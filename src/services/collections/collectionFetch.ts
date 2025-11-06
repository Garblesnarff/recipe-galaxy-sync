import { supabase } from "@/integrations/supabase/client";
import { Collection } from "@/types/collection";
import { Recipe } from "@/types/recipe";
import { SupabaseError } from "@/types/adaptedRecipe";
import { toast } from "sonner";

export const fetchCollections = async (userId?: string): Promise<Collection[]> => {
  try {
    let query = supabase
      .from('collections')
      .select(`
        *,
        collection_recipes:collection_recipes(count)
      `)
      .order('name');
    if (userId) query = query.eq('user_id', userId);

    const { data, error } = await query as unknown as {
      data: Array<{
        id: string;
        name: string;
        description: string | null;
        cover_image_url: string | null;
        created_at: string;
        updated_at: string;
        collection_recipes: Array<{ count: number }> | null;
      }> | null,
      error: SupabaseError | null
    };

    if (error) throw error;
    return (data || []).map((collection) => ({
      id: collection.id,
      name: collection.name,
      description: collection.description,
      cover_image_url: collection.cover_image_url,
      created_at: collection.created_at,
      updated_at: collection.updated_at,
      recipe_count: collection.collection_recipes?.[0]?.count || 0
    }));
  } catch (error) {
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
      .single() as unknown as {
        data: {
          id: string;
          name: string;
          description: string | null;
          cover_image_url: string | null;
          created_at: string;
          updated_at: string;
          collection_recipes: Array<{ count: number }> | null;
        } | null,
        error: SupabaseError | null
      };

    if (error) throw error;
    if (!data) return null;

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

export const fetchCollectionRecipes = async (collectionId: string): Promise<Recipe[]> => {
  try {
    const { data, error } = await supabase
      .from('collection_recipes')
      .select(`
        recipe_id,
        recipes:recipe_id(*)
      `)
      .eq('collection_id', collectionId) as unknown as {
        data: Array<{ recipe_id: string; recipes: Recipe }> | null,
        error: SupabaseError | null
      };

    if (error) throw error;

    // Extract the recipe objects from the nested structure
    return (data || []).map((item) => item.recipes);
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
      .eq('recipe_id', recipeId) as unknown as {
        data: Array<{ collections: {
          id: string;
          name: string;
          description: string | null;
          cover_image_url: string | null;
          created_at: string;
          updated_at: string;
        } }> | null,
        error: SupabaseError | null
      };

    if (error) throw error;

    // Extract the collection objects and map them to our Collection type
    return (data || []).map((item) => ({
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
