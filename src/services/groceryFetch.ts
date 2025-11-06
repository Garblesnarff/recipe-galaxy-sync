
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { handleGroceryError } from "./groceryUtils";
import { GroceryItem } from "./groceryTypes";

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

    // Convert to unknown first, then to GroceryItem[] to avoid type errors
    return (data || []) as unknown as GroceryItem[];
  } catch (error) {
    handleGroceryError(error, "getGroceryList");
    return [];
  }
};
