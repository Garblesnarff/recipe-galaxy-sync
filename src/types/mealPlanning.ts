/**
 * Meal Planning Types
 * Types for weekly meal planning functionality
 */

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';
export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Sunday, 6 = Saturday
export type MealPlanStatus = 'active' | 'completed' | 'archived';

export interface MealPlan {
  id: string;
  user_id: string;
  name: string;
  week_start_date: string; // ISO date string
  status: MealPlanStatus;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface MealPlanRecipe {
  id: string;
  meal_plan_id: string;
  recipe_id: string;
  day_of_week: DayOfWeek;
  meal_type: MealType;
  servings: number;
  notes?: string;
  created_at: string;
  // Populated from recipe join
  recipe?: {
    id: string;
    title: string;
    image_url?: string;
    cook_time?: string;
    prep_time?: string;
  };
}

export interface WeeklyMealPlan {
  id: string;
  name: string;
  week_start_date: string;
  status: MealPlanStatus;
  recipes: MealPlanRecipe[];
  notes?: string;
}

export interface MealPlanSummary {
  total_recipes: number;
  unique_recipes: number;
  total_servings: number;
  nutrition_summary?: {
    total_calories: number;
    total_protein: number;
    total_carbs: number;
    total_fat: number;
  };
}

export interface MealPlanFilters {
  status?: MealPlanStatus;
  date_range?: {
    start: string;
    end: string;
  };
  search_query?: string;
}
