
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Parse ingredients into structured grocery items
export const parseIngredient = (ingredient: string, recipeId?: string) => {
  // Simple parsing logic
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
};

// Handle and log errors
export const handleGroceryError = (error: any, message: string): null => {
  console.error(`Error in ${message}:`, error);
  toast.error("An unexpected error occurred");
  return null;
};
