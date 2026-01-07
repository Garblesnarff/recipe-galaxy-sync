
import { supabase } from "@/integrations/supabase/client";
import { parseIngredient, combineIngredientsForGroceryList, scaleIngredients } from "./groceryUtils";
import { toast } from "sonner";
import { GroceryItem, ParsedIngredient } from "./groceryTypes";

export const addToGroceryList = async (
  item: Omit<GroceryItem, "id" | "created_at">,
  userId: string
): Promise<boolean> => {
  try {
    const groceryItem = { 
      ...item, 
      is_purchased: item.is_purchased !== undefined ? item.is_purchased : false,
      user_id: userId
    };
    const { data, error } = await supabase
      .from("grocery_items" as any)
      .insert([groceryItem as any])
      .select();

    if (error) {
      toast.error("Failed to add to grocery list");
      return false;
    }
    toast.success("Item added to grocery list");
    return true;
  } catch (error) {
    toast.error("Failed to add to grocery list");
    return false;
  }
};

export const addIngredientsToGroceryList = async (
  ingredients: string[],
  userId: string,
  recipeId?: string
): Promise<boolean> => {
  try {
    if (!ingredients || ingredients.length === 0) {
      toast.error("No ingredients to add");
      return false;
    }
    const parsedIngredients = ingredients
      .map(ingredient => parseIngredient(ingredient, recipeId))
      .filter(item => item !== null) as ParsedIngredient[];
    if (parsedIngredients.length === 0) {
      toast.error("No valid ingredients to add");
      return false;
    }

    // Convert to GroceryItem format for database insertion
    const groceryItems = parsedIngredients.map(ing => ({
      item_name: ing.item_name,
      quantity: ing.quantity,
      quantity_numeric: ing.quantity_numeric,
      unit: ing.unit,
      is_purchased: false,
      user_id: userId,
      recipe_id: ing.recipe_id
    })) as Omit<GroceryItem, "id" | "created_at">[];

    const { data, error } = await supabase
      .from("grocery_items" as any)
      .insert(groceryItems as any)
      .select();

    if (error) {
      toast.error("Failed to add ingredients to grocery list");
      return false;
    }
    toast.success(`Added ${parsedIngredients.length} ingredients to grocery list`);
    return true;
  } catch (error) {
    toast.error("Failed to add ingredients");
    return false;
  }
};

// Interface for recipe ingredients data
export interface RecipeIngredientsData {
  recipeId: string;
  ingredients: string[];
  scaleFactor?: number; // Optional scaling (e.g., 2 for double recipe)
}

// Add ingredients from multiple recipes with deduplication and scaling
export const addMultipleRecipesToGroceryList = async (
  recipeData: RecipeIngredientsData[],
  userId: string
): Promise<{ success: boolean; addedCount: number; combinedCount: number }> => {
  try {
    if (!recipeData || recipeData.length === 0) {
      toast.error("No recipes to add");
      return { success: false, addedCount: 0, combinedCount: 0 };
    }

    // Parse all ingredients from all recipes
    let allParsedIngredients: ParsedIngredient[] = [];

    for (const recipe of recipeData) {
      const parsed = recipe.ingredients
        .map(ingredient => parseIngredient(ingredient, recipe.recipeId))
        .filter(item => item !== null) as ParsedIngredient[];

      // Apply scaling if specified
      const processedIngredients = recipe.scaleFactor && recipe.scaleFactor !== 1
        ? scaleIngredients(parsed, recipe.scaleFactor)
        : parsed;

      allParsedIngredients = allParsedIngredients.concat(processedIngredients);
    }

    if (allParsedIngredients.length === 0) {
      toast.error("No valid ingredients found in recipes");
      return { success: false, addedCount: 0, combinedCount: 0 };
    }

    // Deduplicate ingredients across recipes
    const deduplicatedIngredients = combineIngredientsForGroceryList(allParsedIngredients);

    // Convert to GroceryItem format for database insertion
    const groceryItems = deduplicatedIngredients.map(ing => ({
      item_name: ing.item_name,
      quantity: ing.quantity,
      quantity_numeric: ing.quantity_numeric,
      unit: ing.unit,
      is_purchased: false,
      user_id: userId,
      recipe_id: ing.recipe_id?.includes(',') ? 'multiple' : ing.recipe_id // Handle combined recipes
    })) as Omit<GroceryItem, "id" | "created_at">[];

    const { data, error } = await supabase
      .from("grocery_items" as any)
      .insert(groceryItems as any)
      .select();

    if (error) {
      toast.error("Failed to add recipes to grocery list");
      return { success: false, addedCount: 0, combinedCount: 0 };
    }

    const originalCount = allParsedIngredients.length;
    const finalCount = deduplicatedIngredients.length;
    const combinedCount = originalCount - finalCount;

    toast.success(
      `Added ${finalCount} items from ${recipeData.length} recipes` +
      (combinedCount > 0 ? ` (${combinedCount} ingredients combined)` : '')
    );

    return { success: true, addedCount: finalCount, combinedCount };

  } catch (error) {
    toast.error("Failed to add recipes to grocery list");
    return { success: false, addedCount: 0, combinedCount: 0 };
  }
};

// Add ingredients from a single recipe with scaling option
export const addRecipeToGroceryListWithScaling = async (
  ingredients: string[],
  userId: string,
  recipeId: string,
  scaleFactor: number = 1
): Promise<boolean> => {
  try {
    const recipeData: RecipeIngredientsData = {
      recipeId,
      ingredients,
      scaleFactor
    };

    const result = await addMultipleRecipesToGroceryList([recipeData], userId);
    return result.success;
  } catch (error) {
    toast.error("Failed to add scaled recipe to grocery list");
    return false;
  }
};
