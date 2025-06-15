
export const processIngredients = (ingredients: any): string[] => {
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

export const normalizeImageUrl = (image: string | Record<string, any> | undefined): string | undefined => {
  if (!image) return undefined;
  if (typeof image === 'string') return image;
  return undefined;
};
