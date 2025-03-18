
import { supabase } from "@/integrations/supabase/client";
import { parseIngredient } from "./groceryUtils";
import { toast } from "sonner";
import { GroceryItem } from "./groceryTypes";

// Add a single item to the grocery list
export const addToGroceryList = async (item: Omit<GroceryItem, "id" | "created_at">): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from("grocery_items")
      .insert([item])
      .select();

    if (error) {
      console.error("Error adding to grocery list:", error);
      toast.error("Failed to add to grocery list");
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error adding to grocery list:", error);
    toast.error("Failed to add to grocery list");
    return false;
  }
};

// Add multiple ingredients to the grocery list
export const addIngredientsToGroceryList = async (
  ingredients: string[],
  recipeId?: string
): Promise<boolean> => {
  try {
    // Parse each ingredient and filter out nulls
    const parsedIngredients = ingredients
      .map(ingredient => parseIngredient(ingredient, recipeId))
      .filter(item => item !== null) as Omit<GroceryItem, "id" | "created_at">[];

    if (parsedIngredients.length === 0) {
      toast.error("No valid ingredients to add");
      return false;
    }

    console.log("Adding to grocery list:", parsedIngredients);

    const { data, error } = await supabase
      .from("grocery_items")
      .insert(parsedIngredients)
      .select();

    if (error) {
      console.error("Error adding ingredients to grocery list:", error);
      toast.error("Failed to add ingredients to grocery list");
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error adding ingredients to grocery list:", error);
    toast.error("Failed to add ingredients");
    return false;
  }
};
