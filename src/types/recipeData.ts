import { RecipeIngredient } from './recipeIngredient';

/**
 * Union type to handle both ingredient storage formats
 * - string[]: Simple array of ingredient strings
 * - RecipeIngredient[]: Structured ingredient objects with quantity, unit, etc.
 */
export type RecipeIngredients = string[] | RecipeIngredient[];

/**
 * Recipe rating structure
 */
export interface RecipeRating {
  user_id: string;
  rating: number;
  created_at: string;
}

/**
 * Data structure for creating a new recipe
 * All fields required for recipe creation
 */
export interface RecipeSaveData {
  title: string;
  description: string;
  cook_time: string;
  difficulty: string;
  instructions: string;
  ingredients: RecipeIngredients;
  recipe_type: "manual" | "webpage" | "youtube";
  image_url: string;
  source_url: string;
  categories: string[];
  cuisine_type: string;
  diet_tags: string[];
  cooking_method: string;
  season_occasion: string[];
  prep_time: string;
  servings: number;
  is_favorite: boolean;
}

/**
 * Data structure for updating an existing recipe
 * All fields optional to allow partial updates
 */
export interface RecipeUpdateData {
  title?: string;
  description?: string;
  cook_time?: string;
  difficulty?: string;
  instructions?: string;
  ingredients?: RecipeIngredients;
  recipe_type?: "manual" | "webpage" | "youtube";
  image_url?: string;
  source_url?: string;
  source_type?: string;
  categories?: string[];
  cuisine_type?: string | null;
  diet_tags?: string[];
  cooking_method?: string | null;
  season_occasion?: string[];
  prep_time?: string;
  servings?: number;
  is_favorite?: boolean;
  rating?: number;
}
