
export interface GroceryItem {
  id: string;
  user_id?: string;
  recipe_id?: string;
  item_name: string;
  quantity?: string;
  quantity_numeric?: number; // For calculations and scaling
  unit?: string;
  category?: string;
  is_purchased: boolean;
  created_at: string;
}

// Enhanced interface for parsed ingredients before adding to grocery list
export interface ParsedIngredient {
  item_name: string;
  quantity?: string;
  quantity_numeric?: number;
  unit?: string;
  original_text?: string;
  recipe_id?: string;
}

// Interface for ingredient scaling operations
export interface IngredientScale {
  ingredient: ParsedIngredient;
  scaleMultiplier: number;
  originalQuantity: number;
  scaledQuantity: number;
}
