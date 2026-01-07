/**
 * Recipe Scaling Service
 * Service for scaling recipe ingredients and managing unit conversions
 */

import { supabase } from "@/integrations/supabase/client";
import { Tables, TablesInsert } from "@/integrations/supabase/types";
import {
  UnitConversion,
  RecipeScaling,
  ScaledIngredient
} from "@/types/recipeVersioning";

type UnitConversionRow = Tables<"unit_conversions">;
type UnitConversionInsert = TablesInsert<"unit_conversions">;

export interface ParsedIngredient {
  name: string;
  amount: number;
  unit: string;
  comments?: string;
}

export interface ScalingOptions {
  targetServings: number;
  roundToNearest?: number; // e.g., 0.25 for quarter measurements
  preserveFractions?: boolean;
}

/**
 * Parses ingredient text into structured data
 * Example: "2 cups flour, sifted" -> { name: "flour", amount: 2, unit: "cups", comments: "sifted" }
 */
export const parseIngredient = (ingredientText: string): ParsedIngredient => {
  // Remove extra whitespace and normalize
  const text = ingredientText.trim();

  // Common patterns for ingredient parsing
  const patterns = [
    // "2 cups flour, sifted"
    /^([\d\s/¼½¾⅓⅔⅛⅜⅝⅞]+)\s*(tablespoon|tbsp|cup|cups|teaspoon|tsp|gram|grams|g|kg|kilogram|kilograms|ounce|ounces|oz|pound|pounds|lb|lbs|ml|milliliter|milliliters|l|liter|liters|pinch|dash|handful|clove|cloves)?\s*(.+?)(?:,|\s*$)/i,
    // "flour 2 cups"
    /(.+?)\s+([\d\s/¼½¾⅓⅔⅛⅜⅝⅞]+)\s*(tablespoon|tbsp|cup|cups|teaspoon|tsp|gram|grams|g|kg|kilogram|kilograms|ounce|ounces|oz|pound|pounds|lb|lbs|ml|milliliter|milliliters|l|liter|liters|pinch|dash|handful|clove|cloves)?$/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const [, part1, unit, part2] = match;

      // Determine which part is the amount and which is the name
      const hasNumber = /^[\d\s/¼½¾⅓⅔⅛⅜⅝⅞]+$/.test(part1);
      const amount = hasNumber ? part1 : part2;
      const name = hasNumber ? part2 : part1;
      const ingredientUnit = hasNumber ? unit : (unit || '');

      return {
        name: name?.trim() || '',
        amount: parseFraction(amount?.trim() || '1'),
        unit: ingredientUnit?.trim() || '',
        comments: hasNumber ? undefined : unit?.trim() || undefined,
      };
    }
  }

  // Fallback: treat whole text as ingredient name
  return {
    name: text,
    amount: 1,
    unit: '',
  };
};

/**
 * Parses fractional amounts like "1 1/2" or "¼"
 */
export const parseFraction = (amountText: string): number => {
  const fractionMap: { [key: string]: number } = {
    '¼': 0.25, '½': 0.5, '¾': 0.75,
    '⅓': 1/3, '⅔': 2/3,
    '⅛': 0.125, '⅜': 0.375, '⅝': 0.625, '⅞': 0.875,
  };

  // Handle mixed fractions like "1 1/2"
  const mixedMatch = amountText.match(/^(\d+)\s+(\d+)\/(\d+)$/);
  if (mixedMatch) {
    const [, whole, numerator, denominator] = mixedMatch;
    return parseInt(whole) + parseInt(numerator) / parseInt(denominator);
  }

  // Handle simple fractions like "1/2"
  const simpleMatch = amountText.match(/^(\d+)\/(\d+)$/);
  if (simpleMatch) {
    const [, numerator, denominator] = simpleMatch;
    return parseInt(numerator) / parseInt(denominator);
  }

  // Handle unicode fractions
  for (const [unicode, decimal] of Object.entries(fractionMap)) {
    if (amountText.includes(unicode)) {
      return parseFloat(amountText.replace(unicode, '')) + decimal;
    }
  }

  // Handle whole numbers
  const numMatch = amountText.match(/^(\d+)$/);
  if (numMatch) {
    return parseInt(numMatch[1]);
  }

  // Default to 1 if parsing fails
  return 1;
};

/**
 * Gets unit conversions from database
 */
export const getUnitConversions = async (
  fromUnit?: string,
  toUnit?: string,
  category?: string
): Promise<UnitConversion[]> => {
  let query = supabase
    .from("unit_conversions")
    .select("*")
    .eq("is_public", true);

  if (fromUnit) {
    query = query.eq("from_unit", fromUnit);
  }

  if (toUnit) {
    query = query.eq("to_unit", toUnit);
  }

  if (category) {
    query = query.eq("ingredient_category", category);
  }

  const { data, error } = await query.order("ingredient_category", { nullsFirst: true });

  if (error) {
    console.error('Error fetching unit conversions:', error);
    throw new Error(`Failed to fetch unit conversions: ${error.message}`);
  }

  return data || [];
};

/**
 * Adds a custom unit conversion
 */
export const addUnitConversion = async (
  userId: string,
  conversion: Omit<UnitConversionInsert, 'created_by' | 'is_public'>
): Promise<UnitConversion> => {
  const conversionData: UnitConversionInsert = {
    ...conversion,
    created_by: userId,
    is_public: false,
  };

  const { data, error } = await supabase
    .from("unit_conversions")
    .insert(conversionData)
    .select()
    .single();

  if (error) {
    console.error('Error adding unit conversion:', error);
    throw new Error(`Failed to add unit conversion: ${error.message}`);
  }

  return data;
};

/**
 * Converts an amount from one unit to another
 */
export const convertUnit = async (
  amount: number,
  fromUnit: string,
  toUnit: string,
  ingredientName?: string
): Promise<number> => {
  // Get conversion factor
  const conversions = await getUnitConversions(fromUnit, toUnit);

  // Try to find exact match first
  let conversion = conversions.find(c =>
    c.from_unit === fromUnit &&
    c.to_unit === toUnit &&
    (!ingredientName || c.ingredient_category === null)
  );

  // If no exact match, try category-specific conversion
  if (!conversion && ingredientName) {
    // This is a simplified approach - in a real app, you'd categorize ingredients
    const category = getIngredientCategory(ingredientName);
    conversion = conversions.find(c =>
      c.from_unit === fromUnit &&
      c.to_unit === toUnit &&
      c.ingredient_category === category
    );
  }

  // If still no match, try reverse conversion
  if (!conversion) {
    const reverseConversions = await getUnitConversions(toUnit, fromUnit);
    const reverseConversion = reverseConversions.find(c =>
      c.from_unit === toUnit &&
      c.to_unit === fromUnit
    );

    if (reverseConversion) {
      conversion = {
        ...reverseConversion,
        conversion_factor: 1 / reverseConversion.conversion_factor,
        from_unit: fromUnit,
        to_unit: toUnit,
      };
    }
  }

  if (!conversion) {
    throw new Error(`No conversion found from ${fromUnit} to ${toUnit}`);
  }

  return amount * conversion.conversion_factor;
};

/**
 * Simple ingredient categorization (can be expanded)
 */
const getIngredientCategory = (ingredientName: string): string | null => {
  const name = ingredientName.toLowerCase();

  if (name.includes('flour') || name.includes('sugar') || name.includes('salt')) {
    return 'dry_goods';
  }

  if (name.includes('milk') || name.includes('water') || name.includes('oil')) {
    return 'liquid';
  }

  if (name.includes('chicken') || name.includes('beef') || name.includes('fish')) {
    return 'protein';
  }

  return null;
};

/**
 * Scales a recipe's ingredients
 */
export const scaleRecipe = async (
  originalIngredients: any[],
  originalServings: number,
  targetServings: number,
  options?: ScalingOptions
): Promise<RecipeScaling> => {
  const scaleFactor = targetServings / originalServings;
  const scaledIngredients: ScaledIngredient[] = [];
  const warnings: string[] = [];

  for (const ingredient of originalIngredients) {
    try {
      const parsed = parseIngredient(ingredient);

      // Scale the amount
      let scaledAmount = parsed.amount * scaleFactor;

      // Apply rounding if specified
      if (options?.roundToNearest) {
        scaledAmount = Math.round(scaledAmount / options.roundToNearest) * options.roundToNearest;
      }

      // Convert units if needed (simplified - just for demonstration)
      let finalAmount = scaledAmount;
      let finalUnit = parsed.unit;
      let conversionApplied = undefined;

      // Example: convert large amounts to more appropriate units
      if (scaledAmount >= 16 && parsed.unit === 'ounce') {
        finalAmount = scaledAmount / 16;
        finalUnit = 'pound';
        conversionApplied = {
          from_unit: 'ounce',
          to_unit: 'pound',
          factor: 1/16,
        };
      }

      const scaledIngredient: ScaledIngredient = {
        original: ingredient,
        scaled: formatAmount(finalAmount, finalUnit),
        amount: finalAmount,
        unit: finalUnit,
        conversion_applied: conversionApplied,
      };

      scaledIngredients.push(scaledIngredient);
    } catch (error) {
      console.warn(`Failed to scale ingredient "${ingredient}":`, error);
      warnings.push(`Could not scale ingredient: ${ingredient}`);

      // Add original ingredient as-is
      scaledIngredients.push({
        original: ingredient,
        scaled: ingredient,
        amount: 0,
        unit: '',
      });
    }
  }

  return {
    original_servings: originalServings,
    target_servings: targetServings,
    scale_factor: scaleFactor,
    scaled_ingredients: scaledIngredients,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
};

/**
 * Formats a number as a fraction or decimal
 */
const formatAmount = (amount: number, unit: string): string => {
  // If it's a whole number, return as integer
  if (amount % 1 === 0) {
    return `${amount} ${unit}`.trim();
  }

  // Try to format as fraction
  const fraction = decimalToFraction(amount);
  if (fraction) {
    return `${fraction} ${unit}`.trim();
  }

  // Otherwise return as decimal rounded to 2 places
  return `${amount.toFixed(2)} ${unit}`.trim();
};

/**
 * Converts decimal to fraction string
 */
const decimalToFraction = (decimal: number): string | null => {
  const tolerance = 1.0E-6;
  let h1 = 1, h2 = 0, k1 = 0, k2 = 1;
  let b = decimal;

  do {
    const a = Math.floor(b);
    let aux = h1;
    h1 = a * h1 + h2;
    h2 = aux;
    aux = k1;
    k1 = a * k1 + k2;
    k2 = aux;
    b = 1 / (b - a);
  } while (Math.abs(decimal - h1 / k1) > decimal * tolerance);

  const numerator = h1;
  const denominator = k1;

  // Only return fraction if denominator is reasonable
  if (denominator <= 16 && numerator <= 16) {
    return denominator === 1 ? numerator.toString() : `${numerator}/${denominator}`;
  }

  return null;
};

/**
 * Gets common unit conversions for display
 */
export const getCommonConversions = async (): Promise<UnitConversion[]> => {
  return getUnitConversions();
};

/**
 * Validates if a unit conversion makes sense
 */
export const validateConversion = (
  fromUnit: string,
  toUnit: string,
  factor: number
): { valid: boolean; reason?: string } => {
  if (factor <= 0) {
    return { valid: false, reason: "Conversion factor must be positive" };
  }

  if (!isFinite(factor)) {
    return { valid: false, reason: "Conversion factor must be finite" };
  }

  // Basic validation - same units should have factor of 1
  if (fromUnit === toUnit && Math.abs(factor - 1) > 0.01) {
    return { valid: false, reason: "Same units should have conversion factor of 1" };
  }

  return { valid: true };
};
