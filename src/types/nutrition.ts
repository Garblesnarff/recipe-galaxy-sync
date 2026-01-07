/**
 * Nutrition Types
 * Types for nutritional information and tracking
 */

export interface IngredientNutrition {
  id: string;
  name: string;
  category?: string;
  serving_size_grams: number;
  calories_per_100g?: number;
  protein_per_100g?: number;
  carbs_per_100g?: number;
  fat_per_100g?: number;
  fiber_per_100g?: number;
  sugar_per_100g?: number;
  sodium_per_100g?: number;
  created_by?: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface RecipeNutrition {
  id: string;
  recipe_id: string;
  version_number: number;
  servings: number;
  calories_per_serving?: number;
  protein_per_serving?: number;
  carbs_per_serving?: number;
  fat_per_serving?: number;
  fiber_per_serving?: number;
  sugar_per_serving?: number;
  sodium_per_serving?: number;
  calculated_at: string;
}

export interface NutritionSummary {
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
  fiber: number;
  sugar: number;
  sodium: number;
}

export interface DailyNutritionGoals {
  id?: string;
  user_id: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  fiber?: number;
  sodium?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface NutritionProgress {
  date: string;
  consumed: NutritionSummary;
  goals?: NutritionSummary;
  percentage: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
    sodium: number;
  };
}

export interface ParsedIngredient {
  name: string;
  amount: number;
  unit: string;
  comments?: string;
}

export interface NutritionCalculation {
  ingredient: ParsedIngredient;
  nutrition: IngredientNutrition;
  scaled_nutrition: NutritionSummary;
  confidence: number; // 0-1, how confident we are in the match
}
