export interface RecipeFormData {
  title: string;
  description: string;
  cookTime: string;
  difficulty: string;
  instructions: string;
  ingredients: string[];
  currentIngredient: string;
  imageUrl: string;
  source_url: string;
  recipe_type: "manual" | "webpage" | "youtube";
  categories: string[];
  cuisine_type: string;
  diet_tags: string[];
  cooking_method: string;
  season_occasion: string[];
  prep_time: string;
  servings: number;
}

export interface ImportedRecipeData {
  title?: string;
  description?: string;
  cook_time?: string;
  difficulty?: string;
  instructions?: string;
  ingredients?: string[] | string;
  image_url?: string;
}

export interface RecipeFilters {
  categories: string[];
  cuisine_type: string | null;
  diet_tags: string[];
  cooking_method: string | null; 
  season_occasion: string[];
  difficulty: string | null;
  favorite_only: boolean;
  searchQuery: string;
}

export interface SortOption {
  label: string;
  value: string;
  direction: 'asc' | 'desc';
}

export interface Recipe {
  id: string;
  title: string;
  description: string;
  image_url?: string;
  ingredients: any[];
  instructions: string;
  prep_time?: string;
  cook_time?: string;
  servings: number;
  difficulty?: string;
  source_url?: string;
  source_type?: string;
  categories?: string[];
  cuisine_type?: string;
  diet_tags?: string[];
  cooking_method?: string;
  season_occasion?: string[];
  rating?: number;
  ratings?: any[];
  is_favorite?: boolean;
  created_at?: string;
  updated_at?: string;
}

export const CUISINE_TYPES = [
  "American", "Italian", "Mexican", "Chinese", "Indian", "Japanese", "Thai", 
  "Mediterranean", "French", "Greek", "Spanish", "Middle Eastern", "Korean", 
  "Vietnamese", "German", "Caribbean", "African", "British", "Fusion", "Uncategorized"
];

export const COOKING_METHODS = [
  "Baking", "Grilling", "Roasting", "Frying", "Sautéing", "Boiling", "Steaming", 
  "Slow Cooking", "Pressure Cooking", "Sous Vide", "Air Frying", "Smoking", "Raw", 
  "Fermenting", "Pickling", "Various"
];

export const CATEGORY_OPTIONS = [
  "Breakfast", "Lunch", "Dinner", "Appetizer", "Side Dish", "Snack", "Dessert", 
  "Beverage", "Soup", "Salad", "Main Course", "One Pot Meal", "Sandwich", "Pasta", 
  "Pizza", "Stir Fry", "Casserole", "Curry"
];

export const DIET_TAG_OPTIONS = [
  "Vegetarian", "Vegan", "Gluten-Free", "Dairy-Free", "Keto", "Low-Carb", 
  "Paleo", "Whole30", "Sugar-Free", "Nut-Free", "Low-Fat", "High-Protein"
];

export const SEASON_OCCASION_OPTIONS = [
  "Spring", "Summer", "Fall", "Winter", "Holiday", "Thanksgiving", "Christmas", 
  "Easter", "Halloween", "Game Day", "Picnic", "BBQ", "Birthday", "Anniversary", 
  "Valentine's Day", "New Year's", "Weeknight", "Weekend", "Brunch"
];

export const SORT_OPTIONS: SortOption[] = [
  { label: "Recently Added", value: "created_at", direction: "desc" },
  { label: "Oldest First", value: "created_at", direction: "asc" },
  { label: "Alphabetical (A-Z)", value: "title", direction: "asc" },
  { label: "Alphabetical (Z-A)", value: "title", direction: "desc" },
  { label: "Highest Rated", value: "rating", direction: "desc" },
  { label: "Prep Time (Quick first)", value: "prep_time", direction: "asc" },
];
