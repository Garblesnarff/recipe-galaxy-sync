
/**
 * Clean an ingredient string to extract just the food item
 */
export const normalizeIngredient = (ingredient: string): string => {
  // Remove quantities and units (e.g., "2 cups of milk" -> "milk")
  return ingredient
    .toLowerCase()
    .replace(/^\d+\s*\/?\d*\s*/, "") // Remove quantities like "2" or "1/2"
    .replace(/cups?|tbsps?|tablespoons?|tsps?|teaspoons?|pounds?|lbs?|ounces?|oz|grams?|kilograms?|kg|ml|liters?|l\s+of\s+/g, "")
    .replace(/^\s+|\s+$/g, ""); // Trim whitespace
};

/**
 * Check if an ingredient matches a sale item
 */
export const doesIngredientMatch = (
  ingredient: string, 
  saleItem: string, 
  variantMap: Record<string, string>
): boolean => {
  const normalizedIngredient = ingredient.toLowerCase();
  const normalizedSaleItem = saleItem.toLowerCase();
  
  // Direct match
  if (normalizedSaleItem.includes(normalizedIngredient)) {
    return true;
  }
  
  // Check for variant matches using the mapping
  const canonicalName = variantMap[normalizedIngredient];
  if (canonicalName) {
    if (normalizedSaleItem.includes(canonicalName.toLowerCase())) {
      return true;
    }
    
    // Check if any variants of this canonical name are in the sale item
    for (const [variant, canonical] of Object.entries(variantMap)) {
      if (canonical === canonicalName && normalizedSaleItem.includes(variant)) {
        return true;
      }
    }
  }
  
  return false;
};
