
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface GroceryItem {
  id: string;
  user_id?: string;
  recipe_id?: string;
  item_name: string;
  quantity?: string;
  unit?: string;
  category?: string;
  is_purchased: boolean;
  created_at: string;
}

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
    console.error("Error in addToGroceryList:", error);
    toast.error("An unexpected error occurred");
    return null;
  }
};

// Add multiple ingredients to grocery list
export const addIngredientsToGroceryList = async (
  ingredients: string[],
  recipeId: string
): Promise<boolean> => {
  try {
    // Parse ingredients
    const groceryItems = ingredients.map(ingredient => {
      // Simple parsing logic - can be enhanced later
      let quantity = "";
      let unit = "";
      let itemName = ingredient;

      // Try to extract quantity and unit
      const match = ingredient.match(/^([0-9¼½¾⅓⅔]+(?:\s*-\s*[0-9¼½¾⅓⅔]+)?)\s*([a-zA-Z]+)?\s+(.+)$/);
      if (match) {
        quantity = match[1].trim();
        unit = match[2]?.trim() || "";
        itemName = match[3].trim();
      }

      return {
        recipe_id: recipeId,
        item_name: itemName,
        quantity,
        unit,
        is_purchased: false
      };
    });

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

// Get all grocery items
export const getGroceryList = async (): Promise<GroceryItem[]> => {
  try {
    const { data, error } = await supabase
      .from("grocery_items")
      .select("*")
      .order("is_purchased", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching grocery list:", error);
      toast.error("Failed to load grocery list");
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Error in getGroceryList:", error);
    toast.error("An unexpected error occurred");
    return [];
  }
};

// Toggle purchased status of an item
export const toggleItemPurchasedStatus = async (id: string, currentStatus: boolean): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from("grocery_items")
      .update({ is_purchased: !currentStatus })
      .eq("id", id);

    if (error) {
      console.error("Error toggling item status:", error);
      toast.error("Failed to update item");
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error in toggleItemPurchasedStatus:", error);
    toast.error("An unexpected error occurred");
    return false;
  }
};

// Delete a grocery item
export const deleteGroceryItem = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from("grocery_items")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting grocery item:", error);
      toast.error("Failed to delete item");
      return false;
    }

    toast.success("Item removed from grocery list");
    return true;
  } catch (error) {
    console.error("Error in deleteGroceryItem:", error);
    toast.error("An unexpected error occurred");
    return false;
  }
};

// Clear all purchased items
export const clearPurchasedItems = async (): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from("grocery_items")
      .delete()
      .eq("is_purchased", true);

    if (error) {
      console.error("Error clearing purchased items:", error);
      toast.error("Failed to clear purchased items");
      return false;
    }

    toast.success("Cleared all purchased items");
    return true;
  } catch (error) {
    console.error("Error in clearPurchasedItems:", error);
    toast.error("An unexpected error occurred");
    return false;
  }
};

// Clear all grocery items
export const clearAllItems = async (): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from("grocery_items")
      .delete()
      .neq("id", "");  // A condition that's always true to delete all rows

    if (error) {
      console.error("Error clearing all items:", error);
      toast.error("Failed to clear grocery list");
      return false;
    }

    toast.success("Cleared grocery list");
    return true;
  } catch (error) {
    console.error("Error in clearAllItems:", error);
    toast.error("An unexpected error occurred");
    return false;
  }
};
