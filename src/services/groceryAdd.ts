
import { supabase } from "@/integrations/supabase/client";
import { parseIngredient } from "./groceryUtils";
import { toast } from "sonner";
import { GroceryItem } from "./groceryTypes";

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
      .filter(item => item !== null) as Omit<GroceryItem, "id" | "created_at">[];
    if (parsedIngredients.length === 0) {
      toast.error("No valid ingredients to add");
      return false;
    }
    // set user_id for all items
    const itemsWithUserId = parsedIngredients.map(item => ({
      ...item,
      user_id: userId
    }));

    const { data, error } = await supabase
      .from("grocery_items" as any)
      .insert(itemsWithUserId as any)
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
