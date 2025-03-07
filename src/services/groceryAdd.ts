
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { parseIngredient, handleGroceryError } from "./groceryUtils";
import { GroceryItem } from "./groceryTypes";

// Add a single ingredient to grocery list
export const addToGroceryList = async (
  item: Omit<GroceryItem, "id" | "user_id" | "created_at" | "is_purchased">
): Promise<GroceryItem | null> => {
  try {
    const { data, error } = await supabase
      .from("grocery_items")
      .insert({
        ...item,
        is_purchased: false
      })
      .select()
      .single();

    if (error) {
      console.error("Error adding to grocery list:", error);
      toast.error("Failed to add item to grocery list");
      return null;
    }

    toast.success("Added to grocery list");
    return data;
  } catch (error) {
    return handleGroceryError(error, "addToGroceryList");
  }
};

// Add multiple ingredients to grocery list
export const addIngredientsToGroceryList = async (
  ingredients: string[],
  recipeId: string
): Promise<boolean> => {
  try {
    // Parse ingredients
    const groceryItems = ingredients.map(ingredient => parseIngredient(ingredient, recipeId));

    const { error } = await supabase
      .from("grocery_items")
      .insert(groceryItems);

    if (error) {
      console.error("Error adding ingredients to grocery list:", error);
      toast.error("Failed to add ingredients to grocery list");
      return false;
    }

    toast.success(`Added ${ingredients.length} ingredients to grocery list`);
    return true;
  } catch (error) {
    console.error("Error in addIngredientsToGroceryList:", error);
    toast.error("An unexpected error occurred");
    return false;
  }
};
