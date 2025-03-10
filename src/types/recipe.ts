
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
