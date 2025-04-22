
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { GroceryItem } from "./groceryTypes";

// Parse ingredients into structured grocery items
export const parseIngredient = (ingredient: string, recipeId?: string) => {
  try {
    // Default values
    let quantity = "";
    let unit = "";
    let itemName = ingredient.trim();

    if (!itemName) {
      return null; // Skip empty ingredients
    }

    // Try to extract quantity and unit
    // Match patterns like "1 cup flour", "1/2 tsp salt", "3-4 tbsp sugar"
    const match = ingredient.match(/^([0-9¼½¾⅓⅔]+(?:\s*[\/\-]\s*[0-9¼½¾⅓⅔]+)?)\s*([a-zA-Z]+)?\s+(.+)$/);
    
    if (match) {
      quantity = match[1].trim();
      unit = match[2]?.trim() || "";
      itemName = match[3].trim();
    }

    // If no structured data was extracted but we have a non-empty string,
    // just use it as the item name
    if (!itemName && ingredient.trim()) {
      itemName = ingredient.trim();
    }

    console.log("Parsed ingredient:", { itemName, quantity, unit, original: ingredient });

    return {
      recipe_id: recipeId,
      item_name: itemName,
      quantity,
      unit,
      is_purchased: false
    };
  } catch (error) {
    console.error("Error parsing ingredient:", ingredient, error);
    return {
      recipe_id: recipeId,
      item_name: ingredient.trim(),
      quantity: "",
      unit: "",
      is_purchased: false
    };
  }
};

// Handle and log errors
export const handleGroceryError = (error: any, message: string): null => {
  console.error(`Error in ${message}:`, error);
  toast.error("An unexpected error occurred");
  return null;
};
