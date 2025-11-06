import { Recipe } from './recipe';
import { RecipeIngredient } from './recipeIngredient';

/**
 * Represents a substitution made when adapting a recipe
 */
export interface RecipeSubstitution {
  original: string;
  substitute: string;
  reason: string;
}

/**
 * Represents an adapted recipe with substitutions
 */
export interface AdaptedRecipe extends Recipe {
  substitutions?: RecipeSubstitution[];
  adaptedFor?: string[];
  originalRecipeId?: string;
}

/**
 * Supabase database error type
 */
export interface SupabaseError {
  message: string;
  details?: string;
  hint?: string;
  code?: string;
}

/**
 * Generic Supabase query response type
 */
export interface SupabaseResponse<T> {
  data: T | null;
  error: SupabaseError | null;
}

/**
 * Window interface extension for gtag analytics
 */
declare global {
  interface Window {
    gtag?: (
      command: 'event' | 'config' | 'set',
      targetId: string,
      config?: Record<string, unknown>
    ) => void;
  }
}

/**
 * Ingredients in various formats that need to be normalized
 */
export type IngredientInput =
  | string[]
  | RecipeIngredient[]
  | Record<string, string>
  | Record<string, RecipeIngredient>
  | string
  | null
  | undefined;

/**
 * Image URL in various formats that need to be normalized
 */
export type ImageInput =
  | string
  | Record<string, unknown>
  | null
  | undefined;
