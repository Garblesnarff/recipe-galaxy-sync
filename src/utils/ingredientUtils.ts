import { IngredientInput, ImageInput } from '@/types/adaptedRecipe';

export const processIngredients = (ingredients: IngredientInput): string[] => {
  if (!ingredients) return [];

  if (Array.isArray(ingredients)) {
    return ingredients.map(ingredient =>
      typeof ingredient === 'string' ? ingredient : String(ingredient)
    );
  }

  if (typeof ingredients === 'object') {
    return Object.values(ingredients).map(ingredient =>
      typeof ingredient === 'string' ? ingredient : String(ingredient)
    );
  }

  return [];
};

export const normalizeImageUrl = (image: ImageInput): string | undefined => {
  if (!image) return undefined;
  if (typeof image === 'string') return image;
  return undefined;
};
