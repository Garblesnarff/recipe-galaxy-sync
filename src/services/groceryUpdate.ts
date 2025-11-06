
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { handleGroceryError } from "./groceryUtils";

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
    return handleGroceryError(error, "toggleItemPurchasedStatus") ?? false;
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
    return handleGroceryError(error, "deleteGroceryItem") ?? false;
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
    return handleGroceryError(error, "clearPurchasedItems") ?? false;
  }
};

// Clear all grocery items
export const clearAllItems = async (): Promise<boolean> => {
  try {
    // Using a different approach to delete all items
    // Instead of using a condition that tries to match all items
    const { error } = await supabase
      .from("grocery_items")
      .delete()
      .not("id", "is", null); // Delete all items where id is not null (all items)

    if (error) {
      console.error("Error clearing all items:", error);
      toast.error("Failed to clear grocery list");
      return false;
    }

    toast.success("Cleared grocery list");
    return true;
  } catch (error) {
    return handleGroceryError(error, "clearAllItems") ?? false;
  }
};
