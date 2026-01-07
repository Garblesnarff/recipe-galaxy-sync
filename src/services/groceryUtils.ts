
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { GroceryItem, ParsedIngredient } from "./groceryTypes";

// Convert fraction strings to decimal numbers
const fractionToDecimal = (fraction: string): number => {
  const fractionMap: Record<string, number> = {
    '¼': 0.25, '½': 0.5, '¾': 0.75, '⅓': 1/3, '⅔': 2/3, '⅛': 0.125, '⅜': 0.375,
    '⅝': 0.625, '⅞': 0.875, '⅙': 1/6, '⅚': 5/6, '⅕': 0.2, '⅖': 0.4,
    '⅗': 0.6, '⅘': 0.8
  };

  return fractionMap[fraction] || parseFractionString(fraction);
};

// Parse fraction strings like "1/2", "3/4"
const parseFractionString = (fraction: string): number => {
  if (fraction.includes('/')) {
    const [numerator, denominator] = fraction.split('/').map(Number);
    if (!isNaN(numerator) && !isNaN(denominator) && denominator !== 0) {
      return numerator / denominator;
    }
  }
  const num = parseFloat(fraction);
  return isNaN(num) ? 0 : num;
};

// Convert quantity string to numeric value
const parseQuantityToNumber = (quantityStr: string): number => {
  if (!quantityStr) return 0;

  // Handle mixed numbers like "1 1/2", "2 ¾"
  const mixedMatch = quantityStr.trim().match(/^(\d+)\s+(.+)$/);
  if (mixedMatch) {
    const whole = parseInt(mixedMatch[1]);
    const fraction = fractionToDecimal(mixedMatch[2]);
    return whole + fraction;
  }

  // Handle straight fractions or decimals
  return fractionToDecimal(quantityStr);
};

// Enhanced ingredient parsing with better fraction and unit handling
export const parseIngredient = (ingredient: string, recipeId?: string): ParsedIngredient | null => {
  try {
    if (!ingredient || !ingredient.trim()) {
      return null; // Skip empty ingredients
    }

    const originalText = ingredient.trim();
    let itemName = originalText;
    let quantity = "";
    let quantityNumeric = 0;
    let unit = "";

    // Comprehensive regex patterns for ingredient parsing
    const patterns = [
      // Pattern 1: "1 ½ cups all-purpose flour"
      /^(\d+(?:\s+\d+[\/]\d+|\s+[¼½¾⅓⅔⅛⅜⅝⅞⅙⅚⅕⅖⅗⅘]|[¼½¾⅓⅔⅛⅜⅝⅞⅙⅚⅕⅖⅗⅘]))?\s*([a-zA-Z]+(?:\s*[a-zA-Z]+)*)?\s*(.+)$/,
      // Pattern 2: "1½ cups flour" (compact fractions)
      /^(\d*[¼½¾⅓⅔⅛⅜⅝⅞⅙⅚⅕⅖⅗⅘]\d*|(?:\d+\s*)?[¼½¾⅓⅔⅛⅜⅝⅞⅙⅚⅕⅖⅗⅘]*\d*[¼½¾⅓⅔⅛⅜⅝⅞⅙⅚⅕⅖⅗⅘]*(?:\s*[\/]\s*\d+[¼½¾⅓⅔⅛⅜⅝⅞⅙⅚⅕⅖⅗⅘]*\d*[¼½¾⅓⅔⅛⅜⅝⅞⅙⅚⅕⅖⅗⅘]*)?)+\s*([a-zA-Z]+(?:\s*[a-zA-Z]+)*)?\s*(.+)$/,
      // Pattern 3: "1 cup flour" (simple case)
      /^(\d+(?:[\/\-]\d+)?|[¼½¾⅓⅔⅛⅜⅝⅞⅙⅚⅕⅖⅗⅘]+)\s*([a-zA-Z]+(?:\s*[a-zA-Z]+)*)?\s*(.+)$/,
      // Pattern 4: Simple fallback
      /^(.+)$/  // Fallback for anything
    ];

    for (const pattern of patterns) {
      const match = originalText.match(pattern);
      if (match) {
        const quantityPart = match[1]?.trim();
        const unitPart = match[2]?.trim();
        const itemPart = (match[3] || match[1])?.trim();

        if (quantityPart) {
          quantity = quantityPart;
          quantityNumeric = parseQuantityToNumber(quantityPart);
          unit = unitPart || "";
          itemName = itemPart;
          break;
        }
      }
    }

    // Clean up the item name by removing common preparation instructions
    itemName = itemName
      .replace(/\s*\([^)]*\)/g, '') // Remove parentheses
      .replace(/\s*,\s*(chopped|sliced|diced|minced|grated|crushed|ground)\s*/gi, '') // Remove prep methods
      .replace(/^\s*(fresh|dried|frozen|canned)\s+/i, '') // Remove quality descriptors at start
      .trim();

    // Normalize units
    const unitMap: Record<string, string> = {
      'cups': 'cup', 'cup': 'cup', 'c': 'cup', 'c.': 'cup',
      'tablespoons': 'tbsp', 'tablespoon': 'tbsp', 'tbsps': 'tbsp', 'tbsp': 'tbsp', 'tbsp.': 'tbsp', 't': 'tbsp', 't.': 'tbsp',
      'teaspoons': 'tsp', 'teaspoon': 'tsp', 'tsps': 'tsp', 'tsp': 'tsp', 'tsp.': 'tsp',
      'ounces': 'oz', 'ounce': 'oz', 'oz': 'oz', 'oz.': 'oz',
      'pounds': 'lb', 'pound': 'lb', 'lbs': 'lb', 'lb': 'lb', 'lb.': 'lb',
      'grams': 'g', 'gram': 'g', 'g': 'g', 'g.': 'g',
      'milligrams': 'mg', 'milligram': 'mg', 'mg': 'mg', 'mg.': 'mg',
      'kilograms': 'kg', 'kilogram': 'kg', 'kg': 'kg', 'kg.': 'kg',
      'liters': 'L', 'liter': 'L', 'L': 'L', 'l': 'L',
      'milliliters': 'mL', 'milliliter': 'mL', 'ml': 'mL',
      'pieces': 'piece', 'piece': 'piece', 'pcs': 'piece', 'pc': 'piece',
      'packages': 'package', 'package': 'package', 'pkg': 'package', 'pkgs': 'package',
      'cans': 'can', 'can': 'can', 'cloves': 'clove', 'clove': 'clove'
    };

    if (unit && unitMap[unit.toLowerCase()]) {
      unit = unitMap[unit.toLowerCase()];
    }

    // Ensure we have a valid item name
    if (!itemName) {
      itemName = originalText;
    }

    return {
      item_name: itemName,
      quantity,
      quantity_numeric: quantityNumeric > 0 ? quantityNumeric : undefined,
      unit: unit || undefined,
      original_text: originalText,
      recipe_id
    };
  } catch (error) {
    console.error("Error parsing ingredient:", ingredient, error);
    return {
      item_name: ingredient.trim(),
      quantity: "",
      unit: "",
      original_text: ingredient.trim(),
      recipe_id
    };
  }
};

// Legacy function for backward compatibility - converts ParsedIngredient to GroceryItem format
export const parseIngredientLegacy = (ingredient: string, recipeId?: string): Partial<GroceryItem> | null => {
  const parsed = parseIngredient(ingredient, recipeId);
  if (!parsed) return null;

  return {
    recipe_id: recipeId || undefined,
    item_name: parsed.item_name,
    quantity: parsed.quantity,
    quantity_numeric: parsed.quantity_numeric,
    unit: parsed.unit,
    is_purchased: false
  };
};

// Scale ingredient quantities by a multiplier
export const scaleIngredient = (ingredient: ParsedIngredient, scaleMultiplier: number): ParsedIngredient => {
  if (!ingredient.quantity_numeric || scaleMultiplier === 1) {
    return { ...ingredient }; // No scaling needed
  }

  const scaledQuantity = ingredient.quantity_numeric * scaleMultiplier;

  // Determine the appropriate display format for the scaled quantity
  let newQuantity = scaledQuantity.toString();

  // Handle common fractions for readability
  const commonFractions: Record<number, string> = {
    0.125: '⅛', 0.25: '¼', 0.375: '⅜', 0.5: '½', 0.625: '⅝',
    0.75: '¾', 0.875: '⅞', 0.3333333333333333: '⅓', 0.6666666666666666: '⅔', 0.16666666666666666: '⅙',
    0.8333333333333334: '⅚', 0.2: '⅕', 0.4: '⅖', 0.6: '⅗', 0.8: '⅘'
  };

  // Check if the scaled quantity matches a common fraction
  if (commonFractions[scaledQuantity]) {
    newQuantity = commonFractions[scaledQuantity];
  } else if (scaledQuantity % 1 !== 0) {
    // For non-whole numbers, try to represent as mixed numbers or simple fractions
    const whole = Math.floor(scaledQuantity);
    const fraction = scaledQuantity - whole;

    // Find the closest simple fraction representation
    const commonDecimalFractions = [0.125, 0.16666666666666666, 0.25, 0.3333333333333333, 0.375, 0.5, 0.625, 0.6666666666666666, 0.75, 0.8333333333333334, 0.875];
    const closest = commonDecimalFractions.reduce((prev, curr) =>
      Math.abs(curr - fraction) < Math.abs(prev - fraction) ? curr : prev
    );

    if (Math.abs(closest - fraction) < 0.01) { // Within 1% tolerance
      if (whole > 0) {
        newQuantity = `${whole} ${commonFractions[closest] || closest.toString()}`;
      } else {
        newQuantity = commonFractions[closest] || closest.toString();
      }
    } else if (whole === 0) {
      // Keep as decimal for uncommon fractions
      newQuantity = scaledQuantity.toFixed(2).replace(/\.?0+$/, '');
    } else {
      // Mixed number with decimal
      newQuantity = `${whole} ${fraction.toFixed(2).replace(/\.?0+$/, '')}`;
    }
  } else {
    // Whole number
    newQuantity = scaledQuantity.toString();
  }

  return {
    ...ingredient,
    quantity: newQuantity,
    quantity_numeric: scaledQuantity
  };
};

// Scale an array of ingredients by a multiplier
export const scaleIngredients = (ingredients: ParsedIngredient[], scaleMultiplier: number): ParsedIngredient[] => {
  return ingredients.map(ingredient => scaleIngredient(ingredient, scaleMultiplier));
};

// Normalize ingredient names for better deduplication
const normalizeIngredientName = (name: string): string => {
  return name
    .toLowerCase()
    .trim()
    // Remove common variations and descriptors
    .replace(/\s+/g, ' ') // Normalize spaces
    .replace(/(fresh|dried|frozen|canned|organic|large|small|medium|extra large)/gi, '')
    .replace(/^the\s+/i, '') // Remove leading "the"
    .replace(/(?:^|\s)(and|or|with|for|in|on|at|by)(?:\s|$)/gi, ' ') // Remove common words
    .replace(/\s+/g, ' ') // Clean up again
    .trim();
};

// Calculate similarity between two strings (simple Levenshtein-based approach)
const calculateSimilarity = (str1: string, str2: string): number => {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;

  if (longer.length === 0) return 1.0;

  const distance = levenshteinDistance(longer, shorter);
  return (longer.length - distance) / longer.length;
};

// Simple Levenshtein distance calculation
const levenshteinDistance = (str1: string, str2: string): number => {
  const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));

  for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,
        matrix[j - 1][i] + 1,
        matrix[j - 1][i - 1] + cost
      );
    }
  }

  return matrix[str2.length][str1.length];
};

// Check if units are compatible for combination
const areUnitsCompatible = (unit1?: string, unit2?: string): boolean => {
  if (!unit1 && !unit2) return true; // Both unitless are compatible
  if (!unit1 || !unit2) return false; // One unitless, one with unit

  const compatibleUnits: Record<string, string[]> = {
    'cup': ['cup', 'c'],
    'tbsp': ['tbsp', 'tablespoon', 'tablespoons', 't', 't.'],
    'tsp': ['tsp', 'teaspoon', 'teaspoons'],
    'oz': ['oz', 'ounce', 'ounces'],
    'lb': ['lb', 'pound', 'pounds', 'lbs'],
    'g': ['g', 'gram', 'grams', 'gr'],
    'kg': ['kg', 'kilogram', 'kilograms'],
    'L': ['L', 'liter', 'liters', 'l'],
    'mL': ['mL', 'milliliter', 'milliliters', 'ml'],
    'piece': ['piece', 'pieces', 'pcs', 'pc'],
    'can': ['can', 'cans'],
    'clove': ['clove', 'cloves'],
    'package': ['package', 'packages', 'pkg', 'pkgs']
  };

  const normalizedUnit1 = unit1.toLowerCase().trim();
  const normalizedUnit2 = unit2.toLowerCase().trim();

  // Direct match
  if (normalizedUnit1 === normalizedUnit2) return true;

  // Check compatibility groups
  for (const [key, equivalents] of Object.entries(compatibleUnits)) {
    if (equivalents.includes(normalizedUnit1) && equivalents.includes(normalizedUnit2)) {
      return true;
    }
  }

  return false;
};

// Combine compatible ingredients with similar names
export const deduplicateIngredients = (ingredients: ParsedIngredient[]): ParsedIngredient[] => {
  const combined: ParsedIngredient[] = [];

  for (const ingredient of ingredients) {
    let found = false;

    for (let i = 0; i < combined.length; i++) {
      const existing = combined[i];

      // Check if ingredients are similar and units are compatible
      const name1 = normalizeIngredientName(ingredient.item_name);
      const name2 = normalizeIngredientName(existing.item_name);

      const isSimilarName =
        name1 === name2 ||
        calculateSimilarity(name1, name2) > 0.8; // 80% similarity threshold

      const isCompatibleUnit = areUnitsCompatible(ingredient.unit, existing.unit);

      if (isSimilarName && isCompatibleUnit) {
        // Combine quantities if both have numeric values
        if (ingredient.quantity_numeric && existing.quantity_numeric) {
          const combinedQuantity = ingredient.quantity_numeric + existing.quantity_numeric;

          // Update the existing ingredient with combined data
          combined[i] = {
            ...existing,
            quantity: combinedQuantity.toString(),
            quantity_numeric: combinedQuantity,
            // Keep the unit from the first encountered ingredient
            unit: existing.unit || ingredient.unit,
            // Combine recipe IDs if different
            recipe_id: existing.recipe_id !== ingredient.recipe_id ?
              `${existing.recipe_id}, ${ingredient.recipe_id}` : existing.recipe_id
          };
        } else {
          // If not numeric, just keep the first one but note the duplication
          combined[i] = {
            ...existing,
            item_name: `${existing.item_name} (multiple recipes)`
          };
        }

        found = true;
        break;
      }
    }

    if (!found) {
      combined.push({ ...ingredient });
    }
  }

  return combined;
};

// Smart deduplication that combines ingredients across recipes
export const combineIngredientsForGroceryList = (ingredients: ParsedIngredient[]): ParsedIngredient[] => {
  // First scale any ingredients that need scaling
  const processed = ingredients.map(ing => ({ ...ing }));

  // Then deduplicate
  return deduplicateIngredients(processed);
};

// Format a scaled quantity with unit for display
export const formatScaledIngredient = (ingredient: ParsedIngredient, includeUnit = true): string => {
  const parts = [];

  if (ingredient.quantity) {
    parts.push(ingredient.quantity);
  }

  if (includeUnit && ingredient.unit) {
    parts.push(ingredient.unit);
  }

  parts.push(ingredient.item_name);

  return parts.join(' ');
};

// Handle and log errors
export const handleGroceryError = (error: any, message: string): null => {
  console.error(`Error in ${message}:`, error);
  toast.error("An unexpected error occurred");
  return null;
};
