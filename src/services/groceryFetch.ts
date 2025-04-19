
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { handleGroceryError } from "./groceryUtils";
import { GroceryItem } from "./groceryTypes";

// Get all grocery items
export const getGroceryList = async (): Promise<GroceryItem[]> => {
  try {
    const { data, error } = await (supabase
      .from("grocery_items" as any)
      .select("*")
      .order("is_purchased", { ascending: true })
      .order("created_at", { ascending: false })) as unknown as { data: GroceryItem[], error: any };

    if (error) {
      console.error("Error fetching grocery list:", error);
      toast.error("Failed to load grocery list");
      return [];
    }

    return data || [];
  } catch (error) {
    handleGroceryError(error, "getGroceryList");
    return [];
  }
};
